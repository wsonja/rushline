import { linkedinSlug } from "./linkedin";
import type { Member, Profile, UserConnection } from "./types";

/** Classic club-wide officers (President, VP, Chair, Director, …). */
const EBOARD_TITLE =
  /\b(co-?)?president|\bvp\b|vice[\s-]?president|chair|director|treasurer|secretary|eboard|executive|\bcxo?\b|\bc[efto]o\b/i;

/** Project-team / org leads — in some clubs this *is* the top seat. */
const LEAD_TITLE = /\blead(er)?s?\b/i;

/**
 * True for leadership roles: classic eboard titles and Team Lead / Lead
 * (including "Data Science Team Lead", "Subteam Lead", "Full Team Lead").
 * False for Member / Analyst alone.
 */
export function isEboardRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const r = role.trim();
  if (!r) return false;
  return EBOARD_TITLE.test(r) || LEAD_TITLE.test(r);
}

/**
 * Lower is better among leadership:
 * President → VP → Chair → other officers → Team Lead / Lead → non-lead.
 */
export function eboardTitleRank(role: string | null | undefined): number {
  if (!isEboardRole(role)) return 50;
  const r = (role || "").toLowerCase();
  if (/\bpresident\b/.test(r) && !/vice/.test(r)) return 0;
  if (/vice[\s-]?president|\bvp\b/.test(r)) return 1;
  if (/\bchair\b/.test(r)) return 2;
  if (/\b(director|treasurer|secretary)\b/.test(r)) return 3;
  // Team Lead / Lead ranks after Chair/officers so titled Pres/VP/Chair still win
  if (LEAD_TITLE.test(r) && !EBOARD_TITLE.test(r)) return 5;
  return 4;
}

function connectionDegree(
  m: Member,
  connections: UserConnection[]
): 0 | 1 | 2 {
  const slug = linkedinSlug(m.linkedin_url);
  if (!slug) return 0;
  let best: 0 | 1 | 2 = 0;
  for (const c of connections) {
    if (c.connected_linkedin_slug.toLowerCase() !== slug) continue;
    if (c.degree === 1) return 1;
    if (c.degree === 2) best = 2;
  }
  return best;
}

/**
 * Sort key: lower is better.
 * 1st/2nd-degree connections, then leadership (President > VP > Chair > Lead),
 * career-goal match, current students before alumni, name.
 */
function meetRankTuple(
  m: Member,
  connections: UserConnection[],
  goal: string | null
): [number, number, number, number, number, string] {
  const eboardKey = isEboardRole(m.role) ? 0 : 1;
  const titleKey = eboardTitleRank(m.role);
  const deg = connectionDegree(m, connections);
  const degKey = deg === 1 ? 0 : deg === 2 ? 1 : 2;
  const goalKey =
    goal && (m.career_tags ?? []).includes(goal) ? 0 : 1;
  const alumKey = m.is_alumni ? 1 : 0;
  return [degKey, eboardKey, titleKey, goalKey, alumKey, m.name.toLowerCase()];
}

function cmpTuple(
  a: [number, number, number, number, number, string],
  b: [number, number, number, number, number, string]
): number {
  for (let i = 0; i < 5; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a[5].localeCompare(b[5]);
}

/** Full roster sorted by People You Should Meet priority. */
export function sortMembersForMeet(
  members: Member[],
  connections: UserConnection[],
  profile: Profile | null
): Member[] {
  const goal = profile?.career_goal ?? null;
  return [...members].sort((a, b) =>
    cmpTuple(
      meetRankTuple(a, connections, goal),
      meetRankTuple(b, connections, goal)
    )
  );
}

/** Top N people to meet (default 3). */
export function rankPeopleToMeet(
  members: Member[],
  connections: UserConnection[],
  profile: Profile | null,
  limit = 3
): Member[] {
  return sortMembersForMeet(members, connections, profile).slice(0, limit);
}
