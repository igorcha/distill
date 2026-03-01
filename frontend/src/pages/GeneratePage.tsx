import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  Sparkles,
  Save,
  X,
  FileText,
  Upload,
  Type,
  Check,
  Video,
  Clock,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import client from "@/api/client";
import { useDecks } from "@/hooks/useDecks";
import {
  useGenerateFlashcards,
  useBulkCreateFlashcards,
} from "@/hooks/useFlashcards";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RangeSlider } from "@/components/ui/range-slider";
import { Separator } from "@/components/ui/separator";
import { getPdfStore, resetPdfStore, setPdfStore } from "@/state/pdfStore";
import {
  getYoutubeStore,
  resetYoutubeStore,
  setYoutubeStore,
} from "@/state/youtubeStore";
import type { YoutubeMinute } from "@/state/youtubeStore";
import type { FlashcardDraft } from "@/types";

const MAX_CHARS = 25000;
const MIN_CHARS = 50;
const YT_MAX_CHARS = 50000;

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

function PagePreview({ text }: { text: string | undefined }) {
  if (!text || text.trim().length === 0) {
    return (
      <div className="mt-1.5 h-24 overflow-y-auto rounded-lg border border-[#2a2f42] bg-[#0f1117] px-3 py-2 text-xs text-[#8b92a5] leading-relaxed">
        No text detected on this page.
      </div>
    );
  }
  const trimmed = text.trim();
  const snippet = trimmed.slice(0, 600) + (trimmed.length > 600 ? "…" : "");
  return (
    <div className="mt-1.5 h-24 overflow-y-auto rounded-lg border border-[#2a2f42] bg-[#0f1117] px-3 py-2 text-xs text-[#8b92a5] leading-relaxed">
      {snippet}
    </div>
  );
}

