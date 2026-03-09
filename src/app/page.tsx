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
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  { label: string; icon: React.ElementType; gradient: string; text: string }
> = {
  new: {
    label: "Novas",
    icon: Sparkles,
    gradient: "from-blue-500/20 to-blue-600/5",
    text: "text-blue-600",
  },
  favorite: {
    label: "Favoritas",
    icon: Star,
    gradient: "from-amber-500/20 to-amber-600/5",
    text: "text-amber-600",
  },
  applied: {
    label: "Aplicadas",
    icon: Send,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    text: "text-emerald-600",
  },
  dismissed: {
    label: "Descartadas",
    icon: EyeOff,
    gradient: "from-gray-400/20 to-gray-500/5",
    text: "text-gray-500",
  },
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

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/70 px-8 py-8 text-primary-foreground shadow-lg">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-20 size-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-sm font-medium text-primary-foreground/70">
            Dashboard
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight capitalize">
            Olá, {userName}
          </h2>
          <p className="mt-2 max-w-md text-base text-primary-foreground/70">
            Você tem <span className="font-semibold text-primary-foreground">{data.totalJobs} vagas</span> coletadas
            {data.matchedJobs > 0 && (
              <>, com <span className="font-semibold text-primary-foreground">{matchRate}%</span> de match.</>
            )}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Vagas"
          value={data.totalJobs}
          icon={Briefcase}
          accent="from-indigo-500 to-indigo-600"
        />
        <StatsCard
          title="Com Match"
          value={data.matchedJobs}
          icon={Target}
          accent="from-violet-500 to-violet-600"
          sub={`${matchRate}% taxa de match`}
        />
        <StatsCard
          title="Boards Ativos"
          value={data.boardCount}
          icon={Building2}
          accent="from-cyan-500 to-cyan-600"
        />
        <StatsCard
          title="Keywords"
          value={data.keywords.length}
          icon={Tag}
          accent="from-fuchsia-500 to-fuchsia-600"
        />
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
            <Card key={key} className="group overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="relative p-5">
                <div className={`absolute inset-0 bg-linear-to-br ${config.gradient}`} />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {config.label}
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums">{count}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{pct}% do total</p>
                  </div>
                  <div className={`rounded-xl p-3 ${config.text} bg-white/60`}>
                    <config.icon size={22} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Jobs by source (wider) */}
        <Card className="border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <CardTitle className="text-lg">Vagas por Fonte</CardTitle>
            </div>
            <CardDescription>Distribuição por plataforma ATS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.jobsBySource
                .sort((a, b) => b.count - a.count)
                .map((source, i) => {
                  const max = Math.max(
                    ...data.jobsBySource.map((s) => s.count)
                  );
                  const pct = max > 0 ? (source.count / max) * 100 : 0;
                  const colors = [
                    "bg-indigo-500",
                    "bg-violet-500",
                    "bg-cyan-500",
                    "bg-fuchsia-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-rose-500",
                  ];
                  return (
                    <div key={source.source} className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-semibold">
                          {source.source}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {source.count}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            vagas
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-primary" />
              <CardTitle className="text-lg">Keywords</CardTitle>
            </div>
            <CardDescription>
              Palavras-chave ativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((kw) => (
                <Badge
                  key={kw}
                  variant="secondary"
                  className="bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/15"
                >
                  {kw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent jobs */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <CardTitle className="text-lg">Vagas Recentes</CardTitle>
            </div>
            <Link
              href="/vagas"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todas
              <ArrowRight size={14} />
            </Link>
          </div>
          <CardDescription>Últimas 10 vagas coletadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentJobs.map((job) => {
              const sc = statusConfig[job.status] || statusConfig.new;
              return (
                <div
                  key={job.id}
                  className="group flex items-center gap-4 rounded-xl border border-border/50 bg-muted/30 px-5 py-3.5 transition-all hover:border-primary/20 hover:bg-muted/60 hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {job.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {job.company_name || "—"}
                      <span className="mx-2 text-border">·</span>
                      {job.ats}
                      <span className="mx-2 text-border">·</span>
                      {new Date(job.fetched_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${sc.text} shrink-0 gap-1 border-0 bg-white/80 px-2.5 py-1`}
                  >
                    <sc.icon size={12} />
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

function StatsCard({
  title,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${accent} text-white shadow-sm`}
        >
          <Icon size={22} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
          {sub && (
            <p className="text-xs text-muted-foreground">{sub}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <Skeleton className="size-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-14" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
