"use client";

import { useEffect, useState } from "react";
import type { Club } from "@/lib/types";
import { monogram } from "@/lib/ui";
import {
  isCornellProjectTeam,
  projectTeamDeadlineLine,
} from "@/lib/recruitment-timeline";

export type ArcCard = {
  name: string;
  category: string;
  score?: number;
  hops?: string | null;
  deadline?: string | null;
  badge?: string | null;
  badgeSide?: "left" | "right";
  fill: string;
  light?: boolean;
  clip?: boolean;
};

const SLOTS = [
  { y: 64, rot: -19, rotY: 26, fill: "linear-gradient(160deg,#1f2c4d,#0e1526)", light: false, clip: true },
  { y: 36, rot: -12, rotY: 17, fill: "linear-gradient(160deg,#f0f0ea,#dcdbd2)", light: true, clip: true },
  { y: 14, rot: -6, rotY: 8, fill: "linear-gradient(160deg,#3b33f0,#241da8)", light: false, clip: true },
  { y: -8, rot: 0, rotY: 0, fill: "linear-gradient(160deg,#fffefb,#f1efe6)", light: true, clip: false, front: true },
  { y: 14, rot: 6, rotY: -8, fill: "linear-gradient(160deg,#153a2b,#0b2419)", light: false, clip: true },
  { y: 36, rot: 12, rotY: -17, fill: "linear-gradient(160deg,#f6e6c8,#e5cf9f)", light: true, clip: false },
  { y: 64, rot: 19, rotY: -26, fill: "linear-gradient(160deg,#4a1622,#2b0c14)", light: false, clip: true },
] as const;

export const SAMPLE_ARC: ArcCard[] = [
  { name: "CUAir", category: "TECH", score: 79, fill: SLOTS[0].fill },
  { name: "KTP", category: "GREEK · TECH", score: 74, fill: SLOTS[1].fill, light: true },
  { name: "CDS", category: "TECH", score: 82, hops: "2 hops", fill: SLOTS[2].fill },
  {
    name: "Cornell AppDev",
    category: "TECH",
    score: 82,
    deadline: projectTeamDeadlineLine({ slug: "cornell-appdev", name: "Cornell AppDev" }),
    badge: "@sonja · 82",
    badgeSide: "left",
    fill: SLOTS[3].fill,
    light: true,
    clip: false,
  },
  { name: "CEV", category: "TECH", score: 78, fill: SLOTS[4].fill },
  {
    name: "CBS",
    category: "CONSULTING",
    score: 71,
    badge: "@abigail",
    badgeSide: "right",
    fill: SLOTS[5].fill,
    light: true,
    clip: false,
  },
  { name: "Quant Fund", category: "FINANCE", score: 68, fill: SLOTS[6].fill },
];

