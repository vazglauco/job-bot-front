"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getUsers,
  createUser,
  updateUserKeywords,
  deleteUser,
  getDashboardData,
  type User,
} from "@/lib/data";
import { useUser } from "@/lib/user-context";
import { C } from "@/lib/colors";
import { Plus, Pencil, Trash2, Briefcase, Check, X, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { useConfirm } from "@/lib/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWithCount extends User {
  jobCount?: number;
}

type DetailPanel = { type: "create" } | { type: "edit"; user: UserWithCount } | null;

function UserRowSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: C.border }}>
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-3 w-36 rounded" />
      </div>
    </div>
  );
}

export function UsersView() {
  const { userName: activeUser, setUserName } = useUser();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<UserWithCount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithCount | null>(null);
  const [panel, setPanel] = useState<DetailPanel>(null);
  const [isPending, startTransition] = useTransition();
  const [initialLoad, setInitialLoad] = useState(true);

  // Form state
  const [formName, setFormName] = useState("");
  const [formKeywords, setFormKeywords] = useState("");

  const loadUsers = () => {
    startTransition(async () => {
      try {
        const data = await getUsers();
        const withCounts = await Promise.all(
          data.map(async (u) => {
            try {
              const d = await getDashboardData(u.name);
              return { ...u, jobCount: d.totalJobs };
            } catch {
              return { ...u, jobCount: 0 };
            }
          })
        );
        setUsers(withCounts);
      } catch {
        toast({ type: "error", message: "Erro ao carregar usuários." });
      } finally {
        setInitialLoad(false);
      }
    });
  };

  useEffect(() => { loadUsers(); }, []);

  const openCreate = () => {
    setFormName("");
    setFormKeywords("");
    setPanel({ type: "create" });
    setSelectedUser(null);
  };

  const openEdit = (user: UserWithCount) => {
    setFormKeywords(user.keywords ?? "");
    setPanel({ type: "edit", user });
    setSelectedUser(user);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formKeywords.trim()) return;
    const kws = formKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    try {
      await createUser(formName.trim(), kws);
      setPanel(null);
      loadUsers();
      toast({ type: "success", message: `Usuário "${formName.trim()}" criado.` });
    } catch {
      toast({ type: "error", message: "Erro ao criar usuário." });
    }
  };

  const handleUpdateKeywords = async (name: string) => {
    const kws = formKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    try {
      await updateUserKeywords(name, kws);
      setPanel(null);
      loadUsers();
      toast({ type: "success", message: "Keywords atualizadas." });
    } catch {
      toast({ type: "error", message: "Erro ao salvar keywords." });
    }
  };

  const handleDelete = async (name: string) => {
    const ok = await confirm({
      title: "Deletar usuário",
      description: `Deletar "${name}" e todas as vagas associadas? Esta ação não pode ser desfeita.`,
      confirmLabel: "Deletar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteUser(name);
      if (selectedUser?.name === name) setSelectedUser(null);
      if (panel && "user" in panel && panel.user.name === name) setPanel(null);
      loadUsers();
      toast({ type: "success", message: `Usuário "${name}" deletado.` });
    } catch {
      toast({ type: "error", message: "Erro ao deletar usuário." });
    }
  };

  const showSkeleton = initialLoad && isPending;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: panel ? "320px" : "100%",
          flexShrink: 0,
          borderRight: panel ? `1px solid ${C.border}` : "none",
          transition: "width 0.15s ease",
        }}
      >
        {/* Header */}
        <div
          className="flex h-12 items-center gap-2 border-b px-4"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <h1 className="text-[13px] font-semibold" style={{ color: C.text }}>Usuários</h1>
          <span
            className="rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
            style={{ background: C.elevated, color: C.muted }}
          >
            {users.length}
          </span>
          <div className="flex-1" />
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{ background: C.accent, color: "oklch(0.08 0.004 270)" }}
          >
            <Plus size={13} />
            Novo
          </button>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto" style={{ background: C.bg }}>
          {showSkeleton && Array.from({ length: 3 }).map((_, i) => <UserRowSkeleton key={i} />)}

          {!showSkeleton && users.map((user) => {
            const kws = (user.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean);
            const isActive = activeUser === user.name;
            const isSelected = selectedUser?.name === user.name;

            return (
              <button
                key={user.name}
                onClick={() => { setSelectedUser(user); openEdit(user); }}
                className="flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors"
                style={{
                  borderColor: C.border,
                  background: isSelected ? C.elevated : "transparent",
                  borderLeft: isSelected ? `2px solid ${C.accent}` : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = C.surface;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                  style={{ background: C.accent, color: "oklch(0.08 0.004 270)" }}
                >
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium capitalize" style={{ color: C.text }}>
                      {user.name}
                    </span>
                    {isActive && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: `${C.accent}20`, color: C.accent }}
                      >
                        ativo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[12px]" style={{ color: C.muted }}>
                    <span className="flex items-center gap-1">
                      <Briefcase size={11} />
                      {user.jobCount ?? "..."} vagas
                    </span>
                    <span>{kws.length} keywords</span>
                  </div>
                  {kws.length > 0 && (
                    <div className="mt-0.5 truncate text-[11px]" style={{ color: C.subtle }}>
                      {kws.slice(0, 6).join(", ")}{kws.length > 6 ? ` +${kws.length - 6}` : ""}
                    </div>
                  )}
                </div>
                <Pencil size={12} className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: C.subtle }} />
              </button>
            );
          })}

          {!showSkeleton && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: C.subtle }}>
              <UsersIcon size={32} className="mb-3 opacity-40" />
              <p className="text-[13px] font-medium" style={{ color: C.muted }}>Nenhum usuário ainda.</p>
              <p className="mt-1 text-[12px]">Crie um usuário para começar.</p>
              <button
                onClick={openCreate}
                className="mt-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium"
                style={{ background: C.accent, color: "oklch(0.08 0.004 270)" }}
              >
                <Plus size={13} />
                Criar usuário
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail / form panel */}
      {panel && (
        <div className="flex flex-1 flex-col overflow-hidden" style={{ background: C.surface }}>
          {/* Panel header */}
          <div
            className="flex h-12 items-center gap-2 border-b px-4"
            style={{ borderColor: C.border }}
          >
            <span className="flex-1 text-[13px] font-semibold" style={{ color: C.text }}>
              {panel.type === "create" ? "Novo usuário" : `Editar — ${panel.user.name}`}
            </span>
            <button
              onClick={() => { setPanel(null); setSelectedUser(null); }}
              aria-label="Fechar painel"
              className="flex size-6 items-center justify-center rounded transition-colors"
              style={{ color: C.subtle }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.elevated; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto p-5">
            {panel.type === "create" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="user-name" className="text-[12px] font-medium" style={{ color: C.muted }}>Nome</label>
                <input
                  id="user-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: glauco"
                  autoFocus
                  className="h-8 rounded-md border bg-transparent px-3 text-[13px] outline-none focus:ring-1"
                  style={{ borderColor: C.border, color: C.text, background: C.elevated }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="user-keywords" className="text-[12px] font-medium" style={{ color: C.muted }}>Keywords</label>
              <textarea
                id="user-keywords"
                value={formKeywords}
                onChange={(e) => setFormKeywords(e.target.value)}
                placeholder="angular, react, node, typescript"
                rows={4}
                className="rounded-md border bg-transparent px-3 py-2 text-[13px] outline-none focus:ring-1 resize-none"
                style={{ borderColor: C.border, color: C.text, background: C.elevated }}
              />
              <p className="text-[11px]" style={{ color: C.subtle }}>
                Separadas por vírgula — definem quais vagas são relevantes.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {panel.type === "create" ? (
                <button
                  onClick={handleCreate}
                  disabled={!formName.trim() || !formKeywords.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[13px] font-medium transition-colors disabled:opacity-40"
                  style={{ background: C.accent, color: "oklch(0.08 0.004 270)" }}
                >
                  <Plus size={14} />
                  Criar Usuário
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleUpdateKeywords(panel.user.name)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[13px] font-medium"
                    style={{ background: C.accent, color: "oklch(0.08 0.004 270)" }}
                  >
                    <Check size={14} />
                    Salvar
                  </button>
                  <button
                    onClick={() => setUserName(panel.user.name)}
                    title="Usar este usuário como ativo"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium border"
                    style={{ borderColor: C.border, color: C.text, background: C.elevated }}
                  >
                    <Check size={14} />
                    Usar
                  </button>
                  <button
                    onClick={() => handleDelete(panel.user.name)}
                    aria-label="Deletar usuário"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium"
                    style={{ color: C.danger, background: `${C.danger}15` }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
