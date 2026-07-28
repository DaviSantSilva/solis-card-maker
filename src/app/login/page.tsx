"use client";
import { Suspense, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">

        {/* logo / título */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
            Solis
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-3)" }}>
            Card Maker — acesso restrito
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-3)" }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background:   "var(--bg-raised)",
                borderColor:  error ? "#ef4444" : "var(--border)",
                color:        "var(--text-1)",
                boxShadow:    error ? "0 0 0 3px rgba(239,68,68,0.15)" : "none",
              }}
              onFocus={(e) => {
                if (!error) e.currentTarget.style.borderColor = "var(--accent)";
                if (!error) e.currentTarget.style.boxShadow   = "0 0 0 3px var(--accent-glow)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--border)";
                e.currentTarget.style.boxShadow   = error ? "0 0 0 3px rgba(239,68,68,0.15)" : "none";
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: "#ef4444" }}>
                Senha incorreta.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="flex items-center justify-center rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#3b82f6" }}
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
