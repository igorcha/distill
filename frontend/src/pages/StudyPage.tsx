import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Sparkles, X } from "lucide-react";
import { motion } from "framer-motion";
import { useDeck } from "@/hooks/useDecks";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-[#2a2f42] px-2 text-[11px] font-semibold text-[#8b92a5]">
      {children}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="w-full flex-1 min-h-[420px] max-h-[560px] animate-pulse rounded-2xl border border-[#2a2f42] bg-[#1a1f2e] p-12">
      <div className="flex items-center gap-2">
        <div className="h-3 w-4 rounded bg-[#2a2f42]" />
        <div className="h-3 w-28 rounded bg-[#2a2f42]" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3 pt-32">
        <div className="h-7 w-3/4 rounded bg-[#2a2f42]" />
        <div className="h-7 w-1/2 rounded bg-[#2a2f42]" />
      </div>
    </div>
  );
}

function CompletionScreen({
  total,
  onRestart,
  onExit,
}: {
  total: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15"
      >
        <Check className="size-10 text-emerald-400" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Session Complete!</h2>
        <p className="mt-2 text-[#8b92a5]">{total} cards reviewed</p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRestart}
          className="border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white cursor-pointer"
        >
          Study Again
        </Button>
        <Button
          onClick={onExit}
          className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer"
        >
          Back to Deck
        </Button>
      </div>
    </div>
  );
}

export default function StudyPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { data: deck, isLoading } = useDeck(deckId!);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (deck?.flashcards && !initialized) {
      setCards(shuffle(deck.flashcards));
      setInitialized(true);
    }
  }, [deck, initialized]);

  const total = cards.length;
  const current = cards[index];
  const progress = total > 0 ? ((index + (isComplete ? 1 : 0)) / total) * 100 : 0;

  const flip = useCallback(() => {
    if (!isComplete && total > 0) setIsFlipped((f) => !f);
  }, [isComplete, total]);

  const goNext = useCallback(() => {
    if (isComplete || total === 0) return;
    if (index < total - 1) {
      setIsFlipped(false);
      setIndex((i) => i + 1);
    } else {
      setIsFlipped(false);
      setIsComplete(true);
    }
  }, [index, total, isComplete]);

  const goPrev = useCallback(() => {
    if (isComplete || index <= 0) return;
    setIsFlipped(false);
    setIndex((i) => i - 1);
  }, [index, isComplete]);

  const exitTo = `/decks/${deckId}`;

  const restart = useCallback(() => {
    setCards((prev) => shuffle(prev));
    setIndex(0);
    setIsFlipped(false);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          flip();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          navigate(exitTo);
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flip, goNext, goPrev, navigate, exitTo]);

  return (
    <div className="flex h-screen flex-col bg-[#0f1117]">
      {/* Top bar */}
      <div className="shrink-0 px-8 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(exitTo)}
            className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:text-[#8b92a5] cursor-pointer"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-[#2a2f42] transition-colors hover:bg-[#2a2f42]">
              <X className="size-5" />
            </span>
            Exit
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555b6e]">
              Studying Deck
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-white truncate max-w-xs sm:max-w-lg">
              {deck?.title ?? ""}
            </h1>
          </div>
          <div className="w-20" />
        </div>

        {/* Progress section */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#555b6e]">
              Session Progress
            </p>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#3B5BDB] tabular-nums">
              {total > 0 && !isComplete
                ? `${index + 1} / ${total} Cards`
                : total > 0
                  ? `${total} / ${total} Cards`
                  : "\u00A0"}
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#2a2f42]">
            <motion.div
              className="h-full rounded-full bg-[#3B5BDB] shadow-[0_0_8px_#3B5BDB]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main area */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center px-8 pb-24">
          <div className="w-full max-w-[860px]">
            <SkeletonCard />
          </div>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-16">
          <p className="text-sm text-[#8b92a5]">This deck has no cards yet.</p>
          <Button
            onClick={() => navigate(`/generate?deck=${deckId}`)}
            className="bg-[#3B5BDB] hover:bg-[#2645c7] text-white cursor-pointer"
          >
            <Sparkles className="size-4" />
            Generate Cards
          </Button>
        </div>
      ) : isComplete ? (
        <CompletionScreen
          total={total}
          onRestart={restart}
          onExit={() => navigate(exitTo)}
        />
      ) : (
        <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col items-center justify-center gap-5 px-8 pb-24">
          {/* Flip card */}
          <div
            className="w-full cursor-pointer"
            style={{ perspective: "1200px" }}
            onClick={flip}
          >
            <motion.div
              className="relative w-full"
              style={{ transformStyle: "preserve-3d", minHeight: 420, maxHeight: 560, height: "50vh" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.5 }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col rounded-2xl border border-[#2a2f42] bg-[#1a1f2e] p-10 sm:p-12"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#555b6e]" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#555b6e]">
                    AI Generated
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4">
                  <p className="text-center text-2xl font-bold leading-relaxed text-white sm:text-3xl">
                    {current?.front}
                  </p>
                </div>
                <p className="text-center text-xs text-[#555b6e]">
                  Front &middot; Question
                </p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col rounded-2xl border border-[#3B5BDB] bg-[#1e2438] p-10 sm:p-12"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#555b6e]">
                  Back &middot; Answer
                </p>
                <div className="flex flex-1 items-center justify-center px-4">
                  <p className="text-center text-xl leading-relaxed text-[#8b92a5] sm:text-2xl">
                    {current?.back}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={flip}
              className="h-12 px-16 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer gap-3"
            >
              Flip Card
              <span className="rounded bg-[#2645c7] px-1.5 py-0.5 text-[10px] font-semibold text-white/60">
                Space
              </span>
            </Button>
            <p className="text-xs text-[#555b6e]">
              Click card or press Space to see answer
            </p>
            <div className="flex gap-3 mt-1">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={index <= 0}
                className="border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white disabled:opacity-30 cursor-pointer"
              >
                &larr; Previous
              </Button>
              <Button
                variant="outline"
                onClick={goNext}
                className="border-[#2a2f42] bg-transparent text-[#8b92a5] hover:bg-[#2a2f42] hover:text-white disabled:opacity-30 cursor-pointer"
              >
                {index === total - 1 ? (
                  <>
                    Finish
                    <Check className="size-4" />
                  </>
                ) : (
                  <>Next &rarr;</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom keyboard hints bar */}
      <div className="shrink-0 border-t border-[#2a2f42] bg-[#1a1f2e]">
        <div className="flex items-center justify-center gap-8 px-6 py-3">
          <div className="flex items-center gap-2">
            <Kbd>Esc</Kbd>
            <span className="text-xs font-medium uppercase tracking-wider text-[#555b6e]">
              Exit Session
            </span>
          </div>
          <span className="text-[#2a2f42]">|</span>
          <div className="flex items-center gap-2">
            <Kbd>&larr;</Kbd>
            <Kbd>&rarr;</Kbd>
            <span className="text-xs font-medium uppercase tracking-wider text-[#555b6e]">
              Navigate Cards
            </span>
          </div>
          <span className="text-[#2a2f42]">|</span>
          <div className="flex items-center gap-2">
            <Kbd>Space</Kbd>
            <span className="text-xs font-medium uppercase tracking-wider text-[#555b6e]">
              Flip Card
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
