/**
 * Enrich club_intel.placements for ALL clubs with firm counts from:
 * 1) member relevance / talking_points (prestige firm aliases) — +1 per member/firm
 * 2) existing placements counts (e.g. LinkedIn alumni) — take max(memberHits, storedCount)
 *
 * Usage:
 *   npx tsx scripts/enrich-placement-counts.ts
 *   npx tsx scripts/enrich-placement-counts.ts --dry-run
 *   npx tsx scripts/enrich-placement-counts.ts --school=Cornell
 */
import { createClient } from "@supabase/supabase-js";
import { KNOWN_FIRM_ALIASES } from "../lib/prestige";

const dryRun = process.argv.includes("--dry-run");
const schoolArg = process.argv.find((a) => a.startsWith("--school="))?.split("=")[1];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const NOISE =
  /cornell|bowers|college of|university|high school|\bstudent\b|\bclub\b|\bteam\b/i;

/** Never treat these as placement employers (URL / platform noise). */
const SKIP_FIRMS = new Set(["linkedin", "youtube", "instagram", "github"]);

type Row = {
  firm: string;
  count: number;
  source?: string;
  kinds?: string[];
};

function findFirms(text: string): string[] {
  // Strip URLs so "linkedin.com/in/..." doesn't count as LinkedIn the employer
  const cleaned = text.replace(/https?:\/\/\S+/gi, " ");
  const lower = cleaned.toLowerCase();
  const hits: string[] = [];
  for (const f of KNOWN_FIRM_ALIASES) {
    if (SKIP_FIRMS.has(f.name.toLowerCase())) continue;
    const matched = f.aliases.some((a) => {
      const alias = a.toLowerCase().trim();
      if (alias.length <= 3) {
        return new RegExp(
          `(?:^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z0-9]|$)`
        ).test(lower);
      }
      return lower.includes(alias);
    });
    if (matched) hits.push(f.name);
  }
  return hits;
}

/** Map stored firm strings onto prestige canonical names when possible. */
function canonicalizeFirm(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned || NOISE.test(cleaned) || SKIP_FIRMS.has(cleaned.toLowerCase())) {
    return null;
  }
  const lower = cleaned.toLowerCase();
  for (const f of KNOWN_FIRM_ALIASES) {
    if (SKIP_FIRMS.has(f.name.toLowerCase())) continue;
    if (
      f.name.toLowerCase() === lower ||
      f.aliases.some((a) => a.toLowerCase() === lower)
    ) {
      return f.name;
    }
    if (
      f.aliases.some((a) => {
        const al = a.toLowerCase();
        return al.length >= 4 && (lower.includes(al) || al.includes(lower));
      })
    ) {
      return f.name;
    }
  }
  if (cleaned.length < 3 || cleaned.length > 80) return null;
  if (/linkedin|instagram|http|www\./i.test(cleaned)) return null;
  return cleaned;
}

async function fetchAllMembers() {
  const page = 1000;
  const out: {
    club_id: string;
    name: string;
    linkedin_url: string | null;
    relevance: string | null;
    talking_points: string[] | null;
  }[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await sb
      .from("members")
      .select("club_id,name,linkedin_url,relevance,talking_points")
      .range(from, from + page - 1);
    if (error) throw error;
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < page) break;
    from += page;
  }
  return out;
}

async function main() {
  let clubQuery = sb.from("clubs").select("id,name,slug,school");
  if (schoolArg) clubQuery = clubQuery.eq("school", schoolArg);
  const { data: clubs, error: clubErr } = await clubQuery;
  if (clubErr) throw clubErr;
  const clubList = clubs ?? [];
  console.log(`clubs=${clubList.length} dryRun=${dryRun}`);

  const members = await fetchAllMembers();
  const byClubMembers = new Map<string, typeof members>();
  for (const m of members) {
    const arr = byClubMembers.get(m.club_id) ?? [];
    arr.push(m);
    byClubMembers.set(m.club_id, arr);
  }

  const { data: intelRows, error: intelErr } = await sb
    .from("club_intel")
    .select("club_id,placements");
  if (intelErr) throw intelErr;
  const intelByClub = new Map(
    (intelRows ?? []).map((r) => [r.club_id as string, r.placements as unknown])
  );

  let updated = 0;
  let withFirms = 0;

  for (const club of clubList) {
    // memberHits: firm -> { count, source }
    const memberHits = new Map<string, { firm: string; count: number; source?: string }>();
    const roster = byClubMembers.get(club.id) ?? [];
    for (const m of roster) {
      const blob = `${m.relevance ?? ""} ${(m.talking_points ?? []).join(" ")}`;
      if (blob.trim().length < 4) continue;
      for (const firm of new Set(findFirms(blob))) {
        if (NOISE.test(firm)) continue;
        const key = firm.toLowerCase();
        const cur = memberHits.get(key);
        if (cur) {
          cur.count += 1;
          if (!cur.source && m.linkedin_url) cur.source = m.linkedin_url;
        } else {
          memberHits.set(key, {
            firm,
            count: 1,
            source: m.linkedin_url ?? undefined,
          });
        }
      }
    }

    // Merge existing placements — keep larger of stored count vs member hits
    const merged = new Map<string, Row>();
    for (const [key, hit] of memberHits) {
      merged.set(key, {
        firm: hit.firm,
        count: hit.count,
        source: hit.source,
        kinds: [],
      });
    }

    const existing = (intelByClub.get(club.id) as
      | { firm?: string; count?: number; source?: string; kinds?: string[] }[]
      | null) ?? [];
    for (const p of existing) {
      const firm = p?.firm ? canonicalizeFirm(p.firm) : null;
      if (!firm) continue;
      const key = firm.toLowerCase();
      const stored = Math.max(1, p.count ?? 1);
      const cur = merged.get(key);
      if (cur) {
        cur.count = Math.max(cur.count, stored);
        if (!cur.source && p.source) cur.source = p.source;
        cur.kinds = [...new Set([...(cur.kinds ?? []), ...(p.kinds ?? [])])];
      } else {
        merged.set(key, {
          firm,
          count: stored,
          source: p.source,
          kinds: p.kinds ?? [],
        });
      }
    }

    const placements = [...merged.values()]
      .sort((a, b) => b.count - a.count || a.firm.localeCompare(b.firm))
      .slice(0, 20);

    if (placements.length) withFirms += 1;

    if (dryRun) {
      if (placements.length) {
        console.log(
          `${club.slug.padEnd(42)} ${placements
            .slice(0, 6)
            .map((p) => `${p.firm}:${p.count}`)
            .join(", ")}`
        );
      }
      continue;
    }

    const payload = {
      club_id: club.id,
      placements,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb.from("club_intel").upsert(payload, { onConflict: "club_id" });
    if (error) {
      const { error: err2 } = await sb.from("club_intel").upsert(
        {
          ...payload,
          review: null,
          clients: [],
          retreats: [],
          interview: {},
          reddit_sentiment: {},
          vibe: {},
          x_sentiment: {},
          sources: [],
        },
        { onConflict: "club_id" }
      );
      if (err2) {
        console.warn("fail", club.slug, err2.message);
        continue;
      }
    }
    updated += 1;
  }

  console.log(`DONE updated=${updated} clubsWithFirms=${withFirms}/${clubList.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
