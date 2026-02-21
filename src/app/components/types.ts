export interface UserFormData {
    courses: string[];
    skills: { name: string; level: string }[];
    clubs: string[];
    preferences: {
      teamVsIndependent: number;
      analyticalVsCreative: number;
      structuredVsFlexible: number;
    };
  }