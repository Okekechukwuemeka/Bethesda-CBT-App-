import React from "react";
import { SessionQuestion } from "@/types/exam-session";
import QuestionCard from "./QuestionCard";
import { groupQuestionsByPassage } from "./groupQuestionsByPassage";

interface QuestionsListProps {
  questions: SessionQuestion[];
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

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, answers, onAnswerChange }) => {
  const blocks = groupQuestionsByPassage(questions);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#1A3A5C] border-b border-[#E8EEF5] pb-3">
        Questions
      </h2>

      {blocks.map((block) => {
        if (block.kind === "standalone") {
          return (
            <QuestionCard
              key={block.question._id}
              question={block.question}
              questionIndex={block.globalIndex}
              totalQuestions={questions.length}
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
                  totalQuestions={questions.length}
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
    </div>
  );
};

export default QuestionsList;
