import React, { useEffect } from "react";
import { ExamSessionMeta, SubmitResult } from "@/types/exam-session";

interface ExamSubmittedProps {
  exam: ExamSessionMeta;
  result: SubmitResult | null;
  onDone: () => void;
}

const ExamSubmitted: React.FC<ExamSubmittedProps> = ({ exam, result, onDone }) => {
  const isMarked = result?.status === "Marked";

  // Plays both cues together the moment this screen appears - whether the
  // student hit "Submit Exam" themselves or the timer ran out and
  // auto-submitted for them. Fired once per mount (empty dependency
  // array), which is also the only time this component ever mounts.
  useEffect(() => {
    const endExam = new Audio("/audio/sfx/end_exam.wav");
    const goodJob = new Audio("/audio/sfx/good_job.mp3");
    // Both start together - Promise.all rather than two independent
    // calls just so a rejection from one (e.g. a browser blocking
    // autoplay without a preceding user gesture) doesn't produce an
    // unhandled rejection warning in the console. Either way, a blocked
    // play() is silently ignored - the student still sees this screen
    // and its score/status, sound is a nice-to-have on top of that.
    Promise.all([endExam.play(), goodJob.play()]).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#B8D0E8] max-w-md w-full p-8 text-center">
        <div
          className={`mx-auto mb-4 h-14 w-14 rounded-full flex items-center justify-center text-2xl ${
            isMarked ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
          aria-hidden="true">
          ✓
        </div>
        <h1 className="text-xl font-bold text-[#1A3A5C] mb-1">Exam Submitted</h1>
        <p className="text-sm text-[#4A6A8A] mb-6">{exam.title}</p>

        {isMarked ? (
          <p className="text-3xl font-bold text-[#1A3A5C] mb-6">
            {result?.score}{" "}
            <span className="text-base font-medium text-[#4A6A8A]">/ {result?.totalMarks}</span>
          </p>
        ) : (
          <p className="text-sm text-[#4A6A8A] bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
            Your answers have been recorded. Theory questions are graded manually, so your final
            score will be available once marking is complete.
          </p>
        )}

        <button
          type="button"
          onClick={onDone}
          className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200">
          Back to Examinations
        </button>
      </div>
    </div>
  );
};

export default ExamSubmitted;
