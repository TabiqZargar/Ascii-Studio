interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  const display = format ? format(value) : value;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs text-zinc-400">{label}</label>
        <span className="font-mono text-xs text-zinc-500">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="mb-2 flex cursor-pointer items-center justify-between">
      <span className="text-xs text-zinc-400">{label}</span>
      <div
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-emerald-600" : "bg-zinc-700"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <label className="text-xs text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs text-zinc-500">{value}</span>
      </div>
    </div>
  );
}