// Converts seconds to h:mm:ss or m:ss display string for time inputs
function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Human-readable duration label like "2h 15m" for UI badges
function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// Looks up the backend's per-minute transcript snippet closest to a timestamp
function getMinutePreview(
  minutes: YoutubeMinute[],
  seconds: number
): string {
  const minute = Math.floor(seconds / 60);
  const entry = minutes.find((m) => m.minute === minute);
  return entry?.preview || "";
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

  // PDF state — initialized from module-level store so it survives navigation
  const saved = getPdfStore();
  const savedYt = getYoutubeStore();
  const [inputMode, setInputMode] = useState<"text" | "pdf" | "youtube">(
    savedYt.videoId ? "youtube" : saved.pages.length > 0 ? "pdf" : "text"
  );
  const [pdfPages, setPdfPages] = useState<string[]>(saved.pages);
  const [pdfTotalPages, setPdfTotalPages] = useState(saved.totalPages);
  const [pdfFilename, setPdfFilename] = useState(saved.filename);
  const [suggestedStart, setSuggestedStart] = useState(saved.suggestedStart);
  const [pageStart, setPageStart] = useState(saved.pageStart);
  const [pageEnd, setPageEnd] = useState(saved.pageEnd);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube metadata and transcript state. videoId is empty until extraction
  // succeeds — this drives the UI: empty = show URL input, populated = show
  // video controls. Transcript text (ytText) is only populated for short
  // videos on first extract; for long videos it stays empty until the user
  // picks a time range and hits generate, which triggers a second API call.
  const [ytUrl, setYtUrl] = useState(savedYt.url);
  const [ytVideoId, setYtVideoId] = useState(savedYt.videoId);
  const [ytDuration, setYtDuration] = useState(savedYt.totalDurationSeconds);
  const [ytNeedsSegmentation, setYtNeedsSegmentation] = useState(
    savedYt.needsSegmentation
  );
  const [ytMinutes, setYtMinutes] = useState<YoutubeMinute[]>(
    savedYt.minutes
  );
  const [ytText, setYtText] = useState(savedYt.text);
  const [ytCharCount, setYtCharCount] = useState(savedYt.charCount);
  const [ytStartSeconds, setYtStartSeconds] = useState(savedYt.startSeconds);
  const [ytEndSeconds, setYtEndSeconds] = useState(savedYt.endSeconds);
  const [isYtExtracting, setIsYtExtracting] = useState(false);
  const [isYtGenerating, setIsYtGenerating] = useState(false);

  // Sync YouTube state to module store
  useEffect(() => {
    setYoutubeStore({
      videoId: ytVideoId,
      url: ytUrl,
      totalDurationSeconds: ytDuration,
      needsSegmentation: ytNeedsSegmentation,
      minutes: ytMinutes,
      text: ytText,
      charCount: ytCharCount,
      startSeconds: ytStartSeconds,
      endSeconds: ytEndSeconds,
    });
  }, [
    ytVideoId,
    ytUrl,
    ytDuration,
    ytNeedsSegmentation,
    ytMinutes,
    ytText,
    ytCharCount,
    ytStartSeconds,
    ytEndSeconds,
  ]);

  useEffect(() => {
    setPdfStore({
      pages: pdfPages,
      totalPages: pdfTotalPages,
      filename: pdfFilename,
      suggestedStart,
      pageStart,
      pageEnd,
    });
  }, [pdfPages, pdfTotalPages, pdfFilename, suggestedStart, pageStart, pageEnd]);

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

  const resetYoutubeState = () => {
    resetYoutubeStore();
    setYtUrl("");
    setYtVideoId("");
    setYtDuration(0);
    setYtNeedsSegmentation(false);
    setYtMinutes([]);
    setYtText("");
    setYtCharCount(0);
    setYtStartSeconds(0);
    setYtEndSeconds(0);
  };

  // Phase 1 of the two-phase YouTube flow. Always fetches the full transcript
  // and determines segmentation by character count (not duration). If the
  // full transcript fits within 50k chars, the backend returns the complete
  // text and needs_segmentation=false — the user can generate immediately.
  // If it exceeds 50k chars, needs_segmentation=true and the sliders default
  // to the full video duration so the user must actively narrow the range
  // rather than silently getting a partial transcript. We leave ytText empty
  // for segmented videos — the actual text fetch happens in
  // handleYoutubeGenerate (phase 2) after the user confirms a time range.
  const handleYoutubeExtract = async () => {
    if (!ytUrl.trim()) return;
    setIsYtExtracting(true);
    try {
      const res = await client.post("/extract/youtube/", { url: ytUrl });
      const d = res.data;
      setYtVideoId(d.video_id);
      setYtDuration(d.total_duration_seconds);
      setYtNeedsSegmentation(d.needs_segmentation);
      setYtMinutes(d.minutes);
      setYtStartSeconds(d.start_seconds);

      if (!d.needs_segmentation) {
        setYtEndSeconds(d.end_seconds);
        setYtText(d.text);
        setYtCharCount(d.char_count);
        toast.success(
          `Transcript loaded · ${formatDuration(d.total_duration_seconds)}`
        );
      } else {
        // Default to full duration so user must actively choose a segment
        // rather than silently getting a partial transcript
        setYtEndSeconds(d.total_duration_seconds);
        setYtText("");
        setYtCharCount(0);
        toast.success(
          `Video is ${formatDuration(d.total_duration_seconds)} — select a time range`
        );
      }
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to extract transcript.";
      toast.error(detail);
    } finally {
      setIsYtExtracting(false);
    }
  };

  // Phase 2: generates flashcards from the YouTube transcript. Two paths:
  // - Short videos already have ytText from phase 1, so we skip straight
  //   to the /generate/ call with the text we already hold in memory.
  // - Long videos (ytNeedsSegmentation && !ytText) need a second call to
  //   /extract/youtube/ with the user's chosen start_seconds/end_seconds
  //   to fetch only the selected segment's text, then chains into /generate/.
  //   We cache the fetched text in ytText so re-generating the same range
  //   doesn't re-fetch.
  const handleYoutubeGenerate = async () => {
    if (!selectedDeckId) {
      setDeckError(true);
      return;
    }
    setDeckError(false);

    // If segmented and we need to fetch the text for the selected range
    if (ytNeedsSegmentation && !ytText) {
      setIsYtGenerating(true);
      try {
        const res = await client.post("/extract/youtube/", {
          url: ytUrl,
          start_seconds: ytStartSeconds,
          end_seconds: ytEndSeconds,
        });
        const fetchedText = res.data.text;
        setYtText(fetchedText);
        setYtCharCount(res.data.char_count);

        // Segmented videos intentionally keep all YouTube state after
        // generation so the user can tweak the time range and re-generate.
        generate(
          { text: fetchedText },
          {
            onSuccess: (genRes) => {
              setGeneratedCards(genRes.data);
              toast.success(`${genRes.data.length} flashcards generated!`);
            },
            onError: () => {
              toast.error(
                "Failed to generate flashcards. Please try again."
              );
            },
            onSettled: () => setIsYtGenerating(false),
          }
        );
      } catch (err: unknown) {
        const raw = (err as { response?: { data?: { detail?: unknown } } })
          ?.response?.data?.detail;
        const message = Array.isArray(raw) ? raw[0] : raw;
        toast.error(
          (typeof message === "string" && message) ||
            "Failed to extract segment. Please try again."
        );
        setIsYtGenerating(false);
      }
      return;
    }

    // Text already available — either a short video (full transcript loaded
    // in phase 1) or a segmented video whose range was already fetched.
    const textToUse = ytText;
    if (!textToUse || textToUse.length < MIN_CHARS) {
      toast.error("Transcript is too short to generate flashcards.");
      return;
    }
    if (textToUse.length > YT_MAX_CHARS) {
      toast.error(
        `Transcript exceeds ${YT_MAX_CHARS.toLocaleString()} characters. Please use a shorter video.`
      );
      return;
    }
    setIsYtGenerating(true);
    const isShortVideo = !ytNeedsSegmentation;
    generate(
      { text: textToUse },
      {
        onSuccess: (res) => {
          setGeneratedCards(res.data);
          toast.success(`${res.data.length} flashcards generated!`);
          // Short videos are a one-shot flow — reset YouTube state so the
          // left panel returns to the URL input, ready for the next video.
          // Long/segmented videos keep state intact so the user can adjust
          // the time range and re-generate from the same video.
          if (isShortVideo) {
            resetYoutubeState();
          }
        },
        onError: () => {
          toast.error("Failed to generate flashcards. Please try again.");
        },
        onSettled: () => setIsYtGenerating(false),
      }
    );
  };

  const resetPdfState = () => {
    resetPdfStore();
    setPdfPages([]);
    setPdfTotalPages(0);
    setPdfFilename("");
    setSuggestedStart(1);
    setPageStart(1);
    setPageEnd(1);
  };

  const handlePdfUpload = async (file: File) => {
    setIsPdfUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      const res = await client.post("/extract/pdf/", formData);
      const { pages, total_pages, suggested_start_page } = res.data;
      setPdfPages(pages);
      setPdfTotalPages(total_pages);
      setPdfFilename(file.name);
      setSuggestedStart(suggested_start_page);
      setPageStart(suggested_start_page);
      setPageEnd(Math.min(suggested_start_page + 9, pages.length));
      toast.success(`PDF loaded · ${total_pages} pages extracted`);
      const emptyCount = (pages as string[]).filter((p: string) => p.trim().length === 0).length;
      if (emptyCount > pages.length * 0.2) {
        toast.warning("Many pages appear to have no text — this PDF may be scanned or image-based.");
      }
    } catch {
      toast.error("Failed to extract PDF. The file may be corrupted or image-only.");
    } finally {
      setIsPdfUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
    e.target.value = "";
  };

  const handleLoadPages = () => {
    const selected = pdfPages.slice(pageStart - 1, pageEnd);
    const joined = selected
      .join("\n\n---\n\n")
      .replace(/\u0000/g, "")
      .replace(/[\x00-\x08\x0B\x0E-\x1F\x7F]/g, "")
      .trim();
    if (joined.length > MAX_CHARS) {
      toast.error(
        `Selected pages exceed ${MAX_CHARS.toLocaleString()} characters. Please narrow your page range.`
      );
      return;
    }
    setText(joined);
    setInputMode("text");
    toast.success(`Pages ${pageStart}–${pageEnd} loaded into editor`);
  };

  const selectedText = pdfPages.slice(pageStart - 1, pageEnd).join(" ");
  const wordCount = selectedText.split(/\s+/).filter(Boolean).length;
  const rawEstimate = Math.round(wordCount / 80 / 5) * 5;
  const estimatedCards = Math.max(rawEstimate, 5);

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

          {/* Mode toggle */}
          <div className="px-6 pt-4">
            <div className="rounded-lg border border-[#2a2f42] bg-[#0f1117] p-1 flex">
              <button
                onClick={() => setInputMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${inputMode === "text"
                  ? "bg-[#3B5BDB] text-white"
                  : "text-[#8b92a5] hover:text-white"
                  }`}
              >
                <Type className="size-3.5" />
                Text
              </button>
              <button
                onClick={() => setInputMode("pdf")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${inputMode === "pdf"
                  ? "bg-[#3B5BDB] text-white"
                  : "text-[#8b92a5] hover:text-white"
                  }`}
              >
                <Upload className="size-3.5" />
                PDF
              </button>
              <button
                onClick={() => setInputMode("youtube")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${inputMode === "youtube"
                  ? "bg-[#3B5BDB] text-white"
                  : "text-[#8b92a5] hover:text-white"
                  }`}
              >
                <Video className="size-3.5" />
                YouTube
              </button>
            </div>
          </div>

          {inputMode === "text" ? (
            <>
              <div className="flex flex-1 flex-col overflow-hidden px-6 py-4">
                {pdfPages.length > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-[#2a2f42] bg-[#1a1f2e] px-3 py-1.5 text-xs text-[#8b92a5] mb-2">
                    <FileText className="size-3.5 shrink-0" />
                    <span>
                      From PDF · Pages {pageStart}–{pageEnd}
                    </span>
                    <button
                      onClick={() => setInputMode("pdf")}
                      className="ml-auto text-[#3B5BDB] hover:text-[#5a7cf5] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Adjust range →
                    </button>
                  </div>
                )}
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
            </>
          ) : inputMode === "youtube" ? (
            /* YouTube mode */
            !ytVideoId ? (
              /* No video loaded — URL input */
              <div className="flex flex-1 flex-col px-6 py-4">
                <div className="flex flex-1 flex-col items-center justify-center gap-4">
                  <div className="rounded-xl bg-[#2a2f42] p-4">
                    {isYtExtracting ? (
                      <Loader2 className="size-8 text-[#3B5BDB] animate-spin" />
                    ) : (
                      <Video className="size-8 text-[#8b92a5]" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white">
                      {isYtExtracting
                        ? "Extracting transcript..."
                        : "YouTube Transcript"}
                    </p>
                    <p className="mt-1 text-sm text-[#555b6e]">
                      {isYtExtracting
                        ? "This may take a moment"
                        : "Paste a YouTube URL to extract the transcript"}
                    </p>
                  </div>
                  <div className="w-full max-w-md space-y-3">
                    <input
                      type="url"
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && ytUrl.trim() && !isYtExtracting)
                          handleYoutubeExtract();
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      disabled={isYtExtracting}
                      className="w-full h-11 rounded-lg border border-[#2a2f42] bg-[#1a1f2e] px-4 text-sm text-white placeholder:text-[#555b6e] outline-none focus:border-[#3B5BDB] transition-colors disabled:opacity-50"
                    />
                    <Button
                      onClick={handleYoutubeExtract}
                      disabled={!ytUrl.trim() || isYtExtracting}
                      className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isYtExtracting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="size-4" />
                          Extract Transcript
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-col items-center gap-1">
                    <span className="flex items-center gap-1.5 text-xs text-[#555b6e]">
                      <Check className="size-3 text-[#555b6e]" />
                      Videos up to 5 hours
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#555b6e]">
                      <Check className="size-3 text-[#555b6e]" />
                      Auto-generated captions supported
                    </span>
                  </div>
                </div>
              </div>
            ) : !ytNeedsSegmentation ? (
              /* Short video — transcript ready, can generate directly */
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4 space-y-4">
                {/* Video info pill */}
                <div className="flex items-center gap-3 rounded-xl border border-[#2a2f42] bg-[#1a1f2e] px-4 py-3">
                  <Video className="size-5 shrink-0 text-[#3B5BDB]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {ytVideoId}
                    </p>
                    <p className="text-xs text-[#555b6e]">
                      {formatDuration(ytDuration)} · {ytCharCount.toLocaleString()} chars
                    </p>
                  </div>
                  <button
                    onClick={resetYoutubeState}
                    className="shrink-0 rounded-md p-1 text-[#555b6e] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Transcript preview */}
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b92a5] block mb-1.5">
                    Transcript Preview
                  </label>
                  <div className="h-40 overflow-y-auto rounded-lg border border-[#2a2f42] bg-[#0f1117] px-3 py-2 text-xs text-[#8b92a5] leading-relaxed">
                    {ytText.slice(0, 2000)}
                    {ytText.length > 2000 ? "…" : ""}
                  </div>
                </div>

                <Button
                  onClick={handleYoutubeGenerate}
                  disabled={isYtGenerating || isPending}
                  className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isYtGenerating || isPending ? (
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
            ) : (
              /* Long video — needs time range selection */
              <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4 space-y-4">
                {/* Video info pill */}
                <div className="flex items-center gap-3 rounded-xl border border-[#2a2f42] bg-[#1a1f2e] px-4 py-3">
                  <Video className="size-5 shrink-0 text-[#3B5BDB]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {ytVideoId}
                    </p>
                    <p className="text-xs text-[#555b6e]">
                      {formatDuration(ytDuration)} · Select a time range
                    </p>
                  </div>
                  <button
                    onClick={resetYoutubeState}
                    className="shrink-0 rounded-md p-1 text-[#555b6e] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="rounded-lg bg-[#3B5BDB]/10 border border-[#3B5BDB]/20 px-3 py-2 text-xs text-[#3B5BDB]">
                  <Clock className="inline size-3 mr-1.5" />
                  This transcript is too large to process at once. Select a segment to generate flashcards from.
                </div>

                {/* Time labels row */}
                <div className="flex items-center justify-between text-xs text-[#8b92a5] font-medium">
                  <span>START {formatTime(ytStartSeconds)}</span>
                  <span>{formatDuration(ytDuration)} total</span>
                  <span>END {formatTime(ytEndSeconds)}</span>
                </div>

                <RangeSlider
                  min={0}
                  max={ytDuration}
                  start={ytStartSeconds}
                  end={ytEndSeconds}
                  onChange={(start, end) => {
                    setYtStartSeconds(start);
                    setYtEndSeconds(end);
                    setYtText("");
                    setYtCharCount(0);
                  }}
                />

                {/* Start preview */}
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b92a5]">
                    At {formatTime(ytStartSeconds)}
                  </p>
                  <div className="h-16 overflow-hidden rounded-lg border border-[#2a2f42] bg-[#0f1117] px-3 py-2.5 text-xs text-[#8b92a5] leading-relaxed">
                    {getMinutePreview(ytMinutes, ytStartSeconds) || (
                      <span className="italic text-[#555b6e]">No transcript at this timestamp.</span>
                    )}
                  </div>
                </div>

                {/* End preview */}
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b92a5]">
                    At {formatTime(ytEndSeconds)}
                  </p>
                  <div className="h-16 overflow-hidden rounded-lg border border-[#2a2f42] bg-[#0f1117] px-3 py-2.5 text-xs text-[#8b92a5] leading-relaxed">
                    {getMinutePreview(ytMinutes, ytEndSeconds) || (
                      <span className="italic text-[#555b6e]">No transcript at this timestamp.</span>
                    )}
                  </div>
                </div>

                {/* Selected duration + warnings */}
                {(() => {
                  const selectedMinutes = Math.round(
                    (ytEndSeconds - ytStartSeconds) / 60
                  );
                  const estimatedChars = selectedMinutes * 800;
                  return (
                    <>
                      <p className="text-xs text-[#555b6e] text-center">
                        {selectedMinutes} min selected · {formatTime(ytStartSeconds)} – {formatTime(ytEndSeconds)}
                      </p>
                      {selectedMinutes >= 91 ? (
                        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-xs text-orange-400">
                          ⚠ Very long segment. For best results, work through the video in 60-minute sections.
                        </div>
                      ) : selectedMinutes >= 61 ? (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
                          ⚠ Long segment — card quality may vary. Consider narrowing your range.
                        </div>
                      ) : null}
                      {estimatedChars > 50000 && (
                        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-xs text-orange-400">
                          ⚠ This segment may exceed the 50,000 character limit. Try selecting under 60 minutes.
                        </div>
                      )}
                    </>
                  );
                })()}

                <Button
                  onClick={handleYoutubeGenerate}
                  disabled={isYtGenerating || isPending}
                  className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isYtGenerating || isPending ? (
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
            )
          ) : pdfPages.length === 0 ? (
            /* PDF mode — no PDF loaded */
            <div className="flex flex-1 flex-col px-6 py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => !isPdfUploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.toLowerCase().endsWith(".pdf")) {
                    handlePdfUpload(file);
                  } else {
                    toast.error("Please drop a PDF file.");
                  }
                }}
                className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${isPdfUploading
                  ? "border-[#3B5BDB]/50 bg-[#1e2438] cursor-wait"
                  : isDragging
                    ? "border-[#3B5BDB]/50 bg-[#1e2438] cursor-pointer"
                    : "border-[#2a2f42] bg-[#1a1f2e] cursor-pointer hover:border-[#3B5BDB]/50 hover:bg-[#1e2438]"
                  }`}
              >
                {isPdfUploading ? (
                  <>
                    <div className="rounded-xl bg-[#2a2f42] p-4">
                      <Loader2 className="size-8 text-[#3B5BDB] animate-spin" />
                    </div>
                    <p className="text-lg font-semibold text-white">
                      Extracting text...
                    </p>
                    <p className="text-sm text-[#555b6e]">
                      This may take a moment
                    </p>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl bg-[#2a2f42] p-4">
                      <Upload className="size-8 text-[#8b92a5]" />
                    </div>
                    <p className="text-lg font-semibold text-white">
                      Drop PDF Document
                    </p>
                    <p className="text-sm text-[#555b6e] text-center">
                      Drag & drop your notes, textbook, or lecture slides
                    </p>
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <span className="flex items-center gap-1.5 text-xs text-[#555b6e]">
                        <Check className="size-3 text-[#555b6e]" />
                        PDF Format
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#555b6e]">
                        <Check className="size-3 text-[#555b6e]" />
                        Max 20MB
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-[#555b6e]">
                        <Check className="size-3 text-[#555b6e]" />
                        Digital text only
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* PDF mode — PDF loaded, configure scope */
            <div className="flex flex-1 flex-col overflow-y-auto px-6 py-4 space-y-4">
              {/* File info pill */}
              <div className="flex items-center gap-3 rounded-xl border border-[#2a2f42] bg-[#1a1f2e] px-4 py-3">
                <FileText className="size-5 shrink-0 text-[#3B5BDB]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {pdfFilename.length > 40
                      ? pdfFilename.slice(0, 40) + "…"
                      : pdfFilename}
                  </p>
                  <p className="text-xs text-[#555b6e]">
                    {pdfTotalPages} pages
                  </p>
                </div>
                <button
                  onClick={resetPdfState}
                  className="shrink-0 rounded-md p-1 text-[#555b6e] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Configure Scope heading */}
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Configure Scope
                </h3>
                {suggestedStart > 1 && (
                  <span className="rounded-md bg-[#3B5BDB]/10 px-2 py-0.5 text-[10px] font-medium text-[#3B5BDB]">
                    ⚡ Recommended: pg {suggestedStart}
                  </span>
                )}
              </div>

              {/* Start Page */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b92a5] block mb-1.5">
                  Start Page
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPageStart((v) => Math.max(1, v - 1))}
                    disabled={pageStart <= 1}
                    className="flex size-10 items-center justify-center rounded-lg border border-[#2a2f42] bg-[#1a1f2e] text-xl text-white transition-colors hover:bg-[#2a2f42] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pageStart}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(pageEnd, Number(e.target.value) || 1));
                      setPageStart(v);
                    }}
                    className="h-10 w-16 rounded-lg border border-[#2a2f42] bg-[#0f1117] text-white text-center text-lg font-semibold outline-none focus:border-[#3B5BDB] transition-colors"
                  />
                  <button
                    onClick={() => setPageStart((v) => Math.min(pageEnd, v + 1))}
                    disabled={pageStart >= pageEnd}
                    className="flex size-10 items-center justify-center rounded-lg border border-[#2a2f42] bg-[#1a1f2e] text-xl text-white transition-colors hover:bg-[#2a2f42] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <PagePreview text={pdfPages[pageStart - 1]} />
              </div>

              {/* End Page */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8b92a5] block mb-1.5">
                  End Page
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPageEnd((v) => Math.max(pageStart, v - 1))}
                    disabled={pageEnd <= pageStart}
                    className="flex size-10 items-center justify-center rounded-lg border border-[#2a2f42] bg-[#1a1f2e] text-xl text-white transition-colors hover:bg-[#2a2f42] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pageEnd}
                    onChange={(e) => {
                      const v = Math.max(pageStart, Math.min(pdfPages.length, Number(e.target.value) || pageStart));
                      setPageEnd(v);
                    }}
                    className="h-10 w-16 rounded-lg border border-[#2a2f42] bg-[#0f1117] text-white text-center text-lg font-semibold outline-none focus:border-[#3B5BDB] transition-colors"
                  />
                  <button
                    onClick={() => setPageEnd((v) => Math.min(pdfPages.length, v + 1))}
                    disabled={pageEnd >= pdfPages.length}
                    className="flex size-10 items-center justify-center rounded-lg border border-[#2a2f42] bg-[#1a1f2e] text-xl text-white transition-colors hover:bg-[#2a2f42] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <PagePreview text={pdfPages[pageEnd - 1]} />
              </div>

              {/* Selected range info */}
              <p className="text-xs text-[#555b6e] text-center">
                {pageEnd - pageStart + 1} pages selected · ~{estimatedCards}–
                {estimatedCards + 5} cards estimated
              </p>

              {/* Page count warning */}
              {pageEnd - pageStart + 1 >= 16 ? (
                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-xs text-orange-400">
                  ⚠ {pageEnd - pageStart + 1} pages is a lot to process at once. For best results, work section by section for higher quality cards.
                </div>
              ) : pageEnd - pageStart + 1 >= 11 ? (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-400">
                  ⚠ Large selection — card quality may vary. Consider narrowing your range for better results.
                </div>
              ) : null}

              {/* Load into editor */}
              <Button
                onClick={handleLoadPages}
                className="w-full h-11 bg-[#3B5BDB] hover:bg-[#2645c7] text-white font-medium cursor-pointer"
              >
                Load Pages into Editor
              </Button>
            </div>
          )}
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
                className={`w-full h-11 rounded-lg border bg-[#1a1f2e] px-3 text-sm text-white outline-none transition-colors cursor-pointer ${deckError
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
