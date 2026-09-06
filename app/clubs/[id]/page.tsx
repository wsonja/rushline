"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ScoreBar } from "@/components/Controls";
import CoffeeChatDrawer from "@/components/CoffeeChatDrawer";
import { citeReview, confidenceLabel } from "@/lib/evidence";
import { getSupabase } from "@/lib/supabase";
import { scoreClubDetailed } from "@/lib/rank";
import { rankPeopleToMeet, sortMembersForMeet } from "@/lib/people-to-meet";
import {
  colorFor,
  initials,
  monogram,
  relativeTime,
  softenHeadcountPhrases,
} from "@/lib/ui";
import type {
  Club,
  ClubIntel,
  Member,
  Profile,
  RedditPost,
  UserConnection,
} from "@/lib/types";

function linkedinConnect(m: Member, club: Club) {
  if (m.linkedin_url) return m.linkedin_url;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
    `${m.name} ${club.name}`
  )}`;
}
function instagramLink(m: Member) {
  if (!m.instagram) return null;
  return `https://www.instagram.com/${m.instagram.replace(/^@/, "")}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function Card({
  id,
  children,
  style,
}: {
  id?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div id={id} className="rl-card" style={{ padding: 28, borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}

const JUMP = [
  { id: "review", label: "The review" },
  { id: "sentiment", label: "Sentiment" },
  { id: "placements", label: "Placements" },
  { id: "roster", label: "Roster" },
  { id: "path", label: "Your path in" },
];

export default function ClubDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [club, setClub] = useState<Club | null>(null);
  const [intel, setIntel] = useState<ClubIntel | null>(null);
  const [intelUpdated, setIntelUpdated] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [reddit, setReddit] = useState<RedditPost[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [active, setActive] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracked, setTracked] = useState(false);
  const [activeJump, setActiveJump] = useState("review");
  const [hoverSrc, setHoverSrc] = useState<number | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const [{ data: c }, { data: it }, { data: mem }, { data: rp }] = await Promise.all([
        sb.from("clubs").select("*").eq("id", id).maybeSingle(),
        sb.from("club_intel").select("*").eq("club_id", id).maybeSingle(),
        sb.from("members").select("*").eq("club_id", id),
        sb.from("reddit_posts").select("*").eq("club_id", id),
      ]);
      setClub(c as Club | null);
      setIntel(it as ClubIntel | null);
      setIntelUpdated((it as { updated_at?: string } | null)?.updated_at ?? null);
      setMembers((mem as Member[]) ?? []);
      setReddit((rp as RedditPost[]) ?? []);
      const { data: userData } = await sb.auth.getUser();
      if (userData.user) {
        const [{ data: prof }, connRes] = await Promise.all([
          sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
          sb.from("user_connections").select("*").eq("user_id", userData.user.id),
        ]);
        setProfile(prof as Profile | null);
        setConnections(connRes.error ? [] : ((connRes.data as UserConnection[]) ?? []));
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    setTracked(localStorage.getItem(`rushline.track.${id}`) === "1");
  }, [id]);

  const peopleToMeet = rankPeopleToMeet(members, connections, profile);
  const rosterSorted = sortMembersForMeet(members, connections, profile);
  const match = club
    ? scoreClubDetailed(club, {
        profile,
        connections,
        members,
        placementsByClubId: intel?.placements?.length
          ? { [club.id]: intel.placements }
          : undefined,
      }).score
    : 0;

  const sources = intel?.sources ?? [];
  const cited = useMemo(() => {
    if (!intel?.review) return null;
    const text = escapeHtml(softenHeadcountPhrases(intel.review));
    if (!sources.length) return { html: text, used: [] as number[] };
    return citeReview(text, sources.length);
  }, [intel?.review, sources.length]);

  const deadlineHint = useMemo(() => {
    const blob = [
      intel?.x_sentiment?.summary,
      ...(intel?.x_sentiment?.posts ?? []).map((p) => p.text),
    ]
      .filter(Boolean)
      .join(" ");
    const m = blob.match(
      /(close|closes|deadline|due|applications?)[^\n.]{0,40}(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}|\b\d{1,2}\/\d{1,2})/i
    );
    return m ? m[0] : null;
  }, [intel]);

  const path = useMemo(() => {
    const you = {
      name: profile?.full_name || "You",
      role: "You",
      initials: initials(profile?.full_name || "You"),
    };
    const connected = members.filter((m) => {
      const slug = (m.linkedin_url || "").toLowerCase();
      return connections.some(
        (c) => slug.includes(c.connected_linkedin_slug.toLowerCase()) && c.degree === 1
      );
    });
    const hop = connected[0] ?? peopleToMeet[0] ?? members.find((m) => !m.is_alumni) ?? members[0];
    if (!hop) return { you, hops: [] as Member[], label: null as string | null };
    const hops = connected[0] ? [connected[0]] : peopleToMeet.slice(0, 2);
    const unique = hops.filter((h, i, a) => a.findIndex((x) => x.id === h.id) === i).slice(0, 2);
    return {
      you,
      hops: unique,
      label: connected[0] ? "1 hop · first-degree" : unique.length ? `${unique.length} hop${unique.length > 1 ? "s" : ""} · strongest route we can show` : null,
    };
  }, [profile, members, connections, peopleToMeet]);

  const pageContext = club
    ? [
        `Club: ${club.name}`,
        `Match: ${match}`,
        club.tagline,
        intel?.review,
        `Sources: ${sources.map((s, i) => `${i + 1}. ${s.label}`).join("; ")}`,
        intel?.reddit_sentiment?.summary
          ? `Reddit: ${intel.reddit_sentiment.summary}`
          : "Reddit: no data",
        intel?.x_sentiment?.summary ? `Chatter: ${intel.x_sentiment.summary}` : "",
        `Roster: ${members.slice(0, 12).map((m) => `${m.name} (${m.role})`).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n")
    : undefined;

  const jumpNav = (
    <>
      <div className="rl-eyebrow" style={{ marginBottom: 11 }}>
        On this page
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "rgba(0,0,0,.55)" }}>
        {JUMP.map((j) => (
          <a
            key={j.id}
            href={`#${j.id}`}
            onClick={() => setActiveJump(j.id)}
            style={{
              color: activeJump === j.id ? "var(--accent)" : "inherit",
              fontWeight: activeJump === j.id ? 600 : 400,
              textDecoration: "none",
            }}
          >
            {j.label}
          </a>
        ))}
      </div>
    </>
  );

  const shell = (content: React.ReactNode) => (
    <div style={{ position: "relative" }}>
      <AppShell
        pageNav={jumpNav}
        copilotDefaultOpen
        copilotContext={pageContext}
        copilotSuggestions={["Compare to CDS", "Who's most reachable?", "What's missing here?"]}
        scrape={null}
      >
        <main
          style={{
            height: "100vh",
            overflowY: "auto",
            filter: active ? "blur(2px) brightness(0.9)" : "none",
            pointerEvents: active ? "none" : "auto",
          }}
        >
          {content}
        </main>
      </AppShell>
      {active && club && (
        <CoffeeChatDrawer
          member={active}
          club={club}
          profile={profile}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );

  if (loading) return shell(<div style={{ padding: 34, color: "var(--ink-50)" }}>Loading intel…</div>);
  if (!club)
    return shell(
      <div style={{ padding: 34 }}>
        Club not found. <Link href="/clubs">Back to clubs</Link>
      </div>
    );

  const redditEmpty = reddit.length === 0 && !intel?.reddit_sentiment?.summary;
  const chatterQuote = intel?.x_sentiment?.posts?.[0];
  const placements = intel?.placements ?? [];

  return shell(
    <div style={{ padding: "20px 34px 34px" }}>
      <div style={{ fontSize: 13.5, color: "var(--ink-50)", marginBottom: 16 }}>
        <Link href="/clubs" style={{ color: "inherit", textDecoration: "none" }}>
          ← All clubs
        </Link>
        {club.category ? ` / ${club.category} / ${club.name}` : ` / ${club.name}`}
      </div>

      <Card>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "var(--navy)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              fontWeight: 700,
              flex: "none",
            }}
          >
            {monogram(club.name).slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-serif)",
                  fontWeight: 400,
                  fontSize: 42,
                  lineHeight: 1,
                  letterSpacing: "-0.025em",
                }}
              >
                {club.name}
              </h1>
              <span
                className="rl-chip rl-chip-accent"
                style={{ padding: "6px 12px", borderRadius: 9, fontSize: 14, fontWeight: 700 }}
              >
                {match} match
              </span>
            </div>
            {club.tagline && (
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: "var(--ink-70)",
                  maxWidth: "70ch",
                }}
              >
                {club.tagline}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 24 }}>
          {[
            { label: "Category", val: club.category ?? "—", warn: false },
            { label: "Roster", val: `${members.length} tracked`, warn: false },
            { label: "Sources", val: `${sources.length} scraped`, warn: false },
            {
              label: "Deadline",
              val: deadlineHint ?? "Unknown",
              warn: Boolean(deadlineHint),
            },
            {
              label: "Confidence",
              val: confidenceLabel(sources.length, members.length),
              warn: false,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.warn ? "rgba(179,118,42,.09)" : "var(--bg-sunken)",
                borderRadius: 11,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 11.5, color: "var(--ink-45)" }}>{s.label}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 6,
                  color: s.warn ? "var(--warn-text)" : undefined,
                  textTransform: s.label === "Category" ? "capitalize" : undefined,
                }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          {peopleToMeet[0] && (
            <button
              type="button"
              onClick={() => setActive(peopleToMeet[0])}
              className="rl-btn rl-btn-accent"
              style={{ padding: "14px 24px", borderRadius: 11, fontSize: 14.5 }}
            >
              Draft coffee chat
            </button>
          )}
          {club.website && (
            <a
              href={club.website}
              target="_blank"
              rel="noreferrer"
              className="rl-btn rl-btn-ghost"
              style={{ padding: "14px 24px", borderRadius: 11, fontSize: 14.5 }}
            >
              Website ↗
            </a>
          )}
          <button
            type="button"
            className="rl-btn rl-btn-ghost"
            style={{ padding: "14px 24px", borderRadius: 11, fontSize: 14.5 }}
            onClick={() => {
              const next = !tracked;
              setTracked(next);
              localStorage.setItem(`rushline.track.${id}`, next ? "1" : "0");
            }}
          >
            {tracked ? "Deadline tracked" : "Track deadline"}
          </button>
        </div>
      </Card>

      <Card id="review" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div className="rl-eyebrow">The review</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-40)" }}>
            Assembled from {sources.length || "the"} document{sources.length === 1 ? "" : "s"}
            {intelUpdated ? ` · ${relativeTime(intelUpdated)}` : ""}
          </div>
        </div>
        {cited ? (
          <p
            onMouseOver={(e) => {
              const a = (e.target as HTMLElement).closest("a[href^='#src-']");
              if (!a) return;
              const n = Number((a as HTMLAnchorElement).hash.replace("#src-", ""));
              setHoverSrc(n);
            }}
            onMouseOut={() => setHoverSrc(null)}
            style={{
              margin: "18px 0 0",
              fontFamily: "var(--font-serif)",
              fontSize: 19,
              lineHeight: 1.65,
              color: "#1a1a1a",
              maxWidth: "78ch",
              textWrap: "pretty",
            }}
            dangerouslySetInnerHTML={{ __html: cited.html }}
          />
        ) : (
          <div className="rl-gap">
            <strong style={{ display: "block", color: "var(--ink)", marginBottom: 6 }}>
              An honest gap
            </strong>
            No cited review is on file for this club yet. We don&apos;t generate a blurb to fill the
            space.
          </div>
        )}
        {sources.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 22 }}>
            {sources.map((s, i) => (
              <a
                key={i}
                id={`src-${i + 1}`}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className={hoverSrc === i + 1 ? "source-hit" : undefined}
                style={{
                  display: "flex",
                  gap: 9,
                  fontSize: 12.5,
                  color: "var(--ink-55)",
                  textDecoration: "none",
                  padding: "4px 6px",
                  margin: "0 -6px",
                }}
              >
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{i + 1}</span>
                {s.label}
              </a>
            ))}
          </div>
        )}
      </Card>

      <div id="sentiment" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card>
          <div className="rl-eyebrow">Reddit sentiment</div>
          {redditEmpty ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                <ScoreBar value={34} warn />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--warn-text)" }}>No data</span>
              </div>
              <div className="rl-gap">
                <strong style={{ display: "block", color: "var(--ink)", marginBottom: 6 }}>
                  An honest gap
                </strong>
                This pass retrieved no usable subreddit threads
                {intelUpdated ? ` (${relativeTime(intelUpdated)})` : ""}. An older note is superseded
                by this gap rather than backfilled — we don&apos;t invent sentiment.
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                <ScoreBar
                  value={
                    intel?.reddit_sentiment?.vibe === "positive"
                      ? 74
                      : intel?.reddit_sentiment?.vibe === "negative"
                        ? 32
                        : 50
                  }
                  warn={intel?.reddit_sentiment?.vibe !== "positive"}
                />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {intel?.reddit_sentiment?.vibe === "positive"
                    ? "Mostly positive"
                    : intel?.reddit_sentiment?.vibe === "negative"
                      ? "Mostly negative"
                      : "Mixed"}
                </span>
              </div>
              {intel?.reddit_sentiment?.summary && (
                <p style={{ margin: "14px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-70)" }}>
                  {intel.reddit_sentiment.summary}
                </p>
              )}
            </>
          )}
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span className="rl-eyebrow">Live chatter</span>
            <span className="rl-chip">Proxied · LinkedIn + IG</span>
          </div>
          {intel?.x_sentiment?.summary || chatterQuote ? (
            <>
              {intel?.x_sentiment?.summary && (
                <p style={{ margin: "16px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-70)" }}>
                  {intel.x_sentiment.summary}
                </p>
              )}
              {chatterQuote && (
                <>
                  <div
                    style={{
                      marginTop: 16,
                      borderLeft: "3px solid var(--accent)",
                      padding: "8px 0 8px 14px",
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      fontSize: 15,
                      lineHeight: 1.55,
                    }}
                  >
                    “{chatterQuote.text}”
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--ink-40)" }}>
                    {chatterQuote.handle ?? "Live source"}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="rl-gap">
              <strong style={{ display: "block", color: "var(--ink)", marginBottom: 6 }}>
                An honest gap
              </strong>
              No live chatter was retrieved for this club. We leave the panel empty rather than
              quoting a press blurb.
            </div>
          )}
        </Card>
      </div>

      {placements.length > 0 && (
        <Card id="placements" style={{ marginTop: 16 }}>
          <div className="rl-eyebrow">Placements</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {placements.map((p) => (
              <span key={p.firm} className="rl-chip" style={{ fontSize: 13, padding: "6px 10px" }}>
                {p.firm}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div
        id="path"
        style={{
          background: "var(--navy)",
          borderRadius: 16,
          padding: "26px 28px",
          margin: "16px 0 0",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span className="rl-eyebrow" style={{ color: "rgba(255,255,255,.55)" }}>
            Your path in
          </span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.5)" }}>
            {path.label ?? "No route on file"}
          </span>
        </div>
        {path.hops.length === 0 ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "rgba(255,255,255,.7)",
            }}
          >
            We don&apos;t have a first- or second-degree path into this roster yet. Draft a coffee
            chat with a listed member, or import LinkedIn connections on your profile.
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {path.you.initials}
              </div>
              <span style={{ fontSize: 13.5 }}>You</span>
            </div>
            {path.hops.map((h) => (
              <div key={h.id} style={{ display: "contents" }}>
                <div style={{ flex: 1, minWidth: 24, height: 1, background: "rgba(255,255,255,.25)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,.14)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {initials(h.name)}
                  </div>
                  <span style={{ fontSize: 13.5 }}>
                    {h.name}
                    <br />
                    <span style={{ color: "rgba(255,255,255,.5)", fontSize: 12 }}>{h.role}</span>
                  </span>
                </div>
              </div>
            ))}
            {path.hops[0] && (
              <button
                type="button"
                onClick={() => setActive(path.hops[path.hops.length - 1])}
                style={{
                  marginLeft: "auto",
                  padding: "12px 20px",
                  borderRadius: 11,
                  background: "#fff",
                  color: "var(--navy)",
                  fontSize: 13.5,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Draft intro
              </button>
            )}
          </div>
        )}
      </div>

      {peopleToMeet.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div className="rl-eyebrow">People you should meet</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(peopleToMeet.length, 3)}, 1fr)`,
              gap: 14,
              marginTop: 16,
            }}
          >
            {peopleToMeet.map((m) => (
              <div
                key={m.id}
                style={{
                  background: "var(--bg-sunken)",
                  borderRadius: 14,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: colorFor(m.name),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {initials(m.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-45)" }}>{m.role}</div>
                  </div>
                </div>
                {m.relevance && (
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-55)", fontStyle: "italic" }}>
                    “{m.relevance}”
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setActive(m)}
                  className="rl-btn rl-btn-accent"
                  style={{ padding: 8, borderRadius: 8, fontSize: 12 }}
                >
                  Coffee chat →
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {rosterSorted.length > 0 && (
        <Card id="roster" style={{ marginTop: 16 }}>
          <div className="rl-eyebrow">Roster</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {rosterSorted.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--bg-sunken)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: colorFor(m.name),
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials(m.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-45)" }}>
                    {m.role}
                    {m.is_alumni ? " · alum" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <a href={linkedinConnect(m, club)} target="_blank" rel="noreferrer" style={{ fontSize: 9, fontWeight: 600, textDecoration: "none" }}>
                      in
                    </a>
                    {instagramLink(m) && (
                      <a href={instagramLink(m)!} target="_blank" rel="noreferrer" style={{ fontSize: 9, fontWeight: 600, textDecoration: "none" }}>
                        ig
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
