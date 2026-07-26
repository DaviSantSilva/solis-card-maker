"use client";
import { useEffect, useState } from "react";
import { PublicationManifest, VariantMeta } from "@/lib/supabase/db.types";

const MANIFEST_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards/manifest.json`;

type Status =
  | { type: "loading" }
  | { type: "empty" }
  | { type: "error"; message: string }
  | { type: "ready"; manifest: PublicationManifest };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── card individual ── */
function CardTile({ slug, manifest }: { slug: string; manifest: PublicationManifest }) {
  const name    = manifest.names?.[slug] ?? slug;
  const url     = manifest.cards[slug];
  const variant = manifest.variants?.[slug] as VariantMeta | undefined;

  return (
    <div className="group flex flex-col gap-2">
      <div
        className="relative overflow-hidden rounded-xl shadow-lg shadow-black/40 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-xl"
        style={{ aspectRatio: "864 / 1234" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} className="h-full w-full object-cover" loading="lazy" />
        {/* dot de cor do jogador */}
        {variant?.playerColor && (
          <span
            className="absolute right-2 top-2 h-4 w-4 rounded-full border-2 border-neutral-900 shadow"
            style={{ background: variant.playerColor }}
            title={variant.companyId}
          />
        )}
      </div>
      <p className="text-center text-xs font-medium text-neutral-400">{name}</p>
    </div>
  );
}

/* ── grupo de variantes ── */
function VariantGroup({
  groupKey,
  slugs,
  manifest,
}: {
  groupKey: string;
  slugs: string[];
  manifest: PublicationManifest;
}) {
  const [open, setOpen] = useState(true);
  const name = manifest.names?.[slugs[0]] ?? groupKey;
  const colors = slugs.map((s) => (manifest.variants?.[s] as VariantMeta | undefined)?.playerColor).filter(Boolean);

  return (
    <div className="col-span-full flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      {/* cabeçalho */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-200">{name}</span>
          <span className="text-xs text-neutral-600">{slugs.length} variantes</span>
        </div>
        <div className="flex items-center gap-2">
          {colors.map((c, i) => (
            <span key={i} className="h-4 w-4 rounded-full border border-neutral-700" style={{ background: c! }} />
          ))}
          <svg
            className={`ml-1 h-3 w-3 text-neutral-600 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 10 6" fill="currentColor"
          >
            <path d="M0 0l5 6 5-6z" />
          </svg>
        </div>
      </button>

      {/* grid de variantes */}
      {open && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {slugs.map((slug) => (
            <CardTile key={slug} slug={slug} manifest={manifest} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── página principal ── */
export default function PublicadasPage() {
  const [status, setStatus] = useState<Status>({ type: "loading" });

  useEffect(() => {
    fetch(`${MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<PublicationManifest>;
      })
      .then((manifest) => {
        const hasCards = Object.keys(manifest.cards).length > 0;
        setStatus(hasCards ? { type: "ready", manifest } : { type: "empty" });
      })
      .catch((e) => {
        const notFound = e.message.includes("404") || e.message.includes("403");
        setStatus(notFound ? { type: "empty" } : { type: "error", message: e.message });
      });
  }, []);

  if (status.type === "loading") {
    return (
      <Page>
        <div className="flex flex-1 items-center justify-center gap-3 text-neutral-600">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span className="text-sm">Carregando cartas…</span>
        </div>
      </Page>
    );
  }

  if (status.type === "empty") {
    return (
      <Page>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-600">
          <p className="text-sm">Nenhuma carta publicada ainda.</p>
          <a href="/editor" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
            Abrir editor →
          </a>
        </div>
      </Page>
    );
  }

  if (status.type === "error") {
    return (
      <Page>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-red-400">Erro: {status.message}</p>
        </div>
      </Page>
    );
  }

  const { manifest } = status;
  const allSlugs = Object.keys(manifest.cards);
  const total    = allSlugs.length;

  // Separa slugs em grupos de variantes e cartas individuais
  const groupMap: Record<string, string[]> = {};
  const singles: string[] = [];

  for (const slug of allSlugs) {
    const meta = manifest.variants?.[slug] as VariantMeta | undefined;
    if (meta?.variantGroup) {
      if (!groupMap[meta.variantGroup]) groupMap[meta.variantGroup] = [];
      groupMap[meta.variantGroup].push(slug);
    } else {
      singles.push(slug);
    }
  }

  return (
    <Page>
      <header className="flex items-end justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-neutral-100 uppercase">
            Solis
            <span className="ml-2 text-sm font-normal tracking-normal text-neutral-500 normal-case">
              Cartas Publicadas
            </span>
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            v{manifest.version} · {formatDate(manifest.published_at)} · {total} carta{total !== 1 ? "s" : ""}
          </p>
        </div>
        <a href="/editor"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-500 hover:text-neutral-300">
          Abrir Editor
        </a>
      </header>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* cartas individuais */}
        {singles.map((slug) => (
          <CardTile key={slug} slug={slug} manifest={manifest} />
        ))}

        {/* grupos de variantes */}
        {Object.entries(groupMap).map(([groupKey, slugs]) => (
          <VariantGroup key={groupKey} groupKey={groupKey} slugs={slugs} manifest={manifest} />
        ))}
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col gap-8 bg-[#16181b] px-6 py-10 sm:px-10">
      {children}
    </main>
  );
}
