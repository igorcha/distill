import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, BookOpen, Sparkles } from "lucide-react";
import { createDeck, deleteDeck, getDecks } from "@/api/decks";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Deck } from "@/types";

const inputStyles =
  "bg-[#1a1f2e] border-[#2a2f42] text-white placeholder:text-[#8b92a5] h-11 focus-visible:border-[#3B5BDB] focus-visible:ring-[#3B5BDB]/25";

const labelStyles =
  "text-[#8b92a5] text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 block";

interface CreateDeckForm {
  title: string;
  description: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-5 animate-pulse">
      <div className="h-5 w-2/3 rounded bg-[#2a2f42]" />
      <div className="mt-3 h-4 w-16 rounded bg-[#2a2f42]" />
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full rounded bg-[#2a2f42]" />
        <div className="h-3.5 w-4/5 rounded bg-[#2a2f42]" />
      </div>
      <div className="mt-4 h-3 w-24 rounded bg-[#2a2f42]" />
      <div className="mt-5 flex gap-2">
        <div className="h-9 flex-1 rounded-md bg-[#2a2f42]" />
        <div className="h-9 flex-1 rounded-md bg-[#2a2f42]" />
      </div>
    </div>
  );
}

function DeckCard({ deck }: { deck: Deck }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteM = useMutation({
    mutationFn: () => deleteDeck(deck.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["decks"] }),
  });

  return (
    <div className="group rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{deck.title}</h3>
        <button
          onClick={() => deleteM.mutate()}
          disabled={deleteM.isPending}
          className="shrink-0 rounded-md p-1.5 text-[#8b92a5] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <Badge
        variant="secondary"
        className="mt-2 w-fit bg-[#2a2f42] text-[#8b92a5] border-none text-xs"
      >
        {deck.flashcard_count} cards
      </Badge>

      {deck.description && (
        <p className="mt-3 text-sm text-[#8b92a5] line-clamp-2">
          {deck.description}
        </p>
      )}

      <p className="mt-3 text-xs text-[#555b6e]">
        {formatDate(deck.created_at)}
      </p>

      <div className="mt-auto pt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/study/${deck.id}`)}
          className="flex-1 border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
        >
          <BookOpen className="size-3.5" />
          Study Now
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/generate?deck=${deck.id}`)}
          className="flex-1 border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          Generate
        </Button>
      </div>
    </div>
  );
}

function CreateDeckDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreateDeckForm>({ defaultValues: { title: "", description: "" } });

  const createM = useMutation({
    mutationFn: (data: CreateDeckForm) =>
      createDeck(data.title, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = (data: CreateDeckForm) => createM.mutateAsync(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1f2e] border-[#2a2f42] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className={labelStyles}>Title</label>
            <Input
              placeholder="e.g. Biology 101"
              className={inputStyles}
              {...register("title", { required: true })}
            />
          </div>
          <div>
            <label className={labelStyles}>Description</label>
            <Textarea
              placeholder="What is this deck about?"
              rows={3}
              className={`${inputStyles} h-auto py-2.5 resize-none`}
              {...register("description")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#8b92a5] hover:text-white hover:bg-[#2a2f42] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createM.isPending}
              className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer"
            >
              {createM.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<{ data: Deck[] }>({
    queryKey: ["decks"],
    queryFn: getDecks,
  });

  const decks = data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Library</h1>
            <p className="mt-1 text-[#8b92a5]">
              Harness your knowledge with{" "}
              <span className="font-semibold text-[#3B5BDB]">
                {decks.length}
              </span>{" "}
              active decks.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white shrink-0 cursor-pointer"
          >
            <Plus className="size-4" />
            Create New Deck
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <button
                onClick={() => setDialogOpen(true)}
                className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-[#2a2f42] text-[#8b92a5] transition-colors hover:border-[#3B5BDB] hover:text-[#3B5BDB] cursor-pointer"
              >
                <Plus className="size-8" />
              </button>
              <p className="mt-4 text-[#8b92a5]">
                No decks yet. Create your first deck to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateDeckDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
