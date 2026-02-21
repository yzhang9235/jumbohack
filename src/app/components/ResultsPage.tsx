import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Target,
  Lightbulb,
} from "lucide-react";
import { useState } from "react";
import type { UserFormData } from "./types";

interface ResultsPageProps {
  userFormData: UserFormData;
  onBack: () => void;
}

interface CareerMatch {
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

export function ResultsPage({ userFormData, onBack }: ResultsPageProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const generateMatches = (): CareerMatch[] => {
    const hasComputerScience = userFormData.courses.some((c) =>
      c.toLowerCase().includes("comp")
    );
    const hasEcon = userFormData.courses.some((c) =>
      c.toLowerCase().includes("econ")
    );
    const hasDataSkills = userFormData.skills.some((s) =>
      s.name.toLowerCase().includes("data")
    );
    const isTeamOriented = userFormData.preferences.teamVsIndependent > 60;
    const isCreative = userFormData.preferences.analyticalVsCreative > 60;

    const matches: CareerMatch[] = [];

    if (hasComputerScience || hasDataSkills) {
      matches.push({
        title: "Software Engineer",
        matchPercentage: 92,
        whyMatches: [
          "Strong foundation in data structures and programming",
          "Technical courses align with software development",
          "Problem-solving skills demonstrated through coursework",
        ],
        skillGaps: ["System design", "Advanced algorithms", "Cloud architecture"],
        nextSteps: {
          courses: [
            "COMP 117: Internet-Scale Distributed Systems",
            "COMP 160: Algorithms",
          ],
          clubs: ["Tufts Computer Science Society", "Hackathon Team"],
          skills: ["Docker/Kubernetes", "AWS/Cloud platforms", "CI/CD pipelines"],
        },
      });
    }

    if (
      hasDataSkills ||
      userFormData.skills.some((s) => s.name.includes("Statistical"))
    ) {
      matches.push({
        title: "Data Scientist",
        matchPercentage: 88,
        whyMatches: [
          "Strong analytical and statistical background",
          "Data analysis skills match core requirements",
          "Mathematical coursework provides solid foundation",
        ],
        skillGaps: ["Machine learning", "Deep learning frameworks", "SQL optimization"],
        nextSteps: {
          courses: ["COMP 135: Machine Learning", "MATH 136: Statistics"],
          clubs: ["Data Science Club", "Analytics Group"],
          skills: ["TensorFlow/PyTorch", "Advanced SQL", "Big data tools (Spark)"],
        },
      });
    }

    if (isTeamOriented && userFormData.clubs.length > 0) {
      matches.push({
        title: "Product Manager",
        matchPercentage: 85,
        whyMatches: [
          "Strong team collaboration preference",
          "Leadership experience through clubs and activities",
          "Balance of technical and creative thinking",
        ],
        skillGaps: ["Product strategy", "User research methods", "Roadmap planning"],
        nextSteps: {
          courses: ["COMP 20: Web Development", "ECON 155: Industrial Organization"],
          clubs: ["Entrepreneurship Society", "Product Club"],
          skills: ["Agile methodologies", "User research", "A/B testing"],
        },
      });
    }

    if (hasEcon || userFormData.clubs.some((c) => c.includes("Investment"))) {
      matches.push({
        title: "Business Analyst",
        matchPercentage: 83,
        whyMatches: [
          "Economics background provides strong business foundation",
          "Analytical skills align with data-driven decision making",
          "Interest in business and finance demonstrated",
        ],
        skillGaps: ["Advanced Excel/modeling", "SQL", "Business intelligence tools"],
        nextSteps: {
          courses: ["ECON 154: Econometrics", "COMP 150: Business Analytics"],
          clubs: ["Tufts Consulting Collective", "Investment Club"],
          skills: ["Tableau/Power BI", "Financial modeling", "SQL"],
        },
      });
    }

    if (isCreative) {
      matches.push({
        title: "UX/UI Designer",
        matchPercentage: 81,
        whyMatches: [
          "Creative preference matches design work",
          "Balance of technical and creative skills",
          "User-centered thinking demonstrated",
        ],
        skillGaps: ["Design systems", "User testing", "Accessibility standards"],
        nextSteps: {
          courses: ["COMP 20: Web Development", "COMP 171: Human-Computer Interaction"],
          clubs: ["Design Club", "Arts Society"],
          skills: ["Figma/Sketch", "User research", "Prototyping tools"],
        },
      });
    }

    return matches.slice(0, 3);
  };

  const careerMatches = generateMatches();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50/30 to-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mb-4 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Form
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl opacity-60">🐘</span>
            <h1 className="text-4xl text-slate-700">Your Top Career Matches</h1>
          </div>

          <p className="text-slate-500">
            Based on your courses, skills, and preferences
          </p>
        </div>

        <div className="space-y-6">
          {careerMatches.map((match, index) => (
            <Card
              key={index}
              className="p-6 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl border border-slate-200/60"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl text-slate-700 mb-2">{match.title}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">Match Score</span>
                      <span className="text-2xl text-blue-600">{match.matchPercentage}%</span>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-blue-100/70 text-blue-700 rounded-full text-sm border border-blue-200/50">
                    #{index + 1} Match
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress value={match.matchPercentage} className="h-2" />
                </div>

                <div className="pt-4 bg-blue-50/30 p-4 rounded-lg border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm text-slate-700">Why This Matches You</h3>
                  </div>

                  <ul className="space-y-2">
                    {match.whyMatches.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                  className="w-full flex items-center justify-between pt-4 border-t border-slate-200/60 text-slate-600 hover:text-slate-700 transition-colors"
                >
                  <span className="text-sm">
                    {expandedCard === index ? "Hide details" : "Show skill gaps & next steps"}
                  </span>
                  {expandedCard === index ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {expandedCard === index && (
                  <div className="space-y-6 pt-4 border-t border-slate-200/60">
                    <div className="bg-amber-50/50 p-5 rounded-lg border border-amber-200/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <h3 className="text-sm text-slate-700">Skill Gaps to Address</h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {match.skillGaps.map((gap, i) => (
                          <div
                            key={i}
                            className="px-3 py-1.5 bg-white text-amber-700 rounded-full text-sm border border-amber-200"
                          >
                            {gap}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200/50">
                      <h3 className="text-sm text-slate-700 mb-4">Next Steps</h3>

                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">📚 Recommended Courses</p>
                        <div className="space-y-2">
                          {match.nextSteps.courses.map((course, i) => (
                            <div
                              key={i}
                              className="text-sm text-slate-600 pl-3 border-l-2 border-blue-300 py-1"
                            >
                              {course}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">👥 Clubs to Join</p>
                        <div className="flex flex-wrap gap-2">
                          {match.nextSteps.clubs.map((club, i) => (
                            <div
                              key={i}
                              className="px-3 py-1.5 bg-white text-slate-700 rounded-full text-sm border border-slate-200"
                            >
                              {club}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-2">⚡ Skills to Build</p>
                        <div className="flex flex-wrap gap-2">
                          {match.nextSteps.skills.map((skill, i) => (
                            <div
                              key={i}
                              className="px-3 py-1.5 bg-white text-slate-700 rounded-full text-sm border border-slate-200"
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Update My Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}