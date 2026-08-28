const PALETTE = [
  "#1A1A2E",
  "#0A3D62",
  "#7B2D00",
  "#1B4F72",
  "#2C3E50",
  "#1A2980",
  "#5B2C6F",
  "#1A3A2A",
];

export function monogram(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !["of", "the", "at", "and"].includes(w.toLowerCase()));
  return words
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/** Identity — match scores are already 0–100. Kept for call-site compatibility. */
export function displayScore(raw: number): number {
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Club size / roster headcount for UI — never show exact small-or-precise counts. */
export function formatApproxHeadcount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "<10";
  if (n < 5) return "<10";
  return `~${Math.round(n / 10) * 10}`;
}

/**
 * Soften student/member headcounts embedded in vibe copy
 * (e.g. "~92 students" → "~90 students", "77 members" → "~80 members").
 */
export function softenHeadcountPhrases(text: string): string {
  return text.replace(
    /~?(\d+)\+?\s*(students?|members?|people|person)\b/gi,
    (_m, num: string, unit: string) => {
      const approx = formatApproxHeadcount(Number(num));
      return `${approx} ${unit}`;
    }
  );
}
