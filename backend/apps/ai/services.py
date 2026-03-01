import json
import re
from urllib.parse import parse_qs, urlparse

import anthropic
from django.conf import settings
from pypdf import PdfReader
from rest_framework.exceptions import APIException, ValidationError
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled

from apps.ai.prompts import FLASHCARD_SYSTEM_PROMPT

PDF_MAX_PAGES = 200
PDF_MAX_FILE_SIZE_MB = 20
YOUTUBE_MAX_DURATION_SECONDS = 18000
YOUTUBE_MAX_SEGMENT_CHARS = 50000


class FlashcardGenerationError(APIException):
    status_code = 502
    default_detail = "Failed to generate flashcards. Please try again."


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
    exceeds YOUTUBE_MAX_SEGMENT_CHARS, giving the frontend a sensible
    initial range that fits within the limit.

    Raises ValidationError for invalid URLs, videos over 5 hours,
    or segments exceeding YOUTUBE_MAX_SEGMENT_CHARS.
    Lets TranscriptsDisabled and NoTranscriptFound bubble up to the view.
    """
    video_id = extract_video_id(url)
    if not video_id:
        raise ValidationError("Invalid YouTube URL.")

    ytt = YouTubeTranscriptApi()
    transcript = ytt.fetch(video_id)

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
        if cumulative_len > YOUTUBE_MAX_SEGMENT_CHARS:
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
        max_tokens=8192,
        system=FLASHCARD_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Create comprehensive flashcards from this content:\n\n{text}"}],
    )

    raw = message.content[0].text
    return parse_flashcards_json(raw)
