"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState, useTransition, useCallback } from "react";
import {
  getJobs,
  getRuns,
  updateJobStatus,
  bulkUpdateStatus,
  getDistinctSources,
  getDistinctKeywords,
  deleteJob,
  bulkDeleteJobs,
  restoreJob,
  bulkRestoreJobs,
  type Job,
  type JobFilters,
  type RunGroup,
} from "@/lib/data";
import { C, scoreColor, statusColor } from "@/lib/colors";
import { Kanban } from "lucide-react";
import { JobDetailPanel } from "@/components/job-detail-panel";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Star,
  Send,
  EyeOff,
  Sparkles,
  Trash2,
  Undo2,
  Brain,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Briefcase,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { useConfirm } from "@/lib/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_CONFIG = {
  new:        { label: "Nova",       icon: Sparkles, color: C.statusNew },
  favorite:   { label: "Favorita",   icon: Star,     color: C.statusFav },
  applied:    { label: "Aplicada",   icon: Send,     color: C.statusApplied },
  dismissed:  { label: "Descartada", icon: EyeOff,   color: C.statusIrrelevant },
  irrelevant: { label: "Irrelevante",icon: EyeOff,   color: C.statusIrrelevant },
  deleted:    { label: "Deletada",   icon: Trash2,   color: C.statusDeleted },
};

function ScorePill({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const pct = Math.round(score * 100);
  const color = scoreColor(score);
  return (
    <span
      title="Score de relevância IA"
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{ color, background: `${color}20` }}
    >
      <Brain size={10} />
      {pct}%
    </span>
  );
}

function KeywordChip({ label }: { label: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ background: C.elevated, color: C.muted }}
    >
      {label}
    </span>
  );
}

