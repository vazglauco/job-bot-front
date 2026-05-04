"use client";

/**
 * Dispatcher: routes data calls to Tauri commands (desktop) or server actions (web).
 * Re-exports types from tauri-bridge so views only need to import from here.
 */

import { isTauri } from "@/lib/tauri-bridge";
import * as bridge from "@/lib/tauri-bridge";
import * as jobActions from "@/app/actions/jobs";
import * as userActions from "@/app/actions/users";
import * as dashboardActions from "@/app/actions/dashboard";

export type {
  Job,
  JobFilters,
  JobsPage,
  RunGroup,
  User,
  DashboardData,
  PipelineStatus,
} from "@/lib/tauri-bridge";

export {
  PIPELINE_ACTIVE_STATUSES,
  PIPELINE_ARCHIVED_STATUSES,
  PIPELINE_STATUSES,
} from "@/lib/tauri-bridge";

// ── Jobs ───────────────────────────────────────────────────────────────────

export async function getJobs(
  userName: string,
  filters: bridge.JobFilters = {},
): Promise<bridge.JobsPage> {
  if (isTauri()) return bridge.getJobs(userName, filters);
  const result = await jobActions.getJobs(userName, filters);
  return result as bridge.JobsPage;
}

export async function getRuns(userName: string): Promise<bridge.RunGroup[]> {
  if (isTauri()) return bridge.getRuns(userName);
  const result = await jobActions.getRuns(userName);
  return result as bridge.RunGroup[];
}

export async function updateJobStatus(id: number, status: string): Promise<void> {
  if (isTauri()) return bridge.updateJobStatus(id, status);
  return jobActions.updateJobStatus(id, status);
}

export async function bulkUpdateStatus(ids: number[], status: string): Promise<void> {
  if (isTauri()) return bridge.bulkUpdateStatus(ids, status);
  return jobActions.bulkUpdateStatus(ids, status);
}

export async function deleteJob(id: number): Promise<void> {
  if (isTauri()) return bridge.deleteJob(id);
  return jobActions.deleteJob(id);
}

export async function bulkDeleteJobs(ids: number[]): Promise<void> {
  if (isTauri()) return bridge.bulkDeleteJobs(ids);
  return jobActions.bulkDeleteJobs(ids);
}

export async function restoreJob(id: number): Promise<void> {
  if (isTauri()) return bridge.restoreJob(id);
  return jobActions.restoreJob(id);
}

export async function bulkRestoreJobs(ids: number[]): Promise<void> {
  if (isTauri()) return bridge.bulkRestoreJobs(ids);
  return jobActions.bulkRestoreJobs(ids);
}

export async function getDistinctSources(userName: string): Promise<string[]> {
  if (isTauri()) return bridge.getDistinctSources(userName);
  return jobActions.getDistinctSources(userName);
}

export async function getDistinctKeywords(userName: string): Promise<string[]> {
  if (isTauri()) return bridge.getDistinctKeywords(userName);
  return jobActions.getDistinctKeywords(userName);
}

// ── Pipeline ───────────────────────────────────────────────────────────────

export async function getPipelineJobs(userName: string): Promise<bridge.Job[]> {
  if (isTauri()) return bridge.getPipelineJobs(userName);
  const allStatuses = [...bridge.PIPELINE_STATUSES];
  const pages = await Promise.all(
    allStatuses.map((status) =>
      jobActions.getJobs(userName, { status, page: 1, perPage: 500 }),
    ),
  );
  return pages.flatMap((p) => p.jobs) as bridge.Job[];
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboardData(userName: string): Promise<bridge.DashboardData> {
  if (isTauri()) return bridge.getDashboardData(userName);
  const result = await dashboardActions.getDashboardData(userName);
  return result as unknown as bridge.DashboardData;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<bridge.User[]> {
  if (isTauri()) return bridge.getUsers();
  const result = await userActions.getUsers();
  return result as bridge.User[];
}

export async function createUser(name: string, keywords: string[]): Promise<void> {
  if (isTauri()) return bridge.createUser(name, keywords);
  return userActions.createUser(name, keywords);
}

export async function updateUserKeywords(name: string, keywords: string[]): Promise<void> {
  if (isTauri()) return bridge.updateUserKeywords(name, keywords);
  return userActions.updateUserKeywords(name, keywords);
}

export async function deleteUser(name: string): Promise<void> {
  if (isTauri()) return bridge.deleteUser(name);
  return userActions.deleteUser(name);
}
