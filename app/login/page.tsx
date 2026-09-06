"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInPeek } from "@/components/ClubArc";
import { Wordmark } from "@/components/Wordmark";
import { getSupabase } from "@/lib/supabase";

type AuthKind = "exists" | "invalid" | "generic" | null;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<AuthKind>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [holdPct, setHoldPct] = useState(0);
  const [magicSent, setMagicSent] = useState(false);

  async function minHold<T>(started: number, work: Promise<T>): Promise<T> {
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setHoldPct(Math.min(100, Math.round((elapsed / 600) * 100)));
    }, 40);
    try {
      const result = await work;
      const wait = Math.max(0, 600 - (Date.now() - started));
      if (wait) await new Promise((r) => setTimeout(r, wait));
      setHoldPct(100);
      return result;
    } finally {
      window.clearInterval(tick);
    }
  }

  function classify(message: string): AuthKind {
    const m = message.toLowerCase();
    if (m.includes("already") || m.includes("registered") || m.includes("exists")) return "exists";
    if (m.includes("invalid") || m.includes("credentials")) return "invalid";
    return "generic";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorText(null);
    setMagicSent(false);
    setLoading(true);
    setHoldPct(8);
    const sb = getSupabase();
    const started = Date.now();
    try {
      if (mode === "signup") {
        const { error: err } = await minHold(started, sb.auth.signUp({ email, password }));
        if (err) throw err;
        await sb.auth.signInWithPassword({ email, password });
        router.push("/onboarding");
      } else {
        const { error: err } = await minHold(
          started,
          sb.auth.signInWithPassword({ email, password })
        );
        if (err) throw err;
        router.push("/clubs");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(classify(msg));
      setErrorText(msg);
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    const sb = getSupabase();
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/clubs` },
    });
    if (err) {
      setError("generic");
      setErrorText(err.message);
      return;
    }
    setMagicSent(true);
  }

  async function forgot() {
    if (!email) {
      setError("generic");
      setErrorText("Enter your email first.");
      return;
    }
    const { error: err } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (err) {
      setError("generic");
      setErrorText(err.message);
      return;
    }
    setMagicSent(true);
  }

  return (
    <main
      className="rl-signin"
      style={{
        display: "grid",
        gridTemplateColumns: "1.02fr .98fr",
        minHeight: "100vh",
        background: "var(--bg-page)",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          padding: "34px 40px 40px",
          background: "var(--navy)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <Wordmark href="/" size={32} wordSize={18} color="#fff" />
        <SignInPeek />
        <div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 34,
              lineHeight: 1.2,
              letterSpacing: "-0.018em",
              maxWidth: "22ch",
            }}
          >
            Your 119 clubs are already scored.
          </div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
              <span style={{ color: "rgba(255,255,255,.6)" }}>Warm intros</span>
              <span>7 people · 2 hops</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
              <span style={{ color: "rgba(255,255,255,.6)" }}>Next deadline</span>
              <span style={{ color: "#f0c07a" }}>Watch the intel page — we don&apos;t invent dates</span>
            </div>
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 11.5,
              lineHeight: 1.6,
              color: "rgba(255,255,255,.45)",
              maxWidth: "48ch",
            }}
          >
            We store your goals and your campus. Nothing else. Delete the account and the graph in
            one click.
          </div>
        </div>
      </div>

      <div style={{ padding: "56px 62px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          className="rl-card"
          style={{
            borderRadius: 18,
            boxShadow: "var(--shadow-elevated)",
            padding: "38px 36px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-serif)",
              fontWeight: 400,
              fontSize: 40,
              lineHeight: 1,
              letterSpacing: "-0.022em",
            }}
          >
            {mode === "signup" ? "Create your account." : "Welcome back."}
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 14.5, color: "var(--ink-50)" }}>
            {mode === "signup"
              ? "Build your recruiting edge in under a minute."
              : "Sign in to pick up where you left off."}
          </p>

          <form onSubmit={submit} style={{ marginTop: 30 }}>
            <div>
              <label htmlFor="email" style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(0,0,0,.6)", marginBottom: 8, display: "block" }}>
                Email
              </label>
              <input
                id="email"
                className="rl-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="netid@cornell.edu"
                autoComplete="email"
              />
            </div>
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <label htmlFor="password" style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(0,0,0,.6)" }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={forgot}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 12.5,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot?
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  className="rl-input"
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  style={{ paddingRight: 64, background: "#fff" }}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: 12.5,
                    color: "var(--ink-40)",
                    cursor: "pointer",
                    boxShadow: "none",
                  }}
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error === "exists" && (
              <div
                style={{
                  marginTop: 18,
                  border: "1px solid rgba(179,118,42,.4)",
                  background: "rgba(179,118,42,.07)",
                  borderRadius: 11,
                  padding: "14px 15px",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--warn-text)" }}>
                  This email already has an account
                </div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "rgba(0,0,0,.6)" }}>
                  Nothing is wrong with your password — you signed up already.{" "}
                  <button
                    type="button"
                    onClick={sendMagicLink}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 13,
                    }}
                  >
                    Send a sign-in link
                  </button>{" "}
                  instead, or reset it.
                </div>
              </div>
            )}

            {error === "invalid" && (
              <div
                style={{
                  marginTop: 18,
                  border: "1px solid rgba(179,118,42,.4)",
                  background: "rgba(179,118,42,.07)",
                  borderRadius: 11,
                  padding: "14px 15px",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--warn-text)" }}>
                  That password didn&apos;t match
                </div>
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.55, color: "rgba(0,0,0,.6)" }}>
                  Try again, or{" "}
                  <button
                    type="button"
                    onClick={sendMagicLink}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 13,
                    }}
                  >
                    send a sign-in link
                  </button>{" "}
                  instead of guessing.
                </div>
              </div>
            )}

            {error === "generic" && errorText && (
              <p style={{ marginTop: 14, fontSize: 13, color: "var(--warn-text)" }}>{errorText}</p>
            )}

            {magicSent && (
              <p style={{ marginTop: 14, fontSize: 13, color: "var(--success)" }}>
                Check your inbox — we sent a link.
              </p>
            )}

            <button
              disabled={loading}
              className="rl-btn rl-btn-accent"
              style={{
                width: "100%",
                marginTop: 22,
                borderRadius: 12,
                padding: 16,
                fontSize: 15,
              }}
            >
              {loading ? (
                <>
                  <span className="rl-spinner" />
                  Verifying your netid…
                </>
              ) : mode === "signup" ? (
                "Create account →"
              ) : (
                "Sign in →"
              )}
            </button>
            {loading && (
              <>
                <div className="rl-bar" style={{ height: 3, marginTop: 10 }}>
                  <div
                    className="rl-bar-fill"
                    style={{
                      ["--w" as string]: `${Math.max(holdPct, 8)}%`,
                      background: "var(--accent)",
                      animation: "none",
                      width: `${Math.max(holdPct, 8)}%`,
                    }}
                  />
                </div>
                <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.55, color: "var(--ink-42)" }}>
                  A deliberate 600ms hold — instant confirmations read as if nothing happened.
                </div>
              </>
            )}
          </form>
        </div>
        <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "var(--ink-50)" }}>
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setErrorText(null);
                }}
                style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
              >
                Sign in →
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setErrorText(null);
                }}
                style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
              >
                Create an account →
              </button>
            </>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Link href="/" style={{ fontSize: 12.5, color: "var(--ink-42)", textDecoration: "none" }}>
            ← Back to rushline
          </Link>
        </div>
      </div>
    </main>
  );
}
