"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/user-context";
import { getUsers, type User } from "@/lib/tauri-bridge";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { C } from "@/lib/colors";
import { useToast } from "@/lib/toast-context";
import {
  Play,
  Brain,
  Radar,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

type StageStatus = "pending" | "running" | "done" | "error";

interface Stage {
  id: string;
  label: string;
  status: StageStatus;
  summary?: string;
  log: string[];
  startedAt?: number;
  finishedAt?: number;
}

const STAGE_PATTERNS: { id: string; label: string; pattern: RegExp; summary: RegExp }[] = [
  {
    id: "probe",
    label: "Probe",
    pattern: /Stage.*Prob|Probing ATS/i,
    summary: /(\d+) boards? found|boards? probed/i,
  },
  {
    id: "fetch",
    label: "Fetch",
    pattern: /Stage.*Fetch|Fetching jobs/i,
    summary: /(\d+[\d.,]* (?:total|raw|vagas))/i,
  },
  {
    id: "filter",
    label: "Filter",
    pattern: /Stage.*Filter|Filtering|matched/i,
    summary: /(\d+[\d.,]* (?:matched|correspondem))/i,
  },
  {
    id: "score",
    label: "Score",
    pattern: /Stage.*Scor|Scoring|AI Scoring/i,
    summary: /(\d+[\d.,]* (?:relevantes|scored|analisadas))/i,
  },
  {
    id: "purge",
    label: "Purge",
    pattern: /Stage.*Purg|Purging|Verificando vagas fechadas/i,
    summary: /(\d+[\d.,]* (?:fechadas|closed|checked))/i,
  },
];

function parseStages(lines: string[]): Stage[] {
  const stages: Stage[] = STAGE_PATTERNS.map((p) => ({
    id: p.id,
    label: p.label,
    status: "pending",
    log: [],
  }));

  let activeIdx = -1;

  for (const line of lines) {
    for (let i = 0; i < STAGE_PATTERNS.length; i++) {
      if (STAGE_PATTERNS[i].pattern.test(line)) {
        if (activeIdx >= 0 && stages[activeIdx].status === "running") {
          stages[activeIdx].status = "done";
          stages[activeIdx].finishedAt = Date.now();
        }
        activeIdx = i;
        stages[i].status = "running";
        if (!stages[i].startedAt) stages[i].startedAt = Date.now();
        break;
      }
    }

    if (activeIdx >= 0) {
      stages[activeIdx].log.push(line);
      const pat = STAGE_PATTERNS[activeIdx];
      const m = pat.summary.exec(line);
      if (m) stages[activeIdx].summary = m[0];
    }
  }

  return stages;
}

function elapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function StageRow({ stage, isLast }: { stage: Stage; isLast: boolean }) {
  const [logOpen, setLogOpen] = useState(false);
  const dur = stage.finishedAt && stage.startedAt
    ? elapsed(stage.finishedAt - stage.startedAt)
    : stage.startedAt ? elapsed(Date.now() - stage.startedAt) : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 py-2">
        <div className="flex w-5 shrink-0 justify-center">
          {stage.status === "pending" && <Circle size={14} style={{ color: C.subtle }} />}
          {stage.status === "running" && <Loader2 size={14} className="animate-spin" style={{ color: C.accent }} />}
          {stage.status === "done" && <CheckCircle2 size={14} style={{ color: C.success }} />}
          {stage.status === "error" && <XCircle size={14} style={{ color: C.danger }} />}
        </div>

        <span
          className="w-16 text-[13px] font-medium"
          style={{ color: stage.status === "pending" ? C.subtle : C.text }}
        >
          {stage.label}
        </span>

        {stage.summary && (
          <span className="flex-1 truncate text-[12px]" style={{ color: C.muted }}>
            {stage.summary}
          </span>
        )}
        {stage.status === "running" && !stage.summary && (
          <span className="flex-1 text-[12px]" style={{ color: C.accent }}>em andamento...</span>
        )}
        {stage.status === "pending" && (
          <span className="flex-1 text-[12px]" style={{ color: C.subtle }}>—</span>
        )}

        {dur && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: C.subtle }}>
            <Clock size={10} />
            {dur}
          </span>
        )}

        {stage.log.length > 0 && (
          <button
            onClick={() => setLogOpen((o) => !o)}
            aria-expanded={logOpen}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors"
            style={{ color: C.subtle }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.muted; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.subtle; }}
          >
            log
            {logOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>

      {logOpen && stage.log.length > 0 && (
        <div
          className="mb-2 ml-8 max-h-40 overflow-y-auto rounded-md p-3 font-mono text-[11px] leading-relaxed"
          style={{ background: C.surface, color: C.muted }}
        >
          {stage.log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {!isLast && (
        <div className="ml-2.25 h-3 w-px" style={{ background: C.border }} />
      )}
    </div>
  );
}

type RunType = "run" | "score" | "probe";

interface RunState {
  type: RunType;
  status: "running" | "done" | "error";
  startedAt: number;
  finishedAt?: number;
  error?: string;
  lines: string[];
  stages: Stage[];
}

export function BotView() {
  const { userName } = useUser();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState(userName || "");
  const [noAi, setNoAi] = useState(false);
  const [searchOnly, setSearchOnly] = useState(false);
  const [currentRun, setCurrentRun] = useState<RunState | null>(null);
  const [history, setHistory] = useState<RunState[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (userName && !selectedUser) setSelectedUser(userName);
  }, [userName, selectedUser]);

  useEffect(() => {
    if (currentRun?.status === "running") {
      timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentRun?.status]);

  const isRunning = currentRun?.status === "running";

  const handleRun = async (type: RunType) => {
    if (isRunning) return;

    const initialStages: Stage[] = STAGE_PATTERNS.map((p) => ({
      id: p.id,
      label: p.label,
      status: "pending",
      log: [],
    }));

    setCurrentRun({
      type,
      status: "running",
      startedAt: Date.now(),
      lines: [],
      stages: initialStages,
    });

    let lines: string[] = [];

    // Subscribe to streaming output from Rust
    const unlisten = await listen<string>("pipeline-output", (event) => {
      const line = event.payload;
      lines = [...lines, line];
      const updatedStages = parseStages(lines);
      setCurrentRun((prev) => {
        if (!prev) return null;
        return { ...prev, lines, stages: updatedStages };
      });
    });

    try {
      if (type === "probe") {
        await invoke("run_probe");
      } else if (type === "run") {
        await invoke("run_pipeline", { opts: { user: selectedUser, no_ai: noAi, search_only: searchOnly } });
      } else {
        await invoke("run_score", { user: selectedUser });
      }

      unlisten();

      setCurrentRun((prev) => {
        if (!prev) return null;
        const finished: RunState = {
          ...prev,
          status: "done",
          finishedAt: Date.now(),
          stages: prev.stages.map((s) =>
            s.status === "running" ? { ...s, status: "done", finishedAt: Date.now() } : s
          ),
        };
        setHistory((h) => [finished, ...h.slice(0, 4)]);
        return null;
      });

      toast({ type: "success", message: `${type === "run" ? "Pipeline" : type === "score" ? "Score" : "Probe"} concluído.` });
    } catch (e) {
      unlisten();

      setCurrentRun((prev) => {
        if (!prev) return null;
        const failed: RunState = {
          ...prev,
          status: "error",
          finishedAt: Date.now(),
          error: String(e),
          stages: prev.stages.map((s) =>
            s.status === "running" ? { ...s, status: "error", finishedAt: Date.now() } : s
          ),
        };
        setHistory((h) => [failed, ...h.slice(0, 4)]);
        return null;
      });

      toast({ type: "error", message: `Erro na execução: ${String(e)}` });
    }
  };

  const runElapsed = currentRun ? elapsed(Date.now() - currentRun.startedAt) : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: C.bg }}>
      {/* Header */}
      <div
        className="flex h-12 shrink-0 items-center gap-2 border-b px-4"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <h1 className="text-[13px] font-semibold" style={{ color: C.text }}>Bot</h1>
        <span className="text-[13px]" style={{ color: C.subtle }}>—</span>
        <span className="text-[13px]" style={{ color: C.muted }}>Executar Pipeline</span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Config panel */}
        <div className="border-b px-6 py-5" style={{ borderColor: C.border }}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label htmlFor="bot-user" className="text-[12px]" style={{ color: C.muted }}>Usuário:</label>
              <select
                id="bot-user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="h-7 rounded-md border bg-transparent px-2 text-[13px] outline-none"
                style={{ borderColor: C.border, color: C.text, background: C.elevated }}
              >
                {users.map((u) => (
                  <option key={u.name} value={u.name} style={{ background: C.elevated }}>
                    {u.name}
                  </option>
                ))}
                {users.length === 0 && (
                  <option value="" style={{ background: C.elevated }}>Nenhum usuário</option>
                )}
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={noAi}
                onChange={(e) => setNoAi(e.target.checked)}
                className="accent-indigo-500"
              />
              <span className="text-[12px]" style={{ color: C.muted }}>--no-ai</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={searchOnly}
                onChange={(e) => setSearchOnly(e.target.checked)}
                className="accent-indigo-500"
              />
              <span className="text-[12px]" style={{ color: C.muted }}>--search-only</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <RunButton
              onClick={() => handleRun("run")}
              disabled={isRunning || !selectedUser}
              primary
              icon={isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              label="Run Pipeline"
            />
            <RunButton
              onClick={() => handleRun("score")}
              disabled={isRunning || !selectedUser}
              icon={isRunning ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
              label="Score Only"
            />
            <RunButton
              onClick={() => handleRun("probe")}
              disabled={isRunning}
              icon={isRunning ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
              label="Probe Only"
            />
          </div>
        </div>

        {/* Active run */}
        {currentRun && (
          <div className="border-b px-6 py-5" style={{ borderColor: C.border }}>
            <div className="mb-3 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" style={{ color: C.accent }} />
              <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: C.accent }}>
                Em execução
              </span>
              <span className="text-[12px]" style={{ color: C.subtle }}>{currentRun.type}</span>
              <div className="flex-1" />
              {runElapsed && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: C.subtle }}>
                  <Clock size={10} />
                  {runElapsed}
                </span>
              )}
            </div>

            {/* Indeterminate progress bar */}
            <div className="mb-4 h-0.5 w-full overflow-hidden rounded-full" style={{ background: C.elevated }}>
              <div
                className="h-full rounded-full"
                style={{
                  background: C.accent,
                  width: "40%",
                  animation: "progress-slide 1.5s ease-in-out infinite",
                }}
              />
            </div>

            <div className="ml-2">
              {currentRun.stages.map((stage, i) => (
                <StageRow key={stage.id} stage={stage} isLast={i === currentRun.stages.length - 1} />
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.map((run, idx) => (
          <HistoryRun key={idx} run={run} />
        ))}

        {!currentRun && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20" style={{ color: C.subtle }}>
            <Radar size={32} className="mb-3 opacity-40" />
            <p className="text-[13px] font-medium" style={{ color: C.muted }}>Nenhuma execução ainda.</p>
            <p className="mt-1 text-[12px]">Clique em Run Pipeline para começar.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress-slide {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

function HistoryRun({ run }: { run: RunState }) {
  const [open, setOpen] = useState(false);
  const dur = run.finishedAt ? elapsed(run.finishedAt - run.startedAt) : null;

  return (
    <div className="border-b" style={{ borderColor: C.border }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors"
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.surface; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        {run.status === "done" && <CheckCircle2 size={13} style={{ color: C.success }} />}
        {run.status === "error" && <XCircle size={13} style={{ color: C.danger }} />}
        <span className="text-[12px] font-medium" style={{ color: C.text }}>{run.type}</span>
        <span className="text-[12px]" style={{ color: C.subtle }}>
          {new Date(run.startedAt).toLocaleString("pt-BR")}
        </span>
        {run.status === "error" && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${C.danger}15`, color: C.danger }}>
            erro
          </span>
        )}
        <div className="flex-1" />
        {dur && (
          <span className="flex items-center gap-1 text-[11px]" style={{ color: C.subtle }}>
            <Clock size={10} />
            {dur}
          </span>
        )}
        {open ? <ChevronUp size={12} style={{ color: C.subtle }} /> : <ChevronDown size={12} style={{ color: C.subtle }} />}
      </button>

      {open && (
        <div className="px-6 pb-4">
          {run.error && (
            <div
              className="mb-3 rounded-md p-3 text-[12px] font-mono"
              style={{ background: `${C.danger}10`, color: C.danger, borderLeft: `3px solid ${C.danger}` }}
            >
              {run.error}
            </div>
          )}
          <div className="ml-2">
            {run.stages.map((stage, i) => (
              <StageRow key={stage.id} stage={stage} isLast={i === run.stages.length - 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RunButton({
  onClick,
  disabled,
  primary,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-md px-3.5 py-2 text-[13px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: primary ? C.accent : C.elevated,
        color: primary ? "oklch(1.00 0 0)" : C.text,
        border: primary ? "none" : `1px solid ${C.border}`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.opacity = "1";
      }}
    >
      {icon}
      {label}
    </button>
  );
}
