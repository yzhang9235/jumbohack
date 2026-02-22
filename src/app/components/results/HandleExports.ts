import type { UserFormData } from "../input/types";
import type { CareerMatch } from "../input/types"; // add CareerMatch to your types if not already there
import { jsPDF } from "jspdf";

// ── Shared helper ────────────────────────────────────────────────────────────

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

// ── JSON ─────────────────────────────────────────────────────────────────────

export function handleExportJSON(userFormData: UserFormData, careerMatches: CareerMatch[]) {
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

// ── TXT ──────────────────────────────────────────────────────────────────────

export function handleExportTXT(careerMatches: CareerMatch[]) {
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

// ── PDF ──────────────────────────────────────────────────────────────────────

export async function handleExportPDF(careerMatches: CareerMatch[]) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function drawWrappedText(
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ): number {
    const lines: string[] = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      doc.text(line, x, startY);
      startY += lineHeight;
    });
    return startY;
  }

  // Page header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 72, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Your Top Career Matches", margin, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}  |  Based on your courses, skills, and preferences`,
    margin,
    60
  );

  y = 96;

  careerMatches.forEach((match, index) => {
    const rankColors: [number, number, number][] = [
      [37, 99, 235],
      [79, 70, 229],
      [6, 148, 162],
    ];
    const accentColor = rankColors[index] ?? rankColors[2];

    checkPageBreak(160);

    // Card header background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 36, 4, 4, "F");

    // Accent left bar
    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, y, 5, 36, 2, 2, "F");

    // Rank badge
    doc.setFillColor(...accentColor);
    doc.roundedRect(pageWidth - margin - 52, y + 8, 52, 20, 10, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`#${index + 1} Match`, pageWidth - margin - 44, y + 21);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(match.title, margin + 16, y + 15);

    // Score
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...accentColor);
    doc.text(`${match.matchPercentage}% match`, margin + 16, y + 28);

    y += 44;

    // Progress bar
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 6, 3, 3, "F");
    doc.setFillColor(...accentColor);
    doc.roundedRect(margin, y, (contentWidth * match.matchPercentage) / 100, 6, 3, 3, "F");
    y += 16;

    // Why this matches you
    checkPageBreak(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...accentColor);
    doc.text("WHY THIS MATCHES YOU", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    match.whyMatches.forEach((reason) => {
      checkPageBreak(16);
      doc.setFillColor(...accentColor);
      doc.circle(margin + 4, y - 3, 2.5, "F");
      y = drawWrappedText(reason, margin + 12, y, contentWidth - 12, 14);
    });
    y += 6;

    // Skill gaps
    checkPageBreak(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(217, 119, 6);
    doc.text("SKILL GAPS TO ADDRESS", margin, y);
    y += 12;

    let tagX = margin;
    const tagHeight = 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    match.skillGaps.forEach((gap) => {
      const tagWidth = doc.getTextWidth(gap) + 16;
      if (tagX + tagWidth > pageWidth - margin) {
        tagX = margin;
        y += tagHeight + 4;
        checkPageBreak(tagHeight + 4);
      }
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(tagX, y - 12, tagWidth, tagHeight, 9, 9, "FD");
      doc.setTextColor(146, 64, 14);
      doc.text(gap, tagX + 8, y);
      tagX += tagWidth + 6;
    });
    y += tagHeight + 6;

    // Next steps
    checkPageBreak(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("NEXT STEPS", margin, y);
    y += 14;

    // Courses
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Recommended Courses", margin, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    match.nextSteps.courses.forEach((course) => {
      checkPageBreak(14);
      doc.setDrawColor(...accentColor);
      doc.setLineWidth(2);
      doc.line(margin, y - 10, margin, y + 2);
      doc.setLineWidth(0.5);
      y = drawWrappedText(course, margin + 8, y, contentWidth - 8, 13);
    });
    y += 4;

    // Clubs
    checkPageBreak(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Clubs to Join", margin, y);
    y += 12;

    tagX = margin;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    match.nextSteps.clubs.forEach((club) => {
      const tagWidth = doc.getTextWidth(club) + 16;
      if (tagX + tagWidth > pageWidth - margin) {
        tagX = margin;
        y += tagHeight + 4;
        checkPageBreak(tagHeight + 4);
      }
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(tagX, y - 12, tagWidth, tagHeight, 9, 9, "FD");
      doc.setTextColor(51, 65, 85);
      doc.text(club, tagX + 8, y);
      tagX += tagWidth + 6;
    });
    y += tagHeight + 4;

    // Skills
    checkPageBreak(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Skills to Build", margin, y);
    y += 12;

    tagX = margin;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    match.nextSteps.skills.forEach((skill) => {
      const tagWidth = doc.getTextWidth(skill) + 16;
      if (tagX + tagWidth > pageWidth - margin) {
        tagX = margin;
        y += tagHeight + 4;
        checkPageBreak(tagHeight + 4);
      }
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(tagX, y - 12, tagWidth, tagHeight, 9, 9, "FD");
      doc.setTextColor(51, 65, 85);
      doc.text(skill, tagX + 8, y);
      tagX += tagWidth + 6;
    });
    y += tagHeight;

    // Divider between cards
    if (index < careerMatches.length - 1) {
      y += 12;
      checkPageBreak(24);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 24;
    }
  });

  // Footer on every page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Career Match Results  |  Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 24,
      { align: "center" }
    );
  }

  doc.save("career-results.pdf");
}