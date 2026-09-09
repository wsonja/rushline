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

/** The track that matters right now — collapsed UI shows this one, not all three. */
export function projectTeamActiveTrack(
  club?: Pick<Club, "slug" | "name"> | null,
  now = new Date()
): TimelineTrack {
  const tracks = projectTeamTracks(club);
  if (tracks.length === 1) return tracks[0];
  const day = ymd(now);
  if (day <= "2026-09-03") return tracks[0];
  if (day <= "2026-10-15") return tracks[1];
  return tracks[2];
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

type ClubRef = Pick<Club, "school" | "slug" | "name"> | null | undefined;

function isCornellClub(club: ClubRef): boolean {
  if (!club) return false;
  const school = (club.school ?? "").toLowerCase();
  return !school || school === "cornell";
}

type BizCalendar = {
  slugs: string[];
  matchName: (name: string) => boolean;
  sourceUrl: string;
  sourceLabel: string;
  deadlineLine: (day: string) => string;
  tracks: TimelineTrack[];
};

function findBizCalendar(club: ClubRef): BizCalendar | null {
  if (!isCornellClub(club)) return null;
  const slug = club?.slug ?? "";
  const name = (club?.name ?? "").toLowerCase();
  return (
    BIZ_CALENDARS.find((c) => c.slugs.includes(slug) || c.matchName(name)) ?? null
  );
}

function until(day: string, checkpoints: { until: string; text: string }[], fallback: string): string {
  for (const c of checkpoints) {
    if (day <= c.until) return c.text;
  }
  return fallback;
}

const BIZ_CALENDARS: BizCalendar[] = [
  // --- Consulting (top 10) ---
  {
    slugs: ["cornell-consulting-club-ccc", "cornell-consulting-club", "cornell-consulting"],
    matchName: (n) => /\bcornell consulting club\b/.test(n) || (/\bconsulting club\b/.test(n) && !/group|180|social|healthcare|technology|design/.test(n)),
    sourceUrl: "https://www.cornellconsultingclub.org/apply",
    sourceLabel: "cornellconsultingclub.org/apply",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-15", text: "Apps due Sep 15 · frosh/soph" },
          { until: "2026-09-30", text: "Interviews after Sep 15 · watch email" },
        ],
        "FA26 apps closed · check site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Freshman or sophomore · cornellconsultingclub.org/apply",
        steps: [
          { label: "Applications due", detail: "Fall ’26 app live. Frosh/soph, all colleges.", when: "Tue Sep 15 · 11:59 p.m." },
          { label: "Round 1", detail: "Group case + behavioral / light technical. Decisions same day.", when: "Invite only" },
          { label: "Final round", detail: "Extended case presentation, case interview, behavioral. Decisions same day.", when: "Invite only" },
        ],
      },
      {
        id: "events",
        title: "Before you apply",
        subtitle: "Coffee chats + workshops encouraged — calendar on the apply page",
        steps: [
          { label: "Interest form + coffee chats", detail: "Sign up on the apply page; chats with current members.", when: "Open now" },
          { label: "Resume / casing workshops", detail: "Casual prep before interview rounds.", when: "See apply calendar" },
          { label: "Info sessions", detail: "Club overview + meet members.", when: "See apply calendar" },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-consulting-group-ccg", "cornell-consulting-group"],
    matchName: (n) => /\bconsulting group\b/.test(n) || /\bccg\b/.test(n),
    sourceUrl: "https://www.cornellconsultinggroup.org/why-ccg",
    sourceLabel: "cornellconsultinggroup.org",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-16", text: "Apps due Sep 16 · R1 Sep 19" },
          { until: "2026-09-19", text: "Round 1 Sat Sep 19 · invite only" },
          { until: "2026-09-20", text: "Final round Sun Sep 20" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Freshman or sophomore · app closes Sep 16",
        steps: [
          { label: "Applications due", detail: "Non-rolling. Status by EOD Fri Sep 18.", when: "Wed Sep 16 · 11:59 p.m." },
          { label: "Round 1", detail: "Personal / get-to-know-you. Assigned slot if invited.", when: "Sat Sep 19 · invite only" },
          { label: "Final round", detail: "Quant case + qualitative case + behavioral.", when: "Sun Sep 20 · invite only" },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Coffee chats on /why-ccg · questions to David Diao (dd668)",
        steps: [
          { label: "Consulting Crash Course", detail: "SBC x CC x CCG · Goldwin Smith G132", when: "Tue Sep 1 · 5:30–6:30 p.m." },
          { label: "Resume review w/ PGN", detail: "Statler 445", when: "Wed Sep 2 · 4–5:30 p.m." },
          { label: "Info session #1", detail: "Mann 102", when: "Thu Sep 10 · 7:30–8:30 p.m." },
          { label: "Info session #2", detail: "Mann 102", when: "Mon Sep 14 · 5:30–6:30 p.m." },
          { label: "Case interview workshop", detail: "MVR 1153", when: "Wed Sep 16 · 6:30–7:30 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["180-degrees-consulting-at-cornell", "180-degrees-consulting-cornell", "180-degrees-consulting"],
    matchName: (n) => /180\s*degrees/.test(n) || /\b180dc\b/.test(n),
    sourceUrl: "https://www.cornell180dc.org/recruitment",
    sourceLabel: "cornell180dc.org/recruitment",
    deadlineLine: () => "Coffee chats open · FA26 dates on IG @cornell180dc",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Calendar not posted on site — follow @cornell180dc",
        steps: [
          { label: "Coffee chats", detail: "General chats open; diversity chats closed.", when: "Open now" },
          { label: "Application", detail: "FA26 dates unpublished on /recruitment.", when: "TBD" },
          { label: "Interviews", detail: "Behavioral + sample case (Sun Blocked) on the site.", when: "TBD" },
        ],
      },
    ],
  },
  {
    slugs: ["social-business-consulting-sbc", "social-business-consulting"],
    matchName: (n) => /social business consulting/.test(n) || (/\bsbc\b/.test(n) && /consult/.test(n)),
    sourceUrl: "https://www.sbccornell.org/apply",
    sourceLabel: "sbccornell.org/apply",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-16", text: "Apps due Sep 16 · R1 Sep 18" },
          { until: "2026-09-18", text: "Round 1 Sep 18 · invite only" },
          { until: "2026-09-20", text: "Round 2 Sep 20 · invite only" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Frosh/soph · sbccornell.org/apply",
        steps: [
          { label: "Applications due", detail: "Resume drop + short questions.", when: "Wed Sep 16 · 11:59 p.m." },
          { label: "Round 1", detail: "Behavioral + logical reasoning. Invite only.", when: "Fri Sep 18" },
          { label: "Round 2", detail: "Case — problem-solving, collaboration, communication.", when: "Sun Sep 20" },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Coffee chats + info sessions strongly encouraged",
        steps: [
          { label: "Info session #1", detail: "Location TBA", when: "Mon Sep 8 · 7–8:30 p.m." },
          { label: "Casual mocktail hour", detail: "Location TBA", when: "Wed Sep 10 · 5–7 p.m." },
          { label: "Resume + behaviorals workshop", detail: "Location TBA", when: "Mon Sep 15 · 6–7:30 p.m." },
          { label: "Info session #2", detail: "Location TBA", when: "Mon Sep 14 · 6–7:30 p.m." },
          { label: "Casing for social impact", detail: "Location TBA", when: "Wed Sep 16 · 6–8 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["international-business-consulting-ibc", "international-business-consulting"],
    matchName: (n) => /international business consulting/.test(n) || /\bibc\b/.test(n),
    sourceUrl: "https://cornellibc.com/recruitment",
    sourceLabel: "cornellibc.com/recruitment",
    deadlineLine: (day) =>
      until(
        day,
        [{ until: "2026-09-12", text: "Coffee chats through Sep 12 · apply on site" }],
        "FA26 app on site · event times on Instagram"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Analyst app + coffee chats live · full grid is a graphic on /recruitment",
        steps: [
          { label: "Coffee chats", detail: "Sign-up on /recruitment.", when: "Through Fri Sep 12" },
          { label: "Analyst application", detail: "Fall 2026 form is live.", when: "Open now" },
          { label: "Interviews", detail: "Both rounds: behavioral + market sizing + formal case.", when: "See Instagram" },
        ],
      },
    ],
  },
  {
    slugs: ["cayuga-healthcare-consulting", "cayuga-healthcare-consulting-chc"],
    matchName: (n) => /cayuga healthcare/.test(n) || (/\bchc\b/.test(n) && /health|consult/.test(n)),
    sourceUrl: "https://www.cayugahealthcareconsulting.org/apply",
    sourceLabel: "cayugahealthcareconsulting.org/apply",
    deadlineLine: () => "FA26 apps open · calendar graphic on /apply",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Recruitment open — dates are on the /apply graphic + @cayugahealthcareconsulting",
        steps: [
          { label: "Coffee chats", detail: "Request form on /apply.", when: "Open now" },
          { label: "Application", detail: "Form live on /apply.", when: "Open now" },
          { label: "Interviews", detail: "Typical CHC: R1 group case + round-robin; R2 individual case.", when: "See /apply graphic" },
        ],
      },
    ],
  },
  {
    slugs: ["consult-your-community-at-cornell-cyc", "consult-your-community-cornell", "consult-your-community"],
    matchName: (n) => /consult your community/.test(n) || (/\bcyc\b/.test(n) && /consult|cornell/.test(n)),
    sourceUrl: "https://www.cornellconsultyourcommunity.org/apply",
    sourceLabel: "cornellconsultyourcommunity.org/apply",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-17", text: "Apps due Sep 17 · interviews Sep 19–20" },
          { until: "2026-09-20", text: "Interviews Sep 19–20 · invite only" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "cornellconsultyourcommunity.org/apply",
        steps: [
          { label: "Applications due", detail: "Resume drop + short responses, then resume screen.", when: "Thu Sep 17 · 11:59 p.m." },
          { label: "Round 1", detail: "Background + why CYC. Business casual.", when: "Sat Sep 19 – Sun Sep 20" },
          { label: "Final round", detail: "Case + team activity. Same weekend if invited.", when: "Sat Sep 19 – Sun Sep 20" },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Coffee chats Aug 20 – Sep 15",
        steps: [
          { label: "Info session #1", detail: "Plant Science 139", when: "Thu Sep 3 · 5 p.m." },
          { label: "Resume & casing workshop", detail: "Plant Science 138", when: "Wed Sep 9 · 5 p.m." },
          { label: "Info session #2", detail: "Plant Science 139", when: "Tue Sep 15 · 5 p.m." },
          { label: "Speed dating", detail: "Location TBA", when: "Wed Sep 16 · 6 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["design-consulting-at-cornell-dcc", "design-consulting-cornell-dcc", "design-consulting-cornell"],
    matchName: (n) => /design consulting/.test(n) || (/\bdcc\b/.test(n) && /design|consult/.test(n)),
    sourceUrl: "https://www.designconsultingcornell.com/apply",
    sourceLabel: "designconsultingcornell.com/apply",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-15", text: "Apps due Sep 15 · interviews Sep 20" },
          { until: "2026-09-20", text: "Interviews Sep 20 · keep the day free" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Apps Aug 24 – Sep 15",
        steps: [
          { label: "Applications due", detail: "Submit by 11:59 p.m.", when: "Mon Sep 15 · 11:59 p.m." },
          { label: "Interviews", detail: "They reach out if selected. Keep the day free.", when: "Sat Sep 20" },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Coffee chats via the team directory",
        steps: [
          { label: "Info session #2", detail: "Statler 198", when: "Mon Sep 8 · 5–6 p.m." },
          { label: "Whiteboard workshop w/ DTI", detail: "Hollister 401 — design technical round", when: "Thu Sep 11 · 5–6 p.m." },
          { label: "Whiteboard workshop #2", detail: "eHub Kennedy", when: "Sun Sep 14 · 5–6 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["social-enterprise-group-cornell-segc", "social-enterprise-group-at-cornell", "social-enterprise-group-cornell"],
    matchName: (n) => /social enterprise/.test(n) || /\bsegc\b/.test(n),
    sourceUrl: "https://www.socialenterprisegroupatcornell.com/apply",
    sourceLabel: "socialenterprisegroupatcornell.com/apply",
    deadlineLine: () => "Coffee chats open · FA26 apps opening soon",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Apps not open yet — coffee chats live",
        steps: [
          { label: "Coffee chats", detail: "Sign-up on /apply.", when: "Open now" },
          { label: "Written application", detail: "Why SEGC / why social impact / dream client.", when: "Opening soon" },
          { label: "Interview", detail: "Behavioral (STAR) + chart + mini-case. Campus casual.", when: "Invite only" },
        ],
      },
    ],
  },
  {
    slugs: ["global-research-consulting-cornell", "global-research-consulting", "grc-cornell"],
    matchName: (n) => /global research consulting/.test(n) || (/\bgrc\b/.test(n) && /consult|cornell/.test(n)),
    sourceUrl: "https://www.grccornell.org/apply",
    sourceLabel: "grccornell.org/apply",
    deadlineLine: () => "FA26 calendar not posted · coffee chats on /apply",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Site still describes the last cycle — do not treat old dates as live",
        steps: [
          { label: "Coffee chats", detail: "Form linked from /apply when a cycle is open.", when: "Check site" },
          { label: "Application", detail: "Frosh, soph, first-semester junior. All majors.", when: "TBD" },
          { label: "Interviews", detail: "Case + behavioral + group case.", when: "TBD" },
        ],
      },
    ],
  },
  // --- Finance (top 10) ---
  {
    slugs: ["cornell-investment-banking-club-cibc", "cornell-investment-banking-club", "cornell-ib"],
    matchName: (n) => /investment banking/.test(n) || /\bcibc\b/.test(n),
    sourceUrl: "https://www.cornell-ib.com/recruitment",
    sourceLabel: "cornell-ib.com/recruitment",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-12", text: "Coffee chats close Sep 12 · apps due Sep 16" },
          { until: "2026-09-16", text: "Apps due Sep 16 · 11:59 p.m." },
        ],
        "FA26 apps closed · watch site for next cycle"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "cornell-ib.com/recruitment",
        steps: [
          { label: "Coffee chats close", detail: "Request form on /recruitment.", when: "Fri Sep 12" },
          { label: "Applications due", detail: "Fall 2026 analyst app.", when: "Wed Sep 16 · 11:59 p.m." },
          { label: "Interviews", detail: "Invite-only rounds — times unpublished on the page.", when: "Watch Instagram" },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Locations TBA — follow for live updates",
        steps: [
          { label: "Resume tips & review", detail: "Location TBD", when: "Fri Sep 4 · 5–6:30 p.m." },
          { label: "Behaviorals & markets workshop", detail: "Location TBD", when: "Fri Sep 11 · 5:30–7 p.m." },
          { label: "Info session #1", detail: "Location TBD", when: "Mon Sep 14 · 7–8 p.m." },
          { label: "Info session #2", detail: "Location TBD", when: "Wed Sep 16 · 5:30–6:30 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-investments-club", "cornell-investments-club-cic"],
    matchName: (n) => /investments club/.test(n) && !/mutual/.test(n),
    sourceUrl: "https://www.cornellinvestmentsclub.com/application",
    sourceLabel: "cornellinvestmentsclub.com/application",
    deadlineLine: () => "Coffee chats open · FA26 apps opening soon",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Distinct from MICC (Mutual Investment Club)",
        steps: [
          { label: "Coffee chats", detail: "Form on /application.", when: "Open now" },
          { label: "Applications", detail: "Page says FA26 apps will open soon — no dated grid yet.", when: "Opening soon" },
          { label: "Interviews", detail: "Typical CIC: invite-only R1 then R2 after the written app.", when: "TBD" },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-private-equity-club", "cornell-private-equity-club-cpec"],
    matchName: (n) => /private equity/.test(n) || /\bcpec\b/.test(n),
    sourceUrl: "https://cornellprivateequityclub.com/recruitment",
    sourceLabel: "cornellprivateequityclub.com/recruitment",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-07", text: "Info #1 tonight · R1 Sep 17" },
          { until: "2026-09-15", text: "Info #2 Sep 15 · R1 Sep 17" },
          { until: "2026-09-17", text: "Round 1 Sep 17 · invite only" },
          { until: "2026-09-18", text: "Round 2 Sep 18 · invite only" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "App deadline not listed — interviews Sep 17–18",
        steps: [
          { label: "Info session #1", detail: "STL 351", when: "Mon Sep 7 · 7 p.m." },
          { label: "Info session #2", detail: "STL 391", when: "Tue Sep 15 · 6 p.m." },
          { label: "Round 1", detail: "Invite only · STL TBD", when: "Thu Sep 17 · 6 p.m." },
          { label: "Round 2", detail: "Invite only", when: "Fri Sep 18 · 6 p.m." },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Coffee chat request + email list on /recruitment",
        steps: [
          { label: "Breaking into professional clubs", detail: "Ives 305", when: "Thu Sep 3 · 6 p.m." },
          { label: "Breaking into PE", detail: "STL 351", when: "Tue Sep 8 · 7 p.m." },
          { label: "Resume review", detail: "STL 391", when: "Thu Sep 10 · 5 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-venture-capital-cvc", "cornell-venture-capital"],
    matchName: (n) => /venture capital/.test(n) && !/entrepreneur/.test(n),
    sourceUrl: "https://cornellvc.com/join/",
    sourceLabel: "cornellvc.com/join",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-14", text: "Apps due Sep 14 · 11:59 p.m. ET" },
          { until: "2026-09-30", text: "Apps closed · watch email for interviews" },
        ],
        "FA26 apps closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Applications open · due Mon Sep 14",
        steps: [
          { label: "Info session #1", detail: "Time on cornellvc.com/join calendar", when: "Tue Sep 8 · 7:30–9 p.m." },
          { label: "Info session #2", detail: "", when: "Thu Sep 10 · 5–6:30 p.m." },
          { label: "Interview workshop", detail: "", when: "Sun Sep 13 · 5–7 p.m." },
          { label: "Applications due", detail: "Fall 2026 analyst app.", when: "Mon Sep 14 · 11:59 p.m. ET" },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-alternative-investments-cai", "cornell-alternative-investments"],
    matchName: (n) => /alternative investments/.test(n) || (/\bcai\b/.test(n) && /invest|cornell/.test(n)),
    sourceUrl: "https://www.cornellalternativeinvestments.org/join",
    sourceLabel: "cornellalternativeinvestments.org/join",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-14", text: "Apps close Sep 14 · R1 Sep 16" },
          { until: "2026-09-16", text: "Round 1 Sep 16 · invite only" },
          { until: "2026-09-18", text: "Round 2 Sep 18 · invite only" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Apps opened Sep 2",
        steps: [
          { label: "Applications close", detail: "", when: "Sun Sep 14" },
          { label: "Round 1", detail: "Invite only", when: "Tue Sep 16" },
          { label: "Round 2", detail: "Invite only", when: "Thu Sep 18" },
        ],
      },
      {
        id: "events",
        title: "Events",
        subtitle: "Coffee chat form on /join",
        steps: [
          { label: "Info session I", detail: "Statler 165", when: "Wed Sep 2 · 6:30–8:30 p.m." },
          { label: "Let’s Talk Business", detail: "Statler 396", when: "Tue Sep 8 · 5–6:30 p.m." },
          { label: "Info session II", detail: "Location TBD", when: "Thu Sep 10 · 5:30–7 p.m." },
          { label: "Resume review", detail: "Location TBD", when: "Sun Sep 14 · 7–9 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["mutual-investment-club-of-cornell", "mutual-investment-club-cornell", "cornell-micc"],
    matchName: (n) => /mutual investment/.test(n) || /\bmicc\b/.test(n),
    sourceUrl: "https://www.cornellmicc.com/recruitment",
    sourceLabel: "cornellmicc.com/recruitment",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-09", text: "Apps due Sep 9 · R1 Sep 11" },
          { until: "2026-09-11", text: "Round 1 Sep 11 · invite only" },
          { until: "2026-09-16", text: "Round 2 Sep 16 · invite only" },
        ],
        "FA26 cycle closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "App opened Sep 1 · distinct from Investments Club (CIC)",
        steps: [
          { label: "Info session #2", detail: "Location TBD", when: "Wed Sep 9 · 5–6 p.m." },
          { label: "Applications due", detail: "Link under Resources on /recruitment.", when: "Wed Sep 9 · 11:59 p.m." },
          { label: "Round 1", detail: "Invite only", when: "Fri Sep 11" },
          { label: "Round 2", detail: "Invite only", when: "Wed Sep 16" },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-alpha-fund", "alpha-fund-cornell"],
    matchName: (n) => /alpha fund/.test(n),
    sourceUrl: "https://cornellalphafund.org/recruitment",
    sourceLabel: "cornellalphafund.org/recruitment",
    deadlineLine: (day) =>
      until(
        day,
        [
          { until: "2026-09-15", text: "Coffee chats close Sep 15 · apps Sep 16 7pm" },
          { until: "2026-09-16", text: "Apps close Sep 16 · 7 p.m." },
        ],
        "FA26 apps closed · watch site for spring"
      ),
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Apps open Sep 4 7pm – Sep 16 7pm",
        steps: [
          { label: "Info session #1", detail: "Warren 101", when: "Wed Sep 9 · 7–9 p.m." },
          { label: "Info session #2", detail: "Warren B73", when: "Fri Sep 11 · 4:30–6 p.m." },
          { label: "Coffee chats close", detail: "Book on /recruitment", when: "Mon Sep 15 · 11:59 p.m." },
          { label: "Applications close", detail: "Opened Sep 4 at 7 p.m.", when: "Tue Sep 16 · 7 p.m." },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-hedge-fund", "cornell-hedge-fund-club"],
    matchName: (n) => /hedge fund/.test(n),
    sourceUrl: "https://www.cornellhedgefund.org/apply",
    sourceLabel: "cornellhedgefund.org/apply",
    deadlineLine: () => "Coffee chats open · dated grid not on /apply",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Any person, any study — prior finance not required",
        steps: [
          { label: "Coffee chats", detail: "Open on /apply. Recruitment guide linked there.", when: "Open now" },
          { label: "Application", detail: "Fall 2026 application section is on /apply.", when: "See /apply" },
          { label: "Interviews", detail: "Multi-round after resume drop — exact dates unpublished.", when: "TBD" },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-capital-club"],
    matchName: (n) => /capital club/.test(n),
    sourceUrl: "https://www.cornellcapitalclub.com/apply",
    sourceLabel: "cornellcapitalclub.com/apply",
    deadlineLine: () => "Apps locked · coffee chats + mailing list",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Written app still locked (page still says Fall 2025 closed)",
        steps: [
          { label: "Coffee chats", detail: "CTA stays live while the app is locked.", when: "Open now" },
          { label: "Mailing list", detail: "Join on /apply for the open-gate notice.", when: "Open now" },
          { label: "Application", detail: "They say gates open soon — no FA26 deadline posted.", when: "TBD" },
          { label: "Onboarding", detail: "10-week NME after accept.", when: "After offers" },
        ],
      },
    ],
  },
  {
    slugs: ["alpha-kappa-psi-akpsi", "alpha-kappa-psi", "akpsi"],
    matchName: (n) => /alpha kappa psi/.test(n) || /\bakpsi\b/.test(n),
    sourceUrl: "https://www.cornellakpsi.org/",
    sourceLabel: "cornellakpsi.org · @akpsicornell",
    deadlineLine: () => "Coffee chats + Rush Night · dates on @akpsicornell",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "Professional business fraternity — frosh/soph/junior, all majors. Public steps only.",
        steps: [
          { label: "Coffee chats", detail: "1:1s with brothers. Primary on-ramp before the written app.", when: "See @akpsicornell" },
          { label: "Rush Night", detail: "Highly encouraged. Meet the chapter; times post on IG.", when: "See @akpsicornell" },
          { label: "Application", detail: "Opens with the rush cycle. No dated grid on the site right now.", when: "Watch IG" },
          { label: "Interviews", detail: "Invite-only rounds after the app. Exact format unpublished.", when: "Invite only" },
        ],
      },
    ],
  },
  {
    slugs: ["cornell-venture-and-entrepreneurship-club-cvec", "cornell-venture-entrepreneurs-cvec", "cornell-venture-entrepreneurs"],
    matchName: (n) => /venture and entrepreneurship/.test(n) || /\bcvec\b/.test(n),
    sourceUrl: "https://cornellcvec.org/recruitment",
    sourceLabel: "cornellcvec.org/recruitment",
    deadlineLine: () => "Coffee chats open · FA26 apps opening soon",
    tracks: [
      {
        id: "fa26",
        title: "Fall ’26",
        subtitle: "IA (investment analysis) vs SD (startup development) desks",
        steps: [
          { label: "Coffee chats", detail: "One-on-ones to learn projects + the app process.", when: "Open now" },
          { label: "Applications", detail: "Site says Fall 2026 apps are opening soon.", when: "Opening soon" },
          { label: "Interviews", detail: "Format unpublished — watch IG @cvec_cornell_venture_and_eship.", when: "TBD" },
        ],
      },
    ],
  },
];

export function hasRecruitingTimeline(club: ClubRef): boolean {
  return isCornellProjectTeam(club) || Boolean(findBizCalendar(club));
}

export function recruitingDeadlineLine(club: ClubRef, now = new Date()): string | null {
  if (isCornellProjectTeam(club)) return projectTeamDeadlineLine(club, now);
  const cal = findBizCalendar(club);
  return cal ? cal.deadlineLine(ymd(now)) : null;
}

export function recruitingTracks(club: ClubRef): TimelineTrack[] {
  if (isCornellProjectTeam(club)) return projectTeamTracks(club);
  return findBizCalendar(club)?.tracks ?? [];
}

export function recruitingActiveTrack(club: ClubRef, now = new Date()): TimelineTrack | null {
  if (isCornellProjectTeam(club)) return projectTeamActiveTrack(club, now);
  const tracks = findBizCalendar(club)?.tracks;
  return tracks?.[0] ?? null;
}

export function recruitingSource(
  club: ClubRef
): { url: string; label: string } | null {
  if (isCornellProjectTeam(club)) {
    const slug = club?.slug ?? "";
    const name = (club?.name ?? "").toLowerCase();
    if (slug === "cornell-appdev" || /\bappdev\b/.test(name)) {
      return { url: APPDEV_APPLY_URL, label: "cornellappdev.com/apply" };
    }
    return { url: DUFFIELD_JOIN_URL, label: "Duffield calendar" };
  }
  const cal = findBizCalendar(club);
  return cal ? { url: cal.sourceUrl, label: cal.sourceLabel } : null;
}
