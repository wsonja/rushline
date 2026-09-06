"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { CampusToggle } from "@/components/Controls";
import { getSupabase } from "@/lib/supabase";
import {
  campusLabel,
  campusToSchool,
  clubMatchesCampus,
  schoolToCampus,
  useCampus,
  type Campus,
} from "@/lib/prefs";
import type { Profile } from "@/lib/types";
import { initials } from "@/lib/ui";

const NAV = [
  { label: "Clubs", path: "/clubs", key: "clubs" as const },
  { label: "My web", path: "/network", key: "web" as const },
  { label: "Outreach", path: "/outreach", key: "outreach" as const },
];

function goalLabel(g: string): string {
  return g.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Sidebar({
  pageNav,
  counts,
}: {
  pageNav?: React.ReactNode;
  counts?: { clubs?: number; web?: number; outreach?: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [clubCount, setClubCount] = useState(counts?.clubs ?? 0);
  const { campus, setCampus } = useCampus();

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data } = await sb.auth.getUser();
      setEmail(data.user?.email ?? null);
      if (!data.user) return;
      const { data: prof } = await sb
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      const p = prof as Profile | null;
      setProfile(p);
      if (p?.school) setCampus(schoolToCampus(p.school));
    })();
  }, [setCampus]);

  useEffect(() => {
    getSupabase()
      .from("clubs")
      .select("school")
      .then(({ data }) => {
        const n = ((data ?? []) as { school: string }[]).filter((c) =>
          clubMatchesCampus(c.school, campus)
        ).length;
        setClubCount(n);
      });
  }, [campus]);

  async function changeCampus(next: Campus) {
    setCampus(next);
    if (profile) {
      await getSupabase()
        .from("profiles")
        .update({ school: campusToSchool(next) })
        .eq("id", profile.id);
    }
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    router.push("/login");
  }

  const displayName = profile?.full_name || email?.split("@")[0] || "Guest";
  const goals = [
    profile?.career_goal ? goalLabel(profile.career_goal) : null,
    ...(profile?.target_clubs ?? []).map(goalLabel),
  ].filter((g, i, a): g is string => Boolean(g) && a.indexOf(g) === i);

  const showRanked = !pageNav && pathname?.startsWith("/clubs") && !pathname?.slice(7).includes("/");

  return (
    <aside className="rl-rail" style={{ width: 240 }}>
      <div style={{ padding: 20 }}>
        <Wordmark href="/clubs" size={30} wordSize={17} />
      </div>
      <div style={{ padding: "0 16px" }}>
        <CampusToggle campus={campus} onChange={changeCampus} compact />
        <div style={{ fontSize: 12, color: "var(--ink-42)", margin: "10px 4px 0" }}>
          Viewing {clubCount || counts?.clubs || "—"} {campusLabel(campus)} clubs
        </div>
      </div>
      <nav style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const isActive =
            item.path === "/clubs"
              ? pathname === "/clubs" || pathname?.startsWith("/clubs/")
              : pathname?.startsWith(item.path);
          const count =
            item.key === "clubs"
              ? (counts?.clubs ?? clubCount)
              : item.key === "web"
                ? counts?.web
                : counts?.outreach;
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? "var(--accent)" : "rgba(0,0,0,.6)",
                background: isActive ? "var(--accent-tint)" : "transparent",
              }}
            >
              {item.label}
              {count != null && (
                <span style={{ opacity: 0.6, fontWeight: 500 }}>{count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {pageNav ? (
        <div style={{ margin: "10px 16px 0", paddingTop: 16, borderTop: "1px solid var(--divider)" }}>
          {pageNav}
        </div>
      ) : showRanked ? (
        <div style={{ margin: "6px 16px 0", paddingTop: 16, borderTop: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-45)", marginBottom: 10 }}>
            Ranked for
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {goals.slice(0, 4).map((g) => (
              <span key={g} className="rl-chip rl-chip-accent" style={{ padding: "5px 10px", borderRadius: 8, fontSize: 12 }}>
                {g}
              </span>
            ))}
            <Link
              href="/onboarding"
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px dashed rgba(0,0,0,.2)",
                fontSize: 12,
                color: "var(--ink-45)",
                textDecoration: "none",
              }}
            >
              + edit
            </Link>
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: "auto",
          padding: 16,
          borderTop: "1px solid var(--divider)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11.5,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email ?? "Not signed in"}
          </div>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-45)", padding: 4 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
