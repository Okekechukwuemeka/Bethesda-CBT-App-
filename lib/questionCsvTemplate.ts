// Sample CSV for the bulk question importer. Shared by the staff import
// modal; the columns and example rows match what /api/admin/questions/bulk
// and /api/staff/questions/bulk both parse (identical format).

// Wraps a field in quotes and escapes internal quotes if it contains a
// comma, quote, or newline - otherwise a passage body like "Last term, our
// class teacher..." would split into extra columns when the template is
// re-uploaded.
function csvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const HEADERS = [
  "text",
  "type",
  "marks",
  "option1",
  "option2",
  "option3",
  "option4",
  "passage_key",
  "passage_title",
  "passage_body",
  "passage_kind",
];

const ROWS: string[][] = [
  // Last populated option column ("NaCl") is the correct answer.
  [
    "What is the chemical formula for common table salt?",
    "Objective",
    "3",
    "H2O",
    "CO2",
    "NaCl",
    "",
    "",
    "",
    "",
    "",
  ],
  // Here the last populated option is "HCl".
  [
    "Which of these is a strong acid?",
    "Objective",
    "5",
    "H2O",
    "CH3COOH",
    "NH3",
    "HCl",
    "",
    "",
    "",
    "",
  ],
  // Theory rows leave every option column blank.
  [
    "Define an acid and give two examples with their chemical formulas.",
    "Theory",
    "10",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
  // Passage group: only the first row carries title/body/kind; later rows
  // repeat passage_key. The last option repeats the correct answer's text.
  [
    "Who organized the trip to the zoo?",
    "Objective",
    "1",
    "The school principal",
    "The class teacher",
    "The bus driver",
    "The class teacher",
    "zoo1",
    "A Visit to the Zoo",
    "Last term, our class teacher, Mrs. Adebayo, organized a trip for us to the zoo in the city. We were all very excited because it was our first school trip of the year.",
    "comprehension",
  ],
  [
    "How did the students travel to the zoo?",
    "Objective",
    "1",
    "By train",
    "By car",
    "By school bus",
    "By school bus",
    "zoo1",
    "",
    "",
    "",
  ],
];

export function downloadQuestionTemplate(filename = "question_template.csv"): void {
  const csv = [HEADERS, ...ROWS].map((row) => row.map(csvField).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
