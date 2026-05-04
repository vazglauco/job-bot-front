"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState, useTransition } from "react";
import {
  getPipelineJobs,
  updateJobStatus,
  PIPELINE_ACTIVE_STATUSES,
  PIPELINE_ARCHIVED_STATUSES,
  type Job,
  type PipelineStatus,
} from "@/lib/data";
import { C, scoreColor } from "@/lib/colors";
import { JobDetailPanel } from "@/components/job-detail-panel";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Brain,
  ExternalLink,
  UserX,
  LogOut,
  Building2,
  Kanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS: { status: PipelineStatus; label: string; color: string }[] = [
  { status: "pipeline_applied", label: "Inscrito",           color: "oklch(0.48 0.20 270)" },
  { status: "pipeline_hr",      label: "Entrevista RH",      color: "oklch(0.55 0.18 85)" },
  { status: "pipeline_tech",    label: "Entrevista Técnica", color: "oklch(0.58 0.18 310)" },
  { status: "pipeline_offer",   label: "Oferta",             color: "oklch(0.45 0.18 145)" },
];

function ScorePill({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const pct = Math.round(score * 100);
  const color = scoreColor(score);
  return (
    <span
      title="Score de relevância IA"
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
      style={{ color, background: `${color}20` }}
    >
      <Brain size={9} />
      {pct}%
    </span>
  );
}

function KanbanCardSkeleton() {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.bg }}>
      <Skeleton className="mb-2 h-3.5 w-4/5 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
      <div className="mt-3 flex gap-1.5">
        <Skeleton className="h-6 w-14 rounded" />
        <Skeleton className="h-6 w-16 rounded" />
      </div>
    </div>
  );
}

