export const C = {
  bg:          "oklch(1.00 0.000 0)",
  surface:     "oklch(0.97 0.002 270)",
  elevated:    "oklch(0.94 0.003 270)",
  overlay:     "oklch(0.91 0.004 270)",
  border:      "oklch(0.88 0.004 270)",
  borderMuted: "oklch(0.91 0.003 270)",
  text:        "oklch(0.15 0.010 270)",
  muted:       "oklch(0.45 0.010 270)",
  subtle:      "oklch(0.62 0.008 270)",
  accent:      "oklch(0.50 0.18 270)",
  accentBg:    "oklch(0.50 0.18 270 / 0.10)",
  success:     "oklch(0.45 0.18 145)",
  danger:      "oklch(0.52 0.20 25)",
  warn:        "oklch(0.55 0.18 85)",
  statusNew:        "oklch(0.48 0.20 270)",
  statusFav:        "oklch(0.55 0.18 85)",
  statusApplied:    "oklch(0.45 0.18 145)",
  statusIrrelevant: "oklch(0.55 0.006 270)",
  statusDeleted:    "oklch(0.52 0.20 25)",
  scoreHigh: "oklch(0.45 0.18 145)",
  scoreMid:  "oklch(0.55 0.18 85)",
  scoreLow:  "oklch(0.52 0.20 25)",
} as const;

export function scoreColor(score: number): string {
  return score >= 0.7 ? C.scoreHigh : score >= 0.5 ? C.scoreMid : C.scoreLow;
}

const STATUS_COLORS: Record<string, string> = {
  new:        C.statusNew,
  favorite:   C.statusFav,
  applied:    C.statusApplied,
  dismissed:  C.statusIrrelevant,
  irrelevant: C.statusIrrelevant,
  deleted:    C.statusDeleted,
};

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? C.muted;
}
