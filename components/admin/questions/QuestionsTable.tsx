import React from "react";

interface Question {
  id: number;
  text: string;
  type: "objective" | "theory";
  options: string[];
  correctAnswer: string;
  marks: number;
}

interface QuestionsTableProps {
  questions: Question[];
  onEdit: (question: Question, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (question: Question) => void;
}

const getTypeBadgeColor = (type: string) =>
  type === "objective" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";

const truncate = (text: string, len: number) =>
  text.length > len ? `${text.slice(0, len)}…` : text;

const QuestionsTable: React.FC<QuestionsTableProps> = ({ questions, onEdit, onDelete }) => {
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <table className="w-full" aria-label="Questions list">
          <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                #
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Question
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Marks
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-[#8A9CAE]">
                <div className="text-4xl mb-2" aria-hidden="true">
                  📝
                </div>
                <p className="font-medium">No questions added yet</p>
                <p className="text-sm">Add questions to this exam</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Questions list">
          <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                #
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Question
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Type
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Marks
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EEF5]">
            {questions.map((question, index) => (
              <tr key={question.id} className="hover:bg-[#F8FAFE] transition">
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">{index + 1}</td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A] max-w-md">
                  {question.text}
                  {question.type === "objective" && question.options.length > 0 && (
                    <div className="text-xs text-[#8A9CAE] mt-1">
                      Options: {question.options.join(", ")}
                    </div>
                  )}
                  {question.type === "objective" && question.correctAnswer && (
                    <div className="text-xs text-green-600 mt-1">
                      Answer: {question.correctAnswer}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor(question.type)}`}>
                    {question.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">{question.marks}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => onEdit(question, e)}
                      className="text-[#2B6CB0] hover:text-[#1A3A5C] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                      aria-label={`Edit question ${index + 1}: ${truncate(question.text, 40)}`}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(question)}
                      className="text-red-600 hover:text-red-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete question ${index + 1}: ${truncate(question.text, 40)}`}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-[#E8EEF5] flex justify-between">
        <p className="text-sm text-[#5A7A9A]">Total: {questions.length} questions</p>
        <p className="text-sm font-medium text-[#1A3A5C]">Total Marks: {totalMarks}</p>
      </div>
    </div>
  );
};

export default QuestionsTable;
