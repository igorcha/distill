import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkCreateFlashcards, generateFlashcards } from "@/api/flashcards";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import type { FlashcardDraft } from "@/types";

export function useGenerateFlashcards() {
  return useMutation({
    mutationFn: ({ text }: { text: string }) => generateFlashcards(text),
  });
}

export function useBulkCreateFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      deckId,
      flashcards,
    }: {
      deckId: string;
      flashcards: FlashcardDraft[];
    }) => bulkCreateFlashcards(deckId, flashcards),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decks });
    },
  });
}
