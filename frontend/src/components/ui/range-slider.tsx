// Dual-thumb range slider built from two overlapping native <input type="range">
// elements on a shared track. The track itself has pointer-events-none so only
// the thumbs (re-enabled via pointer-events-auto) respond to interaction. This
// avoids the complexity of a custom drag implementation while still giving us
// a single visual track with an active fill segment between the two thumbs.

export interface RangeSliderProps {
  min: number;
  max: number;
  start: number;
  end: number;
  step?: number;
  minGap?: number;
  onChange: (start: number, end: number) => void;
}

const rangeThumbClass = [
  "absolute inset-0 w-full appearance-none bg-transparent pointer-events-none cursor-pointer",
  "[&::-webkit-slider-thumb]:pointer-events-auto",
  "[&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:w-4",
  "[&::-webkit-slider-thumb]:h-4",
  "[&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:bg-white",
  "[&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-[#3B5BDB]",
  "[&::-webkit-slider-thumb]:cursor-pointer",
  "[&::-webkit-slider-thumb]:shadow-md",
  "[&::-moz-range-thumb]:pointer-events-auto",
  "[&::-moz-range-thumb]:appearance-none",
  "[&::-moz-range-thumb]:w-4",
  "[&::-moz-range-thumb]:h-4",
  "[&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:bg-white",
  "[&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-[#3B5BDB]",
  "[&::-moz-range-thumb]:cursor-pointer",
].join(" ");

export function RangeSlider({
  min,
  max,
  start,
  end,
  step = 60,
  minGap = 60,
  onChange,
}: RangeSliderProps) {
  const range = max - min || 1;
  const leftPct = ((start - min) / range) * 100;
  const widthPct = ((end - start) / range) * 100;

  return (
    <div className="relative w-full h-8">
      {/* Background track */}
      <div className="absolute inset-0 h-1.5 top-1/2 -translate-y-1/2 rounded-full bg-[#2a2f42]" />
      {/* Active fill between thumbs */}
      <div
        className="absolute h-1.5 top-1/2 -translate-y-1/2 rounded-full bg-[#3B5BDB]"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
      {/* Start thumb */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={start}
        onChange={(e) => {
          const v = Math.min(Number(e.target.value), end - minGap);
          onChange(v, end);
        }}
        className={rangeThumbClass}
        style={{ zIndex: start >= end - minGap ? 5 : 3 }}
      />
      {/* End thumb */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={end}
        onChange={(e) => {
          const v = Math.max(Number(e.target.value), start + minGap);
          onChange(start, v);
        }}
        className={rangeThumbClass}
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
