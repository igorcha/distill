import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Search,
  Sparkles,
  Star,
  Trash2,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDeck } from "@/hooks/useDecks";
import { useDeleteFlashcard, useUpdateFlashcard } from "@/hooks/useFlashcards";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Flashcard } from "@/types";

const PAGE_SIZE = 10;

const DATE_FILTERS = ["All", "Today", "This Week", "This Month"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isWithinDays(dateStr: string, days: number) {
  const date = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function filterByDate(cards: Flashcard[], filter: DateFilter): Flashcard[] {
  switch (filter) {
    case "Today":
      return cards.filter((c) => isToday(c.created_at));
    case "This Week":
      return cards.filter((c) => isWithinDays(c.created_at, 7));
    case "This Month":
      return cards.filter((c) => isWithinDays(c.created_at, 30));
    default:
      return cards;
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#2a2f42] bg-[#1a1f2e] px-5 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#2a2f42]">
        <Icon className="size-5 text-[#8b92a5]" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b92a5]">
          {label}
        </p>
        <p className={`mt-0.5 text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-32 rounded bg-[#2a2f42]" />
      <div className="h-7 w-64 rounded bg-[#2a2f42]" />
      <div className="h-4 w-96 rounded bg-[#2a2f42]" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg bg-[#1a1f2e] px-4 py-3"
        >
          <div className="size-4 rounded bg-[#2a2f42]" />
          <div className="h-4 flex-1 rounded bg-[#2a2f42]" />
          <div className="h-4 flex-1 rounded bg-[#2a2f42]" />
          <div className="h-4 w-24 rounded bg-[#2a2f42]" />
          <div className="size-4 rounded bg-[#2a2f42]" />
        </div>
      ))}
    </div>
  );
}

function FlipCardTextarea({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    },
    [onChange]
  );

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={handleChange}
      rows={3}
      className={`w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-[#555b6e] ${className}`}
    />
  );
}

function CardEditModal({
  card,
  onClose,
  deckId,
}: {
  card: Flashcard;
  onClose: () => void;
  deckId: string;
}) {
  const [editFront, setEditFront] = useState(card.front);
  const [editBack, setEditBack] = useState(card.back);
  const [isFlipped, setIsFlipped] = useState(false);
  const updateM = useUpdateFlashcard(deckId);

  function handleSave() {
    updateM.mutate(
      { id: card.id, data: { front: editFront, back: editBack } },
      {
        onSuccess: () => {
          toast.success("Card updated.");
          onClose();
        },
        onError: () => {
          toast.error("Failed to update card.");
        },
      }
    );
  }

  const hasChanges = editFront !== card.front || editBack !== card.back;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="bg-[#1a1f2e] border-[#2a2f42] sm:max-w-2xl p-8"
      >
        <DialogTitle className="sr-only">Edit Flashcard</DialogTitle>
        <DialogDescription className="sr-only">
          Edit the front and back of your flashcard
        </DialogDescription>

        {/* 3D Flip Card */}
        <div
          className="mx-auto w-full max-w-[580px]"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="relative h-[340px] w-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Front Side */}
            <div
              className="absolute inset-0 flex flex-col rounded-xl border border-[#2a2f42] bg-[#0f1117] p-5"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#555b6e]">
                Front &middot; Question
              </p>
              <div className="mt-3 flex-1 overflow-y-auto">
                <FlipCardTextarea
                  value={editFront}
                  onChange={setEditFront}
                  className="text-white"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsFlipped(true)}
                  className="flex items-center gap-1 text-xs text-[#555b6e] transition-colors hover:text-[#8b92a5] cursor-pointer"
                >
                  Flip to Back
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>

            {/* Back Side */}
            <div
              className="absolute inset-0 flex flex-col rounded-xl border border-[#2a2f42] bg-[#0f1117] p-5"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#555b6e]">
                Back &middot; Answer
              </p>
              <div className="mt-3 flex-1 overflow-y-auto">
                <FlipCardTextarea
                  value={editBack}
                  onChange={setEditBack}
                  className="text-[#8b92a5]"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsFlipped(false)}
                  className="flex items-center gap-1 text-xs text-[#555b6e] transition-colors hover:text-[#8b92a5] cursor-pointer"
                >
                  <ArrowLeft className="size-3" />
                  Flip to Front
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action buttons */}
        <div className="mt-2 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateM.isPending || !hasChanges}
            className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer disabled:opacity-50"
          >
            {updateM.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data: deck, isLoading } = useDeck(deckId!);
  const deleteM = useDeleteFlashcard(deckId!);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);

  const allCards = deck?.flashcards ?? [];
  const newCardsCount = useMemo(
    () => allCards.filter((c) => isWithinDays(c.created_at, 7)).length,
    [allCards]
  );

  const filtered = useMemo(() => {
    let result = filterByDate(allCards, dateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.front.toLowerCase().includes(q) ||
          c.back.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allCards, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageCards = filtered.slice(start, start + PAGE_SIZE);

  const allPageSelected =
    pageCards.length > 0 && pageCards.every((c) => selected.has(c.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageCards.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pageCards.forEach((c) => next.add(c.id));
        return next;
      });
    }
  }

  function handleDelete(id: string) {
    deleteM.mutate(id, {
      onSuccess: () => {
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Card deleted.");
      },
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => deleteM.mutateAsync(id))).then(() => {
      setSelected(new Set());
      toast.success(`${ids.length} cards deleted.`);
    });
  }

  const showEnd = Math.min(start + PAGE_SIZE, filtered.length);

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        {isLoading ? (
          <HeaderSkeleton />
        ) : deck ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm text-[#8b92a5]">
                <Link
                  to="/dashboard"
                  className="hover:text-white transition-colors"
                >
                  My Decks
                </Link>
                <span className="text-[#555b6e]">&gt;</span>
                <span className="truncate text-[#555b6e]">{deck.title}</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-white">
                {deck.title}
              </h1>
              {deck.description && (
                <p className="mt-1 text-[#8b92a5]">{deck.description}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/generate?deck=${deckId}`)}
                className="border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
              >
                <Sparkles className="size-4" />
                Regenerate
              </Button>
              <Button
                onClick={() => navigate(`/study/${deckId}`)}
                className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer"
              >
                <BookOpen className="size-4" />
                Study Now
              </Button>
            </div>
          </div>
        ) : null}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Cards"
            value={isLoading ? "—" : allCards.length}
            icon={Layers}
          />
          <StatCard
            label="New Cards"
            value={isLoading ? "—" : newCardsCount}
            icon={Star}
            color="text-[#3B5BDB]"
          />
          <StatCard label="Generated" value="—" icon={Zap} color="text-[#8b92a5]" />
        </div>

        {/* Table section */}
        <div className="mt-8 rounded-xl border border-[#2a2f42] bg-[#1a1f2e]">
          {/* Toolbar */}
          <div className="relative border-b border-[#2a2f42]">
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#555b6e]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search cards..."
                  className="h-9 w-full rounded-lg border border-[#2a2f42] bg-[#0f1117] pl-9 pr-3 text-sm text-white placeholder:text-[#555b6e] outline-none transition-colors focus:border-[#3B5BDB]"
                />
              </div>

              <div className="flex items-center gap-1">
                {DATE_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setDateFilter(f);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      dateFilter === f
                        ? "bg-[#3B5BDB]/15 text-[#3B5BDB]"
                        : "text-[#8b92a5] hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk actions bar — overlays the toolbar */}
            <div
              className={`absolute inset-0 flex items-center gap-3 rounded-t-xl bg-[#1a1f2e] px-5 transition-all duration-200 ${
                selected.size > 0
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <span className="text-xs font-medium text-[#3B5BDB]">
                {selected.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="size-3" />
                Delete Selected
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Search className="size-10 text-[#2a2f42]" />
              <p className="mt-3 text-sm text-[#555b6e]">No cards found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#2a2f42] text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#555b6e]">
                    <th className="w-10 py-3 pl-5 pr-2">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        className="size-3.5 cursor-pointer accent-[#3B5BDB]"
                      />
                    </th>
                    <th className="w-[35%] px-3 py-3">Front Text</th>
                    <th className="px-3 py-3">Back Text</th>
                    <th className="px-3 py-3 w-28">Created</th>
                    <th className="w-16 py-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageCards.map((card) => (
                    <tr
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="border-b border-[#2a2f42]/50 border-l-2 border-l-transparent transition-all hover:border-l-[#3B5BDB] hover:bg-[#1a1f2e] cursor-pointer"
                    >
                      <td className="py-4 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.has(card.id)}
                          onChange={() => toggleSelect(card.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="size-3.5 cursor-pointer accent-[#3B5BDB]"
                        />
                      </td>
                      <td className="w-[35%] px-3 py-4 font-medium text-white">
                        {truncate(card.front, 40)}
                      </td>
                      <td className="px-3 py-4 text-[#8b92a5]">
                        {truncate(card.back, 40)}
                      </td>
                      <td className="px-3 py-4 text-[#555b6e]">
                        {formatDate(card.created_at)}
                      </td>
                      <td className="py-4 pr-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(card.id);
                          }}
                          className="rounded-md p-1.5 text-[#555b6e] transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between border-t border-[#2a2f42] px-5 py-3">
              <p className="text-xs text-[#555b6e]">
                Showing {start + 1}–{showEnd} of {filtered.length} cards
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-md p-1.5 text-[#8b92a5] transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`size-7 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        n === safePage
                          ? "bg-[#3B5BDB] text-white"
                          : "text-[#8b92a5] hover:text-white"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-md p-1.5 text-[#8b92a5] transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedCard && (
        <CardEditModal
          key={selectedCard.id}
          card={selectedCard}
          deckId={deckId!}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
