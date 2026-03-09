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
}

export async function getJobs(userName: string, filters: JobFilters = {}) {
  const { search, ats, keyword, status, page = 1, perPage = 20 } = filters;

  const where: Record<string, unknown> = { user_name: userName };

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
  if (status) where.status = status;

  const [jobs, total] = await Promise.all([
    prisma.jobs.findMany({
      where,
      orderBy: { fetched_at: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.jobs.count({ where }),
  ]);

  return {
    jobs,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getJobById(id: number) {
  return prisma.jobs.findUnique({ where: { id } });
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
