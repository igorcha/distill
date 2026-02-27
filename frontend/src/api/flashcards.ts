import client from "./client";

export function generateFlashcards(text: string, deck_id: string) {
  return client.post("/generate/", { text, deck_id });
}
