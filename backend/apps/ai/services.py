import json
import re

import anthropic
from django.conf import settings
from pypdf import PdfReader
from rest_framework.exceptions import APIException

from apps.ai.prompts import FLASHCARD_SYSTEM_PROMPT

PDF_MAX_PAGES = 200
PDF_MAX_FILE_SIZE_MB = 20


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


def extract_pdf_text(file) -> dict:
    reader = PdfReader(file)
    total_pages = len(reader.pages)
    pages_to_extract = min(total_pages, PDF_MAX_PAGES)

    pages = []
    for i in range(pages_to_extract):
        raw = reader.pages[i].extract_text() or ""
        cleaned = re.sub(r"\n{3,}", "\n\n", raw).strip()
        cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
        pages.append(cleaned)

    return {
        "total_pages": total_pages,
        "extracted_pages": pages_to_extract,
        "pages": pages,
        "truncated": total_pages > PDF_MAX_PAGES,
    }


def generate_flashcards(text: str) -> list[dict]:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        system=FLASHCARD_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"Create comprehensive flashcards from this content:\n\n{text}"}],
    )

    raw = message.content[0].text
    return parse_flashcards_json(raw)
