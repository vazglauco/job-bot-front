"use client";

import { UserProvider } from "@/lib/user-context";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto scroll-smooth p-8 lg:p-10">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </TooltipProvider>
    </UserProvider>
  );
}
