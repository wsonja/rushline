"use client";

import { AppShell } from "@/components/AppShell";

export default function OutreachPage() {
  return (
    <AppShell
      counts={{ outreach: 0 }}
      copilotScope="Outreach is empty, so there's nothing on this page to read yet."
    >
      <main style={{ padding: "32px 34px" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: 46,
            lineHeight: 1,
            letterSpacing: "-0.022em",
          }}
        >
          Outreach
        </h1>
        <div className="rl-gap" style={{ marginTop: 28, maxWidth: 560 }}>
          <strong style={{ display: "block", color: "var(--ink)", marginBottom: 6 }}>
            An honest gap
          </strong>
          You haven&apos;t sent a coffee-chat from rushline yet. Open a club, pick someone on the
          path in, and draft the first note — we don&apos;t pad this list with suggested spam.
        </div>
      </main>
    </AppShell>
  );
}
