import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDeck, deleteDeck, getDecks } from "@/api/decks";
import { QUERY_KEYS } from "@/hooks/queryKeys";
import type { Deck } from "@/types";

export function useDecks() {
  return useQuery({
    queryKey: QUERY_KEYS.decks,
    queryFn: getDecks,
    select: (res): Deck[] => res.data,
  });
}

export function useCreateDeck() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) =>
      createDeck(title, description),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decks });
      navigate(`/generate?deck=${res.data.id}`);
    },
  });
}

export function useDeleteDeck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDeck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.decks });
    },
  });
}
