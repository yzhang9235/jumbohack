
// UseState let the component remember something (state) when the user interacts
// with it 
// Use to remember which card (career match) is expanded
import { useState } from "react";

// Connect with UI components 
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

// Showing different icons from the library
import { ChevronDown, ChevronUp, ArrowLeft, Target, Lightbulb } from "lucide-react";

// Import the different files in the folder
import type { UserFormData } from "./types";

// Import function that takes user's answer and return career matches
/* keeps career matching from roles*/
import { generateCareerMatches } from "./roles";

// Properties expected by ResultsPage 
interface ResultsPageProps {
  userFormData: UserFormData; // Collected answers from the form 
  onBack: () => void;         // Makes the page go back to the previous page when click the back buttom 
  onReset: () => void; 
}

export function ResultsPage({ userFormData, onBack, onReset}: ResultsPageProps) {
  // creates expandedcard that either stores a number of null
  // setExpandedCard is the function call to change it 
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Return top three matches 
  /* Result is career match (array) including title, matchPercentage, why, 
   skill and next steps */
  const careerMatches = generateCareerMatches(userFormData, 3);

  // Export results as a downloadable file (no server needed)
function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// Export as JSON (best for saving + re-importing later)
function handleExportJSON() {
  const exportData = {
    exportedAt: new Date().toISOString(),
    userFormData,
    topMatches: careerMatches,
  };

  downloadFile(
    "career-results.json",
    JSON.stringify(exportData, null, 2),
    "application/json"
  );
}

// Export as text (easy for students to read/share)
function handleExportTXT() {
  const lines: string[] = [];

  lines.push("Your Top Career Matches");
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push("");

  careerMatches.forEach((match, idx) => {
    lines.push(`#${idx + 1}: ${match.title} (${match.matchPercentage}%)`);
    lines.push("Why this matches you:");
    match.whyMatches.forEach((r) => lines.push(`- ${r}`));
    lines.push("");

    lines.push("Skill gaps:");
    match.skillGaps.forEach((g) => lines.push(`- ${g}`));
    lines.push("");

    lines.push("Next steps:");
    lines.push("  Recommended courses:");
    match.nextSteps.courses.forEach((c) => lines.push(`  - ${c}`));
    lines.push("  Clubs to join:");
    match.nextSteps.clubs.forEach((c) => lines.push(`  - ${c}`));
    lines.push("  Skills to build:");
    match.nextSteps.skills.forEach((s) => lines.push(`  - ${s}`));
    lines.push("");
    lines.push("--------------------------------------------------");
    lines.push("");
  });

  downloadFile("career-results.txt", lines.join("\n"), "text/plain");
}

  return (
    // outer container for the entire page
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50/30 to-slate-50 py-12 px-4"> 
      {/* Centers cntent and limit width */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-8 flex justify-between">
            {/* When clicked, call the onBack function; variant = ghost means
          minimal style, and classname sets color */}
          <Button
              onClick={onBack}
              variant="ghost"
              className="text-slate-500 hover:text-slate-700"
              >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Form
          </Button>

            {/* Export Results */}
            <div className="flex justify-end gap-2">
              <Button onClick={handleExportJSON} variant="ghost"
              className="text-slate-500 hover:text-slate-700">
                Export Results (JSON)
              </Button>

              <Button onClick={handleExportTXT} variant="ghost"
              className="text-slate-500 hover:text-slate-700">
                Export Results (TXT)
              </Button>
            </div>
          </div>

            {/* Title row with an elephant emoji and title */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl opacity-60">🐘</span>
            <h1 className="text-4xl text-slate-700">Your Top Career Matches</h1>
          </div>

          <p className="text-slate-500">Based on your courses, skills, and preferences</p>
        </div>

        {/* <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={handleExportJSON} variant="outline">
            Export Results (JSON)
          </Button>

          <Button onClick={handleExportTXT} variant="outline">
            Export Results (TXT)
          </Button>
        </div> */}

        {/* Results */}
        <div className="space-y-6">
          {/* Goes through the array and produce UI for each item; 
          match is the match object and index is the position in the list */}
          {careerMatches.map((match, index) => (
            // Card UI is created for each match with key = {index} help React track list items; also styling included in (border, corner, shadow)
            <Card
              key={index}
              className="p-6 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Vertical stack with spacing */}
              <div className="space-y-4"> 
                {/* Title + Score */}
                {/* Left content + right badge (match #s) with justify-between pushing them to opposite sides */}
                <div className="flex items-start justify-between">
                  {/* Job title is display for this match with match score */}
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

                {/* Progress bar filled to the percentage in result */}
                <Progress value={match.matchPercentage} className="h-2" />

                {/* Why Matches */}
                {/* A light colored box */}
                <div className="bg-blue-50/30 p-4 rounded-lg border border-blue-100/50">
                {/* Section header with an icon */}
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm text-slate-700">Why This Matches You</h3>
                  </div>
                  {/* Loop through reason and render each one */}
                  <ul className="space-y-2">
                    {match.whyMatches.map((reason, i) => (
                      // Each reason is a bullet point 
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expand Button */}
                {/* If the card is already opened, set it to NULL and close it*/}
                {/* Else, set it to index and open this new card while closing the other one */}
                <button
                  onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                  className="w-full flex items-center justify-between pt-4 border-t border-slate-200/60 text-slate-600 hover:text-slate-700"
                >
                  {/* Text and icon change depending on open or close */}
                  <span className="text-sm">
                    {expandedCard === index ? "Hide details" : "Show skill gaps & next steps"}
                  </span>
                  {expandedCard === index ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {/* Expanded Content and only show if card is expanded */}
                {expandedCard === index && (
                  <div className="space-y-6 pt-4 border-t border-slate-200/60">
                    {/* Skill Gaps */}
                    {/* Creates a yellow box */}
                    <div className="bg-amber-50/50 p-5 rounded-lg border border-amber-200/50">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <h3 className="text-sm text-slate-700">Skill Gaps to Address</h3>
                      </div>

                      {/* Look through skill gaps */}
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
                    {/* Gray box that contains courses, clubs, skills */}
                    <div className="bg-slate-50/50 p-5 rounded-lg border border-slate-200/50">
                      <h3 className="text-sm text-slate-700 mb-4">Next Steps</h3>

                      {/* Courses */}
                      {/* Loops through the course recommendations */}
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">📚 Recommended Courses</p>
                        {match.nextSteps.courses.map((course, i) => (
                          // Show each course with a blue left border
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
          // The back buttom to go edit input page again 
            onClick={onReset}
            variant="outline"
            className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Retake Form
          </Button>
        </div>
      </div>
    </div>
  );
}
