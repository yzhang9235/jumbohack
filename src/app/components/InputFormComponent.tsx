import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { ChevronDown, BookOpen, Lightbulb, Users, Sliders } from "lucide-react";
import type { UserFormData } from "./types";

interface InputFormProps {
  onSubmit: (data: UserFormData ) => void;
}

const COURSES = [
  "COMP 15: Data Structures",
  "COMP 40: Machine Structure",
  "COMP 126: Practical Software Engineering",
  "ECON 1: Intro to Microeconomics",
  "ECON 2: Intro to Macroeconomics",
  "MATH 42: Calculus II",
  "PSYCH 1: Introduction to Psychology",
  "BIO 13: Cells and Organisms",
  "CHEM 1: General Chemistry",
  "ENG 1: Writing Seminar",
  "PHIL 1: Introduction to Philosophy",
  "SOC 1: Introduction to Sociology",
  
];

const SKILLS = [
  "Python Programming",
  "Data Analysis",
  "Public Speaking",
  "Project Management",
  "UI/UX Design",
  "Statistical Modeling",
  "Research Methods",
  "Leadership",
  "Marketing",
  "Financial Analysis",
];

const CLUBS = [
  "Tufts Consulting Collective",
  "Tufts Computer Science Society",
  "Student Government",
  "Entrepreneurship Society",
  "Data Science Club",
  "Marketing Club",
  "Investment Club",
  "Debate Team",
  "Volunteer Organization",
  "Arts Society",
];

