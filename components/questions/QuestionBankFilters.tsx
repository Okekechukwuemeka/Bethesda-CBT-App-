import { CLASSES, SUBJECTS } from "@/mockData/question-bank";

interface QuestionBankFiltersProps {
  searchTerm: string;
  filterType: string;
  filterSubject: string;
  filterClass: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onClassChange: (value: string) => void;
}

const QuestionBankFilters: React.FC<QuestionBankFiltersProps> = ({
  searchTerm,
  filterType,
  filterSubject,
  filterClass,
  onSearchChange,
  onTypeChange,
  onSubjectChange,
  onClassChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex-1">
        <label htmlFor="searchQuestions" className="sr-only">
          Search questions
        </label>
        <input
          id="searchQuestions"
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] text-sm"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={filterType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-sm"
          aria-label="Filter by type">
          <option value="all">All Types</option>
          <option value="objective">Objective</option>
          <option value="theory">Theory</option>
        </select>
        <select
          value={filterSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-sm"
          aria-label="Filter by subject">
          <option value="all">All Subjects</option>
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <select
          value={filterClass}
          onChange={(e) => onClassChange(e.target.value)}
          className="px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-sm"
          aria-label="Filter by class">
          <option value="all">All Classes</option>
          {CLASSES.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuestionBankFilters;