function JobRowSkeleton() {
  return (
    <div className="flex items-start gap-2.5 border-b px-4 py-2.5" style={{ borderColor: C.borderMuted }}>
      <Skeleton className="mt-0.5 size-3.5 shrink-0 rounded" />
      <Skeleton className="mt-1.5 size-1.5 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

type ViewMode = "active" | "irrelevant" | "deleted";

export function JobsView() {
  const { userName } = useUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  const [search, setSearch] = useState("");
  const [atsFilter, setAtsFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("active");
  const [sortBy, setSortBy] = useState("");
  const [runFilter, setRunFilter] = useState<number | "all">("all");

  const [sources, setSources] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [runs, setRuns] = useState<RunGroup[]>([]);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchJobs = useCallback(() => {
    if (!userName) return;
    const filters: JobFilters = { page, perPage: 50 };
    if (search) filters.search = search;
    if (sortBy) filters.sortBy = sortBy;
    if (viewMode === "deleted") filters.status = "deleted";
    else if (viewMode === "irrelevant") filters.status = "irrelevant";
    else if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
    if (atsFilter && atsFilter !== "all") filters.ats = atsFilter;
    if (keywordFilter && keywordFilter !== "all") filters.keyword = keywordFilter;
    if (runFilter !== "all") filters.runId = runFilter as number;

    startTransition(async () => {
      try {
        const result = await getJobs(userName, filters);
        setJobs(result.jobs);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch {
        toast({ type: "error", message: "Erro ao carregar vagas." });
      } finally {
        setInitialLoad(false);
      }
    });
  }, [userName, page, search, atsFilter, keywordFilter, statusFilter, viewMode, sortBy, runFilter]);

  useEffect(() => {
    if (!userName) return;
    startTransition(async () => {
      const [s, k, r] = await Promise.all([
        getDistinctSources(userName),
        getDistinctKeywords(userName),
        getRuns(userName),
      ]);
      setSources(s);
      setKeywords(k);
      setRuns(r);
      if (r.length > 0) setRunFilter(r[0].id);
    });
  }, [userName]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const reset = () => setPage(1);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateJobStatus(id, newStatus);
      setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: newStatus } : j));
      if (selectedJob?.id === id) setSelectedJob((j) => j ? { ...j, status: newStatus } : j);
    } catch {
      toast({ type: "error", message: "Erro ao atualizar status." });
    }
  };

  const handleBulkStatus = async (newStatus: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await bulkUpdateStatus(ids, newStatus);
      setJobs((prev) => prev.map((j) => selected.has(j.id) ? { ...j, status: newStatus } : j));
      setSelected(new Set());
      const label = (STATUS_CONFIG as Record<string, { label: string }>)[newStatus]?.label ?? newStatus;
      toast({ type: "success", message: `${ids.length} vaga(s) marcada(s) como ${label}.` });
    } catch {
      toast({ type: "error", message: "Erro ao atualizar vagas." });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((p) => p - 1);
      if (selectedJob?.id === id) setSelectedJob(null);
    } catch {
      toast({ type: "error", message: "Erro ao excluir vaga." });
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const ok = await confirm({
      title: "Excluir vagas",
      description: `Excluir ${ids.length} vaga(s) selecionada(s)?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    try {
      await bulkDeleteJobs(ids);
      setJobs((prev) => prev.filter((j) => !selected.has(j.id)));
      setTotal((p) => p - ids.length);
      setSelected(new Set());
      toast({ type: "success", message: `${ids.length} vaga(s) excluída(s).` });
    } catch {
      toast({ type: "error", message: "Erro ao excluir vagas." });
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((p) => p - 1);
      toast({ type: "success", message: "Vaga restaurada." });
    } catch {
      toast({ type: "error", message: "Erro ao restaurar vaga." });
    }
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await bulkRestoreJobs(ids);
      setJobs((prev) => prev.filter((j) => !selected.has(j.id)));
      setTotal((p) => p - ids.length);
      setSelected(new Set());
      toast({ type: "success", message: `${ids.length} vaga(s) restaurada(s).` });
    } catch {
      toast({ type: "error", message: "Erro ao restaurar vagas." });
    }
  };

  const handleMoveToPipeline = async (id: number) => {
    try {
      await updateJobStatus(id, "pipeline_applied");
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setTotal((p) => p - 1);
      if (selectedJob?.id === id) setSelectedJob(null);
      toast({ type: "success", message: "Vaga movida para Minhas Vagas." });
    } catch {
      toast({ type: "error", message: "Erro ao mover vaga." });
    }
  };

  const handleBulkMoveToPipeline = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    try {
      await bulkUpdateStatus(ids, "pipeline_applied");
      setJobs((prev) => prev.filter((j) => !selected.has(j.id)));
      setTotal((p) => p - ids.length);
      setSelected(new Set());
      toast({ type: "success", message: `${ids.length} vaga(s) movida(s) para Minhas Vagas.` });
    } catch {
      toast({ type: "error", message: "Erro ao mover vagas." });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setAtsFilter("");
    setKeywordFilter("");
    setStatusFilter("");
    setRunFilter("all");
    reset();
  };

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id)));
  };

  const hasFilters = !!(search || (atsFilter && atsFilter !== "all") || (keywordFilter && keywordFilter !== "all") || (statusFilter && statusFilter !== "all") || runFilter !== "all");

  const showSkeleton = initialLoad && isPending;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List panel */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: selectedJob ? "420px" : "100%",
          minWidth: 0,
          borderRight: selectedJob ? `1px solid ${C.border}` : "none",
          flexShrink: 0,
          transition: "width 0.15s ease",
        }}
      >
        {/* Header */}
        <div
          className="flex h-12 items-center gap-2 border-b px-4"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <h1 className="text-[13px] font-semibold" style={{ color: C.text }}>Vagas</h1>
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
            style={{ background: C.elevated, color: C.muted }}
          >
            {total}
          </span>
          <div className="flex-1" />

          {/* View mode toggles */}
          <button
            aria-pressed={viewMode === "irrelevant"}
            onClick={() => { setViewMode(viewMode === "irrelevant" ? "active" : "irrelevant"); reset(); setSelected(new Set()); }}
            className="rounded px-2 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: viewMode === "irrelevant" ? C.elevated : "transparent",
              color: viewMode === "irrelevant" ? C.text : C.muted,
            }}
          >
            Irrelevantes
          </button>
          <button
            aria-pressed={viewMode === "deleted"}
            onClick={() => { setViewMode(viewMode === "deleted" ? "active" : "deleted"); reset(); setSelected(new Set()); }}
            className="rounded px-2 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: viewMode === "deleted" ? C.elevated : "transparent",
              color: viewMode === "deleted" ? C.statusDeleted : C.muted,
            }}
          >
            Lixeira
          </button>

          <div className="mx-1 h-4 w-px" style={{ background: C.border }} />

          <button
            aria-pressed={sortBy === "score"}
            onClick={() => { setSortBy(sortBy === "score" ? "" : "score"); reset(); }}
            className="flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: sortBy === "score" ? C.accentBg : "transparent",
              color: sortBy === "score" ? C.accent : C.muted,
            }}
          >
            <ArrowUpDown size={12} />
            Score
          </button>

          <button
            aria-pressed={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
            className="flex items-center gap-1 rounded px-2 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: (filtersOpen || hasFilters) ? C.elevated : "transparent",
              color: hasFilters ? C.accent : C.muted,
            }}
          >
            <SlidersHorizontal size={12} />
            Filtros
            {hasFilters && <span className="size-1.5 rounded-full" style={{ background: C.accent }} />}
          </button>
        </div>

        {/* Filters bar */}
        {filtersOpen && (
          <div
            className="flex flex-wrap items-center gap-2 border-b px-4 py-2"
            style={{ borderColor: C.border, background: C.surface }}
          >
            {/* Search */}
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5" style={{ color: C.subtle }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); reset(); }}
                placeholder="Buscar..."
                aria-label="Buscar vagas"
                className="h-7 rounded-md border bg-transparent pl-8 pr-3 text-[12px] outline-none focus:ring-1"
                style={{ borderColor: C.border, color: C.text, minWidth: 180 }}
              />
            </div>

            <FilterSelect
              value={atsFilter}
              onChange={(v) => { setAtsFilter(v); reset(); }}
              options={[{ value: "all", label: "Fonte" }, ...sources.map((s) => ({ value: s, label: s }))]}
              placeholder="Fonte"
            />
            <FilterSelect
              value={keywordFilter}
              onChange={(v) => { setKeywordFilter(v); reset(); }}
              options={[{ value: "all", label: "Keyword" }, ...keywords.map((k) => ({ value: k, label: k }))]}
              placeholder="Keyword"
            />
            <FilterSelect
              value={String(runFilter)}
              onChange={(v) => { setRunFilter(v === "all" ? "all" : Number(v)); reset(); }}
              options={[{ value: "all", label: "Puxada" }, ...runs.map((r) => ({ value: String(r.id), label: new Date(r.run_at).toLocaleDateString("pt-BR") }))]}
              placeholder="Puxada"
            />
            {viewMode === "active" && (
              <FilterSelect
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); reset(); }}
                options={[
                  { value: "all", label: "Status" },
                  { value: "new", label: "Nova" },
                  { value: "favorite", label: "Favorita" },
                  { value: "applied", label: "Aplicada" },
                  { value: "dismissed", label: "Descartada" },
                ]}
                placeholder="Status"
              />
            )}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[12px]"
                style={{ color: C.subtle }}
              >
                <X size={11} /> Limpar
              </button>
            )}
          </div>
        )}

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div
            className="flex items-center gap-2 border-b px-4 py-1.5"
            style={{ borderColor: C.border, background: C.elevated }}
          >
            <span className="text-[12px]" style={{ color: C.muted }}>{selected.size} selecionada(s)</span>
            <div className="mx-1 h-3.5 w-px" style={{ background: C.border }} />
            {viewMode !== "active" ? (
              <ActionBtn onClick={handleBulkRestore} icon={<Undo2 size={11} />} label="Restaurar" />
            ) : (
              <>
                <ActionBtn onClick={() => handleBulkStatus("favorite")} icon={<Star size={11} />} label="Favoritar" />
                <ActionBtn onClick={() => handleBulkStatus("applied")} icon={<Send size={11} />} label="Aplicada" />
                <ActionBtn onClick={() => handleBulkStatus("dismissed")} icon={<EyeOff size={11} />} label="Descartar" />
                <ActionBtn onClick={handleBulkMoveToPipeline} icon={<Kanban size={11} />} label="Minhas Vagas" />
                <ActionBtn onClick={handleBulkDelete} icon={<Trash2 size={11} />} label="Excluir" danger />
              </>
            )}
            <button
              onClick={() => setSelected(new Set())}
              aria-label="Limpar seleção"
              className="ml-auto text-[11px]"
              style={{ color: C.subtle }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Select all row */}
        <div
          className="flex items-center gap-2 border-b px-4 py-1.5"
          style={{ borderColor: C.borderMuted }}
        >
          <button
            onClick={toggleSelectAll}
            aria-label={selected.size === jobs.length && jobs.length > 0 ? "Desmarcar todas" : "Selecionar todas"}
            style={{ color: C.subtle }}
          >
            {selected.size === jobs.length && jobs.length > 0
              ? <CheckSquare size={13} />
              : <Square size={13} />}
          </button>
          <span className="text-[11px]" style={{ color: C.subtle }}>
            {isPending ? "Carregando..." : `${total} vaga${total !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto" style={{ background: C.bg }}>
          {showSkeleton && Array.from({ length: 8 }).map((_, i) => <JobRowSkeleton key={i} />)}

          {!showSkeleton && jobs.map((job) => {
            const isSelected = selectedJob?.id === job.id;
            const isChecked = selected.has(job.id);
            const kws = job.matched_keywords?.split(",").map((k) => k.trim()).filter(Boolean) ?? [];

            return (
              <div
                key={job.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedJob(isSelected ? null : job)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedJob(isSelected ? null : job); }}
                className="group flex w-full items-start gap-2.5 border-b px-4 py-2.5 text-left transition-colors cursor-pointer"
                style={{
                  borderColor: C.borderMuted,
                  background: isSelected ? C.elevated : "transparent",
                  borderLeft: isSelected ? `2px solid ${C.accent}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = C.surface;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                {/* Checkbox */}
                <span
                  onClick={(e) => toggleSelect(job.id, e)}
                  aria-label={isChecked ? "Desmarcar vaga" : "Selecionar vaga"}
                  role="checkbox"
                  aria-checked={isChecked}
                  className="mt-0.5 shrink-0"
                  style={{ color: isChecked ? C.accent : C.subtle }}
                >
                  {isChecked ? <CheckSquare size={13} /> : <Square size={13} />}
                </span>

                {/* Status dot */}
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  title={(STATUS_CONFIG as Record<string, { label: string }>)[job.status]?.label ?? job.status}
                  style={{ background: statusColor(job.status) }}
                />

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 truncate text-[13px] font-medium" style={{ color: C.text }}>
                      {job.title}
                    </span>
                    <ScorePill score={job.ai_score} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: C.muted }}>
                    <span className="truncate">{job.company_name || "—"}</span>
                    {job.location && (
                      <>
                        <span style={{ color: C.subtle }}>·</span>
                        <span className="truncate">{job.location}</span>
                      </>
                    )}
                  </div>
                  {kws.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {kws.slice(0, 4).map((kw) => (
                        <KeywordChip key={kw} label={kw} />
                      ))}
                      {kws.length > 4 && (
                        <span className="text-[11px]" style={{ color: C.subtle }}>+{kws.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Row actions */}
                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {viewMode !== "active" ? (
                    <IconBtn onClick={() => handleRestore(job.id)} title="Restaurar vaga">
                      <Undo2 size={12} />
                    </IconBtn>
                  ) : (
                    <IconBtn onClick={() => handleDelete(job.id)} title="Excluir vaga" danger>
                      <Trash2 size={12} />
                    </IconBtn>
                  )}
                </div>
              </div>
            );
          })}

          {!showSkeleton && jobs.length === 0 && !isPending && (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center" style={{ color: C.subtle }}>
              {hasFilters ? (
                <>
                  <Search size={28} className="mb-3 opacity-40" />
                  <p className="text-[13px] font-medium" style={{ color: C.muted }}>Nenhum resultado para os filtros aplicados</p>
                  <p className="mt-1 text-[12px]">Tente ajustar os filtros ou</p>
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-[12px] font-medium underline underline-offset-2"
                    style={{ color: C.accent }}
                  >
                    limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <Briefcase size={28} className="mb-3 opacity-40" />
                  <p className="text-[13px] font-medium" style={{ color: C.muted }}>Nenhuma vaga encontrada</p>
                  <p className="mt-1 text-[12px]">Execute o Bot para buscar novas vagas.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between border-t px-4 py-2"
            style={{ borderColor: C.border, background: C.surface }}
          >
            <span className="text-[12px]" style={{ color: C.muted }}>
              {page} / {totalPages}
            </span>
            <div className="flex gap-1">
              <PaginationBtn onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Página anterior">
                <ChevronLeft size={13} />
              </PaginationBtn>
              <PaginationBtn onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} aria-label="Próxima página">
                <ChevronRight size={13} />
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedJob && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <JobDetailPanel
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onStatusChange={(newStatus) => handleStatusChange(selectedJob.id, newStatus)}
            onMoveToPipeline={() => handleMoveToPipeline(selectedJob.id)}
          />
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const isFiltered = current && current.value !== "all";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors"
        style={{
          borderColor: C.border,
          color: isFiltered ? C.accent : C.muted,
          background: C.elevated,
        }}
      >
        {isFiltered && <Check size={10} />}
        {current?.label ?? placeholder}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-20 mt-1 min-w-30 rounded-md border py-1 shadow-lg"
            style={{ background: C.surface, borderColor: C.border }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors"
                style={{ color: value === o.value ? C.accent : C.text }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {value === o.value && <Check size={10} />}
                {value !== o.value && <span className="size-2.5" />}
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors"
      style={{ color: danger ? C.statusDeleted : C.muted }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = C.elevated;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function IconBtn({
  onClick,
  title,
  children,
  danger,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn("flex size-6 items-center justify-center rounded transition-all opacity-0 group-hover:opacity-100")}
      style={{ color: danger ? C.statusDeleted : C.subtle }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = C.elevated;
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function PaginationBtn({
  onClick,
  disabled,
  children,
  "aria-label": ariaLabel,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex size-7 items-center justify-center rounded border text-[12px] transition-colors disabled:opacity-30"
      style={{ borderColor: C.border, color: C.muted, background: "transparent" }}
    >
      {children}
    </button>
  );
}
