// Import TypeScript type that describes user's form answers 
import type { UserFormData } from "./types";
// Import list of courses used for recommending courses the user hasn't take
import { COURSES } from "./data/classes";
// Import an object that groups name by category 
import { CLUBS_BY_CATEGORY } from "./data/clubs";
import ROLE_DATA from "./data/roles.json";
// Skill level must be one of these
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

// What ResultPage expects for each career match 
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

// ─── JSON role shape ───────────────────────────────────────────────────────────
// Defines what a Role contains 
interface RoleJSON {
  id: string;
  title: string;
  description: string;
  /** Skill name → weight (0..1). Higher = more important to this role. */
  skills01: Record<string, number>;
  /** Course name/prefix → weight (0..1) */
  courses01: Record<string, number>;
  /** Club name → weight (0..1) */
  clubs01: Record<string, number>;
    // Preference targets for the role (0..100)
  idealPreferences: {
    teamVsIndependent?: number;       // higher = more team
    analyticalVsCreative?: number;    // higher = more creative
    structuredVsFlexible?: number;    // higher = more flexible
  };
  scoringWeights: {
    skills: number;
    courses: number;
    clubs: number;
    preferences: number;
  };
}

const ROLES = ROLE_DATA as RoleJSON[];

// ─── Helpers ───────────────────────────────────────────────────────────────────

  // Converts a user's declared skill level into a numeric weight
const levelWeight: Record<SkillLevel, number> = {
  Beginner: 0.6,
  Intermediate: 0.85,
  Advanced: 1,
};

// Normalize a string for comparsion (trim spaces + lowercase)
function normalize(s: string) {
  return s.trim().toLowerCase();
}

// Force a number into range 0 - 1
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Build a map from skill name to numeric weight based on skill level 
// Ex: Python change to 1 if Advanced selected
function skillMapFromUser(user: UserFormData): Map<string, number> {
  
  // User skill might be underfined so default to empty array
  const m = new Map<string, number>();
  for (const s of user.skills ?? []) {
        // Cast level into skilllevel
    const lvl = (s.level as SkillLevel) || "Beginner";
    // Store weight for that skill name (if not recongized default to beginner)
    m.set(s.name, levelWeight[lvl] ?? 0.6);
  }
    // return map so scoring can quickly be check if user has a skill and at what level 
  return m;
}

// ─── Scoring functions ─────────────────────────────────────────────────────────

/**
 * Skills score using importance-weighted matching.
 *
 * For each skill in skills01 we compute:
 *   contribution = roleWeight * userProficiencyWeight   (if user has the skill)
 *   contribution = 0                                    (if user lacks it)
 *
 * Score = Σ contributions / Σ roleWeights  (i.e. a weighted hit rate)
 */

// Score how well user's skills match a role's required or good to have skills 
function scoreSkills(role: RoleJSON, user: UserFormData) {
  // skill -> weight for fast lookup (map)
  const userSkillMap = skillMapFromUser(user);
  const entries = Object.entries(role.skills01);

  let weightedHits = 0;
  let totalWeight = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const [skillName, roleWeight] of entries) {
    totalWeight += roleWeight;
    const userWeight = userSkillMap.get(skillName);
    if (userWeight !== undefined) {
      weightedHits += roleWeight * userWeight;
      matchedSkills.push(skillName);
    } else {
      missingSkills.push(skillName);
    }
  }

  const skillScore01 = totalWeight > 0 ? clamp01(weightedHits / totalWeight) : 0;

  // Sort missing skills by their role importance so we surface the most
  // impactful gaps first.
  const sortedMissing = missingSkills.sort(
    (a, b) => (role.skills01[b] ?? 0) - (role.skills01[a] ?? 0)
  );

  return { skillScore01, matchedSkills, missingSkills: sortedMissing };
}

/**
 * Course score: for each course the user has taken, check whether any key in
 * courses01 is a substring of the course name (case-insensitive). Accumulate
 * the weight of the best-matching role key.
 */
