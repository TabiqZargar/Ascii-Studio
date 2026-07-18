import type { AsciiSettings } from "../types";

interface ControlsProps {
  settings: AsciiSettings;
  onChange: (settings: AsciiSettings) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  const displayValue = format ? format(value) : value;

  return (
    <div className="flex-1">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-xs text-zinc-400">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-violet-500"
      />
    </div>
  );
}

export default function Controls({ settings, onChange }: ControlsProps) {
  const update = (key: keyof AsciiSettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <Slider
          label="Density"
          value={settings.density}
          min={2}
          max={20}
          step={1}
          onChange={(v) => update("density", v)}
        />
        <Slider
          label="Brightness"
          value={settings.brightness}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update("brightness", v)}
        />
        <Slider
          label="Contrast"
          value={settings.contrast}
          min={0.5}
          max={2}
          step={0.05}
          format={(v) => v.toFixed(2)}
          onChange={(v) => update("contrast", v)}
        />
      </div>
    </div>
  );
}