export function InputForm({ onSubmit }: InputFormProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [skills, setSkills] = useState<{ name: string; level: string }[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [teamVsIndependent, setTeamVsIndependent] = useState([50]);
  const [analyticalVsCreative, setAnalyticalVsCreative] = useState([50]);
  const [structuredVsFlexible, setStructuredVsFlexible] = useState([50]);
  
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showClubDropdown, setShowClubDropdown] = useState(false);
  const [selectedSkillForLevel, setSelectedSkillForLevel] = useState("");

  const toggleCourse = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  const addSkill = (skillName: string) => {
    if (!skills.find((s) => s.name === skillName)) {
      setSelectedSkillForLevel(skillName);
    }
  };

  const setSkillLevel = (skillName: string, level: string) => {
    setSkills((prev) => {
      const existing = prev.find((s) => s.name === skillName);
      if (existing) {
        return prev.map((s) => (s.name === skillName ? { ...s, level } : s));
      }
      return [...prev, { name: skillName, level }];
    });
    setSelectedSkillForLevel("");
  };

  const removeSkill = (skillName: string) => {
    setSkills((prev) => prev.filter((s) => s.name !== skillName));
  };

  const toggleClub = (club: string) => {
    setSelectedClubs((prev) =>
      prev.includes(club) ? prev.filter((c) => c !== club) : [...prev, club]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      courses: selectedCourses,
      skills,
      clubs: selectedClubs,
      preferences: {
        teamVsIndependent: teamVsIndependent[0],
        analyticalVsCreative: analyticalVsCreative[0],
        structuredVsFlexible: structuredVsFlexible[0],
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50/30 to-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-4 opacity-60">🐘</div>
          <h1 className="text-4xl mb-3 text-slate-700">
            Translate Your Courses Into Career Direction
          </h1>
          <p className="text-slate-500 text-lg">Built for Tufts students</p>
        </div>

        {/* Form Cards */}
        <div className="space-y-6">
          {/* Courses Section */}
          <Card className="p-6 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl border border-slate-200/60">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <Label className="text-lg text-slate-700">Courses Taken</Label>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                >
                  <span className="text-slate-600">
                    {selectedCourses.length > 0
                      ? `${selectedCourses.length} courses selected`
                      : "Select courses"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>
                {showCourseDropdown && (
                  <div className="absolute z-10 w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {COURSES.map((course) => (
                      <div
                        key={course}
                        className="flex items-center space-x-3 p-2 hover:bg-blue-50/50 rounded-md cursor-pointer transition-colors"
                        onClick={() => toggleCourse(course)}
                      >
                        <Checkbox checked={selectedCourses.includes(course)} />
                        <span className="text-sm text-slate-600">{course}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedCourses.map((course) => (
                    <div
                      key={course}
                      className="px-3 py-1.5 bg-blue-100/70 text-blue-700 rounded-full text-sm border border-blue-200/50"
                    >
                      {course}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Skills Section */}
          <Card className="p-6 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl border border-slate-200/60">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <Label className="text-lg text-slate-700">Skills & Level</Label>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg hover:bg-amber-50/50 hover:border-amber-200 transition-all"
                >
                  <span className="text-slate-600">
                    {skills.length > 0 ? `${skills.length} skills added` : "Add skills"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>
                {showSkillDropdown && (
                  <div className="absolute z-10 w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {SKILLS.map((skill) => (
                      <div
                        key={skill}
                        className="p-2 hover:bg-amber-50/50 rounded-md cursor-pointer text-sm text-slate-600 transition-colors"
                        onClick={() => {
                          addSkill(skill);
                          setShowSkillDropdown(false);
                        }}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skill Level Selection */}
              {selectedSkillForLevel && (
                <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
                  <p className="text-sm text-slate-600 mb-3">
                    Select level for <strong className="text-slate-700">{selectedSkillForLevel}</strong>
                  </p>
                  <div className="flex gap-2">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <Button
                        key={level}
                        onClick={() => setSkillLevel(selectedSkillForLevel, level)}
                        variant="outline"
                        className="flex-1 hover:bg-amber-50 border-slate-200"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Skills */}
              {skills.length > 0 && (
                <div className="space-y-2 mt-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/50 rounded-lg"
                    >
                      <div>
                        <span className="text-sm text-slate-700">{skill.name}</span>
                        <span className="text-xs text-slate-500 ml-2">({skill.level})</span>
                      </div>
                      <button
                        onClick={() => removeSkill(skill.name)}
                        className="text-slate-400 hover:text-amber-600 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Clubs Section */}
          <Card className="p-6 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl border border-slate-200/60">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <Label className="text-lg text-slate-700">Clubs & Activities</Label>
                  <p className="text-sm text-slate-400 mt-0.5">Optional</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowClubDropdown(!showClubDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg hover:bg-slate-100/50 hover:border-slate-300 transition-all"
                >
                  <span className="text-slate-600">
                    {selectedClubs.length > 0
                      ? `${selectedClubs.length} clubs selected`
                      : "Select clubs"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>
                {showClubDropdown && (
                  <div className="absolute z-10 w-full mt-2 p-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {CLUBS.map((club) => (
                      <div
                        key={club}
                        className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                        onClick={() => toggleClub(club)}
                      >
                        <Checkbox checked={selectedClubs.includes(club)} />
                        <span className="text-sm text-slate-600">{club}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedClubs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedClubs.map((club) => (
                    <div
                      key={club}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm border border-slate-200"
                    >
                      {club}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Work Preferences Section */}
          <Card className="p-6 shadow-sm hover:shadow-md transition-shadow bg-white rounded-xl border border-slate-200/60">
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-1">
                <Sliders className="w-5 h-5 text-slate-400" />
                <Label className="text-lg text-slate-700">Work Preferences</Label>
              </div>

              {/* Team vs Independent */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Independent</span>
                  <span className="text-slate-500">Team-oriented</span>
                </div>
                <Slider
                  value={teamVsIndependent}
                  onValueChange={setTeamVsIndependent}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Analytical vs Creative */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Analytical</span>
                  <span className="text-slate-500">Creative</span>
                </div>
                <Slider
                  value={analyticalVsCreative}
                  onValueChange={setAnalyticalVsCreative}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Structured vs Flexible */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Structured</span>
                  <span className="text-slate-500">Flexible</span>
                </div>
                <Slider
                  value={structuredVsFlexible}
                  onValueChange={setStructuredVsFlexible}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={selectedCourses.length === 0 || skills.length === 0}
            className="w-full py-6 text-lg rounded-xl shadow-sm hover:shadow-md transition-all bg-blue-500 hover:bg-blue-600 text-white"
          >
            See My Career Matches
          </Button>
        </div>
      </div>
    </div>
  );
}