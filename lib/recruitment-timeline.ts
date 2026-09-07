import type { Club } from "@/lib/types";

export type TimelineStep = {
  label: string;
  detail: string;
  when?: string | null;
};

export type TimelineTrack = {
  id: string;
  title: string;
  subtitle?: string;
  steps: TimelineStep[];
};

export function splitProcessStep(raw: string): TimelineStep {
  const text = raw.trim();
  const m = text.match(/^(.*?)(?:\s*\(([^)]*)\))\s*$/);
  if (m) {
    return { label: m[1].trim(), detail: text, when: m[2].trim() };
  }
  const dash = text.split(/\s+[—–-]\s+/);
  if (dash.length >= 2) {
    return {
      label: dash[0].trim(),
      detail: dash.slice(1).join(" — ").trim(),
      when: null,
    };
  }
  return { label: text, detail: text, when: null };
}

/** Cornell Engineering Student Project Teams — official FA26 / SP26 recruiting. */
export const PROJECT_TEAM_FALL_UPPERCLASS: TimelineStep[] = [
  {
    label: "Recruiting begins",
    detail: "General + team apps open. No advantage to submitting early.",
    when: "Mon Aug 17",
  },
  {
    label: "Project Teams Fest",
    detail: "Duffield Atrium",
    when: "Tue Sep 1 · 4–6 p.m.",
  },
  {
    label: "Applications due",
    detail: "Upperclass apps due. Teams may begin reviewing after this date.",
    when: "Thu Sep 3 · 11:59 p.m.",
  },
  {
    label: "Uniform first offer",
    detail: "Earliest teams can invite. Applicants get ≥48 hours to respond.",
    when: "Wed Sep 16",
  },
  {
    label: "Add deadline",
    detail: "ENGRG 1400 onboarding (1 cr, S/U) for credit enrollment.",
    when: "Fri Sep 25 · 5 p.m.",
  },
];

export const PROJECT_TEAM_FALL_FIRST_YEAR: TimelineStep[] = [
  {
    label: "Recruiting begins",
    detail: "General + team apps open. No advantage to submitting early.",
    when: "Mon Aug 17",
  },
  {
    label: "Project Teams Fest",
    detail: "Duffield Atrium",
    when: "Tue Sep 1 · 4–6 p.m.",
  },
  {
    label: "Applications due",
    detail: "First-year + transfer apps due. Reviewing may begin after this date.",
    when: "Thu Oct 15 · 11:59 p.m.",
  },
  {
    label: "Uniform first offer",
    detail: "Earliest invite date for first-year + transfer. ≥48 hours to respond.",
    when: "Mon Nov 2",
  },
  {
    label: "Onboarding may begin",
    detail: "Shadowing/training ≤10 hrs/week; ENGRG 1400 in spring (not fall credit).",
    when: "Wed Nov 4",
  },
];

export const PROJECT_TEAM_SPRING_ALL: TimelineStep[] = [
  {
    label: "Recruiting begins",
    detail: "General + team apps open for all students.",
    when: "Mon Jan 4",
  },
  {
    label: "Applications due",
    detail: "Shared spring deadline for all students.",
    when: "Thu Jan 28 · 11:59 p.m.",
  },
  {
    label: "Uniform first offer",
    detail: "Earliest invite date. ≥48 hours to respond.",
    when: "Wed Feb 10",
  },
  {
    label: "Add deadline",
    detail: "ENGRG 1400 onboarding for credit enrollment.",
    when: "Fri Feb 19 · 5 p.m.",
  },
];

/** Slugs for Cornell Engineering Student Project Teams in our DB. */
const PROJECT_TEAM_SLUGS = new Set([
  "aguaclara-cornell",
  "combat-robotics-cornell",
  "cornell-assistive-technologies",
  "cornell-autoboat",
  "cornell-autonomous-sailboat-team-cusail",
  "cusail",
  "cornell-baja-racing",
  "cornell-concrete-canoe",
  "cornell-cup-robotics",
  "cornell-custom-silicon-systems-c2s2",
  "cornell-design-build-fly",
  "cornell-electric-vehicles",
  "cornell-engineering-world-health",
  "cornell-fsae-racing",
  "cornell-hyperloop",
  "cornell-igem",
  "cornell-mars-rover",
  "cornell-rocketry",
  "cornell-seismic-design",
  "cornell-steel-bridge",
  "cornell-university-biomedical-device",
  "cornell-university-extended-reality-cuxr",
  "cornell-university-solar-boat",
  "cornell-university-unmanned-air-systems-cuair",
  "cu-autonomous-drone",
  "cu-geodata",
  "cuauv",
  "senstech-cornell",
  "cornell-appdev", // Engineering-sponsored project team (Walker White)
  "cornell-data-science",
  "cornell-dti",
  "cornell-digital-tech-innovation",
  "cornell-nexus",
  "cornell-debut",
  "cornell-cheme-car",
  "hack4impact-cornell",
  "engineers-for-a-sustainable-world",
  "engineers-in-action",
  "engineers-without-borders",
]);

