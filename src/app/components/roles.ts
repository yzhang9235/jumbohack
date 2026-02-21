// src/roles.ts
import type { UserFormData } from "./types";
import { COURSES } from "./data/classes";
import { CLUBS_BY_CATEGORY } from "./data/clubs";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export interface CareerMatch {
  title: string;
  matchPercentage: number;
  whyMatches: string[];
  skillGaps: string[];
  nextSteps: {
    courses: string[];
    clubs: string[];
    skills: string[];
  };
}

type Role = {
  title: string;

  // Must match EXACT strings from SKILLS_BY_CATEGORY
  requiredSkills: string[];
  niceToHaveSkills: string[];

  // For course scoring + recommendations
  courseKeywords: string[]; // can be "CS ", "DATA ", "EC ", "MATH ", or specific like "CS 111"

  // For club scoring + recommendations
  clubKeywords: string[]; // substring matches
  recommendedClubCategories: string[];

  // Preference targets (0..100)
  preferenceTarget: {
    teamVsIndependent?: number; // higher = more team
    analyticalVsCreative?: number; // higher = more creative
    structuredVsFlexible?: number; // higher = more flexible
  };
};

const levelWeight: Record<SkillLevel, number> = {
  Beginner: 0.6,
  Intermediate: 0.85,
  Advanced: 1,
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function containsAny(haystack: string, needles: string[]) {
  const h = normalize(haystack);
  return needles.some((n) => h.includes(normalize(n)));
}

function skillMapFromUser(user: UserFormData): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of user.skills ?? []) {
    const lvl = (s.level as SkillLevel) || "Beginner";
    m.set(s.name, levelWeight[lvl] ?? 0.6);
  }
  return m;
}

function scoreSkills(role: Role, user: UserFormData) {
  const m = skillMapFromUser(user);

  const required = role.requiredSkills;
  const nice = role.niceToHaveSkills;

  const requiredHit = required.reduce((acc, sk) => acc + (m.get(sk) ?? 0), 0);
  const niceHit = nice.reduce((acc, sk) => acc + (m.get(sk) ?? 0), 0);

  const requiredMax = required.length || 1;
  const niceMax = nice.length || 1;

  const requiredPct = requiredHit / requiredMax;
  const nicePct = niceHit / niceMax;

  // make required matter more
  const combined = 0.72 * requiredPct + 0.28 * nicePct;

  const missingRequired = required.filter((sk) => !m.has(sk));
  const missingNice = nice.filter((sk) => !m.has(sk));

  return {
    skillScore01: clamp01(combined),
    missingRequired,
    missingNice,
    matchedRequired: required.filter((sk) => m.has(sk)),
    matchedNice: nice.filter((sk) => m.has(sk)),
  };
}

function scoreCourses(role: Role, user: UserFormData) {
  const taken = user.courses ?? [];
  const keywords = role.courseKeywords ?? [];
  if (keywords.length === 0) return { courseScore01: 0.5, matchedCourses: [] as string[] }; // neutral

  const matched = taken.filter((c) => containsAny(c, keywords));
  // cap so people with tons of courses don't dominate everything
  const pct = matched.length / Math.min(5, Math.max(1, keywords.length));
  return { courseScore01: clamp01(pct), matchedCourses: matched };
}

function scoreClubs(role: Role, user: UserFormData) {
  const clubs = user.clubs ?? [];
  const keywords = role.clubKeywords ?? [];
  if (keywords.length === 0) return { clubScore01: 0.5, matchedClubs: [] as string[] }; // neutral

  const matched = clubs.filter((c) => containsAny(c, keywords));
  const pct = matched.length / Math.min(3, Math.max(1, keywords.length));
  return { clubScore01: clamp01(pct), matchedClubs: matched };
}

function scorePreferences(role: Role, user: UserFormData) {
  const p = user.preferences;
  const t = role.preferenceTarget;
  const dims: Array<keyof typeof t> = [
    "teamVsIndependent",
    "analyticalVsCreative",
    "structuredVsFlexible",
  ];

  const scores: number[] = [];
  for (const d of dims) {
    const target = t[d];
    if (typeof target !== "number") continue;
    const userVal = p[d];
    const dist = Math.abs(userVal - target);
    scores.push(1 - dist / 100);
  }

  if (scores.length === 0) return 0.6;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return clamp01(avg);
}

function pickRecommendedCourses(user: UserFormData, keywords: string[], limit = 2) {
  const taken = new Set((user.courses ?? []).map(normalize));
  const picks: string[] = [];

  for (const kw of keywords) {
    const found = COURSES.find(
      (c) => normalize(c).includes(normalize(kw)) && !taken.has(normalize(c))
    );
    if (found && !picks.includes(found)) picks.push(found);
    if (picks.length >= limit) break;
  }
  return picks.slice(0, limit);
}

function flattenClubs(): string[] {
  return Object.values(CLUBS_BY_CATEGORY).flat();
}

