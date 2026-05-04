"use client";

import { useState, createContext, useContext } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { JobsView } from "@/components/views/jobs-view";
import { BotView } from "@/components/views/bot-view";
import { UsersView } from "@/components/views/users-view";
import { SetupView } from "@/components/views/setup-view";
import { PipelineView } from "@/components/views/pipeline-view";
import { isTauri } from "@/lib/tauri-bridge";

export type AppView = "vagas" | "minhas-vagas" | "bot" | "users" | "setup";

interface AppShellContextValue {
  activeView: AppView;
  setActiveView: (v: AppView) => void;
}

const AppShellContext = createContext<AppShellContextValue>({
  activeView: "vagas",
  setActiveView: () => {},
});

export function useAppShell() {
  return useContext(AppShellContext);
}

export function AppShell({
  initialView,
  children: _children,
}: {
  initialView: AppView;
  children?: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<AppView>(initialView);

  return (
    <AppShellContext.Provider value={{ activeView, setActiveView }}>
      <div className="flex h-screen w-screen overflow-hidden" style={{ background: "oklch(1.00 0.000 0)" }}>
        {activeView !== "setup" && (
          <AppSidebar activeView={activeView} onNavigate={setActiveView} />
        )}
        <div className="flex flex-1 overflow-hidden">
          {activeView === "vagas" && <JobsView />}
          {activeView === "minhas-vagas" && <PipelineView />}
          {activeView === "bot" && isTauri() && <BotView />}
          {activeView === "users" && <UsersView />}
          {activeView === "setup" && <SetupView onDone={() => setActiveView("vagas")} />}
        </div>
      </div>
    </AppShellContext.Provider>
  );
}
