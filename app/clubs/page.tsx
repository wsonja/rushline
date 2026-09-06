"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ScoreBar } from "@/components/Controls";
import { fetchAllMembers } from "@/lib/fetch-all";
import { clubEvidence, hopsLabel, type EvidenceLine } from "@/lib/evidence";
import {
  campusLabel,
  clubMatchesCampus,
  schoolToCampus,
} from "@/lib/prefs";
import { getSupabase } from "@/lib/supabase";
import { matchReason, matchSubline, scoreClubDetailed } from "@/lib/rank";
import { colorFor, monogram, relativeTime } from "@/lib/ui";
import type { Club, ClubIntel, Member, Profile, UserConnection } from "@/lib/types";

type Placement = { firm: string; source?: string };
type IntelLite = Pick<ClubIntel, "sources" | "reddit_sentiment" | "x_sentiment" | "placements"> & {
  updated_at?: string;
};

const FILTERS = ["All", "Consulting", "Finance", "Tech", "VC"] as const;

function goalLabel(g: string): string {
  return g.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function EvidenceCell({ lines }: { lines: EvidenceLine[] }) {
  return (
    <div style={{ fontSize: 12, lineHeight: 1.9, color: "var(--ink-50)" }}>
      {lines.map((l) => {
        const mark =
          l.status === "loading" ? (
            <span style={{ color: "var(--ink-30)" }}>…</span>
          ) : l.status === "ok" ? (
            <span style={{ color: "var(--success)" }}>✓{l.count ? ` ${l.count}` : ""}</span>
          ) : l.status === "partial" ? (
            <span style={{ color: "var(--warn)" }} title={l.hint}>
              ~{l.count ? ` ${l.count}` : ""}
            </span>
          ) : (
            <span style={{ color: "var(--ink-30)" }}>—</span>
          );
        return (
          <div key={l.key}>
            {l.key} {mark}
          </div>
        );
      })}
    </div>
  );
}

export default function ClubsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [intelByClub, setIntelByClub] = useState<Record<string, IntelLite>>({});
  const [redditCounts, setRedditCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [scrapeInput, setScrapeInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [view, setView] = useState<"list" | "deck">("list");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const [{ data: prof }, { data: clubRows }, connRes] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
        sb.from("clubs").select("*"),
        sb.from("user_connections").select("*").eq("user_id", userData.user.id),
      ]);
      let profileRow = prof as Profile | null;
      if (profileRow?.linkedin_url && !profileRow.linkedin_scraped_at) {
        const { data: sessionData } = await sb.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          try {
            await fetch("/api/linkedin/import", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                linkedinUrl: profileRow.linkedin_url,
                school: profileRow.school,
              }),
            });
            const { data: refreshed } = await sb
              .from("profiles")
              .select("*")
              .eq("id", userData.user.id)
              .maybeSingle();
            if (refreshed) profileRow = refreshed as Profile;
          } catch {
            /* non-blocking */
          }
        }
      }
      setProfile(profileRow);
      setClubs((clubRows as Club[]) ?? []);
      setConnections(connRes.error ? [] : ((connRes.data as UserConnection[]) ?? []));
      try {
        setMembers(await fetchAllMembers(sb));
      } catch {
        setMembers([]);
      }
      const { data: intelRows } = await sb
        .from("club_intel")
        .select("club_id,placements,sources,reddit_sentiment,x_sentiment,updated_at");
      const map: Record<string, IntelLite> = {};
      for (const row of intelRows ?? []) {
        const fromCol = (row.placements as Placement[] | null) ?? [];
        const fromSources = ((row.sources as { label: string; url: string }[] | null) ?? [])
          .filter((s) => s.label.startsWith("placement:"))
          .map((s) => ({ firm: s.label.replace(/^placement:/, ""), source: s.url }));
        const merged = [...fromCol];
        for (const p of fromSources) {
          if (!merged.some((m) => m.firm === p.firm)) merged.push(p);
        }
        map[row.club_id as string] = {
          sources: (row.sources as ClubIntel["sources"]) ?? [],
          reddit_sentiment: (row.reddit_sentiment as ClubIntel["reddit_sentiment"]) ?? {},
          x_sentiment: (row.x_sentiment as ClubIntel["x_sentiment"]) ?? {},
          placements: merged,
          updated_at: (row as { updated_at?: string }).updated_at,
        };
      }
      setIntelByClub(map);
      const { data: redditRows } = await sb.from("reddit_posts").select("club_id");
      const rc: Record<string, number> = {};
      for (const r of redditRows ?? []) {
        const id = (r as { club_id: string }).club_id;
        rc[id] = (rc[id] ?? 0) + 1;
      }
      setRedditCounts(rc);
      setLoading(false);
    })();
  }, [router]);

  const campus = schoolToCampus(profile?.school);
  const campusClubs = useMemo(
    () => clubs.filter((c) => clubMatchesCampus(c.school, campus)),
    [clubs, campus]
  );

  const ranked = useMemo(() => {
    const goal = profile?.career_goal ?? null;
    const targets = profile?.target_clubs ?? [];
    const placementsByClubId: Record<string, Placement[]> = {};
    for (const [id, intel] of Object.entries(intelByClub)) {
      if (intel.placements?.length) placementsByClubId[id] = intel.placements;
    }
    const ctx = { profile, connections, members, placementsByClubId };
    const hasLinkedIn = Boolean(profile?.linkedin_url || profile?.linkedin_scraped_at);
    return [...campusClubs]
      .map((c) => {
        const { score, breakdown } = scoreClubDetailed(c, ctx);
        const roster = members.filter((m) => m.club_id === c.id);
        const intel = intelByClub[c.id] ?? null;
        return {
          club: c,
          score,
          breakdown,
          reason: matchReason(c, goal, targets, ctx),
          subline: matchSubline(breakdown, hasLinkedIn),
          hops: hopsLabel(breakdown.d1, breakdown.d2),
          evidence: clubEvidence({
            club: c,
            intel,
            memberCount: roster.length,
            redditCount: redditCounts[c.id] ?? 0,
            loading,
          }),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [campusClubs, profile, connections, members, intelByClub, redditCounts, loading]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = { All: ranked.length };
    for (const { club } of ranked) {
      const cat = (club.category ?? "").toLowerCase();
      const key = FILTERS.find((f) => f !== "All" && f.toLowerCase() === cat);
      if (key) m[key] = (m[key] ?? 0) + 1;
    }
    return m;
  }, [ranked]);

  const filtered = ranked.filter(
    ({ club }) => filter === "All" || (club.category ?? "").toLowerCase() === filter.toLowerCase()
  );

  const lastScraped = useMemo(() => {
    const times = Object.values(intelByClub)
      .map((i) => i.updated_at)
      .filter(Boolean) as string[];
    if (!times.length) return null;
    times.sort();
    return relativeTime(times[times.length - 1]);
  }, [intelByClub]);

  async function runScrape() {
    if (!scrapeInput.trim()) return;
    setScraping(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: scrapeInput, school: profile?.school }),
      });
      const data = await res.json();
      if (data.clubId) router.push(`/clubs/${data.clubId}`);
    } finally {
      setScraping(false);
    }
  }

  const goals = [
    profile?.career_goal ? goalLabel(profile.career_goal) : null,
    ...(profile?.target_clubs ?? []).map(goalLabel),
  ].filter((g, i, a): g is string => Boolean(g) && a.indexOf(g) === i);

  const goalLine = goals.slice(0, 3).join(" · ") || "your goals";

  return (
    <AppShell
      counts={{ clubs: campusClubs.length, web: connections.length, outreach: 0 }}
      copilotScope="Reads your match list. It won't reorder scores or invent evidence."
      copilotSuggestions={["What's strongest here?", "Who's most reachable?", "What's missing?"]}
      copilotContext={`Campus: ${campusLabel(campus)}. Ranked for ${goalLine}. Top clubs: ${ranked
        .slice(0, 8)
        .map((r) => `${r.club.name} ${r.score}`)
        .join("; ")}`}
      scrape={scraping ? { done: 1, total: 6 } : null}
    >
      <main style={{ height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "32px 34px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
            <div>
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
                Your matches
              </h1>
              <div style={{ marginTop: 12, fontSize: 14, color: "var(--ink-50)" }}>
                Ranked for{" "}
                <strong style={{ color: "var(--accent)" }}>{goalLine}</strong> at{" "}
                {campusLabel(campus)}
                {lastScraped ? ` · scored ${lastScraped}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="rl-btn"
                onClick={() => setView("deck")}
                style={{
                  padding: "9px 14px",
                  borderRadius: 9,
                  fontSize: 13,
                  background: view === "deck" ? "#111" : "#fff",
                  color: view === "deck" ? "#fff" : "var(--ink)",
                  border: view === "deck" ? "none" : "1px solid var(--border-strong)",
                }}
              >
                Deck view
              </button>
              <button
                type="button"
                className="rl-btn"
                onClick={() => setView("list")}
                style={{
                  padding: "9px 14px",
                  borderRadius: 9,
                  fontSize: 13,
                  background: view === "list" ? "#111" : "#fff",
                  color: view === "list" ? "#fff" : "var(--ink)",
                  border: view === "list" ? "none" : "1px solid var(--border-strong)",
                }}
              >
                List view
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 9, marginTop: 24, alignItems: "stretch", flexWrap: "wrap" }}>
            {FILTERS.map((f) => {
              const active = filter === f;
              const n = f === "All" ? ranked.length : categoryCounts[f] ?? 0;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="rl-btn"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 600,
                    background: active ? "var(--accent)" : "#fff",
                    color: active ? "#fff" : "rgba(0,0,0,.6)",
                    border: active ? "none" : "1px solid var(--border-strong)",
                    boxShadow: "none",
                  }}
                >
                  {f} {n}
                </button>
              );
            })}
            <div
              style={{
                flex: 1,
                minWidth: 200,
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0 14px",
                borderRadius: 10,
                background: "#fff",
                border: "1px solid var(--border-strong)",
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  border: "1.5px solid rgba(0,0,0,.35)",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <input
                value={scrapeInput}
                onChange={(e) => setScrapeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runScrape()}
                placeholder="Name any club — we'll scrape it live"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 13.5,
                  background: "transparent",
                  boxShadow: "none",
                  padding: "10px 0",
                }}
              />
            </div>
            <button
              type="button"
              onClick={runScrape}
              disabled={scraping}
              className="rl-btn rl-btn-dark"
              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13.5 }}
            >
              {scraping ? "Scraping…" : "Scrape live"}
            </button>
          </div>
        </div>

        {view === "deck" ? (
          <div
            style={{
              padding: "28px 34px 40px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.slice(0, 12).map(({ club, score, hops }, i) => {
              const fills = [
                "linear-gradient(160deg,#fffefb,#f1efe6)",
                "linear-gradient(160deg,#3b33f0,#241da8)",
                "linear-gradient(160deg,#1f2c4d,#0e1526)",
                "linear-gradient(160deg,#153a2b,#0b2419)",
                "linear-gradient(160deg,#f6e6c8,#e5cf9f)",
                "linear-gradient(160deg,#4a1622,#2b0c14)",
              ];
              const fill = fills[i % fills.length];
              const light = i % fills.length === 0 || i % fills.length === 4;
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  style={{
                    textDecoration: "none",
                    color: light ? "var(--ink)" : "#fff",
                    background: fill,
                    borderRadius: 18,
                    padding: 20,
                    minHeight: 200,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow-arc)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      opacity: 0.6,
                    }}
                  >
                    {(club.category ?? "club").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, lineHeight: 1.1 }}>
                      {club.name}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                      {score} match{hops ? ` · ${hops}` : ""}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 120px 128px",
                padding: "20px 34px 10px",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.02em",
                color: "var(--ink-40)",
              }}
            >
              <span>#</span>
              <span>Club / strongest signal</span>
              <span>Evidence</span>
              <span style={{ textAlign: "right" }}>Match</span>
            </div>
            <div style={{ padding: "0 24px 30px", display: "flex", flexDirection: "column", gap: 12 }}>
              {scraping && (
                <div className="rl-ledger-row" style={{ opacity: 0.85 }}>
                  <span style={{ fontSize: 14, color: "var(--ink-35)", paddingTop: 4 }}>—</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{scrapeInput || "New club"}</div>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="rl-crawl-track">
                        <div className="rl-crawl-fill" />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--ink-40)" }}>Scraping live…</span>
                    </div>
                  </div>
                  <EvidenceCell
                    lines={[
                      { key: "site", status: "loading" },
                      { key: "roster", status: "loading" },
                      { key: "reddit", status: "loading" },
                      { key: "chatter", status: "loading" },
                    ]}
                  />
                  <div style={{ textAlign: "right", color: "var(--ink-40)", fontSize: 12 }}>
                    score pending
                  </div>
                </div>
              )}
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rl-ledger-row" style={{ minHeight: 120 }}>
                    <span style={{ color: "var(--ink-30)" }}>0{i + 1}</span>
                    <div style={{ color: "var(--ink-40)", fontSize: 14 }}>Loading clubs…</div>
                    <EvidenceCell
                      lines={[
                        { key: "site", status: "loading" },
                        { key: "roster", status: "loading" },
                        { key: "reddit", status: "loading" },
                        { key: "chatter", status: "loading" },
                      ]}
                    />
                    <div className="rl-bar" style={{ marginTop: 28 }} />
                  </div>
                ))}
              {!loading &&
                filtered.map(({ club, score, reason, hops, evidence }, i) => (
                  <Link
                    key={club.id}
                    href={`/clubs/${club.id}`}
                    className="rl-ledger-row"
                    onMouseEnter={() => setHovered(club.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span style={{ fontSize: 14, color: "var(--ink-35)", paddingTop: 4 }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: colorFor(club.name),
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12.5,
                            fontWeight: 700,
                          }}
                        >
                          {monogram(club.name).slice(0, 2)}
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em" }}>
                          {club.name}
                        </span>
                        {club.category && <span className="rl-chip">{club.category}</span>}
                        {hops && <span className="rl-chip rl-chip-accent">{hops}</span>}
                      </div>
                      {(club.tagline || reason) && (
                        <p
                          style={{
                            margin: "11px 0 0",
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: "var(--ink-55)",
                            maxWidth: "62ch",
                          }}
                        >
                          {club.tagline || reason}
                        </p>
                      )}
                      <div
                        style={{
                          marginTop: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 13,
                          color: "var(--accent)",
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--accent)",
                          }}
                        />
                        {reason}
                      </div>
                    </div>
                    <EvidenceCell lines={evidence} />
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 9 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: 36,
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {score}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--ink-40)" }}>/100</span>
                      </div>
                      <ScoreBar value={score} />
                      <span
                        className="rl-btn"
                        style={{
                          marginTop: 2,
                          padding: "9px 14px",
                          borderRadius: 9,
                          fontSize: 12.5,
                          background: i === 0 || hovered === club.id ? "var(--accent)" : "#fff",
                          color: i === 0 || hovered === club.id ? "#fff" : "var(--ink)",
                          border:
                            i === 0 || hovered === club.id ? "none" : "1px solid rgba(0,0,0,.14)",
                          boxShadow: i === 0 ? "var(--shadow-accent)" : "none",
                        }}
                      >
                        View intel →
                      </span>
                    </div>
                  </Link>
                ))}
              {!loading && filtered.length === 0 && (
                <div className="rl-gap">
                  <strong style={{ display: "block", color: "var(--ink)", marginBottom: 6 }}>
                    An honest gap
                  </strong>
                  No clubs in this filter yet. Name one above and we&apos;ll scrape it live — we
                  won&apos;t invent a ranked list.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
