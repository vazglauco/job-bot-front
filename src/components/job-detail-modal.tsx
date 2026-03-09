"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Tag,
  Sparkles,
  Star,
  Send,
  EyeOff,
} from "lucide-react";

interface Job {
  id: number;
  user_name: string;
  title: string;
  company_name: string | null;
  url: string | null;
  location: string | null;
  department: string | null;
  ats: string | null;
  matched_keywords: string | null;
  fetched_at: Date;
  status: string;
}

const statusOptions = [
  { value: "new", label: "Nova", icon: Sparkles, color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200" },
  { value: "favorite", label: "Favorita", icon: Star, color: "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200" },
  { value: "applied", label: "Aplicada", icon: Send, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
  { value: "dismissed", label: "Descartada", icon: EyeOff, color: "text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200" },
];

export function JobDetailModal({
  job,
  open,
  onClose,
  onStatusChange,
}: {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  if (!job) return null;

  const keywords = job.matched_keywords
    ? job.matched_keywords.split(",").map((k) => k.trim())
    : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        {/* Header with gradient */}
        <div className="bg-linear-to-br from-primary/8 to-primary/3 px-6 pb-4 pt-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold leading-tight">
              {job.title}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {job.company_name && (
              <span className="flex items-center gap-1.5">
                <Building2 size={15} className="text-primary/60" />
                {job.company_name}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-primary/60" />
                {job.location}
              </span>
            )}
            {job.department && (
              <span className="flex items-center gap-1.5">
                <Tag size={15} className="text-primary/60" />
                {job.department}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Fonte
              </p>
              <Badge variant="outline" className="text-sm">
                {job.ats || "—"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Data de Coleta
              </p>
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar size={13} className="text-muted-foreground" />
                {new Date(job.fetched_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Keywords */}
          {keywords.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Keywords Matched
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw}
                      variant="secondary"
                      className="bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Status */}
          <div>
            <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Status
            </p>
            <div className="flex gap-2">
              {statusOptions.map((opt) => {
                const isActive = job.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onStatusChange(opt.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? `${opt.color} ring-2 ring-offset-1 ring-current/20`
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <opt.icon size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open URL */}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <ExternalLink size={16} />
              Abrir Vaga Original
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
