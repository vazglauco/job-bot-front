"use client";

import { UserProvider } from "@/lib/user-context";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/lib/toast-context";
import { ConfirmProvider } from "@/lib/confirm-context";
import { useEffect, useState } from "react";
import { getConfig, isTauri } from "@/lib/tauri-bridge";

function Shell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    if (!isTauri()) { setReady(true); return; }
    getConfig()
      .then((cfg) => {
        if (!cfg.database_url) setNeedsSetup(true);
        setReady(true);
      })
      .catch(() => {
        setNeedsSetup(true);
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <UserProvider>
          <AppShell initialView={needsSetup ? "setup" : "vagas"}>
            {children}
          </AppShell>
        </UserProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
