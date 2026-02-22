import { useState } from "react";
import { InputForm } from "./components/InputFormComponent";
import type { UserFormData } from "./components/types";
import { ResultsPage } from "./components/ResultsPage";

export default function App() {
  // Track which page is visible and the user's submitted form data
  const [currentPage, setCurrentPage] = useState<"input" | "results">("input");
  const [formData, setFormData] = useState<UserFormData | null>(null);

  const handleReset = () => {
    setFormData(null);
    setCurrentPage("input");
  }
  const handleFormSubmit = (data: UserFormData) => {
    setFormData(data);
    setCurrentPage("results");
    window.scrollTo( { top: 0, behavior: "smooth" });
  };


  const handleBack = () => {
    setCurrentPage("input");
  };

  return (
    <div className="size-full">
      {currentPage === "input" && <InputForm onSubmit={handleFormSubmit} initialData = {formData} />}

      {currentPage === "results" && formData && (
        <ResultsPage userFormData={formData} onBack={handleBack} onReset={handleReset} />
      )}
    </div>
  );
}