"use server";

import { prisma } from "@/lib/db";

export async function getDashboardData(userName: string) {
  const [totalJobs, matchedJobs, boardCount, boardsByAts, recentJobs, user] =
    await Promise.all([
      prisma.jobs.count({ where: { user_name: userName } }),
      prisma.jobs.count({
        where: {
          user_name: userName,
          matched_keywords: { not: null },
        },
      }),
      prisma.boards.count(),
      prisma.boards.groupBy({
        by: ["ats"],
        _count: { ats: true },
      }),
      prisma.jobs.findMany({
        where: { user_name: userName },
        orderBy: { fetched_at: "desc" },
        take: 10,
      }),
      prisma.users.findUnique({ where: { name: userName } }),
    ]);

  // Count jobs by source
  const jobsBySource = await prisma.jobs.groupBy({
    by: ["ats"],
    where: { user_name: userName },
    _count: { ats: true },
  });

  // Count jobs by status
  const jobsByStatus = await prisma.jobs.groupBy({
    by: ["status"],
    where: { user_name: userName },
    _count: { status: true },
  });

  return {
    totalJobs,
    matchedJobs,
    boardCount,
    boardsByAts: boardsByAts.map((b) => ({
      ats: b.ats,
      count: b._count.ats,
    })),
    jobsBySource: jobsBySource.map((j) => ({
      source: j.ats || "unknown",
      count: j._count.ats,
    })),
    jobsByStatus: jobsByStatus.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    recentJobs,
    keywords: user?.keywords
      ? user.keywords.split(",").map((k) => k.trim())
      : [],
  };
}