export function clubsToArc(clubs: { club: Club; score: number; hops?: string | null }[]): ArcCard[] {
  if (clubs.length < 3) return SAMPLE_ARC;
  return SLOTS.map((slot, i) => {
    const row = clubs[i % clubs.length];
    const isFront = i === 3;
    return {
      name: row.club.name,
      category: (row.club.category ?? "club").toUpperCase(),
      score: row.score,
      hops: row.hops,
      deadline: isFront
        ? isCornellProjectTeam(row.club)
          ? projectTeamDeadlineLine(row.club)
          : row.club.tagline
        : null,
      fill: slot.fill,
      light: slot.light,
      clip: slot.clip,
    };
  });
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function ClubArc({
  cards = SAMPLE_ARC,
  reduceMotion,
  cta,
}: {
  cards?: ArcCard[];
  reduceMotion?: boolean;
  cta?: React.ReactNode;
}) {
  const [deal, setDeal] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    if (reduceMotion) {
      setDeal(0);
      return;
    }
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / 420));
      setDeal(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduceMotion]);

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: 430,
          marginTop: 26,
          perspective: 1500,
          perspectiveOrigin: "50% 40%",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 34,
            transform: "translateX(-50%)",
            transformStyle: "preserve-3d",
            display: "flex",
            alignItems: "flex-start",
            pointerEvents: "none",
          }}
        >
        {cards.slice(0, 7).map((card, i) => {
          const slot = SLOTS[i];
          const isFront = i === 3;
          const t = reduceMotion ? 0 : deal;
          const y = lerp(slot.y, isFront ? -4 : 10, t);
          const rot = lerp(slot.rot, 0, t);
          const rotY = lerp(slot.rotY, 0, t);
          const hovered = hover === i;
          const dim = hover !== null && hover !== i;
          const lift = hovered && !reduceMotion ? -10 : 0;
          const rotYHover = hovered ? rotY * 0.25 : rotY;
          const width = isFront ? 176 : 158;
          const height = isFront ? 238 : 212;
          return (
            <div
              key={`${card.name}-${i}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                position: "relative",
                width,
                height,
                borderRadius: isFront ? 20 : 18,
                margin: isFront ? "0 2px" : "0 -5px",
                overflow: card.clip === false ? "visible" : "hidden",
                background: card.fill,
                boxShadow: isFront ? "var(--shadow-arc-front)" : "var(--shadow-arc)",
                transform: `translateY(${y + lift}px) rotate(${rot}deg) rotateY(${rotYHover}deg)`,
                padding: isFront ? 18 : 16,
                boxSizing: "border-box",
                color: card.light ? "var(--ink)" : "#fff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: dim ? 0.85 : 1,
                transition: "opacity 0.2s, transform 0.25s",
                zIndex: isFront ? 2 : 1,
                animation: isFront && !reduceMotion ? "rl-float 6s ease-in-out infinite" : undefined,
              }}
            >
              {card.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: card.badgeSide === "right" ? -26 : -30,
                    left: card.badgeSide === "left" ? -58 : undefined,
                    right: card.badgeSide === "right" ? -40 : undefined,
                    background: card.badgeSide === "right" ? "var(--navy)" : "var(--accent)",
                    color: "#fff",
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "7px 13px",
                    borderRadius: 999,
                    boxShadow:
                      card.badgeSide === "right"
                        ? "0 8px 18px rgba(16,20,40,.24)"
                        : "0 8px 18px rgba(59,51,240,.32)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.badge}
                </div>
              )}
              {isFront ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: "var(--navy)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {monogram(card.name).slice(0, 2)}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        color: "rgba(0,0,0,.4)",
                      }}
                    >
                      {card.category}
                    </span>
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 25,
                        lineHeight: 1.05,
                      }}
                    >
                      {card.name}
                    </div>
                    {card.deadline && (
                      <div
                        style={{
                          marginTop: 9,
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: "rgba(0,0,0,.52)",
                        }}
                      >
                        {card.deadline}
                      </div>
                    )}
                    <div
                      className="rl-bar"
                      style={{ marginTop: 11 }}
                    >
                      <div
                        className="rl-bar-fill"
                        style={{ ["--w" as string]: `${card.score ?? 82}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      opacity: card.light ? undefined : 0.55,
                      color: card.light ? "rgba(0,0,0,.4)" : undefined,
                    }}
                  >
                    {card.category}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 22,
                        lineHeight: 1.1,
                      }}
                    >
                      {card.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        marginTop: 6,
                        opacity: card.light ? undefined : 0.6,
                        color: card.light ? "rgba(0,0,0,.5)" : undefined,
                      }}
                    >
                      {card.score ?? "—"} match{card.hops ? ` · ${card.hops}` : ""}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        </div>
      </div>
      {cta && (
        <div
          style={{
            position: "relative",
            zIndex: 5,
            textAlign: "center",
            marginTop: -92,
            paddingBottom: 8,
          }}
        >
          {cta}
        </div>
      )}
    </div>
  );
}

export function SignInPeek() {
  return (
    <div style={{ position: "relative", perspective: 1200, height: 250, margin: "20px 0" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 20,
          width: 150,
          height: 198,
          borderRadius: 16,
          background: "linear-gradient(160deg,#2a3b60,#16223c)",
          boxShadow: "0 20px 40px rgba(0,0,0,.35)",
          transform: "rotate(-10deg) rotateY(18deg)",
          padding: 15,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          color: "#fff",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>CUAUV</div>
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 5 }}>79 match</div>
      </div>
      <div
        className="rl-float"
        style={{
          position: "absolute",
          left: 118,
          top: 0,
          width: 162,
          height: 214,
          borderRadius: 16,
          background: "linear-gradient(160deg,#3b33f0,#241da8)",
          boxShadow: "0 26px 48px rgba(0,0,0,.4)",
          transform: "rotate(-3deg) rotateY(6deg)",
          padding: 16,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          animationDuration: "7s",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", opacity: 0.7 }}>
          TOP MATCH
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: 23, lineHeight: 1.05 }}>
            Cornell AppDev
          </div>
          <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 6 }}>
            82 · {projectTeamDeadlineLine({ slug: "cornell-appdev", name: "Cornell AppDev" })}
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 252,
          top: 26,
          width: 150,
          height: 196,
          borderRadius: 16,
          background: "linear-gradient(160deg,#f0efe7,#d9d8ce)",
          boxShadow: "0 20px 40px rgba(0,0,0,.3)",
          transform: "rotate(9deg) rotateY(-16deg)",
          padding: 15,
          boxSizing: "border-box",
          color: "#111",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 19 }}>Data Science</div>
        <div style={{ fontSize: 11, color: "rgba(0,0,0,.5)", marginTop: 5 }}>82 · 2 hops away</div>
      </div>
    </div>
  );
}