function pickRecommendedClubs(role: Role, limit = 2) {
  const picks: string[] = [];
  const all = flattenClubs();

  // try keyword hits first
  for (const kw of role.clubKeywords) {
    const found = all.find((c) => normalize(c).includes(normalize(kw)));
    if (found && !picks.includes(found)) picks.push(found);
    if (picks.length >= limit) return picks;
  }

  // then categories
  for (const cat of role.recommendedClubCategories) {
    const list = (CLUBS_BY_CATEGORY as any)[cat] as string[] | undefined;
    if (!list) continue;
    for (const c of list) {
      if (!picks.includes(c)) picks.push(c);
      if (picks.length >= limit) return picks;
    }
  }

  return picks.slice(0, limit);
}

function buildWhy(role: Role, pieces: {
  matchedRequired: string[];
  matchedNice: string[];
  matchedCourses: string[];
  matchedClubs: string[];
  prefScore01: number;
}) {
  const why: string[] = [];

  if (pieces.matchedRequired.length > 0) {
    why.push(`You already have core skills: ${pieces.matchedRequired.slice(0, 3).join(", ")}`);
  }
  if (pieces.matchedCourses.length > 0) {
    why.push(`Your coursework aligns (${pieces.matchedCourses.slice(0, 2).join("; ")})`);
  }
  if (pieces.matchedClubs.length > 0) {
    why.push(`Your activities support this path (${pieces.matchedClubs.slice(0, 2).join("; ")})`);
  }
  if (pieces.matchedNice.length > 0) {
    why.push(`Nice-to-have strengths: ${pieces.matchedNice.slice(0, 3).join(", ")}`);
  }
  if (pieces.prefScore01 > 0.72) {
    why.push(`Your work-style preferences fit this role well`);
  }

  while (why.length < 3) {
    why.push("Your selected skills and interests map well to this role’s core responsibilities");
  }
  return why.slice(0, 4);
}

function unique(arr: string[]) {
  return Array.from(new Set(arr));
}

