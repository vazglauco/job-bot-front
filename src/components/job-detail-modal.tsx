"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
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
} from "lucide-react";
import { useState } from "react";

interface Job {
  id: number;
  user_name: string;
  title: string;
  company_name: string | null;
  url: string | null;
  location: string | null;
  department: string | null;
  ats: string | null;
  matched_keywords: string | null;
  fetched_at: Date;
  status: string;
  ai_score: number | null;
  ai_analysis: Record<string, unknown> | null;
}

const statusOptions = [
  { value: "new", label: "Nova", icon: Sparkles, color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200" },
  { value: "favorite", label: "Favorita", icon: Star, color: "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200" },
  { value: "applied", label: "Aplicada", icon: Send, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
  { value: "dismissed", label: "Descartada", icon: EyeOff, color: "text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200" },
];

function ScoreDisplay({ score, analysis }: { score: number | null; analysis: Record<string, unknown> | null }) {
  const [logOpen, setLogOpen] = useState(false);

  if (score === null || score === undefined) return null;

  const pct = Math.round(score * 100);
  let barColor = "bg-red-500";
  let textColor = "text-red-700";
  if (score >= 0.7) { barColor = "bg-emerald-500"; textColor = "text-emerald-700"; }
  else if (score >= 0.5) { barColor = "bg-amber-500"; textColor = "text-amber-700"; }

  // Support both old format (flat) and new format (nested under response)
  const response = (analysis?.response as Record<string, unknown>) ?? analysis;
  const prompt = analysis?.prompt as string | undefined;
  const model = analysis?.model as string | undefined;
  const scoredAt = analysis?.scored_at as string | undefined;
  const minScore = analysis?.min_score as number | undefined;
  const statusAssigned = analysis?.status_assigned as string | undefined;

  return (
    <>
      <Separator />
      <div>
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
          AI Score
        </p>
        <div className="flex items-center gap-3">
          <Brain size={18} className={textColor} />
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold ${textColor}`}>{pct}%</span>
              {response?.match_reasoning && (
                <span className="ml-2 text-xs leading-tight text-muted-foreground">{String(response.match_reasoning)}</span>
              )}
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
              <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {response && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {response.role_category && (
              <div className="rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">Categoria</span>
                <p className="text-sm font-medium">{String(response.role_category).replace(/_/g, " ")}</p>
              </div>
            )}
            {response.role_specific && (
              <div className="rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">Cargo</span>
                <p className="text-sm font-medium">{String(response.role_specific).replace(/_/g, " ")}</p>
              </div>
            )}
            {response.seniority && (
              <div className="rounded-lg bg-muted/50 px-3 py-1.5">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">Senioridade</span>
                <p className="text-sm font-medium capitalize">{String(response.seniority)}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Log — collapsible */}
        {analysis && (
          <div className="mt-3">
            <button
              onClick={() => setLogOpen(!logOpen)}
              className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <FileText size={13} />
              Log da IA
              {logOpen ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
            </button>

            {logOpen && (
              <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {model && (
                    <span className="flex items-center gap-1">
                      <Cpu size={12} /> {model}
                    </span>
                  )}
                  {scoredAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(scoredAt).toLocaleString("pt-BR")}
                    </span>
                  )}
                  {minScore !== undefined && (
                    <span>Threshold: {Math.round(minScore * 100)}%</span>
                  )}
                  {statusAssigned && (
                    <span>Resultado: <strong>{statusAssigned}</strong></span>
                  )}
                </div>

                {/* Prompt sent */}
                {prompt && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt enviado</p>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground/80">{prompt}</pre>
                  </div>
                )}

                {/* LLM Response */}
                {response && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resposta da IA</p>
                    <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono text-[11px] leading-relaxed text-foreground/80">{JSON.stringify(response, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export function JobDetailModal({
  job,
  open,
  onClose,
  onStatusChange,
}: {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  if (!job) return null;

  const keywords = job.matched_keywords
    ? job.matched_keywords.split(",").map((k) => k.trim())
    : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="bg-linear-to-br from-primary/8 to-primary/3 px-6 pb-4 pt-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold leading-tight">
              {job.title}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {job.company_name && (
              <span className="flex items-center gap-1.5">
                <Building2 size={15} className="text-primary/60" />
                {job.company_name}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-primary/60" />
                {job.location}
              </span>
            )}
            {job.department && (
              <span className="flex items-center gap-1.5">
                <Tag size={15} className="text-primary/60" />
                {job.department}
              </span>
            )}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Fonte
              </p>
              <Badge variant="outline" className="text-sm">
                {job.ats || "—"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Data de Coleta
              </p>
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar size={13} className="text-muted-foreground" />
                {new Date(job.fetched_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Keywords */}
          {keywords.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Keywords Matched
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AI Score */}
          <ScoreDisplay score={job.ai_score} analysis={job.ai_analysis} />

          <Separator />

          {/* Status */}
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Status
            </p>
            <div className="flex gap-2">
              {statusOptions.map((opt) => {
                const isActive = job.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onStatusChange(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? `${opt.color} ring-2 ring-offset-1 ring-current/20`
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open URL */}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <ExternalLink size={16} />
              Abrir Vaga Original
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
