"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string; extras?: string[] };

export function CopilotRail({
  open,
  onOpen,
  onClose,
  scopeNote = "Reads only what's on this page. It won't rewrite the review or reorder your matches.",
  suggestions = ["Compare to CDS", "Who's most reachable?", "What's missing here?"],
  pageContext,
  scrape,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  scopeNote?: string;
  suggestions?: string[];
  pageContext?: string;
  scrape?: { done: number; total: number } | null;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, pageContext }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.text ?? "I can only speak to what's on this page.",
          extras: data.extras,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Couldn't reach the copilot. Try again in a moment." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <aside
        className="rl-rail"
        style={{
          width: 56,
          borderRight: "none",
          borderLeft: "1px solid var(--divider)",
          alignItems: "center",
          padding: "22px 0",
          gap: 14,
        }}
      >
        <button
          type="button"
          onClick={onOpen}
          aria-label="Ask rushline"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            border: "1px solid rgba(59,51,240,.4)",
            color: "var(--accent)",
            background: "transparent",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ?
        </button>
        <div
          style={{
            writingMode: "vertical-rl",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--ink-45)",
          }}
        >
          Ask rushline · optional
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="rl-rail"
      style={{
        width: 340,
        borderRight: "none",
        borderLeft: "1px solid var(--divider)",
      }}
    >
      <div
        style={{
          padding: "20px 22px",
          borderBottom: "1px solid var(--divider)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "var(--accent-tint)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            ?
          </div>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Ask rushline</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12.5,
            color: "var(--ink-40)",
          }}
        >
          Dismiss
        </button>
      </div>
      <div style={{ padding: "20px 22px", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-50)" }}>
        {scopeNote}
      </div>
      <div style={{ padding: "0 22px", display: "flex", flexDirection: "column", gap: 12, flex: 1, overflowY: "auto" }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 13.5, color: "var(--ink-45)", lineHeight: 1.55 }}>
            Optional, and it stays in the margin. Ask about this page — not the whole internet.
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 13,
                padding: "15px 16px",
              }}
            >
              <div style={{ fontSize: 12.5, color: "var(--ink-42)", marginBottom: 7 }}>You asked</div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} style={{ background: "var(--accent-tint)", borderRadius: 13, padding: "15px 16px" }}>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#1a1a1a" }}>{m.text}</div>
              {m.extras?.map((e) => (
                <div
                  key={e}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    padding: "12px 13px",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    marginTop: 8,
                  }}
                >
                  {e}
                </div>
              ))}
            </div>
          )
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rl-btn rl-btn-ghost"
              style={{ padding: "8px 12px", borderRadius: 9, fontSize: 12.5, boxShadow: "none" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "auto", padding: "18px 22px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#fff",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: "8px 8px 8px 15px",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this club…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13.5,
              background: "transparent",
              boxShadow: "none",
            }}
          />
          <button
            type="submit"
            disabled={busy}
            aria-label="Send"
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ↑
          </button>
        </form>
        {scrape && scrape.total > 0 && scrape.done < scrape.total && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <div className="rl-crawl-track">
              <div className="rl-crawl-fill" />
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ink-40)" }}>
              Re-scraping {scrape.done} of {scrape.total}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
