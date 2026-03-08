import json
import re
from datetime import date
from time import sleep
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

import anthropic
import requests
from django.conf import settings
from pypdf import PdfReader
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

from apps.ai.prompts import FLASHCARD_SYSTEM_PROMPT

PDF_MAX_PAGES = 200
PDF_MAX_FILE_SIZE_MB = 20
YOUTUBE_MAX_DURATION_SECONDS = 18000
YOUTUBE_MAX_SEGMENT_CHARS = 50000
YOUTUBE_DEFAULT_SEGMENT_CHARS = 40000
MAX_TOKENS = 4096
SUPADATA_TRANSCRIPT_URL = "https://api.supadata.ai/v1/youtube/transcript"
SUPADATA_JOB_URL = "https://api.supadata.ai/v1/transcript"
SUPADATA_POLL_MAX_ATTEMPTS = 60
SUPADATA_POLL_INTERVAL_SECONDS = 1
SUPADATA_REQUEST_TIMEOUT_SECONDS = 30

CREDIT_COSTS = {"text": 1, "pdf": 1, "youtube": 3}
MONTHLY_LIMITS = {"free": 10, "pro": 200}


class FlashcardGenerationError(APIException):
    status_code = 502
    default_detail = "Failed to generate flashcards. Please try again."


def reset_credits_if_needed(profile) -> None:
    today = date.today()
    if (
        profile.last_reset.month != today.month
        or profile.last_reset.year != today.year
    ):
        profile.monthly_credits_used = 0
        profile.last_reset = today
        profile.save()


def check_and_deduct_credits(profile, input_type: str) -> None:
    reset_credits_if_needed(profile)
    cost = CREDIT_COSTS[input_type]
    limit = MONTHLY_LIMITS[profile.tier]
    if profile.monthly_credits_used + cost > limit:
        raise PermissionDenied("Monthly credit limit reached.")
    profile.monthly_credits_used += cost
    profile.save()


