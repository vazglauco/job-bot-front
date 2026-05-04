/**
 * Tauri bridge — wraps all invoke() calls to Rust commands.
 * Used by the desktop app (static Next.js export).
 * Falls back to server actions only when NOT in static export mode
 * (i.e. during `next dev` with TAURI_DEV=1 or direct browser dev).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InvokeArgs = Record<string, any>;

async function invoke<T>(cmd: string, args?: InvokeArgs): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(cmd, args);
}

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface Job {
  id: number;
  user_name: string;
  title: string;
  company_name: string | null;
  url: string | null;
  location: string | null;
  department: string | null;
  ats: string | null;
  matched_keywords: string | null;
  fetched_at: string | Date | null;
  status: string;
  ai_score: number | null;
  ai_analysis: Record<string, unknown> | null;
  run_id: number | null;
  description: string | null;
}

export interface JobFilters {
  search?: string;
  ats?: string;
  keyword?: string;
  status?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  runId?: number;
}

export interface JobsPage {
  jobs: Job[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface RunGroup {
  id: number;
  run_at: Date | string;
}

export interface User {
  name: string;
  keywords: string | null;
  created_at?: Date | string | null;
}

export interface DashboardData {
  totalJobs: number;
  matchedJobs: number;
  boardCount: number;
  boardsByAts: { ats: string; count: number }[];
  jobsBySource: { source: string; count: number }[];
  jobsByStatus: { status: string; count: number }[];
  recentJobs: Job[];
  keywords: string[];
}

export interface AppConfig {
  database_url: string | null;
  ollama_url: string | null;
}

// ── Config ─────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>("get_config");
}

export async function saveConfig(
  database_url: string,
  ollama_url?: string,
): Promise<void> {
  return invoke("save_config_cmd", { databaseUrl: database_url, ollamaUrl: ollama_url });
}

export async function testConnection(): Promise<string> {
  return invoke<string>("test_connection");
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboardData(userName: string): Promise<DashboardData> {
  const raw = await invoke<{
    total_jobs: number;
    matched_jobs: number;
    total_boards: number;
    jobs_by_status: { status: string; count: number }[];
    jobs_by_source: { ats: string; count: number }[];
    recent_jobs: Job[];
    keywords: string | null;
  }>("get_dashboard", { userName });
  return {
    totalJobs: raw.total_jobs,
    matchedJobs: raw.matched_jobs,
    boardCount: raw.total_boards,
    boardsByAts: raw.jobs_by_source.map((s) => ({ ats: s.ats, count: s.count })),
    jobsBySource: raw.jobs_by_source.map((s) => ({ source: s.ats, count: s.count })),
    jobsByStatus: raw.jobs_by_status.map((s) => ({ status: s.status ?? "new", count: s.count })),
    recentJobs: raw.recent_jobs,
    keywords: raw.keywords ? raw.keywords.split(",").map((k) => k.trim()) : [],
  };
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export async function getJobs(userName: string, filters: JobFilters = {}): Promise<JobsPage> {
  return invoke<JobsPage>("get_jobs", {
    userName,
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 20,
    status: filters.status ?? "new",
    search: filters.search ?? null,
    sortBy: filters.sortBy ?? null,
  });
}

export async function getRuns(userName: string): Promise<RunGroup[]> {
  return invoke<RunGroup[]>("get_runs", { userName });
}

export async function updateJobStatus(id: number, status: string): Promise<void> {
  return invoke("update_job_status", { id, status });
}

export async function bulkUpdateStatus(ids: number[], status: string): Promise<void> {
  return invoke("bulk_update_status", { ids, status });
}

export async function deleteJob(id: number): Promise<void> {
  return updateJobStatus(id, "deleted");
}

export async function bulkDeleteJobs(ids: number[]): Promise<void> {
  return bulkUpdateStatus(ids, "deleted");
}

export async function restoreJob(id: number): Promise<void> {
  return updateJobStatus(id, "new");
}

export async function bulkRestoreJobs(ids: number[]): Promise<void> {
  return bulkUpdateStatus(ids, "new");
}

export async function getDistinctSources(userName: string): Promise<string[]> {
  const dash = await getDashboardData(userName);
  return dash.jobsBySource.map((s) => s.source).filter(Boolean);
}

export async function getDistinctKeywords(userName: string): Promise<string[]> {
  const dash = await getDashboardData(userName);
  return dash.keywords;
}

// ── Pipeline ───────────────────────────────────────────────────────────────

export const PIPELINE_ACTIVE_STATUSES = [
  "pipeline_applied",
  "pipeline_hr",
  "pipeline_tech",
  "pipeline_offer",
] as const;

export const PIPELINE_ARCHIVED_STATUSES = [
  "pipeline_rejected",
  "pipeline_withdrawn",
] as const;

export const PIPELINE_STATUSES = [
  ...PIPELINE_ACTIVE_STATUSES,
  ...PIPELINE_ARCHIVED_STATUSES,
] as const;

export type PipelineStatus = typeof PIPELINE_STATUSES[number];

export async function getPipelineJobs(userName: string): Promise<Job[]> {
  const allStatuses = [...PIPELINE_STATUSES];
  const pages = await Promise.all(
    allStatuses.map((status) =>
      invoke<JobsPage>("get_jobs", {
        userName,
        page: 1,
        perPage: 500,
        status,
        search: null,
        sortBy: null,
      })
    )
  );
  return pages.flatMap((p) => p.jobs);
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  return invoke<User[]>("get_users");
}

export async function createUser(name: string, keywords: string[]): Promise<void> {
  return invoke("create_user", { name, keywords: keywords.join(",") });
}

export async function updateUserKeywords(name: string, keywords: string[]): Promise<void> {
  return invoke("update_user_keywords", { name, keywords: keywords.join(",") });
}

export async function deleteUser(name: string): Promise<void> {
  return invoke("delete_user", { name });
}
