"use client";
import { useEffect, useRef, useState } from "react";
import { FilterCriteria, EMPTY_FILTER, activeFilterCount, isFilterEmpty } from "@/lib/filter";
import { FilterDropdown } from "./FilterDropdown";

export function FilterBar({
  filter,
  onChange,
  resultCount,
  totalCount,
}: {
  filter: FilterCriteria;
  onChange: (f: FilterCriteria) => void;
  resultCount: number;
  totalCount: number;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const advCount = activeFilterCount(filter);
  const hasAny   = !isFilterEmpty(filter);

  /* fecha dropdown ao clicar fora */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="flex flex-col gap-2">
      {/* barra principal */}
      <div className="flex items-center gap-2">
        {/* busca por nome */}
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600"
            fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <path strokeLinecap="round" d="M10 10l3.5 3.5"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar por nome…"
            value={filter.name}
            onChange={(e) => onChange({ ...filter, name: e.target.value })}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800/60 py-1.5 pl-8 pr-3 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-500 transition-colors"
          />
        </div>

        {/* botão de filtros avançados */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              advCount > 0 || open
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-neutral-700 bg-neutral-800/60 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M2 4h12M4 8h8M6 12h4"/>
            </svg>
            Filtros
            {advCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {advCount}
              </span>
            )}
          </button>

          {/* painel de filtros avançados */}
          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                <p className="text-xs font-semibold text-neutral-300">Filtros avançados</p>
                {advCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...EMPTY_FILTER, name: filter.name })}
                    className="text-[10px] text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                <FilterDropdown filter={filter} onChange={onChange} />
              </div>
            </div>
          )}
        </div>

        {/* limpar tudo */}
        {hasAny && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTER)}
            className="rounded-md border border-neutral-700 px-2 py-1.5 text-xs text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-300"
            title="Limpar todos os filtros"
          >
            ✕
          </button>
        )}
      </div>

      {/* contador de resultados */}
      {hasAny && (
        <p className="text-[10px] text-neutral-600">
          {resultCount === totalCount
            ? `${totalCount} cartas`
            : `${resultCount} de ${totalCount} cartas`}
        </p>
      )}
    </div>
  );
}
