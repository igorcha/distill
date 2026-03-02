import client from "./client";
import type { FlashcardDraft } from "@/types";

type GenerateInputType = "text" | "pdf" | "youtube";

export function generateFlashcards(
  text: string,
  inputType: GenerateInputType = "text"
) {
  return client.post<FlashcardDraft[]>("/generate/", {
    text,
    input_type: inputType,
  });
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
