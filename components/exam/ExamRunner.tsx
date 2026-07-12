"use client";

import { useExamSession } from "../../hooks/useExamSession";

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ExamRunner({ examCode }: { examCode: string }) {
  const {
    session,
    questions,
    answers,
    setAnswer,
    remainingSeconds,
    syncState,
    loadError,
    submitted,
    submitExam,
  } = useExamSession(examCode);

  if (loadError) return <p>{loadError}</p>;
  if (!session) return <p>Loading exam…</p>;
  if (submitted) return <p>Your exam has been submitted. You may close this page.</p>;

  return (
    <div>
      <header>
        <h1>{session.title}</h1>
        <span>{remainingSeconds !== null ? formatTime(remainingSeconds) : "--:--"}</span>
        <span>
          {syncState === "offline" && "Offline — your answers are saved on this device and will sync once you're back online"}
          {syncState === "syncing" && "Saving…"}
          {syncState === "idle" && "All changes saved"}
          {syncState === "error" && "Couldn't save just now, will retry"}
        </span>
      </header>

      {questions.map((q) => (
        <fieldset key={q._id}>
          <legend>{q.text}</legend>
          {q.type === "Objective" &&
            q.options?.map((opt) => (
              <label key={opt}>
                <input
                  type="radio"
                  name={q._id}
                  checked={answers[q._id]?.selectedOption === opt}
                  onChange={() => setAnswer(q._id, { selectedOption: opt })}
                />
                {opt}
              </label>
            ))}
          {q.type === "Theory" && (
            <textarea
              value={answers[q._id]?.textAnswer ?? ""}
              onChange={(e) => setAnswer(q._id, { textAnswer: e.target.value })}
            />
          )}
        </fieldset>
      ))}

      <button onClick={submitExam}>Submit Exam</button>
    </div>
  );
}
