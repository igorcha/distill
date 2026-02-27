import json
import re

import anthropic
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import APIException

from apps.ai.prompts import FLASHCARD_SYSTEM_PROMPT
from apps.decks.models import Deck, Flashcard


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


def generate_flashcards(text: str, deck_id: str, user):
    deck = get_object_or_404(Deck, pk=deck_id, user=user)

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        system=FLASHCARD_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )

    raw = message.content[0].text
    cards_data = parse_flashcards_json(raw)

    existing_count = deck.flashcards.count()
    flashcards = []
    for i, card in enumerate(cards_data):
        flashcards.append(
            Flashcard(
                deck=deck,
                front=card["front"],
                back=card["back"],
                order=existing_count + i,
            )
        )

    return Flashcard.objects.bulk_create(flashcards)
