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

export function deleteFlashcard(id: string) {
  return client.delete(`/cards/${id}/`);
}

export function updateFlashcard(
  id: string,
  data: { front?: string; back?: string }
) {
  return client.patch(`/cards/${id}/`, data);
}
