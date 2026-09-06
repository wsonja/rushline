"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import NetworkGraph, {
  type GraphLink,
  type GraphNode,
} from "@/components/NetworkGraph";
import { fetchAllMembers } from "@/lib/fetch-all";
import { getSupabase } from "@/lib/supabase";
import { linkedinSlug } from "@/lib/linkedin";
import { scoreClubDetailed } from "@/lib/rank";
import type { Club, Member, Profile, UserConnection } from "@/lib/types";

export default function NetworkPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const [{ data: prof }, { data: clubRows }, connRes] =
        await Promise.all([
          sb.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
          sb.from("clubs").select("*"),
          sb
            .from("user_connections")
            .select("*")
            .eq("user_id", userData.user.id),
        ]);
      setProfile(prof as Profile | null);
      setClubs((clubRows as Club[]) ?? []);
      setConnections(
        connRes.error ? [] : ((connRes.data as UserConnection[]) ?? [])
      );
      try {
        setMembers(await fetchAllMembers(sb));
      } catch {
        setMembers([]);
      }
      setLoading(false);
    })();
  }, [router]);

  const { nodes, links, target, path } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const ctx = { profile, connections, members };

    const youId = "you";
    nodes.push({
      id: youId,
      label: profile?.full_name || "You",
      kind: "you",
      onPath: true,
    });

    const rankedClubs = [...clubs]
      .map((c) => ({ club: c, score: scoreClubDetailed(c, ctx).score }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.club);

    const target = rankedClubs[0];

    const connSlugs = new Set(
      connections.map((c) => c.connected_linkedin_slug.toLowerCase())
    );

    // Prefer current member on a real connection path; then any current; then alum.
    let pathMember: Member | null = null;
    if (target) {
      const targetMembers = members.filter((m) => m.club_id === target.id);
      const connected = (m: Member) => {
        const slug = linkedinSlug(m.linkedin_url);
        return Boolean(slug && connSlugs.has(slug));
      };
      pathMember =
        targetMembers.find((m) => !m.is_alumni && connected(m)) ??
        targetMembers.find((m) => !m.is_alumni) ??
        targetMembers.find((m) => connected(m)) ??
        targetMembers[0] ??
        null;
    }

    rankedClubs.slice(0, 5).forEach((club) => {
      const isTarget = target && club.id === target.id;
      nodes.push({
        id: club.id,
        label: club.name,
        kind: "club",
        onPath: Boolean(isTarget),
      });
      const clubMembers = members.filter((m) => m.club_id === club.id).slice(0, 8);
      clubMembers.forEach((m) => {
        const slug = linkedinSlug(m.linkedin_url);
        const realEdge = Boolean(slug && connSlugs.has(slug));
        const onPath = pathMember?.id === m.id;
        nodes.push({
          id: m.id,
          label: m.is_alumni ? `${m.name} (alum)` : m.name,
          kind: m.is_alumni ? "alum" : "member",
          onPath,
        });
        links.push({ source: club.id, target: m.id, onPath });
        if (realEdge || onPath) {
          links.push({ source: youId, target: m.id, onPath: onPath || realEdge });
        }
      });
      links.push({ source: youId, target: club.id, onPath: Boolean(isTarget) });
    });

    return { nodes, links, target, path: pathMember };
  }, [clubs, members, profile, connections]);

  return (
    <AppShell
      counts={{ web: connections.length }}
      copilotScope="Reads the graph on this page. It won't invent edges that aren't imported."
    >
      <main style={{ height: "100vh", overflowY: "auto", padding: "32px 34px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 46,
              fontWeight: 400,
              lineHeight: 1,
              marginBottom: 12,
              letterSpacing: "-0.022em",
            }}
          >
            Your web
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-50)" }}>
            Who you know (from LinkedIn connections we could import), who&apos;s in
            each club, and the best path into your top target. Alumni are labeled.
          </p>
        </div>

        {target && path && (
          <div
            style={{
              background: "var(--navy)",
              color: "#fff",
              borderRadius: 16,
              padding: "18px 22px",
              marginBottom: 20,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              maxWidth: 900,
            }}
          >
            <span style={{ color: "rgba(255,255,255,.55)" }}>Your move:</span>
            <span style={{ fontWeight: 600 }}>Reach out to {path.name}</span>
            <span style={{ color: "rgba(255,255,255,.7)" }}>
              ({path.role}
              {path.is_alumni ? ", alum" : ""}) —{" "}
              {path.is_alumni ? "alumni fallback path into" : "your strongest current path into"}
            </span>
            <span style={{ fontWeight: 600 }}>{target.name}</span>
          </div>
        )}

        {!loading && connections.length === 0 && (
          <div className="rl-gap" style={{ marginBottom: 20, maxWidth: 900 }}>
            <strong style={{ display: "block", color: "var(--ink)", marginBottom: 6 }}>
              An honest gap
            </strong>
            No 1st-degree LinkedIn connections imported yet (LinkedIn usually
            authwalls that). Edges to people only appear when we have real
            connection slugs — we don&apos;t fake them.
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 16 }}>
          <Legend color="#3B3BFF" label="You / path in" />
          <Legend color="#1A1A2E" label="Clubs" />
          <Legend color="#0A3D62" label="Members" />
          <Legend color="#7B2D00" label="Alumni" />
        </div>

        <div style={{ maxWidth: 1100 }}>
          {loading ? (
            <div
              className="rl-card"
              style={{
                height: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "var(--ink-50)",
              }}
            >
              Building your graph…
            </div>
          ) : (
            <NetworkGraph nodes={nodes} links={links} />
          )}
        </div>
      </main>
    </AppShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-50)" }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}