// Score how well the user's course match the role's course keywords
function scoreCourses(role: RoleJSON, user: UserFormData) {
    // List of course string the user taken 
  const taken = user.courses ?? [];
  // Keywords that represent what courses matter for this role
  const roleKeys = Object.keys(role.courses01);

  // If the role has no keywords, return neutral score
  if (roleKeys.length === 0) return { courseScore01: 0.5, matchedCourses: [] as string[] };

  let weightedHits = 0;
  let totalWeight = 0;
  const matchedCourses: string[] = [];

  // Track which role keys have already been "claimed" to avoid double-counting.
  const claimedKeys = new Set<string>();

  for (const course of taken) {
    const cNorm = normalize(course);
    for (const key of roleKeys) {
      if (!claimedKeys.has(key) && cNorm.includes(normalize(key))) {
        weightedHits += role.courses01[key];
        matchedCourses.push(course);
        claimedKeys.add(key);
        break; // each taken course counts once
      }
    }
  }

  // Total weight = sum of all role course weights
  for (const w of Object.values(role.courses01)) totalWeight += w;

  // Cap at 1 so someone who took every relevant course doesn't dominate
  const courseScore01 = totalWeight > 0 ? clamp01(weightedHits / totalWeight) : 0.5;

  return { courseScore01, matchedCourses };
}

/**
 * Club score: exact name matching against clubs01 keys.
 */
// Score how well the user's clubs match the role's club keywords
function scoreClubs(role: RoleJSON, user: UserFormData) {
  // Club user selected
  const userClubs = user.clubs ?? [];
  // Club keywords for the role
  const roleKeys = Object.keys(role.clubs01);

  // If no keywords, return neutral score
  if (roleKeys.length === 0) return { clubScore01: 0.5, matchedClubs: [] as string[] };

  let weightedHits = 0;
  let totalWeight = 0;
  const matchedClubs: string[] = [];

  const userClubSet = new Set(userClubs.map(normalize));

  for (const [clubName, roleWeight] of Object.entries(role.clubs01)) {
    totalWeight += roleWeight;
    if (userClubSet.has(normalize(clubName))) {
      weightedHits += roleWeight;
      matchedClubs.push(clubName);
    }
  }

  const clubScore01 = totalWeight > 0 ? clamp01(weightedHits / totalWeight) : 0.5;

    // return list of matched clubs
  return { clubScore01, matchedClubs };
}

/**
 * Preference score: compare user slider values against the role's ideal
 * preference targets. Returns a 0..1 value.
 */
// Score how close the user's preference are to the role's target preferences
function scorePreferences(role: RoleJSON, user: UserFormData): number {
      // User perference value
  const t = role.idealPreferences;
    // Roles target perference value 
  const p = user.preferences;
  // Preference dimensions we check 
  const dims: Array<keyof typeof t> = [
    "teamVsIndependent",
    "analyticalVsCreative",
    "structuredVsFlexible",
  ];

    // Compute score for each dimension and average them 
  const scores: number[] = [];
  for (const d of dims) {
    // Target value for this dimension
    const target = t[d];
    if (typeof target !== "number") continue;
      // User's value for that dimension
    const userVal = p[d];
      // Distance between user and target (o means perfect match!)
    const dist = Math.abs(userVal - target);
      //Convert distance to similarity (1-0)
    scores.push(1 - dist / 100);
  }

  // If role didn't define any targets, return a slightly-positive default
  if (scores.length === 0) return 0.6;

  // Average across dimensions 
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return clamp01(avg);
}

// ─── Recommendation helpers ────────────────────────────────────────────────────

// Pick course recommendations that match role keywords and the users hasn't taken
function pickRecommendedCourses(
  user: UserFormData,
  courseKeys: string[],
  limit = 2
): string[] {
  const taken = new Set((user.courses ?? []).map(normalize));
  // Building recommendation list 
  const picks: string[] = [];

  // For each keyword, find the first course in courses that includes that keyword
  for (const kw of courseKeys) {
    const found = COURSES.find(
      (c) => normalize(c).includes(normalize(kw)) && !taken.has(normalize(c))
    );
    // Add if course found and not already added 
    if (found && !picks.includes(found)) picks.push(found);
    // stop when we reach the desired number of recommendations 
    if (picks.length >= limit) break;
  }
    // Return the limit items
  return picks.slice(0, limit);
}

// Make clubs-by-category object into one big list of club names
function flattenClubs(): string[] {
  return Object.values(CLUBS_BY_CATEGORY).flat();
}

// Pick club recommendations for the role (first keyword, then category)
function pickRecommendedClubs(role: RoleJSON, limit = 2): string[] {
  // Building recommednations here 
  const picks: string[] = [];
  // All clubs in one lists for searching 
  const all = flattenClubs();
  const allNorm = new Set(all.map(normalize));

  // First: clubs explicitly listed in clubs01, sorted by weight descending
  const sortedClubKeys = Object.entries(role.clubs01)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  // try to recommend clubs that match clubKeywords
  // Add clubs from that category until we hit limit  
  for (const name of sortedClubKeys) {
    if (allNorm.has(normalize(name)) && !picks.includes(name)) {
      picks.push(name);
    }
    if (picks.length >= limit) return picks;
  }

  // If not enough, return whatever collected 
  return picks.slice(0, limit);
}

