"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { getSupabase } from "@/lib/supabase";
import type { CareerGoal } from "@/lib/types";

const GOALS: { id: CareerGoal; label: string; icon: string; desc: string }[] = [
  { id: "consulting", label: "Consulting", icon: "💼", desc: "MBB, T2 strategy" },
  { id: "big_tech", label: "Big Tech", icon: "💻", desc: "FAANG & top eng" },
  { id: "quant", label: "Quant", icon: "📊", desc: "HF, trading desks" },
  { id: "startups", label: "Startups", icon: "🚀", desc: "Early-stage, VC" },
  { id: "finance", label: "Finance", icon: "🏦", desc: "IB, PE, markets" },
];

const CLUB_TYPES = ["consulting", "finance", "tech", "vc", "design"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 15px",
  borderRadius: 11,
  border: "1px solid var(--border-strong)",
  fontSize: 14.5,
  outline: "none",
  background: "var(--bg-sunken)",
  color: "var(--ink)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--ink-45)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 8,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("Cornell");
  const [goal, setGoal] = useState<CareerGoal>("consulting");
  const [linkedin, setLinkedin] = useState("");
  const [targets, setTargets] = useState<string[]>(["consulting"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: prof } = await sb
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      if (prof) {
        setEditing(true);
        setFullName(prof.full_name ?? "");
        setSchool(prof.school ?? "Cornell");
        if (prof.career_goal) setGoal(prof.career_goal as CareerGoal);
        setLinkedin(prof.linkedin_url ?? "");
        if (Array.isArray(prof.target_clubs) && prof.target_clubs.length) {
          setTargets(prof.target_clubs);
        }
      }
      setLoadingProfile(false);
    })();
  }, [router]);

  function toggleTarget(t: string) {
    setTargets((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    const sb = getSupabase();
    const { data: userData } = await sb.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await sb.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      school,
      career_goal: goal,
      linkedin_url: linkedin,
      target_clubs: targets,
      // Force re-import path on clubs if needed
      linkedin_scraped_at: null,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    if (linkedin.trim()) {
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
            body: JSON.stringify({ linkedinUrl: linkedin.trim(), school }),
          });
        } catch {
          // Non-blocking — ranking still works with category + whatever we have
        }
      }
    }

    router.push("/clubs");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px 80px",
      }}
    >
      <div style={{ position: "fixed", top: 24, left: 32 }}>
        <Wordmark href="/clubs" />
      </div>

      <div
        className="rl-card"
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 18,
          boxShadow: "var(--shadow-elevated)",
          padding: "40px 44px 36px",
          marginTop: 40,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 40,
            fontWeight: 400,
            marginBottom: 6,
            lineHeight: 1,
            letterSpacing: "-0.022em",
          }}
        >
          {editing ? "Update your profile." : "Tell us who you are."}
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--ink-50)", marginBottom: 32, lineHeight: 1.5 }}>
          {loadingProfile
            ? "Loading your profile…"
            : editing
              ? "Change goals, school, or LinkedIn anytime — matches update when you save."
              : "rushline uses this to rank clubs and personalize your intel. No long quiz — drop your LinkedIn and we build the picture."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                style={inputStyle}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
              />
            </div>
            <div>
              <label style={labelStyle}>School</label>
              <input
                style={inputStyle}
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>What are you recruiting for?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {GOALS.map((g) => {
                const selected = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
                      background: selected ? "var(--accent-tint)" : "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{g.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "var(--accent)" : "var(--ink)", lineHeight: 1.3 }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-45)", marginTop: 2 }}>{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Club types you&apos;re targeting</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CLUB_TYPES.map((t) => {
                const selected = targets.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTarget(t)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 999,
                      border: `1px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
                      background: selected ? "var(--accent)" : "#FFFFFF",
                      color: selected ? "#FFFFFF" : "rgba(0,0,0,.6)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textTransform: "capitalize",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>LinkedIn profile URL</label>
            <input
              style={inputStyle}
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/you"
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-strong)")}
            />
            <p style={{ fontSize: 11, color: "var(--ink-42)", marginTop: 6 }}>
              We scrape public profile signals to personalize match scores. LinkedIn
              often blocks connection lists — we never invent them.
            </p>
          </div>

          {error && <p style={{ fontSize: 13, color: "var(--warn-text)" }}>{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="rl-btn rl-btn-accent"
            style={{
              padding: "14px 0",
              borderRadius: 12,
              fontSize: 15,
              cursor: saving ? "wait" : "pointer",
              width: "100%",
            }}
          >
            {saving ? "Saving…" : editing ? "Save & refresh matches →" : "Build my feed →"}
          </button>
        </div>
      </div>
    </main>
  );
}
