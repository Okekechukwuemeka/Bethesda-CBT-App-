import React from "react";
import { SessionQuestion } from "@/types/exam-session";
import ObjectiveQuestion from "./ObjectiveQuestion";
import TheoryQuestion from "./TheoryQuestion";

interface GroupContext {
  localPosition: number;
  localTotal: number;
}

interface QuestionCardProps {
  question: SessionQuestion;
  questionIndex: number;
  totalQuestions: number;
  answer: string | undefined;
  onAnswerChange: (questionId: string, value: string, isObjective: boolean) => void;
  // Present only when this card is being rendered as part of a passage
  // group (see QuestionsList) - swaps the heading from the exam-global
  // "Question X of N" to "Question X of N for this passage", and adds a
  // short screen-reader-only reminder instead of repeating the passage
  // text on every single sub-question.
  groupContext?: GroupContext;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  totalQuestions,
  answer,
  onAnswerChange,
  groupContext,
}) => {
  const isAnswered = Boolean(answer);
  const reminderId = groupContext ? `passage-reminder-${question._id}` : undefined;

  return (
    <div
      // questionIndex here is always the GLOBAL position in the exam
      // (see groupQuestionsByPassage's globalIndex), even when this card
      // is rendered inside a passage group - so this id stays stable and
      // predictable for anything that might jump to a specific question
      // by index, independent of how grouping rearranges the visual
      // layout above it.
      id={`question-${questionIndex}`}
      tabIndex={-1}
      className="border border-[#C5D8EC] rounded-lg p-4 bg-[#F8FAFE] focus-within:ring-2 focus-within:ring-[#2B6CB0] focus:outline-none"
      role="group"
      aria-labelledby={`question-label-${question._id}`}
      aria-describedby={reminderId}>
      <div className="flex justify-between items-start mb-3">
        <h3 id={`question-label-${question._id}`} className="text-base font-medium text-[#1A3A5C]">
          {groupContext
            ? `Question ${groupContext.localPosition} of ${groupContext.localTotal} for this passage`
            : `Question ${questionIndex + 1} of ${totalQuestions}`}
          {question.type === "Theory" && " (Theory)"}
          {isAnswered && <span className="sr-only"> — answered</span>}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-[#E8EEF5] text-[#1A3A5C] font-medium">
          {question.marks} mark{question.marks === 1 ? "" : "s"}
        </span>
      </div>

      {groupContext && (
        // A short reminder, not the passage text again - read right
        // after the question's own label via aria-describedby above,
        // without this app repeating the whole passage for every
        // sub-question in the group.
        <p id={reminderId} className="sr-only">
          Refer to the passage above.
        </p>
      )}

      <p className="text-[#4A6A8A] mb-3 whitespace-pre-wrap">{question.text}</p>

      {question.type === "Objective" && question.options && (
        <ObjectiveQuestion
          question={question}
          selectedAnswer={answer}
          onAnswerChange={onAnswerChange}
        />
      )}

      {question.type === "Theory" && (
        <TheoryQuestion
          question={question}
          questionIndex={questionIndex}
          answer={answer}
          onAnswerChange={onAnswerChange}
        />
      )}
    </div>
  );
};

export default QuestionCard;