// Build the Why this Matches you bullet points 
function buildWhy(
  role: RoleJSON,
  pieces: {
    matchedSkills: string[];
    matchedCourses: string[];
    matchedClubs: string[];
    prefScore01: number;
  }
): string[] {
  // start with empty list of reasons 
  const why: string[] = [];

  // If user has relevant skills
  if (pieces.matchedSkills.length > 0) {
    // Surface the highest-importance matched skills
    const topSkills = pieces.matchedSkills
      .sort((a, b) => (role.skills01[b] ?? 0) - (role.skills01[a] ?? 0))
      .slice(0, 3);
    why.push(`You already have key skills: ${topSkills.join(", ")}`);
  }
  // If user has relevant courses
  if (pieces.matchedCourses.length > 0) {
    why.push(
      `Your coursework aligns (${pieces.matchedCourses.slice(0, 2).join("; ")})`
    );
  }
  // If user has relevant clubs
  if (pieces.matchedClubs.length > 0) {
    why.push(
      `Your activities support this path (${pieces.matchedClubs.slice(0, 2).join("; ")})`
    );
  }
      // If preference match is strong
  if (pieces.prefScore01 > 0.72) {
    why.push("Your work-style preferences fit this role well");
  }

  // Ensure always output at least three reasons
  while (why.length < 3) {
    why.push(
      "Your selected skills and interests map well to this role's core responsibilities"
    );
  }
    // Litmit to at most 4 bullet points 
  return why.slice(0, 4);
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function generateCareerMatches(
  user: UserFormData,
  limit = 3
): CareerMatch[] {
  // Collect matches for every role in role 
  const results: CareerMatch[] = [];

  // Loop through each role and compute a score for the user 
  for (const role of ROLES) {
    // Compute skill match + missing skills
    const skillResult = scoreSkills(role, user);
    // Compute course match + matched courses
    const courseResult = scoreCourses(role, user);
    // Compute club match + matched clubs
    const clubResult = scoreClubs(role, user);
    // Compute preferences similiarity score (0...1)
    const prefScore01 = scorePreferences(role, user);

    // Weighted composite score using per-role weights
    const w = role.scoringWeights;
    const score01 = clamp01(
      w.skills * skillResult.skillScore01 +
        w.courses * courseResult.courseScore01 +
        w.clubs * clubResult.clubScore01 +
        w.preferences * prefScore01
    );

    // Map 0..1 → 60..98 for a friendly display percentage
    const matchPercentage = Math.round(60 + 38 * score01);

    // Skill gaps: missing skills, prioritised by role importance, capped at 4
    // Build skill gap list and remove duplicates 
    const skillGaps = unique(skillResult.missingSkills).slice(0, 4);

    // Next-step recommendations
    const courseKeywords = Object.keys(role.courses01);
    // recommend courses based on the role's course keywords
    const nextCourses = pickRecommendedCourses(user, courseKeywords, 2);
    // Recommend clubs basd on role keywords/categories 
    const nextClubs = pickRecommendedClubs(role, 2);

    // Decide what skills to build should show 
    // If we have skill gaps, use those. else suggest a few nice to have skill
    const nextSkills =
      skillGaps.length > 0
        ? skillGaps
        : Object.keys(role.skills01)
            .filter((s) => !(user.skills ?? []).some((us) => us.name === s))
            .slice(0, 3);

    // Create explanation bullets for why this role match user 
    const whyMatches = buildWhy(role, {
      matchedSkills: skillResult.matchedSkills,
      matchedCourses: courseResult.matchedCourses,
      matchedClubs: clubResult.matchedClubs,
      prefScore01,
    });

    // Add a finalized Career Match object for this role into the result list 
    results.push({
      title: role.title,
      matchPercentage,
      whyMatches,
      skillGaps: skillGaps.length
        ? skillGaps
        : ["Add 1–2 role-specific skills to strengthen fit"],
      nextSteps: {
        courses: nextCourses,
        clubs: nextClubs,
        skills: nextSkills,
      },
    });
  }

  // Sort matches highest->lowest and return the top limit results 
  return results
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, limit);
}

// Re-export role list for any component that needs titles/descriptions
export { ROLES as ROLE_LIBRARY };
export type { RoleJSON };