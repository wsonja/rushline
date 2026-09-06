"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClubArc, SAMPLE_ARC } from "@/components/ClubArc";
import { CampusToggle, ReduceMotionToggle } from "@/components/Controls";
import { Wordmark } from "@/components/Wordmark";
import {
  campusLabel,
  clubMatchesCampus,
  useCampus,
  useReduceMotion,
} from "@/lib/prefs";
import { getSupabase } from "@/lib/supabase";

export default function Home() {
  const { campus, setCampus } = useCampus();
  const { reduceMotion, setReduceMotion } = useReduceMotion();
  const [clubCount, setClubCount] = useState<number | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      try {
        const { data } = await sb.from("clubs").select("school");
        const rows = (data ?? []) as { school: string }[];
        setClubCount(rows.filter((c) => clubMatchesCampus(c.school, campus)).length);
      } catch {
        setClubCount(null);
      }
    })();
  }, [campus]);

  const campusName = campusLabel(campus);
  const n = clubCount ?? 119;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-page)", color: "var(--ink)", overflowX: "hidden" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 34px",
        }}
      >
        <Wordmark />
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <a href="#how" style={{ fontSize: 13.5, color: "var(--ink-55)", textDecoration: "none" }}>
            How it works
          </a>
          <Link href="/clubs" style={{ fontSize: 13.5, color: "var(--ink-55)", textDecoration: "none" }}>
            Clubs
          </Link>
          <ReduceMotionToggle on={reduceMotion} onChange={setReduceMotion} />
          <CampusToggle campus={campus} onChange={setCampus} />
        </div>
      </header>

      <div style={{ padding: "52px 34px 0", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 16px",
            borderRadius: 999,
            background: "var(--accent-tint)",
            color: "var(--accent)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span
            className="rl-pulse"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: "rl-pulse 2.2s ease-in-out infinite",
            }}
          />
          {campusName} · {n} clubs · scraped from primary sources
        </div>
        <h1
          style={{
            margin: "26px auto 0",
            maxWidth: "19ch",
            fontFamily: "var(--font-serif)",
            fontWeight: 400,
            fontSize: "clamp(42px, 7vw, 78px)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          Recruit with an <em style={{ color: "var(--accent)", fontStyle: "italic" }}>insider&apos;s edge</em>.
        </h1>
        <p
          style={{
            margin: "22px auto 0",
            maxWidth: "60ch",
            fontSize: 17,
            lineHeight: 1.6,
            color: "var(--ink-55)",
            textWrap: "pretty",
          }}
        >
          Club recruiting is won on information asymmetry. rushline reads the primary sources — club
          sites, rosters, Reddit, live chatter — and hands you the ground truth behind every
          self-reported blurb.
        </p>
      </div>

      <ClubArc
        cards={SAMPLE_ARC}
        reduceMotion={reduceMotion}
        cta={
          <>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/login"
                className="rl-btn rl-btn-accent"
                style={{ padding: "15px 30px", borderRadius: 12, fontSize: 15 }}
              >
                Get started
              </Link>
              <Link
                href="/clubs"
                className="rl-btn rl-btn-ghost"
                style={{ padding: "15px 30px", borderRadius: 12, fontSize: 15 }}
              >
                Browse {campusName} clubs
              </Link>
            </div>
            <div style={{ marginTop: 16, fontSize: 12.5, color: "var(--ink-42)" }}>
              Scroll and the deck deals itself — your ranked matches, in order.
            </div>
          </>
        }
      />

      <div
        id="how"
        className="rl-features"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          padding: "8px 34px 40px",
        }}
      >
        <div className="rl-card" style={{ padding: "22px 24px", borderRadius: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Real intel, not blurbs
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-55)" }}>
            Clients, retreats, interview format and sentiment — every claim footnoted to the
            document it came from.
          </p>
          <div style={{ marginTop: 14, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="rl-chip">6 sources</span>
            <span className="rl-chip">cited</span>
          </div>
        </div>
        <div className="rl-card" style={{ padding: "22px 24px", borderRadius: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            People you should meet
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-55)" }}>
            A roster of members and alumni ranked to your goals, with a first message already
            drafted.
          </p>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex" }}>
              {[
                ["AK", "#132441"],
                ["LH", "#3b33f0"],
                ["LL", "#7a3a12"],
              ].map(([t, bg], i) => (
                <div
                  key={t}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: bg,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #fff",
                    marginLeft: i ? -8 : 0,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ink-45)", marginLeft: 10 }}>
              7 warm intros
            </span>
          </div>
        </div>
        <div
          style={{
            background: "var(--navy)",
            borderRadius: 14,
            padding: "22px 24px",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Your social web
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,.62)" }}>
            An interactive graph of who you know and the shortest path into any target club.
          </p>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--accent)" }} />
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.3)" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,.6)" }} />
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.3)" }} />
            <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#fff" }} />
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", marginLeft: 6 }}>2 hops</span>
          </div>
        </div>
      </div>

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "18px 34px",
          borderTop: "1px solid var(--divider)",
          fontSize: 12,
          color: "var(--ink-42)",
        }}
      >
        <span>rushline — built from primary sources</span>
        <span>No dark patterns · citations on every claim</span>
      </footer>
    </main>
  );
}
