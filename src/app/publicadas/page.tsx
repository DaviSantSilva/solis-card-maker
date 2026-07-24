"use client";
import { useEffect, useState } from "react";
import { PublicationManifest } from "@/lib/supabase/db.types";

const MANIFEST_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards/manifest.json`;

type Status =
  | { type: "loading" }
  | { type: "empty" }
  | { type: "error"; message: string }
  | { type: "ready"; manifest: PublicationManifest };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export default function PublicadasPage() {
  const [status, setStatus] = useState<Status>({ type: "loading" });

  useEffect(() => {
    // cache: no-store garante que sempre busca o manifest mais recente
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
        setStatus(
          notFound
            ? { type: "empty" }
            : { type: "error", message: e.message }
        );
      });
  }, []);

  /* ── loading ── */
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

  /* ── nenhuma publicação ── */
  if (status.type === "empty") {
    return (
      <Page>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-600">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
            <rect x="8" y="8" width="32" height="40" rx="4"/>
            <path strokeLinecap="round" d="M16 20h16M16 28h10"/>
          </svg>
          <p className="text-sm">Nenhuma carta publicada ainda.</p>
          <a href="/editor" className="text-xs text-blue-500 hover:text-blue-400 transition-colors">
            Abrir editor →
          </a>
        </div>
      </Page>
    );
  }

  /* ── erro ── */
  if (status.type === "error") {
    return (
      <Page>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-red-400">Erro ao carregar manifest: {status.message}</p>
        </div>
      </Page>
    );
  }

  /* ── galeria ── */
  const { manifest } = status;
  const slugs = Object.keys(manifest.cards);

  return (
    <Page>
      {/* header */}
      <header className="flex items-end justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-widest text-neutral-100 uppercase">
            Solis
            <span className="ml-2 text-sm font-normal tracking-normal text-neutral-500 normal-case">
              Cartas Publicadas
            </span>
          </h1>
          <p className="mt-1 text-xs text-neutral-600">
            v{manifest.version} · {formatDate(manifest.published_at)} ·{" "}
            {slugs.length} carta{slugs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/editor"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-500 hover:text-neutral-300"
        >
          Abrir Editor
        </a>
      </header>

      {/* grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {slugs.map((slug) => {
          const imageUrl = manifest.cards[slug];
          const name     = manifest.names?.[slug] ?? slug;

          return (
            <div key={slug} className="group flex flex-col gap-2">
              {/* imagem da carta */}
              <div
                className="overflow-hidden rounded-xl shadow-lg shadow-black/40 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-xl"
                style={{ aspectRatio: "864 / 1234" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* nome */}
              <p className="text-center text-xs font-medium text-neutral-400">
                {name}
              </p>
            </div>
          );
        })}
      </div>
    </Page>
  );
}

/* wrapper de layout da página */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col gap-8 bg-[#16181b] px-6 py-10 sm:px-10">
      {children}
    </main>
  );
}
