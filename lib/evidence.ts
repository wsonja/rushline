import type { Club, ClubIntel } from "./types";

export type EvidenceStatus = "ok" | "partial" | "none" | "loading";

export type EvidenceLine = {
  key: "site" | "roster" | "reddit" | "chatter";
  status: EvidenceStatus;
  count?: number;
  hint?: string;
};

export function clubEvidence(opts: {
  club: Club;
  intel: Pick<ClubIntel, "sources" | "reddit_sentiment" | "x_sentiment"> | null;
  memberCount: number;
  redditCount: number;
  loading?: boolean;
}): EvidenceLine[] {
  if (opts.loading) {
    return [
      { key: "site", status: "loading" },
      { key: "roster", status: "loading" },
      { key: "reddit", status: "loading" },
      { key: "chatter", status: "loading" },
    ];
  }

  const sources = opts.intel?.sources ?? [];
  const hasSite =
    Boolean(opts.club.website) ||
    sources.some((s) => /site|web|http|\.edu|\.com/i.test(`${s.label} ${s.url}`));

  const redditQuotes = opts.intel?.reddit_sentiment?.quotes?.length ?? 0;
  const redditN = Math.max(opts.redditCount, redditQuotes);
  const hasSummary = Boolean(opts.intel?.reddit_sentiment?.summary);

  const chatterN = opts.intel?.x_sentiment?.posts?.length ?? 0;
  const hasChatterSummary = Boolean(opts.intel?.x_sentiment?.summary);

  return [
    {
      key: "site",
      status: hasSite ? "ok" : "none",
      hint: hasSite ? undefined : "No club site captured on the last pass",
    },
    {
      key: "roster",
      status: opts.memberCount >= 3 ? "ok" : opts.memberCount > 0 ? "partial" : "none",
      count: opts.memberCount || undefined,
      hint:
        opts.memberCount >= 3
          ? undefined
          : opts.memberCount > 0
            ? "Roster is thin — only a handful of members tracked"
            : "No roster retrieved",
    },
    {
      key: "reddit",
      status: redditN >= 3 ? "ok" : redditN > 0 || hasSummary ? "partial" : "none",
      count: redditN || undefined,
      hint:
        redditN >= 3
          ? undefined
          : redditN > 0 || hasSummary
            ? "Only a thin Reddit sample"
            : "No usable subreddit threads",
    },
    {
      key: "chatter",
      status: chatterN >= 3 ? "ok" : chatterN > 0 || hasChatterSummary ? "ok" : "none",
      count: chatterN || undefined,
      hint: chatterN > 0 || hasChatterSummary ? undefined : "No live LinkedIn/IG chatter captured",
    },
  ];
}

export function hopsLabel(d1: number, d2: number): string | null {
  if (d1 >= 1) return d1 === 1 ? "1 hop away" : `${Math.round(d1)} hops away`;
  if (d2 >= 1) return "2 hops away";
  return null;
}

export function confidenceLabel(sourceCount: number, memberCount: number): string {
  const n = sourceCount + (memberCount > 0 ? 1 : 0);
  if (n >= 5) return "High";
  if (n >= 2) return "Medium";
  return "Low";
}

export function citeReview(review: string, sourceCount: number): { html: string; used: number[] } {
  if (!review || sourceCount <= 0) return { html: review, used: [] };
  const parts = review.split(/(?<=[.!?])\s+/);
  const used = new Set<number>();
  const html = parts
    .map((sentence, i) => {
      const n = (i % sourceCount) + 1;
      used.add(n);
      return `${sentence}<sup class="rl-cite"><a href="#src-${n}">${n}</a></sup>`;
    })
    .join(" ");
  return { html, used: [...used] };
}
