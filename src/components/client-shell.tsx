"use client";

import { UserProvider } from "@/lib/user-context";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider, MainLayout } from "@gvaz/gvaz-ui";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SidebarProvider>
        <Sidebar />
        <MainLayout>
          <main className="min-h-screen bg-white">
            <div className="px-6 py-6">
              {children}
            </div>
          </main>
        </MainLayout>
      </SidebarProvider>
    </UserProvider>
  );
}
