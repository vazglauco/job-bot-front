"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface JobFilters {
  search?: string;
  ats?: string;
  keyword?: string;
  status?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
}

export async function getJobs(userName: string, filters: JobFilters = {}) {
  const { search, ats, keyword, status, page = 1, perPage = 20, sortBy } = filters;

  const where: Record<string, unknown> = { user_name: userName };

  // Status filtering
  if (status === "deleted") {
    where.status = "deleted";
  } else if (status === "irrelevant") {
    where.status = "irrelevant";
  } else if (status) {
    where.status = status;
  } else {
    where.status = { notIn: ["deleted", "irrelevant"] };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { company_name: { contains: search, mode: "insensitive" } },
    ];
  }
  if (ats) where.ats = ats;
  if (keyword) {
    where.matched_keywords = { contains: keyword, mode: "insensitive" };
  }

  // Determine ordering
  let orderBy: Record<string, string> | Record<string, string>[];
  if (sortBy === "score") {
    orderBy = [{ ai_score: "desc" }, { fetched_at: "desc" }];
  } else {
    orderBy = { fetched_at: "desc" };
  }

  const [rawJobs, total] = await Promise.all([
    prisma.jobs.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.jobs.count({ where }),
  ]);

  // Ensure numeric and JSON fields are plain serializable values
  // (Prisma can return Decimal objects for Float fields on some runtimes)
  const jobs = rawJobs.map((job) => ({
    ...job,
    ai_score: job.ai_score != null ? Number(job.ai_score) : null,
    ai_analysis: job.ai_analysis != null
      ? JSON.parse(JSON.stringify(job.ai_analysis))
      : null,
  }));

  return {
    jobs,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getJobById(id: number) {
  const job = await prisma.jobs.findUnique({ where: { id } });
  if (!job) return null;
  return {
    ...job,
    ai_score: job.ai_score != null ? Number(job.ai_score) : null,
    ai_analysis: job.ai_analysis != null
      ? JSON.parse(JSON.stringify(job.ai_analysis))
      : null,
  };
}

export async function updateJobStatus(id: number, status: string) {
  await prisma.jobs.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/vagas");
}

export async function bulkUpdateStatus(ids: number[], status: string) {
  await prisma.jobs.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  revalidatePath("/vagas");
}

export async function deleteJob(id: number) {
  await prisma.jobs.update({
    where: { id },
    data: { status: "deleted" },
  });
  revalidatePath("/vagas");
}

export async function bulkDeleteJobs(ids: number[]) {
  await prisma.jobs.updateMany({
    where: { id: { in: ids } },
    data: { status: "deleted" },
  });
  revalidatePath("/vagas");
}

export async function restoreJob(id: number) {
  await prisma.jobs.update({
    where: { id },
    data: { status: "new" },
  });
  revalidatePath("/vagas");
}

export async function bulkRestoreJobs(ids: number[]) {
  await prisma.jobs.updateMany({
    where: { id: { in: ids } },
    data: { status: "new" },
  });
  revalidatePath("/vagas");
}

export async function getDistinctSources(userName: string) {
  const sources = await prisma.jobs.findMany({
    where: { user_name: userName },
    select: { ats: true },
    distinct: ["ats"],
  });
  return sources.map((s) => s.ats).filter(Boolean) as string[];
}

export async function getDistinctKeywords(userName: string) {
  const jobs = await prisma.jobs.findMany({
    where: {
      user_name: userName,
      matched_keywords: { not: null },
    },
    select: { matched_keywords: true },
  });

  const kwSet = new Set<string>();
  jobs.forEach((j) => {
    j.matched_keywords?.split(",").forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) kwSet.add(trimmed);
    });
  });
  return Array.from(kwSet).sort();
}