/** 60 roles */
export const ROLE_LIBRARY: Role[] = [
  // --- SOFTWARE / ENGINEERING ---
  { title: "Software Engineer", requiredSkills: ["Java", "Python", "Problem Solving"], niceToHaveSkills: ["JavaScript", "React", "APIs / REST / GraphQL", "SQL", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS ", "CS 15", "CS 40", "CS 111", "CS 160"], clubKeywords: ["JumboCode", "Women In Computer Science", "Robotics", "GNU/Linux", "Computer Science"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 65, structuredVsFlexible: 55, analyticalVsCreative: 40 } },
  { title: "Frontend Engineer", requiredSkills: ["JavaScript", "HTML/CSS", "React"], niceToHaveSkills: ["UI/UX Design", "APIs / REST / GraphQL", "Vue", "Angular"], courseKeywords: ["CS 20", "DIG ", "CS 171"], clubKeywords: ["Product Studio", "WIA", "JumboXR"], recommendedClubCategories: ["Pre-Professional & Academic", "Arts / Performance"], preferenceTarget: { analyticalVsCreative: 60, teamVsIndependent: 60 } },
  { title: "Backend Engineer", requiredSkills: ["Python", "Java", "APIs / REST / GraphQL"], niceToHaveSkills: ["SQL", "NoSQL (MongoDB, Cassandra)", "Cloud Computing (AWS/Azure/GCP)", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 111", "CS 110", "DATA 202"], clubKeywords: ["JumboCode", "GNU/Linux", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 45, teamVsIndependent: 65 } },
  { title: "Full-Stack Engineer", requiredSkills: ["JavaScript", "React", "APIs / REST / GraphQL"], niceToHaveSkills: ["SQL", "Cloud Computing (AWS/Azure/GCP)", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 20", "CS 111", "DATA 202"], clubKeywords: ["JumboCode", "Hack", "Product Studio"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 65, structuredVsFlexible: 55 } },
  { title: "Mobile Developer", requiredSkills: ["Mobile Development (iOS/Android/Flutter/React Native)", "JavaScript", "Problem Solving"], niceToHaveSkills: ["UI/UX Design", "APIs / REST / GraphQL", "React"], courseKeywords: ["CS 20", "CS ", "DIG "], clubKeywords: ["Product Studio", "JumboXR"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 55, structuredVsFlexible: 60 } },
  { title: "DevOps Engineer", requiredSkills: ["DevOps / CI-CD / Docker / Kubernetes", "Cloud Computing (AWS/Azure/GCP)", "Network Administration"], niceToHaveSkills: ["Python", "APIs / REST / GraphQL", "Cybersecurity / Penetration Testing"], courseKeywords: ["CS 110", "CS 111", "CS 122"], clubKeywords: ["GNU/Linux", "Engineering", "Robotics"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35, teamVsIndependent: 60 } },
  { title: "Site Reliability Engineer", requiredSkills: ["DevOps / CI-CD / Docker / Kubernetes", "Cloud Computing (AWS/Azure/GCP)", "Problem Solving"], niceToHaveSkills: ["Network Administration", "Cybersecurity / Penetration Testing", "Python"], courseKeywords: ["CS 111", "CS 122", "CS 110"], clubKeywords: ["GNU/Linux", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35, teamVsIndependent: 65 } },
  { title: "QA / Test Engineer", requiredSkills: ["Problem Solving", "Communication", "Project Management"], niceToHaveSkills: ["Python", "Java", "APIs / REST / GraphQL"], courseKeywords: ["CS ", "ENG ", "EM 51"], clubKeywords: ["Product Studio", "Engineers"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 40, teamVsIndependent: 70 } },
  { title: "Game Developer", requiredSkills: ["C++", "Problem Solving", "Collaboration"], niceToHaveSkills: ["UI/UX Design", "Animation / Motion Graphics", "JavaScript"], courseKeywords: ["CS 23", "CS ", "DIG "], clubKeywords: ["Gaming", "JumboXR"], recommendedClubCategories: ["Recreation", "Arts / Performance"], preferenceTarget: { analyticalVsCreative: 70, teamVsIndependent: 60 } },
  { title: "AR/VR Developer", requiredSkills: ["JavaScript", "Problem Solving", "Prototyping"], niceToHaveSkills: ["UI/UX Design", "3D", "Animation / Motion Graphics"], courseKeywords: ["DIG 150", "CS 132", "CS 171"], clubKeywords: ["JumboXR", "SIGGRAPH"], recommendedClubCategories: ["Arts / Performance", "Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 75, structuredVsFlexible: 60 } },

  // --- DATA / ANALYTICS ---
  { title: "Data Scientist", requiredSkills: ["Statistics", "Data Analysis", "SQL"], niceToHaveSkills: ["Machine Learning", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)", "Research Methods", "A/B Testing"], courseKeywords: ["DATA ", "DATA 100", "DATA 202", "MATH 165", "MATH 166"], clubKeywords: ["Baseball Analytics", "Data Corps", "Economics Society", "Investment"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 35, structuredVsFlexible: 45 } },
  { title: "Data Analyst", requiredSkills: ["Excel / Google Sheets", "Data Analysis", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)"], niceToHaveSkills: ["SQL", "Hypothesis Testing", "A/B Testing"], courseKeywords: ["DATA 100", "DATA 220", "EC 13"], clubKeywords: ["Consulting", "Investment", "Economics"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 50 } },
  { title: "Business Intelligence Analyst", requiredSkills: ["SQL", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)", "Analytics (Google Analytics)"], niceToHaveSkills: ["A/B Testing", "Statistics", "Business Strategy"], courseKeywords: ["DATA 202", "DATA 220", "EC "], clubKeywords: ["Consulting", "TAMID", "Investment"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 45, teamVsIndependent: 65 } },
  { title: "Machine Learning Engineer", requiredSkills: ["Python", "Machine Learning", "Data Wrangling"], niceToHaveSkills: ["Deep Learning", "Cloud Computing (AWS/Azure/GCP)", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 135", "CS 137", "CS 131", "DATA 297", "MATH 169"], clubKeywords: ["Artificial Intelligence Society", "AI Safety", "Robotics"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 45 } },
  { title: "AI Research Assistant", requiredSkills: ["Research Methods", "Python", "Statistics"], niceToHaveSkills: ["Machine Learning", "Deep Learning", "Experiment Design"], courseKeywords: ["CS 131", "CS 135", "DATA 297", "CS 93"], clubKeywords: ["ResearcHERS", "Artificial Intelligence"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 50 } },
  { title: "Data Engineer", requiredSkills: ["SQL", "Big Data (Hadoop, Spark)", "Data Wrangling"], niceToHaveSkills: ["Cloud Computing (AWS/Azure/GCP)", "NoSQL (MongoDB, Cassandra)", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["DATA 202", "CS 111", "CS 122"], clubKeywords: ["GNU/Linux", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35 } },
  { title: "Analytics Engineer", requiredSkills: ["SQL", "Data Analysis", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)"], niceToHaveSkills: ["A/B Testing", "Hypothesis Testing", "Cloud Computing (AWS/Azure/GCP)"], courseKeywords: ["DATA 202", "DATA 220", "EC 13"], clubKeywords: ["Consulting", "Investment"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 45 } },
  { title: "Quantitative Analyst", requiredSkills: ["Statistics", "Statistical Modeling", "Python"], niceToHaveSkills: ["Financial Analysis", "Machine Learning", "R"], courseKeywords: ["MATH 165", "MATH 166", "EC 24", "EC 150"], clubKeywords: ["Investment Club", "Financial Group"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 25, structuredVsFlexible: 35 } },
  { title: "Operations Analyst", requiredSkills: ["Excel / Google Sheets", "Problem Solving", "Communication"], niceToHaveSkills: ["SQL", "Project Management", "Data Analysis"], courseKeywords: ["EM ", "EC ", "DATA 100"], clubKeywords: ["Consulting", "Career Center"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35, teamVsIndependent: 70 } },
  { title: "Research Analyst", requiredSkills: ["Research Methods", "Experiment Design", "Communication"], niceToHaveSkills: ["Statistics", "Data Analysis", "R"], courseKeywords: ["PS 103", "SOC 100", "CS 179", "DATA 220"], clubKeywords: ["ResearcHERS", "Tisch"], recommendedClubCategories: ["Pre-Professional & Academic", "Advocacy"], preferenceTarget: { structuredVsFlexible: 50 } },

  // --- SECURITY ---
  { title: "Cybersecurity Analyst", requiredSkills: ["Cybersecurity / Penetration Testing", "Network Administration", "Problem Solving"], niceToHaveSkills: ["Cloud Computing (AWS/Azure/GCP)", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 28", "CS 114", "CS 116", "CS 183"], clubKeywords: ["Women in Cybersecurity", "GNU/Linux", "Security"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 20, structuredVsFlexible: 30 } },
  { title: "Security Engineer", requiredSkills: ["Cybersecurity / Penetration Testing", "Python", "Network Administration"], niceToHaveSkills: ["Cloud Computing (AWS/Azure/GCP)", "APIs / REST / GraphQL", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 114", "CS 116", "CS 111"], clubKeywords: ["Women in Cybersecurity", "GNU/Linux"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 30 } },
  { title: "Privacy Analyst", requiredSkills: ["Communication", "Critical Thinking", "Research Methods"], niceToHaveSkills: ["Cybersecurity / Penetration Testing", "Data Analysis", "Policy"], courseKeywords: ["CS 183", "PS 191", "PHIL 24"], clubKeywords: ["Tisch", "CARE"], recommendedClubCategories: ["Advocacy", "Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 35 } },

  // --- PRODUCT / DESIGN ---
  { title: "Product Manager", requiredSkills: ["Product Management", "Communication", "Market Research"], niceToHaveSkills: ["Project Management", "Agile / Scrum / Kanban", "Data Analysis", "Presentation Skills"], courseKeywords: ["CS 20", "ENT 101", "ENT 103", "TML ", "EC 50"], clubKeywords: ["Women in Product", "Product Studio", "Jumbo Ventures", "Consulting"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 75, analyticalVsCreative: 60, structuredVsFlexible: 55 } },
  { title: "Product Designer", requiredSkills: ["UI/UX Design", "Wireframing", "Prototyping"], niceToHaveSkills: ["Graphic Design (Photoshop, Illustrator, Figma, Sketch)", "Presentation Design", "Storytelling"], courseKeywords: ["CS 171", "DIG ", "GRA "], clubKeywords: ["WIA", "Design", "Art Galleries"], recommendedClubCategories: ["Arts / Performance", "Publication & Media"], preferenceTarget: { analyticalVsCreative: 80, structuredVsFlexible: 60 } },
  { title: "UX Researcher", requiredSkills: ["Research Methods", "Experiment Design", "Communication"], niceToHaveSkills: ["UI/UX Design", "A/B Testing", "Hypothesis Testing"], courseKeywords: ["CS 171", "CS 179", "PSY 32", "SOC 102"], clubKeywords: ["ResearcHERS", "Tisch"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 65 } },
  { title: "UI Engineer", requiredSkills: ["React", "JavaScript", "HTML/CSS"], niceToHaveSkills: ["UI/UX Design", "Prototyping", "APIs / REST / GraphQL"], courseKeywords: ["CS 20", "CS 171", "DIG "], clubKeywords: ["Product Studio", "WIA"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 65 } },
  { title: "Design Technologist", requiredSkills: ["Prototyping", "UI/UX Design", "JavaScript"], niceToHaveSkills: ["React", "Animation / Motion Graphics", "Storytelling"], courseKeywords: ["CS 171", "DIG 150", "MDIA "], clubKeywords: ["JumboXR", "SIGGRAPH"], recommendedClubCategories: ["Arts / Performance"], preferenceTarget: { analyticalVsCreative: 80, structuredVsFlexible: 70 } },

  // --- BUSINESS / CONSULTING / FINANCE ---
  { title: "Business Analyst", requiredSkills: ["Excel / Google Sheets", "Financial Analysis", "Communication"], niceToHaveSkills: ["SQL", "Statistics", "Competitive Analysis", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)"], courseKeywords: ["EC ", "EC 11", "EC 13", "EC 15", "DATA 100"], clubKeywords: ["Consulting", "Investment", "Financial Group", "TAMID"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 45, teamVsIndependent: 70 } },
  { title: "Management Consultant", requiredSkills: ["Problem Solving", "Communication", "Presentation Skills"], niceToHaveSkills: ["Business Strategy", "Market Research", "Excel / Google Sheets"], courseKeywords: ["EC ", "TML ", "ENT "], clubKeywords: ["180 Degrees", "Consulting", "TAMID"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 75 } },
  { title: "Investment Analyst", requiredSkills: ["Financial Analysis", "Excel / Google Sheets", "Critical Thinking"], niceToHaveSkills: ["Statistics", "Competitive Analysis", "Business Strategy"], courseKeywords: ["EC 50", "EC 150", "EC 155"], clubKeywords: ["Investment Club", "Financial Group"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 25, structuredVsFlexible: 40 } },
  { title: "Product Marketing Manager", requiredSkills: ["Marketing Strategy", "Communication", "Storytelling"], niceToHaveSkills: ["Analytics (Google Analytics)", "Market Research", "Presentation Skills"], courseKeywords: ["ENT 13", "ENT 105", "FMS 160"], clubKeywords: ["Her Campus", "Tufts Daily", "Marketing"], recommendedClubCategories: ["Publication & Media", "Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 70, teamVsIndependent: 70 } },
  { title: "Marketing Analyst", requiredSkills: ["Analytics (Google Analytics)", "Data Analysis", "Marketing Strategy"], niceToHaveSkills: ["A/B Testing", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)", "SEO"], courseKeywords: ["DATA 100", "ENT 13", "ENT 105"], clubKeywords: ["Her Campus", "Tufts Daily"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { structuredVsFlexible: 55 } },
  { title: "Growth Marketer", requiredSkills: ["Digital Marketing", "A/B Testing", "Analytics (Google Analytics)"], niceToHaveSkills: ["SEO", "SEM", "Copywriting"], courseKeywords: ["ENT 13", "ENT 105", "DATA 220"], clubKeywords: ["Her Campus", "Tufts Daily"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { structuredVsFlexible: 65, analyticalVsCreative: 70 } },
  { title: "Sales Engineer", requiredSkills: ["Communication", "Public Speaking", "Problem Solving"], niceToHaveSkills: ["Account Management", "Product Management", "Python"], courseKeywords: ["CS ", "TML 13", "ENT 13"], clubKeywords: ["Debate", "Entrepreneur"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 80, analyticalVsCreative: 55 } },
  { title: "Account Manager", requiredSkills: ["Account Management", "Communication", "Client Relations"], niceToHaveSkills: ["Negotiation", "Sales", "Presentation Skills"], courseKeywords: ["TML ", "ENT 13"], clubKeywords: ["Career Center", "The Women's Network"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 85 } },

  // --- CONTENT / MEDIA / CREATIVE ---
  { title: "Content Strategist", requiredSkills: ["Content Writing / Copywriting", "Storytelling", "Communication"], niceToHaveSkills: ["Branding / Visual Identity", "SEO", "Presentation Design"], courseKeywords: ["ENG ", "FMS ", "GRA "], clubKeywords: ["Tufts Daily", "Her Campus", "Observer"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { analyticalVsCreative: 80 } },
  { title: "Copywriter", requiredSkills: ["Content Writing / Copywriting", "Storytelling", "Communication"], niceToHaveSkills: ["Branding / Visual Identity", "Marketing Strategy"], courseKeywords: ["ENG ", "FMS "], clubKeywords: ["Tufts Daily", "Her Campus"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { analyticalVsCreative: 85 } },
  { title: "Social Media Manager", requiredSkills: ["Social Media Content Creation", "Communication", "Marketing Strategy"], niceToHaveSkills: ["Analytics (Google Analytics)", "Content Writing / Copywriting", "Branding / Visual Identity"], courseKeywords: ["ENT 13", "FMS 160"], clubKeywords: ["Her Campus", "Tufts Daily", "WMFO"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { structuredVsFlexible: 75, analyticalVsCreative: 80 } },
  { title: "Video Producer", requiredSkills: ["Video Editing (Premiere, Final Cut)", "Storytelling", "Project Management"], niceToHaveSkills: ["Animation / Motion Graphics", "Branding / Visual Identity"], courseKeywords: ["FMS 10", "FMS 150", "MDIA "], clubKeywords: ["TUTV", "WMFO"], recommendedClubCategories: ["Publication & Media", "Arts / Performance"], preferenceTarget: { analyticalVsCreative: 85 } },
  { title: "Graphic Designer", requiredSkills: ["Graphic Design (Photoshop, Illustrator, Figma, Sketch)", "Branding / Visual Identity", "Presentation Design"], niceToHaveSkills: ["Content Writing / Copywriting", "Storytelling"], courseKeywords: ["GRA ", "DIG "], clubKeywords: ["Design", "Arts"], recommendedClubCategories: ["Arts / Performance", "SMFA / Fenway Campus"], preferenceTarget: { analyticalVsCreative: 90 } },

  // --- PROJECT / OPS / PEOPLE ---
  { title: "Project Manager", requiredSkills: ["Project Management", "Communication", "Prioritization"], niceToHaveSkills: ["Agile / Scrum / Kanban", "Leadership", "Time Management"], courseKeywords: ["EM 51", "EM 62", "TML "], clubKeywords: ["Engineering Student Council", "Senate"], recommendedClubCategories: ["Pre-Professional & Academic", "Social & Programming"], preferenceTarget: { structuredVsFlexible: 35, teamVsIndependent: 80 } },
  { title: "Program Manager", requiredSkills: ["Leadership", "Communication", "Project Management"], niceToHaveSkills: ["Negotiation", "Conflict Resolution", "Agile / Scrum / Kanban"], courseKeywords: ["TML ", "EM "], clubKeywords: ["TCU", "ESC", "Tisch"], recommendedClubCategories: ["Social & Programming", "Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 85 } },
  { title: "Operations Coordinator", requiredSkills: ["Coordination", "Communication", "Time Management"], niceToHaveSkills: ["Event Planning", "Project Management", "Collaboration"], courseKeywords: ["TML ", "EM "], clubKeywords: ["TCU", "Office"], recommendedClubCategories: ["Social & Programming", "University Department"], preferenceTarget: { teamVsIndependent: 85, structuredVsFlexible: 55 } },
  { title: "People Operations Associate", requiredSkills: ["Communication", "Collaboration", "Conflict Resolution"], niceToHaveSkills: ["Project Management", "Coaching", "Mentorship"], courseKeywords: ["PSY ", "SOC "], clubKeywords: ["The Women's Network", "Mentor"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 90, analyticalVsCreative: 60 } },

  // --- HEALTH / BIO / POLICY (since your course list includes CH/BIO/etc) ---
  { title: "Public Health Analyst", requiredSkills: ["Research Methods", "Data Analysis", "Communication"], niceToHaveSkills: ["Statistics", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)", "Experiment Design"], courseKeywords: ["CH ", "CEE 52", "CH 131"], clubKeywords: ["Public Health", "UNICEF", "Doctors Without Borders"], recommendedClubCategories: ["Advocacy", "Community Service"], preferenceTarget: { teamVsIndependent: 70 } },
  { title: "Healthcare Data Analyst", requiredSkills: ["Data Analysis", "Statistics", "Excel / Google Sheets"], niceToHaveSkills: ["SQL", "Data Visualization (Tableau, PowerBI, Matplotlib, Seaborn)", "Research Methods"], courseKeywords: ["CH 131", "DATA 100", "CH 116"], clubKeywords: ["MEDLIFE", "Public Health"], recommendedClubCategories: ["Community Service"], preferenceTarget: { structuredVsFlexible: 50 } },
  { title: "Clinical Research Coordinator", requiredSkills: ["Coordination", "Research Methods", "Communication"], niceToHaveSkills: ["Experiment Design", "Statistics", "Time Management"], courseKeywords: ["BIO ", "CH ", "PSY "], clubKeywords: ["MEDLIFE", "Doctors Without Borders"], recommendedClubCategories: ["Community Service"], preferenceTarget: { structuredVsFlexible: 45, teamVsIndependent: 85 } },
  { title: "Biomedical Engineer (Entry)", requiredSkills: ["Problem Solving", "Communication", "Project Management"], niceToHaveSkills: ["Python", "Data Analysis", "Research Methods"], courseKeywords: ["BME ", "CHBE ", "CEE "], clubKeywords: ["Engineers Without Borders", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 40 } },
  { title: "Biostatistician (Entry)", requiredSkills: ["Statistics", "Statistical Modeling", "Research Methods"], niceToHaveSkills: ["R", "SAS", "Data Analysis"], courseKeywords: ["CH 116", "CEE 6", "MATH 166"], clubKeywords: ["Public Health", "ResearcHERS"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 40 } },

  // --- POLICY / CIVIC / NONPROFIT ---
  { title: "Policy Analyst", requiredSkills: ["Research Methods", "Critical Thinking", "Communication"], niceToHaveSkills: ["Data Analysis", "Presentation Skills", "Storytelling"], courseKeywords: ["PS ", "CVS ", "SOC "], clubKeywords: ["Tisch", "CIVIC", "Jumbos for Nonprofits"], recommendedClubCategories: ["Advocacy", "Political"], preferenceTarget: { teamVsIndependent: 70 } },
  { title: "Nonprofit Program Associate", requiredSkills: ["Coordination", "Communication", "Collaboration"], niceToHaveSkills: ["Project Management", "Event Planning", "Grant"], courseKeywords: ["CVS ", "SOC "], clubKeywords: ["Jumbos for Nonprofits", "LCS"], recommendedClubCategories: ["Community Service", "Leonard Carmichael Society (LCS)"], preferenceTarget: { teamVsIndependent: 85 } },

  { title: "Technical Product Manager", requiredSkills: ["Product Management", "Communication", "Problem Solving"], niceToHaveSkills: ["Data Analysis", "APIs / REST / GraphQL", "Agile / Scrum / Kanban"], courseKeywords: ["CS ", "DATA 202", "ENT "], clubKeywords: ["Women in Product", "Product Studio"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 80 } },
  { title: "Solutions Architect (Entry)", requiredSkills: ["Cloud Computing (AWS/Azure/GCP)", "Communication", "Problem Solving"], niceToHaveSkills: ["APIs / REST / GraphQL", "DevOps / CI-CD / Docker / Kubernetes", "Network Administration"], courseKeywords: ["CS 111", "CS 110", "CS 122"], clubKeywords: ["Engineering", "GNU/Linux"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 75 } },
  { title: "Cloud Engineer", requiredSkills: ["Cloud Computing (AWS/Azure/GCP)", "DevOps / CI-CD / Docker / Kubernetes", "Python"], niceToHaveSkills: ["Network Administration", "Cybersecurity / Penetration Testing"], courseKeywords: ["CS 110", "CS 111"], clubKeywords: ["GNU/Linux", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 40 } },
  { title: "Database Administrator (Entry)", requiredSkills: ["SQL", "Network Administration", "Problem Solving"], niceToHaveSkills: ["NoSQL (MongoDB, Cassandra)", "Cloud Computing (AWS/Azure/GCP)"], courseKeywords: ["DATA 202", "CS 111"], clubKeywords: ["GNU/Linux"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35 } },
  { title: "Technical Writer", requiredSkills: ["Communication", "Content Writing / Copywriting", "Presentation Skills"], niceToHaveSkills: ["APIs / REST / GraphQL", "Python", "Storytelling"], courseKeywords: ["ENG ", "CS ", "FMS "], clubKeywords: ["Tufts Daily", "Observer"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { analyticalVsCreative: 70 } },
  { title: "Customer Success Manager", requiredSkills: ["Client Relations", "Communication", "Problem Solving"], niceToHaveSkills: ["Account Management", "Project Management", "Product Management"], courseKeywords: ["TML ", "ENT "], clubKeywords: ["Career Center"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 90 } },
  { title: "Community Manager", requiredSkills: ["Communication", "Event Planning", "Collaboration"], niceToHaveSkills: ["Social Media Content Creation", "Storytelling"], courseKeywords: ["CVS ", "ENT "], clubKeywords: ["TCU", "Tisch"], recommendedClubCategories: ["Social & Programming"], preferenceTarget: { teamVsIndependent: 90, structuredVsFlexible: 70 } },
  { title: "Event Planner", requiredSkills: ["Event Planning", "Coordination", "Time Management"], niceToHaveSkills: ["Budgeting", "Communication", "Negotiation"], courseKeywords: ["TML ", "ENT "], clubKeywords: ["Programming Board", "TCU"], recommendedClubCategories: ["Social & Programming"], preferenceTarget: { structuredVsFlexible: 70, teamVsIndependent: 85 } },
  { title: "Entrepreneur / Startup Founder", requiredSkills: ["Leadership", "Problem Solving", "Communication"], niceToHaveSkills: ["Marketing Strategy", "Product Management", "Business Strategy"], courseKeywords: ["ENT ", "EC 50"], clubKeywords: ["Jumbo Ventures", "Entrepreneur"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 80, analyticalVsCreative: 80 } },

  { title: "UI/UX Designer", requiredSkills: ["UI/UX Design", "Wireframing", "Prototyping"], niceToHaveSkills: ["Graphic Design (Photoshop, Illustrator, Figma, Sketch)", "Presentation Design"], courseKeywords: ["CS 171", "DIG ", "GRA "], clubKeywords: ["WIA", "Photography"], recommendedClubCategories: ["Arts / Performance"], preferenceTarget: { analyticalVsCreative: 85 } },
  { title: "Brand Designer", requiredSkills: ["Branding / Visual Identity", "Graphic Design (Photoshop, Illustrator, Figma, Sketch)", "Storytelling"], niceToHaveSkills: ["Marketing Strategy", "Presentation Design"], courseKeywords: ["GRA ", "FMS 160"], clubKeywords: ["Arts", "Design"], recommendedClubCategories: ["Arts / Performance", "SMFA / Fenway Campus"], preferenceTarget: { analyticalVsCreative: 90 } },
  { title: "SEO Specialist", requiredSkills: ["SEO", "Content Writing / Copywriting", "Analytics (Google Analytics)"], niceToHaveSkills: ["SEM", "Marketing Strategy"], courseKeywords: ["ENT 13", "ENT 105"], clubKeywords: ["Her Campus", "Tufts Daily"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { structuredVsFlexible: 70 } },
  { title: "SEM Specialist", requiredSkills: ["SEM", "Analytics (Google Analytics)", "Marketing Strategy"], niceToHaveSkills: ["A/B Testing", "Copywriting"], courseKeywords: ["ENT 13", "DATA 220"], clubKeywords: ["Her Campus"], recommendedClubCategories: ["Publication & Media"], preferenceTarget: { structuredVsFlexible: 70 } },
  { title: "Market Research Analyst", requiredSkills: ["Market Research", "Communication", "Research Methods"], niceToHaveSkills: ["Data Analysis", "Statistics", "Consumer Insights"], courseKeywords: ["EC ", "PS 103", "SOC 100"], clubKeywords: ["Consulting", "TAMID"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 55 } },
  { title: "Strategy Analyst", requiredSkills: ["Business Strategy", "Critical Thinking", "Communication"], niceToHaveSkills: ["Competitive Analysis", "Market Research", "Excel / Google Sheets"], courseKeywords: ["EC ", "TML "], clubKeywords: ["Consulting"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 70 } },
  { title: "Finance Analyst", requiredSkills: ["Financial Analysis", "Budgeting", "Excel / Google Sheets"], niceToHaveSkills: ["Forecasting", "Statistics"], courseKeywords: ["EC 50", "EC 150"], clubKeywords: ["Investment Club", "Financial Group"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 40 } },
  { title: "Operations Manager (Entry)", requiredSkills: ["Leadership", "Project Management", "Problem Solving"], niceToHaveSkills: ["Prioritization", "Time Management", "Communication"], courseKeywords: ["EM ", "TML "], clubKeywords: ["ESC", "TCU"], recommendedClubCategories: ["Social & Programming"], preferenceTarget: { teamVsIndependent: 85 } },
  { title: "Business Development Rep", requiredSkills: ["Sales", "Communication", "Public Speaking"], niceToHaveSkills: ["Account Management", "Negotiation", "Marketing Strategy"], courseKeywords: ["ENT 13", "TML "], clubKeywords: ["Debate", "Entrepreneur"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 90 } },
  { title: "Recruiter (Entry)", requiredSkills: ["Communication", "Collaboration", "Time Management"], niceToHaveSkills: ["Negotiation", "Client Relations"], courseKeywords: ["PSY ", "SOC "], clubKeywords: ["Career Center"], recommendedClubCategories: ["University Department"], preferenceTarget: { teamVsIndependent: 90 } },

  { title: "Network Engineer", requiredSkills: ["Network Administration", "Problem Solving", "Cybersecurity / Penetration Testing"], niceToHaveSkills: ["Cloud Computing (AWS/Azure/GCP)", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 111", "CS 114"], clubKeywords: ["GNU/Linux", "Security"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35 } },
  { title: "IT Support Specialist", requiredSkills: ["Customer Service", "Problem Solving", "Communication"], niceToHaveSkills: ["Network Administration", "Cybersecurity / Penetration Testing"], courseKeywords: ["CS ", "EE "], clubKeywords: ["Tech"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { teamVsIndependent: 70 } },
  { title: "Systems Engineer", requiredSkills: ["C++", "Problem Solving", "Python"], niceToHaveSkills: ["Network Administration", "DevOps / CI-CD / Docker / Kubernetes"], courseKeywords: ["CS 40", "CS 111", "CS 122"], clubKeywords: ["Engineering", "Robotics"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 35 } },
  { title: "Embedded Systems Engineer", requiredSkills: ["C++", "Problem Solving", "Python"], niceToHaveSkills: ["Network Administration", "Project Management"], courseKeywords: ["EE 14", "EE 21", "CS 40"], clubKeywords: ["Robotics", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 40 } },
  { title: "Robotics Engineer (Entry)", requiredSkills: ["Python", "Problem Solving", "Statistics"], niceToHaveSkills: ["Machine Learning", "C++", "Experiment Design"], courseKeywords: ["CS 141", "CS 135", "ME 134"], clubKeywords: ["Robotics", "Engineering"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 55 } },
  { title: "Computer Vision Engineer", requiredSkills: ["Python", "Machine Learning", "Deep Learning"], niceToHaveSkills: ["Data Wrangling", "Cloud Computing (AWS/Azure/GCP)"], courseKeywords: ["CS 132", "CS 137"], clubKeywords: ["Artificial Intelligence"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { analyticalVsCreative: 60 } },
  { title: "Research Assistant (General)", requiredSkills: ["Research Methods", "Communication", "Time Management"], niceToHaveSkills: ["Data Analysis", "Statistics", "Presentation Skills"], courseKeywords: ["Directed Study", "Independent Study", "Seminar"], clubKeywords: ["ResearcHERS"], recommendedClubCategories: ["Pre-Professional & Academic"], preferenceTarget: { structuredVsFlexible: 55 } },
  { title: "Teaching Assistant / Tutor", requiredSkills: ["Teaching", "Communication", "Mentorship"], niceToHaveSkills: ["Public Speaking", "Leadership"], courseKeywords: ["ENG ", "CS ", "MATH "], clubKeywords: ["Tutors", "Tutoring"], recommendedClubCategories: ["Community Service"], preferenceTarget: { teamVsIndependent: 75 } },

];

export function generateCareerMatches(user: UserFormData, limit = 3): CareerMatch[] {
  const results: CareerMatch[] = [];

  for (const role of ROLE_LIBRARY) {
    const skills = scoreSkills(role, user);
    const courses = scoreCourses(role, user);
    const clubs = scoreClubs(role, user);
    const pref = scorePreferences(role, user);

    // weights
    const score01 = 0.55 * skills.skillScore01 + 0.22 * courses.courseScore01 + 0.11 * clubs.clubScore01 + 0.12 * pref;

    // friendly scoring band like your demo (60..98)
    const pct = Math.round(60 + 38 * clamp01(score01));

    const skillGaps = unique([
      ...skills.missingRequired.slice(0, 3),
      ...skills.missingNice.slice(0, 2),
    ]).slice(0, 4);

    const nextCourses = pickRecommendedCourses(user, role.courseKeywords, 2);
    const nextClubs = pickRecommendedClubs(role, 2);

    const nextSkills =
      skillGaps.length > 0
        ? skillGaps
        : role.niceToHaveSkills.filter((s) => !(user.skills ?? []).some((us) => us.name === s)).slice(0, 3);

    const whyMatches = buildWhy(role, {
      matchedRequired: skills.matchedRequired,
      matchedNice: skills.matchedNice,
      matchedCourses: courses.matchedCourses,
      matchedClubs: clubs.matchedClubs,
      prefScore01: pref,
    });

    results.push({
      title: role.title,
      matchPercentage: pct,
      whyMatches,
      skillGaps: skillGaps.length ? skillGaps : ["Add 1–2 role-specific skills to strengthen fit"],
      nextSteps: {
        courses: nextCourses,
        clubs: nextClubs,
        skills: nextSkills,
      },
    });
  }

  return results.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, limit);
}