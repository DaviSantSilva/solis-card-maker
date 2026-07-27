"use client";
import { useEffect, useState } from "react";
import { PublicationManifest, VariantMeta, CardMeta } from "@/lib/supabase/db.types";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";
import { COMPANIES } from "@/lib/cards/companies";

const MANIFEST_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards/manifest.json`;

/* ── tipos ── */
type Status =
  | { type: "loading" }
  | { type: "empty" }
  | { type: "error"; message: string }
  | { type: "ready"; manifest: PublicationManifest };

interface GalleryFilter {
  name:      string;
  types:     string[];
  rarities:  string[];
  companies: string[];
}

const EMPTY: GalleryFilter = { name: "", types: [], rarities: [], companies: [] };

/* ── helpers ── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function matchesFilter(slug: string, manifest: PublicationManifest, f: GalleryFilter): boolean {
  const name = manifest.names?.[slug] ?? slug;
  const meta = manifest.meta?.[slug] as CardMeta | undefined;

  if (f.name) {
    const q = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!n.includes(q)) return false;
  }
  if (f.types.length    && meta && !f.types.includes(meta.cardType))   return false;
  if (f.rarities.length && meta && !f.rarities.includes(meta.rarity))  return false;
  if (f.companies.length && meta && !f.companies.includes(meta.companyId)) return false;
  return true;
}

/* ── chip toggle ── */
function Chip({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all ${
        active
          ? "border-blue-500 bg-blue-500/20 text-blue-300"
          : "border-neutral-700 bg-neutral-800/50 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
      }`}>
      {color && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />}
      {children}
    </button>
  );
}

