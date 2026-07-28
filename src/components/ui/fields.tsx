"use client";
import { ReactNode } from "react";

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-3)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase = [
  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all",
  "placeholder:opacity-40",
].join(" ");

const inputStyle = {
  background:  "var(--bg-raised)",
  borderColor: "var(--border)",
  color:       "var(--text-1)",
};

const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "var(--accent)";
  e.currentTarget.style.boxShadow   = "0 0 0 3px var(--accent-glow)";
};
const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = "var(--border)";
  e.currentTarget.style.boxShadow   = "none";
};

export function TextInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input type="text" className={inputBase} value={value} placeholder={placeholder}
      style={inputStyle}
      onFocus={inputFocus} onBlur={inputBlur}
      onChange={(e) => onChange(e.target.value)} />
  );
}

export function TextArea({ value, onChange, rows = 2 }: {
  value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <textarea className={`${inputBase} resize-none`} value={value} rows={rows}
      style={inputStyle}
      onFocus={inputFocus} onBlur={inputBlur}
      onChange={(e) => onChange(e.target.value)} />
  );
}

export function SelectInput<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <select className={`${inputBase} cursor-pointer`} value={value}
      style={inputStyle}
      onFocus={inputFocus} onBlur={inputBlur}
      onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function NumberInput({ value, onChange, min = 0, max = 20 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <input type="number" className={inputBase} value={value} min={min} max={max}
      style={inputStyle}
      onFocus={inputFocus} onBlur={inputBlur}
      onChange={(e) => onChange(Number(e.target.value))} />
  );
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
        style={{ color: "var(--text-3)" }}>
        {label}
      </span>
      <div className="flex-1 border-t" style={{ borderColor: "var(--border-sub)" }} />
    </div>
  );
}
