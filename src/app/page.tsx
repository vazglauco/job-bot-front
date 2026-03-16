"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState, useTransition } from "react";
import { getDashboardData } from "@/app/actions/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
} from "@gvaz/gvaz-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import {
  Briefcase,
  Target,
  Building2,
  Tag,
  Star,
  Send,
  EyeOff,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  totalJobs: number;
  matchedJobs: number;
  boardCount: number;
  boardsByAts: { ats: string; count: number }[];
  jobsBySource: { source: string; count: number }[];
  jobsByStatus: { status: string; count: number }[];
  recentJobs: {
    id: number;
    title: string;
    company_name: string | null;
    ats: string | null;
    status: string;
    fetched_at: Date;
  }[];
  keywords: string[];
}

const statusConfig: Record<
  string,
  {
    label: string;
    icon: React.ElementType;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  new: { label: "Novas", icon: Sparkles, variant: "default" },
  favorite: { label: "Favoritas", icon: Star, variant: "secondary" },
  applied: { label: "Aplicadas", icon: Send, variant: "secondary" },
  dismissed: { label: "Descartadas", icon: EyeOff, variant: "outline" },
};

export default function DashboardPage() {
  const { userName } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!userName) return;
    startTransition(async () => {
      const result = await getDashboardData(userName);
      setData(result);
    });
  }, [userName]);

  if (!userName) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Zap size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Bem-vindo ao Job Bot</h2>
          <p className="mt-1 text-muted-foreground">
            Selecione um usuário na sidebar para começar.
          </p>
        </div>
      </div>
    );
  }

  if (isPending || !data) {
    return <DashboardSkeleton />;
  }

  const matchRate =
    data.totalJobs > 0
      ? Math.round((data.matchedJobs / data.totalJobs) * 100)
      : 0;

  const stats = [
    { title: "Total de Vagas", value: data.totalJobs, icon: Briefcase, sub: undefined as string | undefined },
    { title: "Com Match", value: data.matchedJobs, icon: Target, sub: `${matchRate}% taxa de match` },
    { title: "Boards Ativos", value: data.boardCount, icon: Building2, sub: undefined as string | undefined },
    { title: "Keywords", value: data.keywords.length, icon: Tag, sub: undefined as string | undefined },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" />

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold capitalize">Olá, {userName}</h2>
        <p className="mt-1 text-muted-foreground">
          Você tem{" "}
          <span className="font-medium text-foreground">{data.totalJobs} vagas</span>{" "}
          coletadas
          {data.matchedJobs > 0 && (
            <>, com{" "}
              <span className="font-medium text-foreground">{matchRate}%</span> de match.
            </>
          )}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{stat.value}</p>
                  {stat.sub && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
                  )}
                </div>
                <stat.icon size={20} className="mt-0.5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(statusConfig).map(([key, config]) => {
          const statusData = data.jobsByStatus.find((s) => s.status === key);
          const count = statusData?.count || 0;
          const pct =
            data.totalJobs > 0
              ? Math.round((count / data.totalJobs) * 100)
              : 0;
          return (
            <Card key={key}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <config.icon size={16} className="text-muted-foreground" />
                  <Badge variant={config.variant} className="text-xs">
                    {pct}%
                  </Badge>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums">{count}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Jobs by source */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <CardTitle className="text-base">Vagas por Fonte</CardTitle>
            </div>
            <CardDescription>Distribuição por plataforma ATS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.jobsBySource
                .sort((a, b) => b.count - a.count)
                .map((source) => {
                  const max = Math.max(...data.jobsBySource.map((s) => s.count));
                  const pct = max > 0 ? Math.round((source.count / max) * 100) : 0;
                  return (
                    <div key={source.source} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{source.source}</span>
                        <span className="text-sm text-muted-foreground">{source.count}</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-primary" />
              <CardTitle className="text-base">Keywords</CardTitle>
            </div>
            <CardDescription>Palavras-chave ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((kw) => (
                <Badge key={kw} variant="secondary">
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent jobs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <CardTitle className="text-base">Vagas Recentes</CardTitle>
            </div>
            <Link
              href="/vagas"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>
          <CardDescription>Últimas vagas coletadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {data.recentJobs.map((job) => {
              const sc = statusConfig[job.status] || statusConfig.new;
              return (
                <div
                  key={job.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {job.company_name || "—"}
                      <span className="mx-1.5">·</span>
                      {job.ats}
                    </p>
                  </div>
                  <Badge variant={sc.variant} className="shrink-0 gap-1">
                    <sc.icon size={11} />
                    {sc.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-9 w-40" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-14" />
                </div>
                <Skeleton className="size-5 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
