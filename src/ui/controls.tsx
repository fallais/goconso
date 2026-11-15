import type { ComponentChildren } from "preact";
import { useEffect, useId, useState } from "preact/hooks";

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: ComponentChildren; title?: string }[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

export function Segmented<T extends string | number>({ label, value, options, onChange, size = "md" }: SegmentedProps<T>) {
  return (
    <div class={`segmented ${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          aria-label={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface NumberFieldProps {
  label: ComponentChildren;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  class?: string;
}

export function NumberField({ label, value, unit, min = 0, max, onChange, class: cls }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(format(value));

  // Follow external changes (import, reset) without fighting the user's typing.
  useEffect(() => {
    if (parse(text) !== value) setText(format(value));
  }, [value]);

  return (
    <div class={`field ${cls ?? ""}`}>
      <label for={id}>{label}</label>
      <div class="field-input">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onInput={(e) => {
            const raw = (e.currentTarget as HTMLInputElement).value;
            setText(raw);
            const n = parse(raw);
            if (n !== null) onChange(Math.max(min, max === undefined ? n : Math.min(max, n)));
          }}
          onBlur={() => setText(format(value))}
        />
        {unit && <span class="unit">{unit}</span>}
      </div>
    </div>
  );
}

const format = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");

function parse(text: string): number | null {
  const cleaned = text.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function SectionTitle({ index, children, aside }: { index: string; children: ComponentChildren; aside?: ComponentChildren }) {
  return (
    <div class="section-title">
      <h2>
        <span class="index">{index}</span>
        {children}
      </h2>
      {aside}
    </div>
  );
}
