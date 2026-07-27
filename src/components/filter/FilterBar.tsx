"use client";
import { useEffect, useRef, useState } from "react";
import { FilterCriteria, EMPTY_FILTER, activeFilterCount, isFilterEmpty } from "@/lib/filter";
import { FilterDropdown } from "./FilterDropdown";

export function FilterBar({ filter, onChange, resultCount, totalCount }: {
  filter: FilterCriteria; onChange: (f: FilterCriteria) => void;
  resultCount: number; totalCount: number;
}) {
  const [open, setOpen]   = useState(false);
  const panelRef          = useRef<HTMLDivElement>(null);
  const advCount          = activeFilterCount(filter);
  const hasAny            = !isFilterEmpty(filter);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!panelRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {/* busca */}
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--text-3)" }}
            fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="6.5" cy="6.5" r="4.5"/><path strokeLinecap="round" d="M10 10l3.5 3.5"/>
          </svg>
          <input type="search" placeholder="Buscar…" value={filter.name}
            onChange={(e) => onChange({ ...filter, name: e.target.value })}
            className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none transition-all"
            style={{ borderColor: "var(--border)", background: "var(--bg-raised)", color: "var(--text-1)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-glow)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }} />
        </div>

        {/* filtros */}
        <div className="relative" ref={panelRef}>
          <button type="button" onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all"
            style={{
              borderColor: advCount > 0 ? "var(--accent)" : "var(--border)",
              color:       advCount > 0 ? "var(--accent)" : "var(--text-3)",
              background:  advCount > 0 ? "var(--accent-glow)" : "var(--bg-raised)",
            }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M2 4h12M4 8h8M6 12h4"/>
            </svg>
            {advCount > 0 && <span className="text-[10px] font-bold">{advCount}</span>}
          </button>

          {open && (
            <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-2xl"
              style={{ borderColor: "var(--border)", background: "var(--bg-overlay)", boxShadow: "0 24px 48px rgba(0,0,0,.6)" }}>
              <div className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>Filtros avançados</p>
                {advCount > 0 && (
                  <button type="button" onClick={() => onChange({ ...EMPTY_FILTER, name: filter.name })}
                    className="text-[10px] transition-colors" style={{ color: "var(--text-3)" }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "#f87171")}
                    onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
                    Limpar
                  </button>
                )}
              </div>
              <div className="max-h-[65vh] overflow-y-auto">
                <FilterDropdown filter={filter} onChange={onChange} />
              </div>
            </div>
          )}
        </div>

        {/* limpar */}
        {hasAny && (
          <button type="button" onClick={() => onChange(EMPTY_FILTER)}
            className="rounded-lg border px-1.5 py-1.5 text-xs transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-3)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#f87171")}
            onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
            ✕
          </button>
        )}
      </div>

      {hasAny && (
        <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
          {resultCount === totalCount ? `${totalCount} cartas` : `${resultCount} / ${totalCount}`}
        </p>
      )}
    </div>
  );
}