def parse_flashcards_json(raw: str) -> list[dict]:
    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences (```json ... ``` or ``` ... ```)
    stripped = re.sub(r"```(?:json)?\s*\n?", "", raw).strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # Extract first JSON array from the text
    match = re.search(r"\[.*]", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise FlashcardGenerationError("Could not parse flashcards from AI response.")


def suggest_content_start(pages: list[str]) -> int:
    for i, page in enumerate(pages):
        if len(page.split()) > 100:
            return i + 1
    return 1


def extract_pdf_text(file) -> dict:
    reader = PdfReader(file)
    total_pages = len(reader.pages)
    pages_to_extract = min(total_pages, PDF_MAX_PAGES)

    pages = []
    for i in range(pages_to_extract):
        raw = reader.pages[i].extract_text() or ""
        cleaned = re.sub(r"\n{3,}", "\n\n", raw).strip()
        cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
        cleaned = re.sub(r"[\x00-\x08\x0B\x0E-\x1F\x7F]", "", cleaned)
        pages.append(cleaned)

    return {
        "total_pages": total_pages,
        "extracted_pages": pages_to_extract,
        "pages": pages,
        "truncated": total_pages > PDF_MAX_PAGES,
        "suggested_start_page": suggest_content_start(pages),
    }


def extract_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.hostname in ("www.youtube.com", "youtube.com", "m.youtube.com"):
        if parsed.path == "/watch":
            return parse_qs(parsed.query).get("v", [None])[0]
        if parsed.path.startswith("/embed/"):
            return parsed.path.split("/embed/")[1].split("/")[0] or None
    if parsed.hostname in ("youtu.be", "www.youtu.be"):
        return parsed.path.lstrip("/").split("/")[0] or None
    return None


def aggregate_chunks_by_minute(transcript) -> list[dict]:
    """
    Aggregates transcript chunks into minute-level buckets for the frontend
    time range selector. Returns one entry per minute instead of hundreds
    of sentence-level chunks, keeping the response payload lean.
    """
    buckets: dict[int, dict] = {}
    for chunk in transcript:
        minute = int(chunk.start // 60)
        if minute not in buckets:
            buckets[minute] = {"texts": [], "start": minute * 60}
        buckets[minute]["texts"].append(chunk.text)

    return [
        {
            "minute": minute,
            "start": data["start"],
            "preview": " ".join(data["texts"])[:200],
        }
        for minute, data in sorted(buckets.items())
    ]


def _get_supadata_error_message(payload: object, fallback: str) -> str:
    if isinstance(payload, dict):
        detail = payload.get("message") or payload.get("detail") or payload.get("details")
        if isinstance(detail, str) and detail:
            return detail
    return fallback


def _get_supadata_error_code(payload: object) -> str | None:
    if isinstance(payload, dict):
        code = payload.get("error") or payload.get("code")
        if isinstance(code, str) and code:
            return code.lower()
    return None


def _raise_supadata_http_error(response: requests.Response) -> None:
    payload: object = {}
    try:
        payload = response.json()
    except ValueError:
        pass

    detail = _get_supadata_error_message(
        payload, f"Supadata request failed with status {response.status_code}."
    )
    error_code = _get_supadata_error_code(payload)

    if response.status_code in (206, 404) or error_code in {
        "not-found",
        "transcript-unavailable",
    }:
        raise NoTranscriptFound(detail)
    if response.status_code == 403 or error_code == "forbidden":
        raise TranscriptsDisabled(detail)
    if response.status_code == 400:
        raise ValidationError("Could not extract a transcript from that YouTube URL. Check that the video exists and has captions available.")
    if 400 <= response.status_code < 500:
        raise ValidationError(detail)
    response.raise_for_status()


def _raise_supadata_job_error(error: object) -> None:
    if isinstance(error, dict):
        detail = _get_supadata_error_message(error, json.dumps(error))
        error_code = _get_supadata_error_code(error)
        if error_code in {"not-found", "transcript-unavailable"}:
            raise NoTranscriptFound(detail)
        if error_code == "forbidden":
            raise TranscriptsDisabled(detail)
        raise ValidationError(detail)

    raise ValidationError(str(error or "Transcript job failed."))


def _extract_supadata_result(payload: dict) -> dict:
    result = payload.get("result")
    if isinstance(result, dict):
        return result
    return payload


def _normalize_supadata_chunks(payload: dict) -> list[SimpleNamespace]:
    result = _extract_supadata_result(payload)
    chunks = result.get("content")
    if not isinstance(chunks, list):
        raise ValidationError("Unexpected transcript response format.")

    transcript = [
        SimpleNamespace(
            text=chunk.get("text", ""),
            start=(chunk.get("offset", 0) or 0) / 1000,
            duration=(chunk.get("duration", 0) or 0) / 1000,
        )
        for chunk in chunks
    ]
    if not transcript:
        raise NoTranscriptFound("No transcript found.")
    return transcript


def _poll_supadata_job(job_id: str) -> dict:
    headers = {"x-api-key": settings.SUPADATA_API_KEY}

    for attempt in range(SUPADATA_POLL_MAX_ATTEMPTS):
        response = requests.get(
            f"{SUPADATA_JOB_URL}/{job_id}",
            headers=headers,
            timeout=SUPADATA_REQUEST_TIMEOUT_SECONDS,
        )
        _raise_supadata_http_error(response)
        payload = response.json()
        status = payload.get("status")

        if status == "completed":
            return payload
        if status == "failed":
            _raise_supadata_job_error(payload.get("error"))

        if attempt < SUPADATA_POLL_MAX_ATTEMPTS - 1:
            sleep(SUPADATA_POLL_INTERVAL_SECONDS)

    raise ValidationError("Transcript extraction timed out. Please try again.")


def _fetch_supadata_transcript(url: str) -> list[SimpleNamespace]:
    headers = {"x-api-key": settings.SUPADATA_API_KEY}
    response = requests.get(
        SUPADATA_TRANSCRIPT_URL,
        params={"url": url, "text": "false"},
        headers=headers,
        timeout=SUPADATA_REQUEST_TIMEOUT_SECONDS,
    )

    if response.status_code == 202:
        payload = response.json()
        job_id = payload.get("id") or payload.get("jobId")
        if not job_id:
            raise ValidationError("Transcript job did not return an id.")
        return _normalize_supadata_chunks(_poll_supadata_job(job_id))

    _raise_supadata_http_error(response)
    return _normalize_supadata_chunks(response.json())


def extract_youtube_transcript(
    url: str, start_seconds: int = 0, end_seconds: int | None = None
) -> dict:
    """
    Fetches and processes a YouTube transcript for a given URL.

    Segmentation is based on character count, not duration. The full
    transcript is always fetched and cleaned first. If it fits within
    YOUTUBE_MAX_SEGMENT_CHARS the entire text is returned directly
    (needs_segmentation=False). Otherwise the frontend shows a time
    range selector and only the selected segment's text is returned.

    For segmented videos the default end_seconds is calculated by
    walking the transcript chunks until cumulative text length first
    exceeds YOUTUBE_DEFAULT_SEGMENT_CHARS, giving the frontend a
    conservative initial range that fits well within the hard limit.

    Raises ValidationError for invalid URLs, videos over 5 hours,
    or segments exceeding YOUTUBE_MAX_SEGMENT_CHARS.
    Lets TranscriptsDisabled and NoTranscriptFound bubble up to the view.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise ValidationError("Invalid YouTube URL.")

    transcript = _fetch_supadata_transcript(url)

    last = transcript[-1]
    total_duration_seconds = last.start + last.duration

    if total_duration_seconds > YOUTUBE_MAX_DURATION_SECONDS:
        raise ValidationError(
            "This video is over 5 hours long. Please use a shorter video."
        )

    # Build the full cleaned transcript to decide segmentation by char count
    full_text = " ".join(chunk.text for chunk in transcript)
    full_text = re.sub(r"\s+", " ", full_text).strip()
    full_text = re.sub(r"[\x00-\x08\x0B\x0E-\x1F\x7F]", "", full_text)

    needs_segmentation = len(full_text) > YOUTUBE_MAX_SEGMENT_CHARS
    minutes = aggregate_chunks_by_minute(transcript)

    if not needs_segmentation:
        return {
            "video_id": video_id,
            "total_duration_seconds": round(total_duration_seconds),
            "needs_segmentation": False,
            "start_seconds": 0,
            "end_seconds": round(total_duration_seconds),
            "minutes": minutes,
            "text": full_text,
            "char_count": len(full_text),
        }

    # Segmented path — calculate where the char limit falls in the timeline
    # so the frontend can default the end time to a value that fits.
    default_end = round(total_duration_seconds)
    cumulative_len = 0
    for chunk in transcript:
        cumulative_len += len(chunk.text) + 1  # +1 for joining space
        if cumulative_len > YOUTUBE_DEFAULT_SEGMENT_CHARS:
            default_end = round(chunk.start)
            break

    effective_start = start_seconds
    effective_end = end_seconds if end_seconds is not None else default_end

    selected = [
        chunk
        for chunk in transcript
        if chunk.start >= effective_start and chunk.start < effective_end
    ]

    text = " ".join(chunk.text for chunk in selected)
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"[\x00-\x08\x0B\x0E-\x1F\x7F]", "", text)

    if len(text) > YOUTUBE_MAX_SEGMENT_CHARS:
        raise ValidationError(
            f"Selected segment exceeds {YOUTUBE_MAX_SEGMENT_CHARS:,} characters. "
            "Please narrow your time range."
        )

    return {
        "video_id": video_id,
        "total_duration_seconds": round(total_duration_seconds),
        "needs_segmentation": True,
        "start_seconds": effective_start,
        "end_seconds": round(effective_end),
        "minutes": minutes,
        "text": text,
        "char_count": len(text),
    }


def generate_flashcards(text: str) -> list[dict]:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        system=FLASHCARD_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Create comprehensive flashcards from this content:\n\n{text}"}],
    )

    raw = message.content[0].text
    return parse_flashcards_json(raw)