function KanbanCard({
  job,
  colIndex,
  isSelected,
  onSelect,
  onAdvance,
  onArchive,
}: {
  job: Job;
  colIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
  onArchive: (reason: "pipeline_rejected" | "pipeline_withdrawn") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLast = colIndex === COLUMNS.length - 1;

  return (
    <div
      className="relative rounded-lg border p-3 cursor-pointer transition-all"
      style={{
        background: isSelected ? C.elevated : C.bg,
        borderColor: isSelected ? C.accent : C.border,
        borderLeft: isSelected ? `3px solid ${C.accent}` : `3px solid transparent`,
      }}
      onClick={onSelect}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.surface;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.bg;
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold" style={{ color: C.text }}>
            {job.title}
          </p>
          {job.company_name && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px]" style={{ color: C.muted }}>
              <Building2 size={10} />
              {job.company_name}
            </p>
          )}
        </div>
        <ScorePill score={job.ai_score} />
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 flex items-center gap-1 text-[10px] transition-opacity hover:opacity-80"
          style={{ color: C.accent }}
        >
          <ExternalLink size={9} />
          Abrir vaga
        </a>
      )}

      {/* Actions */}
      <div
        className="mt-2.5 flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {!isLast && (
          <button
            onClick={onAdvance}
            aria-label="Avançar para próxima etapa"
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors"
            style={{ background: C.elevated, color: C.muted }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = C.overlay;
              (e.currentTarget as HTMLButtonElement).style.color = C.text;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = C.elevated;
              (e.currentTarget as HTMLButtonElement).style.color = C.muted;
            }}
          >
            <ArrowRight size={10} />
            Avançar
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Encerrar candidatura"
            aria-expanded={menuOpen}
            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors"
            style={{ color: C.danger }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = `${C.danger}18`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            Encerrar
            <ChevronDown size={10} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute left-0 top-full z-20 mt-1 w-40 rounded-md border py-1 shadow-lg"
                style={{ background: C.bg, borderColor: C.border }}
              >
                <button
                  onClick={() => { onArchive("pipeline_rejected"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors"
                  style={{ color: C.muted }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <UserX size={12} style={{ color: C.danger }} />
                  Recusado
                </button>
                <button
                  onClick={() => { onArchive("pipeline_withdrawn"); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors"
                  style={{ color: C.muted }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <LogOut size={12} style={{ color: C.subtle }} />
                  Desistência
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PipelineView() {
  const { userName } = useUser();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  const loadJobs = () => {
    if (!userName) return;
    startTransition(async () => {
      try {
        const result = await getPipelineJobs(userName);
        setJobs(result);
      } catch {
        toast({ type: "error", message: "Erro ao carregar pipeline." });
      } finally {
        setInitialLoad(false);
      }
    });
  };

  useEffect(() => { loadJobs(); }, [userName]);

  const activeJobs = jobs.filter((j) =>
    (PIPELINE_ACTIVE_STATUSES as readonly string[]).includes(j.status)
  );
  const archivedJobs = jobs.filter((j) =>
    (PIPELINE_ARCHIVED_STATUSES as readonly string[]).includes(j.status)
  );

  const handleAdvance = async (job: Job) => {
    const idx = COLUMNS.findIndex((c) => c.status === job.status);
    if (idx < 0 || idx >= COLUMNS.length - 1) return;
    const nextStatus = COLUMNS[idx + 1].status;
    try {
      await updateJobStatus(job.id, nextStatus);
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: nextStatus } : j));
      if (selectedJob?.id === job.id) setSelectedJob((j) => j ? { ...j, status: nextStatus } : j);
      toast({ type: "success", message: `Avançou para ${COLUMNS[idx + 1].label}.` });
    } catch {
      toast({ type: "error", message: "Erro ao avançar etapa." });
    }
  };

  const handleArchive = async (job: Job, reason: "pipeline_rejected" | "pipeline_withdrawn") => {
    try {
      await updateJobStatus(job.id, reason);
      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, status: reason } : j));
      if (selectedJob?.id === job.id) setSelectedJob((j) => j ? { ...j, status: reason } : j);
      toast({ type: "success", message: reason === "pipeline_rejected" ? "Marcado como recusado." : "Marcado como desistência." });
    } catch {
      toast({ type: "error", message: "Erro ao encerrar candidatura." });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedJob) return;
    try {
      await updateJobStatus(selectedJob.id, newStatus);
      setJobs((prev) => prev.map((j) => j.id === selectedJob.id ? { ...j, status: newStatus } : j));
      setSelectedJob((j) => j ? { ...j, status: newStatus } : j);
    } catch {
      toast({ type: "error", message: "Erro ao atualizar status." });
    }
  };

  const showSkeleton = initialLoad && isPending;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Kanban area */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ borderRight: selectedJob ? `1px solid ${C.border}` : "none" }}
      >
        {/* Header */}
        <div
          className="flex h-12 shrink-0 items-center gap-2 border-b px-4"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <h1 className="text-[13px] font-semibold" style={{ color: C.text }}>Minhas Vagas</h1>
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
            style={{ background: C.elevated, color: C.muted }}
          >
            {activeJobs.length}
          </span>
        </div>

        {/* Columns */}
        <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-4" style={{ background: C.bg }}>
          {COLUMNS.map((col, colIndex) => {
            const colJobs = activeJobs.filter((j) => j.status === col.status);
            return (
              <div
                key={col.status}
                className="flex w-57.5 shrink-0 flex-col rounded-xl"
                style={{ background: C.surface }}
              >
                {/* Column header */}
                <div
                  className="flex h-10 shrink-0 items-center gap-2 rounded-t-xl px-3"
                  style={{ borderBottom: `2px solid ${col.color}20` }}
                >
                  <span className="size-2 rounded-full" style={{ background: col.color }} />
                  <span className="flex-1 text-[12px] font-semibold" style={{ color: C.text }}>
                    {col.label}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{ background: `${col.color}20`, color: col.color }}
                  >
                    {colJobs.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                  {showSkeleton && Array.from({ length: 2 }).map((_, i) => <KanbanCardSkeleton key={i} />)}

                  {!showSkeleton && colJobs.map((job) => (
                    <KanbanCard
                      key={job.id}
                      job={job}
                      colIndex={colIndex}
                      isSelected={selectedJob?.id === job.id}
                      onSelect={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                      onAdvance={() => handleAdvance(job)}
                      onArchive={(reason) => handleArchive(job, reason)}
                    />
                  ))}

                  {!showSkeleton && colJobs.length === 0 && (
                    <div
                      className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed py-8"
                      style={{ borderColor: C.border }}
                    >
                      <p className="text-[11px]" style={{ color: C.subtle }}>Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state when no active jobs at all */}
        {!showSkeleton && activeJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center" style={{ color: C.subtle }}>
            <Kanban size={28} className="mb-3 opacity-40" />
            <p className="text-[13px] font-medium" style={{ color: C.muted }}>Nenhuma vaga no pipeline</p>
            <p className="mt-1 text-[12px]">Mova vagas de Vagas → Minhas Vagas para acompanhar.</p>
          </div>
        )}

        {/* Archived section */}
        {archivedJobs.length > 0 && (
          <div
            className="shrink-0 border-t"
            style={{ borderColor: C.border, background: C.surface }}
          >
            <button
              onClick={() => setShowArchived((o) => !o)}
              aria-expanded={showArchived}
              className={cn("flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-medium transition-colors")}
              style={{ color: C.muted }}
            >
              {showArchived ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Encerradas
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
                style={{ background: C.elevated, color: C.muted }}
              >
                {archivedJobs.length}
              </span>
            </button>

            {showArchived && (
              <div className="flex flex-wrap gap-2 px-4 pb-3">
                {archivedJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors"
                    style={{
                      background: selectedJob?.id === job.id ? C.elevated : C.bg,
                      borderColor: selectedJob?.id === job.id ? C.accent : C.border,
                    }}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{
                        background: job.status === "pipeline_rejected" ? C.danger : C.subtle,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium" style={{ color: C.text }}>
                        {job.title}
                      </p>
                      <p className="text-[10px]" style={{ color: C.muted }}>
                        {job.company_name} ·{" "}
                        <span style={{ color: job.status === "pipeline_rejected" ? C.danger : C.subtle }}>
                          {job.status === "pipeline_rejected" ? "Recusado" : "Desistência"}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedJob && (
        <div className="flex w-95 shrink-0 flex-col overflow-hidden">
          <JobDetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}
    </div>
  );
}
