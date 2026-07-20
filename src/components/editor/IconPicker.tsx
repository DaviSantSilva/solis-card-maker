"use client";
import { useState } from "react";
import { IconKey } from "@/lib/cards/types";
import { GameIcon } from "@/components/card/icons/GameIcon";

const ALL_ICONS: { key: IconKey; label: string }[] = [
  { key: "trabalho",            label: "Trabalho" },
  { key: "credito",             label: "Crédito" },
  { key: "titanio",             label: "Titânio" },
  { key: "combustivel",         label: "Combustível" },
  { key: "nanoestrutura",       label: "Nanoest." },
  { key: "materia-exotica",     label: "Mat. Exótica" },
  { key: "categoria-trabalho",  label: "Cat. Trabalho" },
  { key: "categoria-credito",   label: "Cat. Crédito" },
];

export function IconPicker({
  value,
  onChange,
  allowNull,
}: {
  value: IconKey | null;
  onChange: (v: IconKey | null) => void;
  allowNull?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = ALL_ICONS.find((i) => i.key === value)?.label ?? value;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-100 transition-colors hover:border-neutral-500"
      >
        {value
          ? <><GameIcon icon={value} className="h-5 w-5 shrink-0 text-neutral-300" /><span className="text-xs text-neutral-400">{label}</span></>
          : <span className="text-xs text-neutral-600">— vazio —</span>
        }
        <svg className="ml-auto h-3 w-3 text-neutral-600" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z" /></svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl">
          <div className="grid grid-cols-4 gap-1">
            {allowNull && (
              <button type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="flex h-12 flex-col items-center justify-center rounded-md border border-dashed border-neutral-700 text-[9px] text-neutral-600 hover:border-neutral-500"
              >
                vazio
              </button>
            )}
            {ALL_ICONS.map(({ key, label: lbl }) => (
              <button key={key} type="button"
                onClick={() => { onChange(key); setOpen(false); }}
                title={lbl}
                className={`flex h-12 flex-col items-center justify-center gap-1 rounded-md border transition-colors ${
                  value === key ? "border-blue-500 bg-blue-950/50" : "border-transparent hover:border-neutral-600 hover:bg-neutral-800"
                }`}
              >
                <GameIcon icon={key} className="h-5 w-5 text-neutral-300" />
                <span className="text-[8px] text-neutral-600 leading-none">{lbl}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
