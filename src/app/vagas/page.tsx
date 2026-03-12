"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState, useTransition, useCallback } from "react";
import {
  getJobs,
  updateJobStatus,
  bulkUpdateStatus,
  getDistinctSources,
  getDistinctKeywords,
  deleteJob,
  bulkDeleteJobs,
  restoreJob,
  bulkRestoreJobs,
  type JobFilters,
} from "@/app/actions/jobs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobDetailModal } from "@/components/job-detail-modal";
import {
  Star,
  Send,
  EyeOff,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Sparkles,
  X,
  Search,
  Briefcase,
  Trash2,
  Undo2,
  Brain,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { value: "new", label: "Nova", icon: Sparkles, color: "text-blue-600 bg-blue-50" },
  { value: "favorite", label: "Favorita", icon: Star, color: "text-amber-600 bg-amber-50" },
  { value: "applied", label: "Aplicada", icon: Send, color: "text-emerald-600 bg-emerald-50" },
  { value: "dismissed", label: "Descartada", icon: EyeOff, color: "text-gray-500 bg-gray-100" },
];

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round(score * 100);
  let color = "text-red-700 bg-red-50 border-red-200";
  if (score >= 0.7) color = "text-emerald-700 bg-emerald-50 border-emerald-200";
  else if (score >= 0.5) color = "text-amber-700 bg-amber-50 border-amber-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Brain size={11} />
      {pct}%
    </span>
  );
}

