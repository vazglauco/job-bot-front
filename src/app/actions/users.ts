"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  return prisma.users.findMany({
    orderBy: { created_at: "desc" },
  });
}

export async function getUserWithStats(name: string) {
  const [user, jobCount] = await Promise.all([
    prisma.users.findUnique({ where: { name } }),
    prisma.jobs.count({ where: { user_name: name } }),
  ]);
  return user ? { ...user, jobCount } : null;
}

export async function createUser(name: string, keywords: string[]) {
  await prisma.users.create({
    data: {
      name,
      keywords: keywords.join(","),
    },
  });
  revalidatePath("/users");
}

export async function updateUserKeywords(name: string, keywords: string[]) {
  await prisma.users.update({
    where: { name },
    data: { keywords: keywords.join(",") },
  });
  revalidatePath("/users");
}

export async function deleteUser(name: string) {
  // cascade: delete jobs first
  await prisma.jobs.deleteMany({ where: { user_name: name } });
  await prisma.users.delete({ where: { name } });
  revalidatePath("/users");
}
