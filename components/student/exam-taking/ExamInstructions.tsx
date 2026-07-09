interface ExamInstructionsProps {
  instructions: string[];
}

const ExamInstructions: React.FC<ExamInstructionsProps> = ({ instructions }) => {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-[#1A3A5C] mb-3">Instructions</h2>
      <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
        <ol className="space-y-2">
          {instructions.map((instruction, index) => (
            <li key={index} className="flex items-start gap-3 text-[#4A6A8A]">
              <span className="text-[#1A3A5C] font-bold mt-0.5" aria-hidden="true">
                {index + 1}.
              </span>
              <span>{instruction}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-[#8A9CAE] mt-3 pt-3 border-t border-[#E8EEF5]">
          Click &quot;Start Exam&quot; above to begin. The timer starts as soon as you do.
        </p>
      </div>
    </div>
  );
};

export default ExamInstructions;
