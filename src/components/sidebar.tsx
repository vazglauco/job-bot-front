"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Sidebar as GvazSidebar,
  useSidebar,
  type SidebarNavItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gvaz/gvaz-ui";
import { LayoutDashboard, Briefcase, Users, Bot, ChevronDown, Check, Play } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { getUsers, type User as BridgeUser } from "@/lib/tauri-bridge";
import { cn } from "@/lib/utils";

const navConfig: Omit<SidebarNavItem, "isActive">[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Vagas", href: "/vagas", icon: Briefcase },
  { title: "Executar", href: "/executar", icon: Play },
  { title: "Usuários", href: "/users", icon: Users },
];

type UserData = BridgeUser;

function UserMenu({
  users,
  userName,
  setUserName,
}: {
  users: UserData[];
  userName: string | null;
  setUserName: (name: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 outline-none">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
          {userName ? userName.slice(0, 2).toUpperCase() : "?"}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold capitalize leading-tight text-sidebar-foreground">
            {userName || "Selecionar usuário"}
          </p>
          <p className="text-xs text-sidebar-foreground/50">Usuário ativo</p>
        </div>
        <ChevronDown size={14} className="shrink-0 text-sidebar-foreground/40" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52">
        {users.map((u) => (
          <DropdownMenuItem
            key={u.name}
            onClick={() => setUserName(u.name)}
            className={cn("flex items-center gap-2.5", userName === u.name && "bg-accent")}
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 capitalize">{u.name}</span>
            {userName === u.name && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
        ))}
        {users.length === 0 && (
          <DropdownMenuItem disabled>Nenhum usuário encontrado</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { userName, setUserName } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getUsers();
      setUsers(data);
      if (!userName && data.length > 0) setUserName(data[0].name);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems: SidebarNavItem[] = navConfig.map((item) => ({
    ...item,
    isActive:
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  }));

  return (
    <GvazSidebar
      collapsed={!open}
      logo={{
        icon: (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary">
            <Bot size={20} className="text-primary-foreground" />
          </div>
        ),
        name: "Job Bot",
      }}
      navItems={navItems}
      LinkComponent={Link}
      user={{
        name: userName || "Selecionar usuário",
        role: "Usuário ativo",
        fallback: userName ? userName.slice(0, 2).toUpperCase() : "?",
      }}
      userMenuContent={
        <UserMenu users={users} userName={userName} setUserName={setUserName} />
      }
    />
  );
}

