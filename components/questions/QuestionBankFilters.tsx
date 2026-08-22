import { CLASS_OPTIONS } from "@/config/exam-form-options";

interface QuestionBankFiltersProps {
  searchTerm: string;
  filterType: string;
  filterSubject: string;
  filterClass: string;
  subjects: { id: string; name: string }[];
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
  subjects,
  onSearchChange,
  onTypeChange,
  onSubjectChange,
  onClassChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4 min-w-0">
      <div className="flex-1 min-w-0">
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
      <div className="flex flex-wrap gap-2 min-w-0">
        <select
          value={filterType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-sm"
          aria-label="Filter by type">
          <option value="">All Types</option>
          <option value="Objective">Objective</option>
          <option value="Theory">Theory</option>
        </select>
        <select
          value={filterSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-sm"
          aria-label="Filter by subject">
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select
          value={filterClass}
          onChange={(e) => onClassChange(e.target.value)}
          className="px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-sm"
          aria-label="Filter by class">
          <option value="">All Classes</option>
          {CLASS_OPTIONS.map((cls) => (
            <option key={cls.value} value={cls.value}>
              {cls.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default QuestionBankFilters;
