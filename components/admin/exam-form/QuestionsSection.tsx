import React from "react";
import { Question } from "@/types/question";
import SelectedQuestionsList from "@/components/questions/SelectedQuestionsList";
import QuestionBank from "@/components/questions/QuestionBank";
import Fieldset from "@/components/ui/form/Fieldset";

interface QuestionsSectionProps {
  selectedQuestions: Question[];
  questionBank: Question[];
  filteredQuestions: Question[];
  searchTerm: string;
  filterType: string;
  filterSubject: string;
  filterClass: string;
  showQuestionBank: boolean;
  onRemoveQuestion: (questionId: number) => void;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onAddQuestion: (question: Question) => void;
  onToggleQuestionBank: () => void;
}

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  selectedQuestions,
  filteredQuestions,
  searchTerm,
  filterType,
  filterSubject,
  filterClass,
  showQuestionBank,
  onRemoveQuestion,
  onSearchChange,
  onTypeChange,
  onSubjectChange,
  onClassChange,
  onAddQuestion,
  onToggleQuestionBank,
}) => {
  return (
    <Fieldset
      legend={
        <>
          Questions{" "}
          <span className="text-sm font-normal text-[#5A7A9A]">
            ({selectedQuestions.length} selected)
          </span>
        </>
      }>
      <SelectedQuestionsList questions={selectedQuestions} onRemove={onRemoveQuestion} />

      <QuestionBank
        isOpen={showQuestionBank}
        onToggle={onToggleQuestionBank}
        questions={filteredQuestions}
        selectedQuestions={selectedQuestions}
        searchTerm={searchTerm}
        filterType={filterType}
        filterSubject={filterSubject}
        filterClass={filterClass}
        onSearchChange={onSearchChange}
        onTypeChange={onTypeChange}
        onSubjectChange={onSubjectChange}
        onClassChange={onClassChange}
        onAddQuestion={onAddQuestion}
      />
    </Fieldset>
  );
};

export default QuestionsSection;
