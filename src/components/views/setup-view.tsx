"use client";

import { useState, useEffect } from "react";
import { getConfig, saveConfig, testConnection } from "@/lib/tauri-bridge";
import { C } from "@/lib/colors";
import { Database, Wifi, CheckCircle2, AlertCircle, Loader2, Bot } from "lucide-react";

function Field({
  label,
  description,
  icon,
  children,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: C.border, background: C.surface }}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon && <span style={{ color: C.accent }}>{icon}</span>}
        <span className="text-[13px] font-semibold" style={{ color: C.text }}>{label}</span>
      </div>
      {description && (
        <p className="mb-3 text-[12px]" style={{ color: C.muted }}>{description}</p>
      )}
      {children}
    </div>
  );
}

export function SetupView({ onDone }: { onDone: () => void }) {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);
  const [testError, setTestError] = useState("");

  useEffect(() => {
    getConfig().then((cfg) => {
      if (cfg.database_url) setDatabaseUrl(cfg.database_url);
      if (cfg.ollama_url) setOllamaUrl(cfg.ollama_url);
    }).catch(() => {});
  }, []);

  const handleTest = async () => {
    if (!databaseUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError("");
    try {
      await saveConfig(databaseUrl.trim(), ollamaUrl.trim() || undefined);
      await testConnection();
      setTestResult("ok");
    } catch (err) {
      setTestResult("error");
      setTestError(String(err));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!databaseUrl.trim()) return;
    setSaving(true);
    try {
      await saveConfig(databaseUrl.trim(), ollamaUrl.trim() || undefined);
      onDone();
    } catch (err) {
      setTestResult("error");
      setTestError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex flex-1 items-center justify-center p-8"
      style={{ background: C.bg }}
    >
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl"
            style={{ background: `${C.accent}20` }}
          >
            <Bot size={24} style={{ color: C.accent }} />
          </div>
          <h1 className="text-[18px] font-bold" style={{ color: C.text }}>Configurar Job Bot</h1>
          <p className="mt-1 text-[13px]" style={{ color: C.muted }}>
            Configure sua conexão com o banco de dados para começar.
          </p>
        </div>

        {/* Database */}
        <Field
          label="Banco de Dados"
          description="URL de conexão PostgreSQL (Neon ou qualquer PostgreSQL)."
          icon={<Database size={15} />}
        >
          <input
            id="database-url"
            type="password"
            placeholder="postgresql://user:password@host/db?sslmode=require"
            value={databaseUrl}
            onChange={(e) => { setDatabaseUrl(e.target.value); setTestResult(null); }}
            className="h-8 w-full rounded-md border bg-transparent px-3 font-mono text-[12px] outline-none focus:ring-1"
            style={{ borderColor: C.border, color: C.text, background: C.elevated }}
          />
          <p className="mt-2 text-[11px]" style={{ color: C.subtle }}>
            Encontre no painel do Neon em{" "}
            <span style={{ color: C.muted }}>Connection Details → Connection string</span>.
          </p>
        </Field>

        {/* Ollama */}
        <Field
          label="Ollama (opcional)"
          description="URL do servidor Ollama para scoring por IA."
          icon={<Wifi size={15} />}
        >
          <input
            id="ollama-url"
            placeholder="http://localhost:11434"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="h-8 w-full rounded-md border bg-transparent px-3 font-mono text-[12px] outline-none focus:ring-1"
            style={{ borderColor: C.border, color: C.text, background: C.elevated }}
          />
        </Field>

        {/* Test result */}
        {testResult === "ok" && (
          <div
            className="flex items-center gap-2 rounded-lg border px-4 py-3 text-[12px]"
            style={{ borderColor: `${C.success}40`, background: `${C.success}10`, color: C.success }}
          >
            <CheckCircle2 size={14} />
            Conexão bem-sucedida! Clique em Salvar para continuar.
          </div>
        )}
        {testResult === "error" && (
          <div
            className="rounded-lg border px-4 py-3 text-[12px]"
            style={{ borderColor: `${C.danger}40`, background: `${C.danger}10`, color: C.danger }}
          >
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle size={14} />
              Falha na conexão
            </div>
            <p className="mt-1 font-mono text-[11px] opacity-80">{testError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={handleTest}
            disabled={!databaseUrl.trim() || testing}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border py-2 text-[13px] font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: C.border, color: C.text, background: C.elevated }}
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Wifi size={14} />}
            Testar
          </button>
          <button
            onClick={handleSave}
            disabled={!databaseUrl.trim() || saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[13px] font-medium transition-colors disabled:opacity-40"
            style={{ background: C.accent, color: "oklch(0.08 0.004 270)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Salvar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
