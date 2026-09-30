import React from "react";
import { SessionQuestion } from "@/types/exam-session";
import QuestionCard from "./QuestionCard";
import { groupQuestionsByPassage } from "./groupQuestionsByPassage";

interface QuestionsListProps {
  questions: SessionQuestion[];
  // Admin-written section directions for a Mixed exam. Blank/undefined
  // falls back to the default wording in SECTION_INSTRUCTIONS below.
  objectiveInstructions?: string;
  theoryInstructions?: string;
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string, isObjective: boolean) => void;
}

// A one-line orientation sentence read right after the passage heading,
// tailored to what kind of stimulus it actually is - a chemistry
// experiment write-up isn't "read the passage," it's "read the
// experiment," and getting that right matters more for someone who can't
// see the surrounding page layout for context clues.
const PASSAGE_KIND_INTRO: Record<string, string> = {
  comprehension: "Read the passage below, then answer the questions that follow.",
  experiment: "Read the experiment description below, then answer the questions that follow.",
  data: "Study the data below, then answer the questions that follow.",
  diagram: "Read the description below, then answer the questions that follow.",
};

// Per-section directions for a Mixed exam. Each section is a labelled
// region with its own heading, so a screen-reader user can jump between
// Section A and Section B with the heading keys and always hears what
// that part expects of them before the first question.
const SECTION_INSTRUCTIONS = {
  Objective:
    "Choose the ONE correct option for each question. Your answers in this section are scored automatically when you submit.",
  Theory:
    "Type your full answer in the box under each question. Your answers in this section are marked by your teacher after you submit, so your theory score will not appear straight away.",
} as const;

const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  answers,
  onAnswerChange,
  objectiveInstructions,
  theoryInstructions,
}) => {
  const objectiveQuestions = questions.filter((q) => q.type === "Objective");
  const theoryQuestions = questions.filter((q) => q.type === "Theory");
  const isMixed = objectiveQuestions.length > 0 && theoryQuestions.length > 0;

  // Not a mixed paper - one flat list exactly as before, no section chrome.
  if (!isMixed) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-[#1A3A5C] border-b border-[#E8EEF5] pb-3">
          Questions
        </h2>
        {renderBlocks(questions, 0, questions.length, answers, onAnswerChange)}
      </div>
    );
  }

  // `start` is the running offset, so numbering continues across sections
  // (Q1-Q20 in Section A, then Q21-Q25 in Section B).
  const sections = [
    {
      key: "Objective",
      letter: "A",
      title: "Objective (Multiple Choice)",
      items: objectiveQuestions,
      start: 0,
      instructions: objectiveInstructions?.trim() || SECTION_INSTRUCTIONS.Objective,
    },
    {
      key: "Theory",
      letter: "B",
      title: "Theory",
      items: theoryQuestions,
      start: objectiveQuestions.length,
      instructions: theoryInstructions?.trim() || SECTION_INSTRUCTIONS.Theory,
    },
  ] as const;

  return (
    <div className="space-y-10">
      {sections.map((section) => {
        const start = section.start;
        const totalMarks = section.items.reduce((sum, item) => sum + item.marks, 0);
        const headingId = `section-${section.letter}-heading`;
        const count = section.items.length;

        return (
          <section key={section.key} aria-labelledby={headingId} className="space-y-6">
            <div className="border-b border-[#E8EEF5] pb-3">
              <h2 id={headingId} className="text-xl font-semibold text-[#1A3A5C]">
                Section {section.letter}: {section.title}
              </h2>
              <p className="text-sm text-[#5A7A9A] mt-1">
                Questions {start + 1}–{start + count} · {count} question{count === 1 ? "" : "s"} ·{" "}
                {totalMarks} mark{totalMarks === 1 ? "" : "s"}
              </p>
              <div className="mt-3 bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-3 text-sm text-[#4A6A8A] whitespace-pre-wrap">
                <span className="font-medium text-[#1A3A5C]">Instructions: </span>
                {section.instructions}
              </div>
            </div>
            {renderBlocks(section.items, start, questions.length, answers, onAnswerChange)}
          </section>
        );
      })}
    </div>
  );
};

function renderBlocks(
  sectionQuestions: SessionQuestion[],
  indexOffset: number,
  totalQuestions: number,
  answers: Record<string, string>,
  onAnswerChange: QuestionsListProps["onAnswerChange"],
) {
  const blocks = groupQuestionsByPassage(sectionQuestions, indexOffset);

  return (
    <>
      {blocks.map((block) => {
        if (block.kind === "standalone") {
          return (
            <QuestionCard
              key={block.question._id}
              question={block.question}
              questionIndex={block.globalIndex}
              totalQuestions={totalQuestions}
              answer={answers[block.question._id]}
              onAnswerChange={onAnswerChange}
            />
          );
        }

        const passageHeadingId = `passage-${block.passageId}-heading`;
        const questionsHeadingId = `passage-${block.passageId}-questions-heading`;
        const intro =
          PASSAGE_KIND_INTRO[block.passageKind ?? "comprehension"] ??
          PASSAGE_KIND_INTRO.comprehension;

        return (
          <div key={block.passageId} className="space-y-4">
            {/* The passage is rendered exactly ONCE here, as a real
                heading - not a styled div. That's what lets NVDA/JAWS
                users jump straight back to it at any point with the "H"
                navigation key, without this app needing to build any
                custom "back to passage" control. */}
            <section
              aria-labelledby={passageHeadingId}
              className="border border-[#C5D8EC] rounded-lg p-4 bg-white">
              <h3 id={passageHeadingId} className="text-lg font-semibold text-[#1A3A5C] mb-2">
                {block.passageTitle || "Read the passage"}
              </h3>
              <p className="text-sm text-[#5A7A9A] italic mb-3">{intro}</p>
              <div className="text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                {block.passageText}
              </div>
            </section>

            {/* Sub-questions live in their own labelled section right
                after, numbered relative to THIS group ("Question 1 of 3
                for this passage"), not the exam-global count - and the
                heading text itself states the relationship, rather than
                relying on visual proximity a screen reader gets no
                benefit from. */}
            <section aria-labelledby={questionsHeadingId} className="space-y-4">
              <h4 id={questionsHeadingId} className="text-sm font-medium text-[#4A6A8A]">
                {block.items.length > 1
                  ? `Questions 1–${block.items.length}, based on the passage above`
                  : "Question, based on the passage above"}
              </h4>
              {block.items.map(({ question, globalIndex }, localIndex) => (
                <QuestionCard
                  key={question._id}
                  question={question}
                  questionIndex={globalIndex}
                  totalQuestions={totalQuestions}
                  answer={answers[question._id]}
                  onAnswerChange={onAnswerChange}
                  groupContext={{
                    localPosition: localIndex + 1,
                    localTotal: block.items.length,
                  }}
                />
              ))}
            </section>
          </div>
        );
      })}
    </>
  );
}

export default QuestionsList;
