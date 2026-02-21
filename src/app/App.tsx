import { useState } from "react";
import { InputForm } from "./components/InputFormComponent";
import type { UserFormData } from "./components/types";
import { ResultsPage } from "./components/ResultsPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"input" | "results">("input");
  const [formData, setFormData] = useState<UserFormData | null>(null);

  const handleFormSubmit = (data: UserFormData) => {
    setFormData(data);
    setCurrentPage("results");
  };

  const handleBack = () => {
    setCurrentPage("input");
  };

  return (
    <div className="size-full">
      {currentPage === "input" && <InputForm onSubmit={handleFormSubmit} />}

      {currentPage === "results" && formData && (
        <ResultsPage userFormData={formData} onBack={handleBack} />
      )}
    </div>
  );
}