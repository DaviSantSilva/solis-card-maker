"use client";
import { create } from "zustand";
import { Locale, LOCALES, TranslationStatus } from "@/lib/localization/locales";
import { CardType } from "@/lib/cards/types";

/* ── tipos ── */

export interface LocaleJobStatus {
  status: TranslationStatus;
  error?: string;
}

export interface PipelineStep {
  id:        string;
  label:     string;
  status:    "running" | "done" | "error";
  locale?:   Locale;
  timestamp: string; // ISO
}

export interface PipelineJob {
  cardId:    string;
  cardName:  string;
  cardType:  CardType;
  cardAccent: string;      // cor do tipo da carta (para o placeholder visual)
  startedAt: string;       // ISO
  locales:   Record<Locale, LocaleJobStatus>;
  steps:     PipelineStep[];
  expanded:  boolean;
}

export type GlobalPipelineStatus = "idle" | "translating" | "done" | "error";

interface PipelineState {
  /** Jobs indexados por cardId — mantém histórico da sessão */
  jobs: Record<string, PipelineJob>;

  /** Abre um novo job para a carta. Reinicia se já existia. */
  startJob: (card: { cardId: string; cardName: string; cardType: CardType; cardAccent: string }) => void;

  /** Atualiza o status de um idioma específico dentro de um job. */
  updateLocaleStatus: (cardId: string, locale: Locale, status: TranslationStatus, error?: string) => void;

  /** Adiciona um passo ao log do job. */
  addStep: (cardId: string, step: Omit<PipelineStep, "id" | "timestamp">) => void;

  /** Colapsa / expande o log de passos de um job no dropdown. */
  setExpanded: (cardId: string, expanded: boolean) => void;

  /** Remove jobs concluídos (done) da lista. */
  clearCompleted: () => void;
}

/* ── store ── */

export const usePipelineStore = create<PipelineState>((set) => ({
  jobs: {},

  startJob: ({ cardId, cardName, cardType, cardAccent }) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [cardId]: {
          cardId,
          cardName,
          cardType,
          cardAccent,
          startedAt: new Date().toISOString(),
          locales:   Object.fromEntries(
            LOCALES.map((l) => [l, { status: "pending" as TranslationStatus }])
          ) as Record<Locale, LocaleJobStatus>,
          steps:     [],
          expanded:  false,
        },
      },
    })),

  updateLocaleStatus: (cardId, locale, status, error) =>
    set((s) => {
      const job = s.jobs[cardId];
      if (!job) return s;
      return {
        jobs: {
          ...s.jobs,
          [cardId]: {
            ...job,
            locales: {
              ...job.locales,
              [locale]: { status, error },
            },
          },
        },
      };
    }),

  addStep: (cardId, step) =>
    set((s) => {
      const job = s.jobs[cardId];
      if (!job) return s;
      return {
        jobs: {
          ...s.jobs,
          [cardId]: {
            ...job,
            steps: [
              ...job.steps,
              { ...step, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
            ],
          },
        },
      };
    }),

  setExpanded: (cardId, expanded) =>
    set((s) => {
      const job = s.jobs[cardId];
      if (!job) return s;
      return { jobs: { ...s.jobs, [cardId]: { ...job, expanded } } };
    }),

  clearCompleted: () =>
    set((s) => {
      const remaining: Record<string, PipelineJob> = {};
      for (const [id, job] of Object.entries(s.jobs)) {
        const allDone = LOCALES.every((l) =>
          ["done", "stale", "error"].includes(job.locales[l].status)
        );
        if (!allDone) remaining[id] = job;
      }
      return { jobs: remaining };
    }),
}));

/* ── selectors utilitários ── */

/** Status global calculado a partir de todos os jobs ativos. */
export function getGlobalStatus(jobs: Record<string, PipelineJob>): GlobalPipelineStatus {
  const allJobs = Object.values(jobs);
  if (!allJobs.length) return "idle";

  const anyError       = allJobs.some((j) => LOCALES.some((l) => j.locales[l].status === "error"));
  const anyTranslating = allJobs.some((j) => LOCALES.some((l) => ["pending","translating"].includes(j.locales[l].status)));

  if (anyError)       return "error";
  if (anyTranslating) return "translating";
  return "done";
}

/** Retorna true se o card tem locales ainda em andamento. */
export function isCardTranslating(jobs: Record<string, PipelineJob>, cardId: string): boolean {
  const job = jobs[cardId];
  if (!job) return false;
  return LOCALES.some((l) => ["pending", "translating"].includes(job.locales[l].status));
}
