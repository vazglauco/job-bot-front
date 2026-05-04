"use client";

import { useEffect, useState, useTransition } from "react";
import { Briefcase, Bot, Users, Settings, ChevronDown, Check, Kanban } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { isTauri } from "@/lib/tauri-bridge";
import { getUsers, getDashboardData, getPipelineJobs, PIPELINE_ACTIVE_STATUSES, type User } from "@/lib/data";
import { cn } from "@/lib/utils";
import { C } from "@/lib/colors";
import type { AppView } from "@/components/app-shell";

const baseNavItems = [
  { id: "vagas" as AppView,        label: "Vagas",        icon: Briefcase },
  { id: "minhas-vagas" as AppView,  label: "Minhas Vagas", icon: Kanban },
  { id: "bot" as AppView,          label: "Bot",           icon: Bot, tauriOnly: true },
  { id: "users" as AppView,        label: "Usuários",      icon: Users },
];

export function AppSidebar({
  activeView,
  onNavigate,
}: {
  activeView: AppView;
  onNavigate: (v: AppView) => void;
}) {
  const { userName, setUserName } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [newCount, setNewCount] = useState<number>(0);
  const [pipelineCount, setPipelineCount] = useState<number>(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getUsers();
        setUsers(data);
        if (!userName && data.length > 0) setUserName(data[0].name);
      } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userName) return;
    startTransition(async () => {
      try {
        const [dash, pipelineJobs] = await Promise.all([
          getDashboardData(userName),
          getPipelineJobs(userName),
        ]);
        const newJobs = dash.jobsByStatus.find((s) => s.status === "new")?.count ?? 0;
        setNewCount(newJobs);
        const active = pipelineJobs.filter((j) =>
          (PIPELINE_ACTIVE_STATUSES as readonly string[]).includes(j.status)
        ).length;
        setPipelineCount(active);
      } catch {}
    });
  }, [userName]);

  const initials = userName ? userName.slice(0, 2).toUpperCase() : "?";
  const navItems = baseNavItems.filter((item) => !item.tauriOnly || isTauri());

  return (
    <aside
      className="flex h-full w-55 shrink-0 flex-col border-r"
      style={{ background: C.surface, borderColor: C.border }}
    >
      {/* Logo */}
      <div
        className="flex h-12 items-center gap-2.5 border-b px-4"
        style={{ borderColor: C.border }}
      >
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: C.accent }}
        >
          <Bot size={14} style={{ color: "oklch(1.00 0 0)" }} />
        </div>
        <span className="text-sm font-semibold tracking-tight" style={{ color: C.text }}>
          Job Bot
        </span>
      </div>

      {/* Nav */}
      <nav role="navigation" aria-label="Navegação principal" className="flex flex-col gap-0.5 p-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{
                background: isActive ? C.overlay : "transparent",
                color: isActive ? C.text : C.muted,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = C.elevated;
                  (e.currentTarget as HTMLButtonElement).style.color = C.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                }
              }}
            >
              <item.icon size={15} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.id === "vagas" && newCount > 0 && (
                <span
                  className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                  style={{ background: `${C.accent}20`, color: C.accent }}
                >
                  {newCount > 99 ? "99+" : newCount}
                </span>
              )}
              {item.id === "minhas-vagas" && pipelineCount > 0 && (
                <span
                  className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                  style={{ background: `${C.success}20`, color: C.success }}
                >
                  {pipelineCount > 99 ? "99+" : pipelineCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* User switcher */}
      <div className="border-t p-2" style={{ borderColor: C.border }}>
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-label="Trocar usuário"
            aria-expanded={userMenuOpen}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors"
            style={{ background: userMenuOpen ? C.elevated : "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
            onMouseLeave={(e) => {
              if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: C.accent, color: "oklch(1.00 0 0)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-medium capitalize" style={{ color: C.text }}>
                {userName || "Selecionar"}
              </p>
            </div>
            <ChevronDown
              size={13}
              style={{
                color: C.subtle,
                transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
              }}
            />
          </button>

          {userMenuOpen && (
            <div
              className="absolute bottom-full left-0 right-0 mb-1 rounded-md border py-1 shadow-lg"
              style={{ background: C.surface, borderColor: C.border }}
            >
              {users.map((u) => (
                <button
                  key={u.name}
                  onClick={() => { setUserName(u.name); setUserMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors"
                  style={{ color: C.text }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <div
                    className="flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{ background: C.accent, color: "oklch(1.00 0 0)" }}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 capitalize">{u.name}</span>
                  {userName === u.name && <Check size={12} style={{ color: C.accent }} />}
                </button>
              ))}
              {users.length === 0 && (
                <p className="px-3 py-2 text-[12px]" style={{ color: C.subtle }}>
                  Nenhum usuário
                </p>
              )}
            </div>
          )}
        </div>

        {/* Setup */}
        <button
          onClick={() => onNavigate("setup")}
          aria-label="Configurações"
          className="mt-0.5 flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors"
          style={{ color: C.subtle }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = C.elevated;
            (e.currentTarget as HTMLButtonElement).style.color = C.muted;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = C.subtle;
          }}
        >
          <Settings size={14} className="shrink-0" />
          <span>Setup</span>
        </button>
      </div>
    </aside>
  );
}
