"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Tag,
  Sparkles,
  Star,
  Send,
  EyeOff,
  Brain,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Cpu,
  Kanban,
} from "lucide-react";
import type { Job } from "@/lib/tauri-bridge";
import { isTauri } from "@/lib/tauri-bridge";
import { C, scoreColor } from "@/lib/colors";

async function openUrl(url: string) {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-shell");
    open(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const STATUS_OPTIONS = [
  { value: "new",       label: "Nova",       icon: Sparkles, color: C.statusNew },
  { value: "favorite",  label: "Favorita",   icon: Star,     color: C.statusFav },
  { value: "applied",   label: "Aplicada",   icon: Send,     color: C.statusApplied },
  { value: "dismissed", label: "Descartada", icon: EyeOff,   color: C.statusIrrelevant },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.subtle }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: C.border }} />;
}

export function JobDetailPanel({
  job,
  onClose,
  onStatusChange,
  onMoveToPipeline,
}: {
  job: Job;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onMoveToPipeline?: () => void;
}) {
  const [aiLogOpen, setAiLogOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const keywords = job.matched_keywords
    ? job.matched_keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const analysis = job.ai_analysis as Record<string, unknown> | null;
  const response = (analysis?.response as Record<string, unknown>) ?? analysis;
  const prompt = analysis?.prompt as string | undefined;
  const model = analysis?.model as string | undefined;
  const scoredAt = analysis?.scored_at as string | undefined;
  const minScore = analysis?.min_score as number | undefined;

  const pct = job.ai_score !== null && job.ai_score !== undefined
    ? Math.round(job.ai_score * 100)
    : null;
  const barColor = pct !== null ? scoreColor(job.ai_score!) : C.muted;

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: C.surface }}
    >
      {/* Header */}
      <div
        className="flex h-12 shrink-0 items-center gap-2 border-b px-4"
        style={{ borderColor: C.border }}
      >
        <span className="flex-1 truncate text-[13px] font-semibold" style={{ color: C.text }}>
          {job.title}
        </span>
        <button
          onClick={onClose}
          aria-label="Fechar painel"
          className="flex size-6 items-center justify-center rounded transition-colors"
          style={{ color: C.subtle }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = C.overlay;
            (e.currentTarget as HTMLButtonElement).style.color = C.text;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = C.subtle;
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Title + meta */}
        <div>
          <h2 className="text-[15px] font-semibold leading-snug" style={{ color: C.text }}>
            {job.title}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px]" style={{ color: C.muted }}>
            {job.company_name && (
              <span className="flex items-center gap-1">
                <Building2 size={12} style={{ color: C.accent }} />
                {job.company_name}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} style={{ color: C.accent }} />
                {job.location}
              </span>
            )}
            {job.department && (
              <span className="flex items-center gap-1">
                <Tag size={12} style={{ color: C.accent }} />
                {job.department}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {job.url && (
            <button
              onClick={() => openUrl(job.url!)}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{ background: C.accent, color: "oklch(1.00 0 0)" }}
            >
              <ExternalLink size={12} />
              Abrir vaga
            </button>
          )}
          {onMoveToPipeline && !job.status.startsWith("pipeline_") && (
            <button
              onClick={onMoveToPipeline}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors"
              style={{
                borderColor: `${C.success}60`,
                color: C.success,
                background: `${C.success}10`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${C.success}18`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${C.success}10`;
              }}
            >
              <Kanban size={12} />
              Minhas Vagas →
            </button>
          )}
        </div>

        <Divider />

        {/* Status buttons */}
        <Section title="Status">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => {
              const isActive = job.status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all"
                  style={{
                    background: isActive ? `${opt.color}20` : C.elevated,
                    color: isActive ? opt.color : C.muted,
                    border: `1px solid ${isActive ? opt.color + "50" : "transparent"}`,
                  }}
                >
                  <opt.icon size={12} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Divider />

        {/* AI Score */}
        {pct !== null && (
          <>
            <Section title="AI Score">
              <div className="flex items-center gap-3">
                <Brain size={16} style={{ color: barColor }} />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[22px] font-bold tabular-nums" style={{ color: barColor }}>
                      {pct}%
                    </span>
                    {!!response?.match_reasoning && (
                      <span className="ml-2 max-w-48 text-right text-[11px] leading-tight" style={{ color: C.muted }}>
                        {String(response.match_reasoning)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: C.elevated }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>
              </div>

              {response && (
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {(["role_category", "role_specific", "seniority"] as const).map((key) => {
                    const val = (response as Record<string, unknown>)[key];
                    if (!val) return null;
                    const labels: Record<string, string> = { role_category: "Categoria", role_specific: "Cargo", seniority: "Senioridade" };
                    return (
                      <div key={key} className="rounded-md px-2.5 py-1.5" style={{ background: C.elevated }}>
                        <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.subtle }}>{labels[key]}</p>
                        <p className="mt-0.5 text-[12px] font-medium capitalize" style={{ color: C.text }}>
                          {String(val).replace(/_/g, " ")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI log toggle */}
              <button
                onClick={() => setAiLogOpen((o) => !o)}
                aria-expanded={aiLogOpen}
                className="mt-2.5 flex w-full items-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-medium transition-colors"
                style={{ borderColor: C.border, borderStyle: "dashed", color: C.muted }}
              >
                <FileText size={12} />
                Log da IA
                {aiLogOpen ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
              </button>

              {aiLogOpen && (
                <div className="mt-1.5 space-y-2.5 rounded-md border p-3" style={{ borderColor: C.border, background: C.bg }}>
                  <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: C.subtle }}>
                    {model && <span className="flex items-center gap-1"><Cpu size={11} />{model}</span>}
                    {scoredAt && <span className="flex items-center gap-1"><Clock size={11} />{new Date(scoredAt).toLocaleString("pt-BR")}</span>}
                    {minScore !== undefined && <span>Threshold: {Math.round(minScore * 100)}%</span>}
                  </div>
                  {prompt && (
                    <div>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: C.subtle }}>Prompt</p>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded p-2 font-mono text-[10px] leading-relaxed" style={{ background: C.surface, color: C.muted }}>
                        {prompt}
                      </pre>
                    </div>
                  )}
                  {response && (
                    <div>
                      <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: C.subtle }}>Resposta</p>
                      <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded p-2 font-mono text-[10px] leading-relaxed" style={{ background: C.surface, color: C.muted }}>
                        {JSON.stringify(response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </Section>
            <Divider />
          </>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <>
            <Section title="Keywords matched">
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-md px-2 py-1 text-[12px] font-medium"
                    style={{ background: `${C.accent}18`, color: C.accent }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </Section>
            <Divider />
          </>
        )}

        {/* Description */}
        {(job as Job & { description?: string | null }).description && (
          <>
            <Section title="Descrição">
              <button
                onClick={() => setDescOpen((o) => !o)}
                aria-expanded={descOpen}
                className="flex w-full items-center gap-1.5 rounded-md border px-3 py-2 text-[12px] font-medium transition-colors"
                style={{ borderColor: C.border, color: C.muted }}
              >
                <FileText size={12} />
                Ver descrição completa
                {descOpen ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
              </button>
              {descOpen && (
                <div
                  className="mt-1.5 max-h-64 overflow-y-auto rounded-md p-3 text-[12px] leading-relaxed"
                  style={{ background: C.bg, color: C.muted }}
                >
                  {(job as Job & { description?: string | null }).description}
                </div>
              )}
            </Section>
            <Divider />
          </>
        )}

        {/* Footer meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" style={{ color: C.subtle }}>
          {job.ats && (
            <span className="flex items-center gap-1">
              ATS: <strong style={{ color: C.muted }}>{job.ats}</strong>
            </span>
          )}
          {job.run_id && (
            <span>
              Run <strong style={{ color: C.muted }}>#{job.run_id}</strong>
            </span>
          )}
          {job.fetched_at && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {new Date(job.fetched_at).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
