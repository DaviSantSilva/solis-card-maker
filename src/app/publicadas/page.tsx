"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PublicationManifest, VariantMeta, CardMeta } from "@/lib/supabase/db.types";
import { CARD_TYPE_THEME, RARITY_LABEL } from "@/lib/cards/theme";
import { COMPANIES } from "@/lib/cards/companies";
import { LOCALES, LOCALE_LABEL, LOCALE_FLAG } from "@/lib/localization/locales";

const STORAGE_BASE =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards`;
const MANIFEST_URL = `${STORAGE_BASE}/manifest.json`;

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

/**
 * Retorna true se o slug passa pelo filtro.
 *
 * Se o manifest não tem o campo `meta` (publicado antes da feature),
 * os filtros de tipo/raridade/empresa são ignorados — o filtro por nome
 * ainda funciona. Uma nota é exibida ao usuário sugerindo republicar.
 */
function matchesFilter(
  slug: string,
  manifest: PublicationManifest,
  f: GalleryFilter,
  manifestHasMeta: boolean,
): boolean {
  const name = manifest.names?.[slug] ?? slug;

  // busca por nome — sempre disponível
  if (f.name) {
    const q = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!n.includes(q)) return false;
  }

  // filtros que dependem de meta — só aplicados se o manifest tem o campo
  if (manifestHasMeta) {
    const meta = manifest.meta?.[slug] as CardMeta | undefined;
    if (f.types.length    && (!meta || !f.types.includes(meta.cardType)))    return false;
    if (f.rarities.length && (!meta || !f.rarities.includes(meta.rarity)))   return false;
    if (f.companies.length && (!meta || !f.companies.includes(meta.companyId))) return false;
  }

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

/* ── helper de download ── */
async function downloadImage(url: string, filename: string) {
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch { alert("Erro ao baixar imagem."); }
}

/* ── ícone de globe (tradução) ── */
function GlobeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10"/>
      <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
    </svg>
  );
}

/* ── modal de localizações ── */
function LocalizationModal({
  slug, ptName, ptUrl, open, onClose,
}: {
  slug: string; ptName: string; ptUrl: string;
  open: boolean; onClose: () => void;
}) {
  // locale → URL da imagem (undefined = carregando, null = não disponível)
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrls({});

    LOCALES.forEach(async (locale) => {
      try {
        const res = await fetch(
          `${STORAGE_BASE}/manifest-${locale}.json?t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!res.ok) { setUrls((p) => ({ ...p, [locale]: null })); return; }
        const m = await res.json() as PublicationManifest;
        setUrls((p) => ({ ...p, [locale]: m.cards?.[slug] ?? null }));
      } catch {
        setUrls((p) => ({ ...p, [locale]: null }));
      }
    });
  }, [open, slug]);

  if (!open || typeof document === "undefined") return null;

  const allLocales: { key: string; label: string; flag: string; url: string | null | undefined }[] = [
    { key: "pt", label: "Português", flag: "🇧🇷", url: ptUrl },
    ...LOCALES.map((l) => ({ key: l, label: LOCALE_LABEL[l], flag: LOCALE_FLAG[l], url: urls[l] })),
  ];

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.7)" }} />

      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl"
        style={{ background: "var(--bg-overlay)", borderColor: "var(--border)",
                 boxShadow: "0 32px 64px rgba(0,0,0,.7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <GlobeIcon className="h-4 w-4" style={{ color: "var(--text-3)" } as React.CSSProperties} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              {ptName} — Localizações
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-3)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--text-1)")}
            onMouseOut={(e)  => (e.currentTarget.style.color = "var(--text-3)")}>
            ✕
          </button>
        </div>

        {/* grid de localizações */}
        <div className="grid grid-cols-2 gap-5 overflow-y-auto p-6 sm:grid-cols-3 lg:grid-cols-6"
          style={{ maxHeight: "75vh" }}>
          {allLocales.map(({ key, label, flag, url }) => (
            <div key={key} className="flex flex-col gap-2">
              {/* header do locale */}
              <div className="flex items-center gap-1.5">
                <span className="text-base">{flag}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-3)" }}>
                  {label}
                </span>
              </div>

              {/* imagem */}
              <div className="relative overflow-hidden rounded-xl"
                style={{ aspectRatio: "864/1234", background: "var(--bg-raised)" }}>
                {url === undefined ? (
                  /* carregando */
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-5 w-5 animate-spin" style={{ color: "var(--text-3)" }}
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  </div>
                ) : url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`${label} — ${ptName}`}
                    className="h-full w-full cursor-zoom-in object-cover"
                    loading="lazy"
                    onClick={() => setLightbox({ url, label: `${flag} ${label}` })} />
                ) : (
                  /* não disponível */
                  <div className="flex h-full flex-col items-center justify-center gap-1">
                    <span className="text-xl" style={{ color: "var(--text-3)" }}>—</span>
                    <span className="text-[9px]" style={{ color: "var(--text-3)" }}>
                      Não publicada
                    </span>
                  </div>
                )}
              </div>

              {/* botão de download */}
              {url && (
                <button
                  type="button"
                  onClick={() => downloadImage(url, `${slug}-${key}.png`)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[10px] font-medium transition-all hover:border-blue-500 hover:text-white"
                  style={{ borderColor: "var(--border)", color: "var(--text-2)" }}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 16 16"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 2v8m0 0L5 7m3 3 3-3M2 12h12"/>
                  </svg>
                  Baixar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

  // Lightbox fullscreen
  if (lightbox && typeof document !== "undefined") {
    const portal = createPortal(
      <div
        className="fixed inset-0 z-[300] flex cursor-zoom-out items-center justify-center"
        style={{ background: "rgba(0,0,0,0.95)" }}
        onClick={() => setLightbox(null)}
      >
        {/* label */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4">
          <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
            {ptName} — {lightbox!.label}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (lightbox) downloadImage(lightbox.url, `${slug}-${lightbox.label.split(" ").pop()?.toLowerCase()}.png`); }}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-blue-500 hover:text-white"
              style={{ borderColor: "var(--border)", color: "var(--text-2)" }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8m0 0L5 7m3 3 3-3M2 12h12"/>
              </svg>
              Baixar
            </button>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-neutral-500 hover:text-white"
              style={{ borderColor: "var(--border)", color: "var(--text-3)" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* imagem */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lightbox!.url ?? ""}
          alt={lightbox!.label ?? ""}
          className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
          style={{ boxShadow: "0 32px 64px rgba(0,0,0,.8)" }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>,
      document.body
    );
    return <>{portal}{open && typeof document !== "undefined" && createPortal(<></>, document.body)}</>;
  }
}

/* ── card tile (carta individual) ── */
function CardTile({ slug, manifest, onLocalize }: {
  slug: string; manifest: PublicationManifest; onLocalize: (slug: string) => void;
}) {
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
            style={{ background: variant.playerColor }} />
        )}
        {/* botão de localizações */}
        <button
          type="button"
          onClick={() => onLocalize(slug)}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg border opacity-0 transition-all group-hover:opacity-100"
          style={{ background: "var(--bg-overlay)", borderColor: "var(--border)", color: "var(--text-2)" }}
          title="Ver localizações"
        >
          <GlobeIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="text-center text-xs font-medium text-neutral-400">{name}</p>
    </div>
  );
}

/* ── modal de variantes da galeria ── */
function GalleryVariantModal({
  groupKey, slugs, manifest, open, onClose,
}: {
  groupKey: string; slugs: string[]; manifest: PublicationManifest;
  open: boolean; onClose: () => void;
}) {
  if (!open) return null;
  const name = manifest.names?.[slugs[0]] ?? groupKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-neutral-100">{name}</p>
            <p className="text-xs text-neutral-500">{slugs.length} variantes</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3"
          style={{ maxHeight: "70vh" }}>
          {slugs.map((slug) => {
            const variant = manifest.variants?.[slug] as VariantMeta | undefined;
            return (
              <div key={slug} className="flex flex-col gap-2">
                <div className="relative overflow-hidden rounded-xl shadow-md"
                  style={{ aspectRatio: "864 / 1234" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={manifest.cards[slug]} alt={manifest.names?.[slug] ?? slug}
                    className="h-full w-full object-cover" loading="lazy" />
                  {variant?.playerColor && (
                    <span className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-900 shadow"
                      style={{ background: variant.playerColor }} />
                  )}
                </div>
                {variant?.companyId && (
                  <p className="text-center text-[10px] capitalize text-neutral-600">
                    {variant.companyId}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── stack de variantes da galeria ── */
function GalleryVariantStack({
  groupKey, slugs, manifest,
}: {
  groupKey: string; slugs: string[]; manifest: PublicationManifest;
}) {
  const [hovered, setHovered]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const front  = slugs[0];
  const others = slugs.slice(1, 3); // até 2 camadas traseiras
  const colors = slugs
    .map((s) => (manifest.variants?.[s] as VariantMeta | undefined)?.playerColor)
    .filter(Boolean) as string[];

  const restOffset  = [{ x: -4, y: 4, r: -1.2 }, { x: -8, y: 8, r: -2.4 }];
  const hoverOffset = [{ x: -14, y: 10, r: -6  }, { x: -26, y: 16, r: -11 }];

  return (
    <>
      <div
        className="group flex flex-col gap-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* stack */}
        <div
          className="relative cursor-pointer"
          style={{ paddingBottom: others.length * 10 }}
          onClick={() => setModalOpen(true)}
        >
          {/* camadas traseiras */}
          {others.map((slug, i) => {
            const color = (manifest.variants?.[slug] as VariantMeta | undefined)?.playerColor;
            const off   = hovered ? hoverOffset[i] : restOffset[i];
            return (
              <div
                key={slug}
                className="absolute inset-0 overflow-hidden rounded-xl"
                style={{
                  background:  color ? `${color}28` : "#23252a",
                  border:      `2px solid ${color ?? "#3a3d42"}44`,
                  transform:   `translate(${off.x}px, ${off.y}px) rotate(${off.r}deg)`,
                  transition:  "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  zIndex:      others.length - i,
                  aspectRatio: "864 / 1234",
                }}
              />
            );
          })}

          {/* carta da frente */}
          <div
            className="relative overflow-hidden rounded-xl shadow-lg shadow-black/40"
            style={{
              aspectRatio: "864 / 1234",
              zIndex:      10,
              transform:   hovered ? "translateY(-6px)" : "translateY(0)",
              transition:  "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter:      hovered ? "drop-shadow(0 12px 24px rgba(0,0,0,.6))" : "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={manifest.cards[front]}
              alt={manifest.names?.[front] ?? front}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {/* dots de cor */}
            <div className="absolute bottom-2 right-2 flex flex-col gap-1">
              {colors.map((c, i) => (
                <span key={i} className="h-2.5 w-2.5 rounded-full border border-neutral-900 shadow"
                  style={{ background: c }} />
              ))}
            </div>
            {/* badge */}
            <div className="absolute left-1.5 top-1.5 rounded-md bg-neutral-900/80 px-1.5 py-0.5 text-[9px] font-bold text-neutral-400 backdrop-blur-sm">
              {slugs.length} vars
            </div>
          </div>
        </div>

        {/* nome abaixo */}
        <p className="text-center text-xs font-medium text-neutral-400">
          {manifest.names?.[front] ?? groupKey}
        </p>
      </div>

      <GalleryVariantModal
        groupKey={groupKey}
        slugs={slugs}
        manifest={manifest}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

/* ── página principal ── */
export default function PublicadasPage() {
  const [status,      setStatus]      = useState<Status>({ type: "loading" });
  const [filter,      setFilter]      = useState<GalleryFilter>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [localizeSlug, setLocalizeSlug] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<PublicationManifest>; })
      .then((m) => setStatus(Object.keys(m.cards).length ? { type: "ready", manifest: m } : { type: "empty" }))
      .catch((e) => setStatus(e.message.includes("404") ? { type: "empty" } : { type: "error", message: e.message }));
  }, []);

  if (status.type === "loading") return <Page><div className="flex flex-1 items-center justify-center"><svg className="h-6 w-6 animate-spin text-neutral-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg></div></Page>;
  if (status.type === "empty")   return <Page><div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-600"><p className="text-sm">Nenhuma carta publicada ainda.</p><a href="/editor" className="text-xs text-blue-500 hover:text-blue-400">Abrir editor →</a></div></Page>;
  if (status.type === "error")   return <Page><div className="flex flex-1 items-center justify-center"><p className="text-sm text-red-400">Erro: {status.message}</p></div></Page>;

  const { manifest } = status;
  const allSlugs       = Object.keys(manifest.cards);
  const manifestHasMeta = !!(manifest.meta && Object.keys(manifest.meta).length > 0);
  const hasFilter      = filter.name || filter.types.length || filter.rarities.length || filter.companies.length;

  const filteredSlugs = hasFilter
    ? allSlugs.filter((s) => matchesFilter(s, manifest, filter, manifestHasMeta))
    : allSlugs;

  // agrupa variantes — stacks mesmo com filtro ativo
  const groupMap: Record<string, string[]> = {};
  const singles:  string[] = [];

  for (const slug of filteredSlugs) {
    const meta = manifest.variants?.[slug] as VariantMeta | undefined;
    if (meta?.variantGroup) {
      if (!groupMap[meta.variantGroup]) groupMap[meta.variantGroup] = [];
      groupMap[meta.variantGroup].push(slug);
    } else {
      singles.push(slug);
    }
  }

  const TYPES    = Object.entries(CARD_TYPE_THEME) as [string, { label: string; accent: string }][];
  const RARITIES = Object.entries(RARITY_LABEL)   as [string, string][];
  const advCount = filter.types.length + filter.rarities.length + filter.companies.length;

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

      {/* barra de filtro */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-600" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="6.5" cy="6.5" r="4.5"/><path strokeLinecap="round" d="M10 10l3.5 3.5"/>
            </svg>
            <input type="search" placeholder="Buscar por nome…" value={filter.name}
              onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800/60 py-2 pl-9 pr-3 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-500 transition-colors" />
          </div>
          <button type="button" onClick={() => setShowFilters((o) => !o)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || advCount > 0
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-neutral-700 bg-neutral-800/60 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
            }`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M2 4h12M4 8h8M6 12h4"/>
            </svg>
            Filtros
            {advCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">{advCount}</span>
            )}
          </button>
          {hasFilter && (
            <button type="button" onClick={() => setFilter(EMPTY)}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-300 transition-colors">✕</button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-col gap-4 border-t border-neutral-800 pt-3">
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

        {hasFilter && (
          <p className="text-xs text-neutral-600">
            {filteredSlugs.length} de {allSlugs.length} cartas
            {!manifestHasMeta && advCount > 0 && (
              <span className="ml-2 text-neutral-700">
                · Filtros de tipo/raridade/empresa requerem republicação para ativar
              </span>
            )}
          </p>
        )}
      </div>

      {/* modal de localizações */}
      {localizeSlug && (
        <LocalizationModal
          slug={localizeSlug}
          ptName={manifest.names?.[localizeSlug] ?? localizeSlug}
          ptUrl={manifest.cards[localizeSlug]}
          open={!!localizeSlug}
          onClose={() => setLocalizeSlug(null)}
        />
      )}

      {/* grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {singles.map((slug) => (
          <CardTile key={slug} slug={slug} manifest={manifest} onLocalize={setLocalizeSlug} />
        ))}
        {Object.entries(groupMap).map(([groupKey, slugs]) => (
          slugs.length === 1
            ? <CardTile key={groupKey} slug={slugs[0]} manifest={manifest} onLocalize={setLocalizeSlug} />
            : <GalleryVariantStack key={groupKey} groupKey={groupKey} slugs={slugs} manifest={manifest} />
        ))}
        {filteredSlugs.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-neutral-600">
            Nenhuma carta encontrada.{!manifest.meta && hasFilter && advCount > 0 && (
              <span className="block mt-1 text-xs text-neutral-700">
                Publique novamente para ativar os filtros de tipo e raridade.
              </span>
            )}
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
