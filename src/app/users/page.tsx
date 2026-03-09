"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getUsers,
  getUserWithStats,
  createUser,
  updateUserKeywords,
  deleteUser,
} from "@/app/actions/users";
import { useUser } from "@/lib/user-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Briefcase, Users, CheckCircle2 } from "lucide-react";

const avatarGradients = [
  "from-indigo-500 to-violet-500",
  "from-cyan-500 to-blue-500",
  "from-fuchsia-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-red-500",
];

interface UserData {
  name: string;
  keywords: string;
  created_at: Date;
}

export default function UsersPage() {
  const { setUserName } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  // Create user form
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKeywords, setNewKeywords] = useState("");

  // Edit keywords
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editKeywords, setEditKeywords] = useState("");

  const loadUsers = () => {
    startTransition(async () => {
      const data = await getUsers();
      setUsers(data);
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Load job counts for each user
  useEffect(() => {
    if (users.length === 0) return;
    startTransition(async () => {
      const counts: Record<string, number> = {};
      const results = await Promise.all(
        users.map((u) => getUserWithStats(u.name))
      );
      results.forEach((data) => {
        if (data) counts[data.name] = data.jobCount;
      });
      setJobCounts(counts);
    });
  }, [users]);

  const handleCreate = async () => {
    if (!newName.trim() || !newKeywords.trim()) return;
    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    await createUser(newName.trim(), keywords);
    setNewName("");
    setNewKeywords("");
    setShowCreate(false);
    loadUsers();
  };

  const handleUpdateKeywords = async () => {
    if (!editingUser || !editKeywords.trim()) return;
    const keywords = editKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    await updateUserKeywords(editingUser, keywords);
    setEditingUser(null);
    setEditKeywords("");
    loadUsers();
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Deletar user "${name}" e todas as vagas associadas?`)) return;
    await deleteUser(name);
    loadUsers();
  };

  if (isPending && users.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
          <p className="mt-1 text-muted-foreground">
            Gerencie usuários e suas keywords de busca
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user, i) => {
          const keywords = user.keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
          const gradient = avatarGradients[i % avatarGradients.length];
          return (
            <Card key={user.name} className="group overflow-hidden border-0 shadow-sm transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${gradient} text-sm font-bold text-white shadow-sm`}>
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">{user.name}</CardTitle>
                      <CardDescription>
                        Desde {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingUser(user.name);
                        setEditKeywords(user.keywords);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.name)}
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-5 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase size={15} className="text-primary/60" />
                    <span className="font-semibold text-foreground">{jobCounts[user.name] ?? "..."}</span>
                    <span>vagas</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{keywords.length}</span>
                    <span>keywords</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.slice(0, 8).map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="bg-primary/8 text-xs font-medium text-primary"
                    >
                      {kw}
                    </Badge>
                  ))}
                  {keywords.length > 8 && (
                    <Badge variant="secondary" className="text-xs text-muted-foreground">
                      +{keywords.length - 8}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setUserName(user.name)}
                >
                  <CheckCircle2 size={14} />
                  Selecionar usuário
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
            <Users size={28} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Nenhum usuário cadastrado</h3>
            <p className="mt-1 text-muted-foreground">
              Crie o primeiro usuário para começar a coletar vagas.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="mt-2 gap-2">
            <Plus size={16} />
            Criar primeiro usuário
          </Button>
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg">Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                placeholder="Ex: glauco"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keywords</label>
              <Input
                placeholder="angular, react, node, typescript"
                value={newKeywords}
                onChange={(e) => setNewKeywords(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Separadas por vírgula — definem quais vagas são relevantes
              </p>
            </div>
            <Button onClick={handleCreate} className="w-full gap-2">
              <Plus size={16} />
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit keywords dialog */}
      <Dialog
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg capitalize">
              Editar Keywords — {editingUser}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Keywords</label>
              <Input
                placeholder="angular, react, node"
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Separadas por vírgula. Isso sobrescreve as keywords anteriores.
              </p>
            </div>
            <Button onClick={handleUpdateKeywords} className="w-full">
              Salvar Keywords
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
