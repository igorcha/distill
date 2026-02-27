import { useCallback, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Sparkles, Save, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { useDecks } from "@/hooks/useDecks";
import {
  useGenerateFlashcards,
  useBulkCreateFlashcards,
} from "@/hooks/useFlashcards";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { FlashcardDraft } from "@/types";

const MAX_CHARS = 10000;
const MIN_CHARS = 50;

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-5 animate-pulse space-y-4">
      <div>
        <div className="h-3 w-28 rounded bg-[#2a2f42]" />
        <div className="mt-2.5 h-4 w-full rounded bg-[#2a2f42]" />
        <div className="mt-1.5 h-4 w-3/4 rounded bg-[#2a2f42]" />
      </div>
      <div className="h-px bg-[#2a2f42]" />
      <div>
        <div className="h-3 w-24 rounded bg-[#2a2f42]" />
        <div className="mt-2.5 h-4 w-full rounded bg-[#2a2f42]" />
        <div className="mt-1.5 h-4 w-2/3 rounded bg-[#2a2f42]" />
      </div>
    </div>
  );
}

function AutoResizeTextarea({
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
      rows={1}
      className={`w-full resize-none overflow-hidden border border-transparent bg-transparent text-sm outline-none transition-colors focus:border-[#2a2f42] focus:bg-[#151926] rounded-md px-2 py-1 -mx-2 -my-1 ${className}`}
    />
  );
}

function FlashcardPreview({
  card,
  onEdit,
  onDelete,
}: {
  card: FlashcardDraft;
  onEdit: (field: "front" | "back", value: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative rounded-xl border border-[#2a2f42] bg-[#1a1f2e] p-5">
      <button
        onClick={onDelete}
        className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-md text-[#555b6e] opacity-0 transition-all hover:bg-[#2a2f42] hover:text-white group-hover:opacity-100 cursor-pointer"
      >
        <X className="size-3.5" />
      </button>

      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b92a5]">
        Front (Question)
      </p>
      <div className="mt-1.5">
        <AutoResizeTextarea
          value={card.front}
          onChange={(v) => onEdit("front", v)}
          className="text-white"
        />
      </div>
      <Separator className="my-3 bg-[#2a2f42]" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b92a5]">
        Back (Answer)
      </p>
      <div className="mt-1.5">
        <AutoResizeTextarea
          value={card.back}
          onChange={(v) => onEdit("back", v)}
          className="text-[#8b92a5]"
        />
      </div>
    </div>
  );
}

export default function GeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [text, setText] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState(
    searchParams.get("deck") ?? ""
  );
  const [generatedCards, setGeneratedCards] = useState<FlashcardDraft[]>([]);
  const [deckError, setDeckError] = useState(false);

  const { data: decks = [] } = useDecks();
  const { mutate: generate, isPending } = useGenerateFlashcards();
  const { mutate: bulkCreate, isPending: isSaving } =
    useBulkCreateFlashcards();

  const handleGenerate = () => {
    if (!selectedDeckId) {
      setDeckError(true);
      return;
    }
    setDeckError(false);
    generate(
      { text },
      {
        onSuccess: (res) => {
          setGeneratedCards(res.data);
          toast.success(`${res.data.length} flashcards generated!`);
        },
        onError: () => {
          toast.error("Failed to generate flashcards. Please try again.");
        },
      }
    );
  };

  const handleEditCard = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    setGeneratedCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const handleDeleteCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedDeckId || generatedCards.length === 0) return;

    bulkCreate(
      { deckId: selectedDeckId, flashcards: generatedCards },
      {
        onSuccess: () => {
          toast.success(
            `${generatedCards.length} cards saved to deck!`
          );
          navigate("/dashboard");
        },
        onError: () => {
          toast.error("Failed to save flashcards. Please try again.");
        },
      }
    );
  };

  const handleClear = () => {
    setText("");
    setGeneratedCards([]);
  };

  const charCount = text.length;

  return (
    <div className="flex h-screen flex-col bg-[#0f1117]">
      <Navbar />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Left Panel */}
        <div className="flex flex-1 flex-col border-r border-[#2a2f42]">
          <div className="flex items-center justify-between border-b border-[#2a2f42] px-6 py-4">
            <h2 className="text-base font-semibold text-white">
              Source Material
            </h2>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-[#8b92a5] hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-3" />
              Clear All
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden px-6 py-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder="Paste your lecture notes, book summaries, or video transcripts here..."
              className="flex-1 w-full resize-none rounded-lg border border-[#2a2f42] bg-[#1a1f2e] px-4 py-3 text-sm text-white placeholder:text-[#555b6e] outline-none focus:border-[#3B5BDB] transition-colors"
            />
          </div>

          <div className="border-t border-[#2a2f42] px-6 py-4 space-y-3">
            <p className="text-xs text-[#555b6e] text-right">
              <span
                className={
                  charCount > 0 && charCount < MIN_CHARS
                    ? "text-amber-400"
                    : ""
                }
              >
                {charCount.toLocaleString()}
              </span>
              {" / "}
              {MAX_CHARS.toLocaleString()}
            </p>
            <Button
              onClick={handleGenerate}
              disabled={charCount < MIN_CHARS || isPending}
              className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[#2a2f42] px-6 py-4">
            <h2 className="text-base font-semibold text-white">
              Generated Drafts
            </h2>
            {generatedCards.length > 0 && (
              <Badge className="bg-[#3B5BDB]/15 text-[#3B5BDB] border-none text-xs">
                {generatedCards.length} Drafts
              </Badge>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isPending ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : generatedCards.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <FileText className="size-10 text-[#2a2f42]" />
                <p className="text-sm text-[#555b6e]">
                  Your generated flashcards will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedCards.map((card, index) => (
                  <FlashcardPreview
                    key={index}
                    card={card}
                    onEdit={(field, value) =>
                      handleEditCard(index, field, value)
                    }
                    onDelete={() => handleDeleteCard(index)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#2a2f42] px-6 py-4 space-y-3">
            <div>
              <label className="text-[#8b92a5] text-[11px] font-semibold uppercase tracking-[0.08em] mb-1.5 block">
                Target Deck
              </label>
              <select
                value={selectedDeckId}
                onChange={(e) => {
                  setSelectedDeckId(e.target.value);
                  setDeckError(false);
                }}
                className={`w-full h-11 rounded-lg border bg-[#1a1f2e] px-3 text-sm text-white outline-none transition-colors cursor-pointer ${
                  deckError
                    ? "border-red-500"
                    : "border-[#2a2f42] focus:border-[#3B5BDB]"
                }`}
              >
                <option value="">Select a deck...</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.title}
                  </option>
                ))}
              </select>
              {deckError && (
                <p className="mt-1 text-xs text-red-400">
                  Please select a deck first.
                </p>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={
                generatedCards.length === 0 || !selectedDeckId || isSaving
              }
              className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save{" "}
                  {generatedCards.length > 0
                    ? `${generatedCards.length} Cards`
                    : "Cards"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