export default function VagasPage() {
  const { userName } = useUser();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [search, setSearch] = useState("");
  const [atsFilter, setAtsFilter] = useState<string>("");
  const [keywordFilter, setKeywordFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"active" | "irrelevant" | "deleted">("active");
  const [sortBy, setSortBy] = useState<string>("");

  // Filter options
  const [sources, setSources] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Detail modal
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(() => {
    if (!userName) return;
    const filters: JobFilters = { page, perPage: 20 };
    if (search) filters.search = search;
    if (atsFilter) filters.ats = atsFilter;
    if (keywordFilter) filters.keyword = keywordFilter;
    if (sortBy) filters.sortBy = sortBy;

    if (viewMode === "deleted") {
      filters.status = "deleted";
    } else if (viewMode === "irrelevant") {
      filters.status = "irrelevant";
    } else if (statusFilter) {
      filters.status = statusFilter;
    }

    startTransition(async () => {
      const result = await getJobs(userName, filters);
      setJobs(result.jobs as Job[]);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    });
  }, [userName, page, search, atsFilter, keywordFilter, statusFilter, viewMode, sortBy]);

  // Load filter options
  useEffect(() => {
    if (!userName) return;
    startTransition(async () => {
      const [s, k] = await Promise.all([
        getDistinctSources(userName),
        getDistinctKeywords(userName),
      ]);
      setSources(s);
      setKeywords(k);
    });
  }, [userName]);

  // Fetch jobs on filter/page change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Wrapper setters that reset page on filter change
  const setSearchAndReset = (v: string) => { setSearch(v); setPage(1); };
  const setAtsAndReset = (v: string) => { setAtsFilter(v); setPage(1); };
  const setKeywordAndReset = (v: string) => { setKeywordFilter(v); setPage(1); };
  const setStatusAndReset = (v: string) => { setStatusFilter(v); setPage(1); };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateJobStatus(id, newStatus);
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j))
    );
  };

  const handleBulkStatus = async (newStatus: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await bulkUpdateStatus(ids, newStatus);
    setJobs((prev) =>
      prev.map((j) =>
        selected.has(j.id) ? { ...j, status: newStatus } : j
      )
    );
    setSelected(new Set());
  };

  const handleDelete = async (id: number) => {
    await deleteJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((prev) => prev - 1);
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await bulkDeleteJobs(ids);
    setJobs((prev) => prev.filter((j) => !selected.has(j.id)));
    setTotal((prev) => prev - ids.length);
    setSelected(new Set());
  };

  const handleRestore = async (id: number) => {
    await restoreJob(id);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setTotal((prev) => prev - 1);
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await bulkRestoreJobs(ids);
    setJobs((prev) => prev.filter((j) => !selected.has(j.id)));
    setTotal((prev) => prev - ids.length);
    setSelected(new Set());
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === jobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jobs.map((j) => j.id)));
    }
  };

  if (!userName) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Briefcase size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Vagas</h2>
          <p className="mt-1 text-muted-foreground">
            Selecione um usuário na sidebar para ver as vagas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vagas</h2>
        <p className="mt-1 text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> vagas encontradas para{" "}
          <span className="font-semibold capitalize text-foreground">{userName}</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou empresa..."
            value={search}
            onChange={(e) => setSearchAndReset(e.target.value)}
            className="w-72 pl-9"
          />
        </div>
        <Select value={atsFilter} onValueChange={(v) => setAtsAndReset(v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fontes</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={keywordFilter} onValueChange={(v) => setKeywordAndReset(v ?? "")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Keyword" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as keywords</SelectItem>
            {keywords.map((k) => (
              <SelectItem key={k} value={k}>
                {k}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {viewMode === "active" && (
          <Select value={statusFilter} onValueChange={(v) => setStatusAndReset(v ?? "")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {(search || atsFilter || keywordFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setAtsFilter("");
              setKeywordFilter("");
              setStatusFilter("");
            }}
          >
            <X size={14} className="mr-1" /> Limpar
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant={sortBy === "score" ? "default" : "outline"}
            size="sm"
            onClick={() => { setSortBy(sortBy === "score" ? "" : "score"); setPage(1); }}
          >
            <ArrowUpDown size={14} className="mr-1" />
            Score
          </Button>
          <Button
            variant={viewMode === "irrelevant" ? "secondary" : "outline"}
            size="sm"
            onClick={() => { setViewMode(viewMode === "irrelevant" ? "active" : "irrelevant"); setPage(1); setSelected(new Set()); }}
          >
            <AlertTriangle size={14} className="mr-1" />
            {viewMode === "irrelevant" ? "Voltar às vagas" : "Irrelevantes"}
          </Button>
          <Button
            variant={viewMode === "deleted" ? "destructive" : "outline"}
            size="sm"
            onClick={() => { setViewMode(viewMode === "deleted" ? "active" : "deleted"); setPage(1); setSelected(new Set()); }}
          >
            <Trash2 size={14} className="mr-1" />
            {viewMode === "deleted" ? "Voltar às vagas" : "Lixeira"}
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 shadow-sm">
          <span className="text-sm font-semibold text-primary">
            {selected.size} selecionada(s)
          </span>
          <div className="mx-2 h-5 w-px bg-primary/20" />
          <div className="flex gap-2">
            {viewMode !== "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRestore}
              >
                <Undo2 size={14} className="mr-1" />
                Restaurar
              </Button>
            ) : (
              <>
                {statusOptions.map((s) => (
                  <Button
                    key={s.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatus(s.value)}
                  >
                    <s.icon size={14} className="mr-1" />
                    {s.label}
                  </Button>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 size={14} className="mr-1" />
                  Excluir
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Limpar seleção
          </Button>
        </div>
      )}

      {/* Table */}
      {isPending && jobs.length === 0 ? (
        <TableSkeleton />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <button onClick={toggleSelectAll}>
                    {selected.size === jobs.length && jobs.length > 0 ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow
                  key={job.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setDetailJob(job)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(job.id)}>
                      {selected.has(job.id) ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-37.5 truncate font-medium">
                    {job.company_name || "—"}
                  </TableCell>
                  <TableCell className="max-w-62.5 truncate">
                    {job.title}
                  </TableCell>
                  <TableCell className="max-w-37.5">
                    <div className="flex flex-wrap gap-1">
                      {job.matched_keywords
                        ?.split(",")
                        .slice(0, 3)
                        .map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="text-xs"
                          >
                            {kw.trim()}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ScoreBadge score={job.ai_score} />
                  </TableCell>
                  <TableCell className="max-w-30 truncate text-sm text-muted-foreground">
                    {job.location || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {job.ats || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusDropdown
                      status={job.status}
                      onStatusChange={(s) => handleStatusChange(job.id, s)}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {viewMode !== "active" ? (
                        <button
                          onClick={() => handleRestore(job.id)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Restaurar vaga"
                        >
                          <Undo2 size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Excluir vaga"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    Nenhuma vaga encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-5 py-3 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-semibold text-foreground">{page}</span> de{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>{" "}
            <span className="text-muted-foreground/70">({total} vagas)</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <JobDetailModal
        job={detailJob}
        open={!!detailJob}
        onClose={() => setDetailJob(null)}
        onStatusChange={(newStatus: string) => {
          if (detailJob) {
            handleStatusChange(detailJob.id, newStatus);
            setDetailJob({ ...detailJob, status: newStatus });
          }
        }}
      />
    </div>
  );
}

function StatusDropdown({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange: (s: string) => void;
}) {
  const current = statusOptions.find((o) => o.value === status) || statusOptions[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${current.color}`}>
            <current.icon size={12} />
            {current.label}
          </button>
        }
      />
      <DropdownMenuContent>
        {statusOptions.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
          >
            <opt.icon size={14} className="mr-2" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}
