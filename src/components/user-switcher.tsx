"use client";

import { useUser } from "@/lib/user-context";
import { useEffect, useState, useTransition } from "react";
import { getUsers } from "@/app/actions/users";
import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface UserData {
  name: string;
  keywords: string;
}

function UserAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm",
        size === "sm" ? "size-7 text-xs" : "size-9 text-sm"
      )}
    >
      {initials}
    </div>
  );
}

export function UserSwitcher({ collapsed }: { collapsed: boolean }) {
  const { userName, setUserName } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const data = await getUsers();
      setUsers(data);
      if (!userName && data.length > 0) {
        setUserName(data[0].name);
      }
    });
  }, [userName, setUserName]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent",
          collapsed && "justify-center px-0"
        )}
      >
        {userName ? (
          <UserAvatar name={userName} />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-sidebar-foreground/30 text-xs text-sidebar-foreground/40">
            ?
          </div>
        )}
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName || "Selecionar user"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/40">
                Usuário ativo
              </p>
            </div>
            <ChevronDown size={14} className="shrink-0 text-sidebar-foreground/40" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52">
        {users.map((u) => (
          <DropdownMenuItem
            key={u.name}
            onClick={() => setUserName(u.name)}
            className={cn(
              "flex items-center gap-2.5 py-2",
              userName === u.name && "bg-accent"
            )}
          >
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 capitalize">{u.name}</span>
            {userName === u.name && <Check size={14} className="text-primary" />}
          </DropdownMenuItem>
        ))}
        {users.length === 0 && (
          <DropdownMenuItem disabled>Nenhum user encontrado</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
