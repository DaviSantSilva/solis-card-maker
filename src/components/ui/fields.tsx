"use client";
import { ReactNode } from "react";

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

const base = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-500 transition-colors";

export function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" className={base} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({ value, onChange, rows = 2 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className={`${base} resize-none`} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />;
}

export function SelectInput<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className={`${base} cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function NumberInput({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return <input type="number" className={base} value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} />;
}

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">{label}</span>
      <div className="flex-1 border-t border-neutral-700" />
    </div>
  );
}
