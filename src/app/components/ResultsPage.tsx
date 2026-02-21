// src/app/components/ResultsPage.tsx
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ChevronDown, ChevronUp, ArrowLeft, Target, Lightbulb } from "lucide-react";

import type { UserFormData } from "./types";
import { generateCareerMatches } from "./roles";

interface ResultsPageProps {
  userFormData: UserFormData;
  onBack: () => void;
}

export function ResultsPage({ userFormData, onBack }: ResultsPageProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Get matches from roles.ts
  const careerMatches = generateCareerMatches(userFormData, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50/30 to-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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

          <p className="text-slate-500">Based on your courses, skills, and preferences</p>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {careerMatches.map((match, index) => (
            <Card
              key={index}
              className="p-6 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Title + Score */}
                <div className="flex items-start justify-between">
                  <div>
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

                <Progress value={match.matchPercentage} className="h-2" />

                {/* Why Matches */}
                <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm text-slate-700">Why This Matches You</h3>
                  </div>

                  <ul className="space-y-2">
                    {match.whyMatches.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expand Button */}
                <button
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                  className="w-full flex items-center justify-between pt-4 border-t border-slate-200/60 text-slate-600 hover:text-slate-700"
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

                {/* Expanded Content */}
                {expandedCard === index && (
                  <div className="space-y-6 pt-4 border-t border-slate-200/60">
                    {/* Skill Gaps */}
                    <div className="bg-amber-50/50 p-5 rounded-lg border border-amber-200/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <h3 className="text-sm text-slate-700">Skill Gaps to Address</h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {match.skillGaps.map((gap, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 bg-white text-amber-700 rounded-full text-sm border border-amber-200"
                          >
                            {gap}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200/50">
                      <h3 className="text-sm text-slate-700 mb-4">Next Steps</h3>

                      {/* Courses */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">📚 Recommended Courses</p>
                        {match.nextSteps.courses.map((course, i) => (
                          <div
                            key={i}
                            className="text-sm text-slate-600 pl-3 border-l-2 border-blue-300 py-1"
                          >
                            {course}
                          </div>
                        ))}
                      </div>

                      {/* Clubs */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">👥 Clubs to Join</p>
                        <div className="flex flex-wrap gap-2">
                          {match.nextSteps.clubs.map((club, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-white text-slate-700 rounded-full text-sm border border-slate-200"
                            >
                              {club}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skills */}
                      <div>
                        <p className="text-xs text-slate-500 mb-2">⚡ Skills to Build</p>
                        <div className="flex flex-wrap gap-2">
                          {match.nextSteps.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-white text-slate-700 rounded-full text-sm border border-slate-200"
                            >
                              {skill}
                            </span>
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

        {/* Footer */}
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
