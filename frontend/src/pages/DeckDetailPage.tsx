import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers,
  Search,
  Sparkles,
  Star,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useDeck } from "@/hooks/useDecks";
import { useDeleteFlashcard } from "@/hooks/useFlashcards";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
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

export default function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data: deck, isLoading } = useDeck(deckId!);
  const deleteM = useDeleteFlashcard(deckId!);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
          <div className="flex flex-col gap-3 border-b border-[#2a2f42] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 border-b border-[#2a2f42] bg-[#3B5BDB]/5 px-5 py-2.5">
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
          )}

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
                  <tr className="border-b border-[#2a2f42] text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#555b6e]">
                    <th className="w-10 py-3 pl-5 pr-2">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        className="size-3.5 cursor-pointer accent-[#3B5BDB]"
                      />
                    </th>
                    <th className="px-3 py-3">Front Text</th>
                    <th className="px-3 py-3">Back Text</th>
                    <th className="px-3 py-3 w-28">Created</th>
                    <th className="w-16 py-3 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageCards.map((card) => (
                    <tr
                      key={card.id}
                      className="border-b border-[#2a2f42]/50 transition-colors hover:bg-[#0f1117]/50"
                    >
                      <td className="py-3 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.has(card.id)}
                          onChange={() => toggleSelect(card.id)}
                          className="size-3.5 cursor-pointer accent-[#3B5BDB]"
                        />
                      </td>
                      <td className="px-3 py-3 text-white">
                        {truncate(card.front, 40)}
                      </td>
                      <td className="px-3 py-3 text-[#8b92a5]">
                        {truncate(card.back, 40)}
                      </td>
                      <td className="px-3 py-3 text-[#555b6e]">
                        {formatDate(card.created_at)}
                      </td>
                      <td className="py-3 pr-5 text-right">
                        <button
                          onClick={() => handleDelete(card.id)}
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
    </div>
  );
}
