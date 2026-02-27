import client from "./client";

export function getDecks() {
  return client.get("/decks/");
}

export function createDeck(title: string, description: string) {
  return client.post("/decks/", { title, description });
}

export function deleteDeck(id: string) {
  return client.delete(`/decks/${id}/`);
}

export function getDeck(id: string) {
  return client.get(`/decks/${id}/`);
}
