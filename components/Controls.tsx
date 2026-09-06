"use client";

import type { Campus } from "@/lib/prefs";

export function CampusToggle({
  campus,
  onChange,
  compact,
}: {
  campus: Campus;
  onChange: (c: Campus) => void;
  compact?: boolean;
}) {
  return (
    <div className="rl-seg" style={compact ? { borderRadius: 10 } : undefined}>
      <button
        type="button"
        data-active={campus === "berkeley"}
        onClick={() => onChange("berkeley")}
      >
        Berkeley
      </button>
      <button
        type="button"
        data-active={campus === "cornell"}
        onClick={() => onChange("cornell")}
      >
        Cornell
      </button>
    </div>
  );
}

export function ReduceMotionToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        borderRadius: 999,
        border: "1px solid var(--border-strong)",
        background: "#fff",
        cursor: "pointer",
        color: "var(--ink-50)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 26,
          height: 15,
          borderRadius: 999,
          background: on ? "var(--accent)" : "rgba(0,0,0,.14)",
          display: "flex",
          alignItems: "center",
          padding: 2,
          justifyContent: on ? "flex-end" : "flex-start",
        }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,.2)",
          }}
        />
      </span>
      <span style={{ fontSize: 12 }}>Reduce motion</span>
    </button>
  );
}

export function ScoreBar({
  value,
  warn,
}: {
  value: number;
  warn?: boolean;
}) {
  const w = Math.max(0, Math.min(100, value));
  return (
    <div className="rl-bar">
      <div
        className="rl-bar-fill"
        style={{
          ["--w" as string]: `${w}%`,
          background: warn ? "var(--warn)" : "var(--success)",
        }}
      />
    </div>
  );
}