export function isCornellProjectTeam(club: Pick<Club, "school" | "slug" | "name"> | null | undefined): boolean {
  if (!club) return false;
  if ((club.school ?? "").toLowerCase() !== "cornell") return false;
  if (PROJECT_TEAM_SLUGS.has(club.slug)) return true;
  // Fallback name heuristics for packs that use alternate slugs
  const n = (club.name ?? "").toLowerCase();
  return (
    /\b(auv|cuair|baja|fsae|rocketry|hyperloop|mars rover|concrete canoe|steel bridge|design.?build.?fly|autoboat|cusail|aguaclara|igem|solar boat|combat robotics|appdev|data science|\bdti\b|hack4impact|nexus|debut|chem.?e car|electric vehicles|\bcev\b)\b/.test(
      n
    )
  );
}

/** Strip concrete dates → TBD for clubs without verified FA26 website dates. */
export function scrubDatesToTbd(steps: TimelineStep[]): TimelineStep[] {
  return steps.map((s) => {
    const label = s.label
      .replace(/\s*\(([^)]*(?:FA26|SP26|2026|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mon|Tue|Wed|Thu|Fri)[^)]*)\)/gi, "")
      .replace(/\s*[—–-]\s*$/, "")
      .trim();
    const detail = s.detail
      .replace(/\([^)]*(?:FA26|SP26|2026|Aug|Sep|Oct|Nov|Dec|Jan|Feb)[^)]*\)/gi, "(TBD)")
      .replace(/\bFA26:[^.—–-]*/gi, "TBD ")
      .trim();
    return {
      label: label || s.label,
      detail: detail === label ? "" : detail,
      when: "TBD",
    };
  });
}

/** AppDev core-team FA26 — from cornellappdev.com/apply (fetched 2026-09-06). */
export const APPDEV_FA26: TimelineStep[] = [
  {
    label: "Applications open",
    detail: "FA26 core team is sophomores, juniors, and seniors only.",
    when: "Mon Aug 17",
  },
  {
    label: "Info sessions",
    detail: "Gates G01",
    when: "Thu Aug 27 & Mon Aug 31 · 5 p.m.",
  },
  {
    label: "Applications due",
    detail: "Core team. No app-dev experience? Take a course this semester and apply in spring.",
    when: "Thu Sep 3 · 11:59 p.m. ET",
  },
  {
    label: "Interviews",
    detail: "Times vary by subteam.",
    when: "Mon Sep 7 – Sun Sep 13",
  },
  {
    label: "Decisions",
    detail: "Times vary.",
    when: "Wed Sep 16 – Wed Sep 23",
  },
];

export const DUFFIELD_JOIN_URL =
  "https://www.duffield.cornell.edu/student-project-teams/join-a-project-team/";
export const APPDEV_APPLY_URL = "https://www.cornellappdev.com/apply";

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** One-line current status for landing / intel deadline chip. */
export function projectTeamDeadlineLine(
  club?: Pick<Club, "slug" | "name"> | null,
  now = new Date()
): string {
  const day = ymd(now);
  const slug = club?.slug ?? "";
  const name = (club?.name ?? "").toLowerCase();
  const isAppDev = slug === "cornell-appdev" || /\bappdev\b/.test(name);

  if (isAppDev) {
    if (day <= "2026-09-03") return "Core apps due Sep 3 · soph/junior/senior";
    if (day <= "2026-09-13") return "Interviews Sep 7–13 · decisions Sep 16–23";
    if (day <= "2026-09-23") return "Decisions Sep 16–23 · courses still open";
    return "Core apps closed · take a course, apply spring";
  }

  if (day <= "2026-09-03") return "Upperclass apps due Sep 3 · FY due Oct 15";
  if (day <= "2026-10-15") return "First-year + transfer apps due Oct 15";
  if (day <= "2026-11-02") return "FY offers from Nov 2 · spring opens Jan 4";
  return "Spring recruiting opens Jan 4";
}

export function projectTeamTracks(
  club?: Pick<Club, "slug" | "name"> | null
): TimelineTrack[] {
  const slug = club?.slug ?? "";
  const name = (club?.name ?? "").toLowerCase();
  if (slug === "cornell-appdev" || /\bappdev\b/.test(name)) {
    return [
      {
        id: "appdev-core",
        title: "AppDev core team · FA26",
        subtitle: "From cornellappdev.com/apply — sophomores, juniors, seniors",
        steps: APPDEV_FA26,
      },
    ];
  }
  return [
    {
      id: "upperclass",
      title: "Sophomores, juniors & seniors",
      subtitle: "Fall — earlier deadline · Duffield ESPT calendar",
      steps: PROJECT_TEAM_FALL_UPPERCLASS,
    },
    {
      id: "first-year",
      title: "First-year + transfer",
      subtitle: "Fall — later deadline (main FY push)",
      steps: PROJECT_TEAM_FALL_FIRST_YEAR,
    },
    {
      id: "spring",
      title: "Spring — all students",
      subtitle: "Shared timeline",
      steps: PROJECT_TEAM_SPRING_ALL,
    },
  ];
}
