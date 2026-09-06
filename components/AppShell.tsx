"use client";

import Sidebar from "@/components/Sidebar";
import { CopilotRail } from "@/components/CopilotRail";
import { useCopilotOpen } from "@/lib/prefs";

export function AppShell({
  children,
  pageNav,
  counts,
  copilotDefaultOpen = false,
  copilotScope,
  copilotSuggestions,
  copilotContext,
  scrape,
}: {
  children: React.ReactNode;
  pageNav?: React.ReactNode;
  counts?: { clubs?: number; web?: number; outreach?: number };
  copilotDefaultOpen?: boolean;
  copilotScope?: string;
  copilotSuggestions?: string[];
  copilotContext?: string;
  scrape?: { done: number; total: number } | null;
}) {
  const { open, setOpen } = useCopilotOpen(copilotDefaultOpen);

  return (
    <div
      className="rl-shell"
      style={{
        gridTemplateColumns: open ? "240px 1fr 340px" : "240px 1fr 56px",
      }}
    >
      <Sidebar pageNav={pageNav} counts={counts} />
      <div style={{ minWidth: 0, minHeight: "100vh", borderRight: "1px solid var(--divider)" }}>
        {children}
      </div>
      <CopilotRail
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        scopeNote={copilotScope}
        suggestions={copilotSuggestions}
        pageContext={copilotContext}
        scrape={scrape}
      />
    </div>
  );
}
