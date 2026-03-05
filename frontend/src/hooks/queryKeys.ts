export const QUERY_KEYS = {
  decks: ["decks"] as const,
  deck: (id: string) => ["decks", id] as const,
  profile: ["profile"] as const,
  me: ["me"] as const,
};
