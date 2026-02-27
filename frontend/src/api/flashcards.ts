import client from "./client";
import type { FlashcardDraft } from "@/types";

export function generateFlashcards(text: string) {
  return client.post<FlashcardDraft[]>("/generate/", { text });
}

export function bulkCreateFlashcards(
  deckId: string,
  flashcards: FlashcardDraft[]
) {
  return client.post(`/decks/${deckId}/cards/bulk/`, { flashcards });
}