/* ── card tile ── */
function CardTile({ slug, manifest }: { slug: string; manifest: PublicationManifest }) {
  const name    = manifest.names?.[slug] ?? slug;
  const url     = manifest.cards[slug];
  const variant = manifest.variants?.[slug] as VariantMeta | undefined;
  return (
    <div className="group flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl shadow-lg shadow-black/40 transition-transform duration-200 group-hover:-translate-y-1"
        style={{ aspectRatio: "864 / 1234" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
        {variant?.playerColor && (
          <span className="absolute right-2 top-2 h-4 w-4 rounded-full border-2 border-neutral-900 shadow"
            style={{ background: variant.playerColor }} title={variant.companyId} />
        )}
      </div>
      <p className="text-center text-xs font-medium text-neutral-400">{name}</p>
    </div>
  );
}

/* ── grupo de variantes ── */
function VariantGroup({ groupKey, slugs, manifest }: {
  groupKey: string; slugs: string[]; manifest: PublicationManifest;
}) {
  const [open, setOpen] = useState(true);
  const name   = manifest.names?.[slugs[0]] ?? groupKey;
  const colors = slugs.map((s) => (manifest.variants?.[s] as VariantMeta | undefined)?.playerColor).filter(Boolean);
  return (
    <div className="col-span-full flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-200">{name}</span>
          <span className="text-xs text-neutral-600">{slugs.length} variantes</span>
        </div>
        <div className="flex items-center gap-2">
          {colors.map((c, i) => (
            <span key={i} className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: c! }} />
          ))}
          <svg className={`ml-1 h-3 w-3 text-neutral-600 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z" /></svg>
        </div>
      </button>
      {open && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {slugs.map((slug) => <CardTile key={slug} slug={slug} manifest={manifest} />)}
        </div>
      )}
    </div>
  );
}

/* ── página ── */
export default function PublicadasPage() {
  const [status, setStatus] = useState<Status>({ type: "loading" });
  const [filter, setFilter] = useState<GalleryFilter>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<PublicationManifest>; })
      .then((m) => setStatus(Object.keys(m.cards).length ? { type: "ready", manifest: m } : { type: "empty" }))
      .catch((e) => setStatus(e.message.includes("404") ? { type: "empty" } : { type: "error", message: e.message }));
  }, []);

  if (status.type === "loading") return <Page><div className="flex flex-1 items-center justify-center"><svg className="h-6 w-6 animate-spin text-neutral-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg></div></Page>;
  if (status.type === "empty") return <Page><div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-600"><p className="text-sm">Nenhuma carta publicada ainda.</p><a href="/editor" className="text-xs text-blue-500 hover:text-blue-400">Abrir editor →</a></div></Page>;
  if (status.type === "error") return <Page><div className="flex flex-1 items-center justify-center"><p className="text-sm text-red-400">Erro: {status.message}</p></div></Page>;

  const { manifest } = status;
  const allSlugs = Object.keys(manifest.cards);
  const hasFilter = filter.name || filter.types.length || filter.rarities.length || filter.companies.length;

  // filtra slugs
  const filteredSlugs = hasFilter
    ? allSlugs.filter((s) => matchesFilter(s, manifest, filter))
    : allSlugs;

  // agrupa variantes (só sem filtro)
  const groupMap: Record<string, string[]> = {};
  const singles: string[] = [];
  for (const slug of filteredSlugs) {
    const meta = manifest.variants?.[slug] as VariantMeta | undefined;
    if (!hasFilter && meta?.variantGroup) {
      if (!groupMap[meta.variantGroup]) groupMap[meta.variantGroup] = [];
      groupMap[meta.variantGroup].push(slug);
    } else {
      singles.push(slug);
    }
  }

  const TYPES    = Object.entries(CARD_TYPE_THEME) as [string, { label: string; accent: string }][];
  const RARITIES = Object.entries(RARITY_LABEL)   as [string, string][];

  return (
    <Page>
      <header className="flex items-end justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-neutral-100 uppercase">
            Solis <span className="ml-2 text-sm font-normal tracking-normal text-neutral-500 normal-case">Cartas Publicadas</span>
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            v{manifest.version} · {formatDate(manifest.published_at)} · {allSlugs.length} cartas
          </p>
        </div>
        <a href="/editor" className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-500 hover:text-neutral-300">
          Abrir Editor
        </a>
      </header>

      {/* barra de filtros */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex items-center gap-3">
          {/* busca por nome */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="6.5" cy="6.5" r="4.5"/><path strokeLinecap="round" d="M10 10l3.5 3.5"/>
            </svg>
            <input type="search" placeholder="Buscar por nome…" value={filter.name}
              onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/60 py-2 pl-9 pr-3 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-500 transition-colors" />
          </div>
          {/* toggle filtros avançados */}
          <button type="button" onClick={() => setShowFilters((o) => !o)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || filter.types.length || filter.rarities.length || filter.companies.length
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-neutral-700 bg-neutral-800/60 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
            }`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M2 4h12M4 8h8M6 12h4"/>
            </svg>
            Filtros
            {(filter.types.length + filter.rarities.length + filter.companies.length) > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                {filter.types.length + filter.rarities.length + filter.companies.length}
              </span>
            )}
          </button>
          {hasFilter && (
            <button type="button" onClick={() => setFilter(EMPTY)}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-300 transition-colors">✕</button>
          )}
        </div>

        {/* filtros avançados */}
        {showFilters && (
          <div className="flex flex-col gap-4 pt-2 border-t border-neutral-800">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(([key, theme]) => (
                  <Chip key={key} active={filter.types.includes(key)} color={theme.accent}
                    onClick={() => setFilter({ ...filter, types: toggle(filter.types, key) })}>
                    {theme.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Raridade</p>
              <div className="flex flex-wrap gap-2">
                {RARITIES.map(([key, label]) => (
                  <Chip key={key} active={filter.rarities.includes(key)}
                    onClick={() => setFilter({ ...filter, rarities: toggle(filter.rarities, key) })}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Corporação</p>
              <div className="flex flex-wrap gap-2">
                {COMPANIES.map((c) => (
                  <Chip key={c.id} active={filter.companies.includes(c.id)}
                    onClick={() => setFilter({ ...filter, companies: toggle(filter.companies, c.id) })}>
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* contador de resultados */}
        {hasFilter && (
          <p className="text-xs text-neutral-600">
            {filteredSlugs.length} de {allSlugs.length} cartas
          </p>
        )}
      </div>

      {/* grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {singles.map((slug) => <CardTile key={slug} slug={slug} manifest={manifest} />)}
        {Object.entries(groupMap).map(([groupKey, slugs]) => (
          <VariantGroup key={groupKey} groupKey={groupKey} slugs={slugs} manifest={manifest} />
        ))}
        {filteredSlugs.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-neutral-600">
            Nenhuma carta encontrada com esses filtros.
          </div>
        )}
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col gap-8 bg-[#16181b] px-6 py-10 sm:px-10">{children}</main>
  );
}
