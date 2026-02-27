export const QUERY_KEYS = {
  decks: ["decks"] as const,
  deck: (id: string) => ["decks", id] as const,
};
