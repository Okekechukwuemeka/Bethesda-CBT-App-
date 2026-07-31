import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface CachedQuestion {
  _id: string;
  text: string;
  type: "Objective" | "Theory";
  marks: number;
  options?: string[];
  order: number;
  // Same denormalized-per-question shape as SessionQuestion - see
  // types/exam-session.ts for why these live on every sibling question
  // rather than in a separate lookup table.
  passageId?: string;
  passageTitle?: string;
  passageText?: string;
  passageKind?: string;
  passageOrder?: number;
}

export interface ExamSessionRecord {
  examId: string; // primary key
  submissionId: string;
  title: string;
  type: string;
  durationMinutes: number;
  // Authoritative, server-issued start time (ms since epoch). Time
  // remaining is always recomputed from this + durationMinutes, never
  // from a client-side counter - that's what makes it survive a closed
  // tab or dead battery: on reopen we recompute instead of resuming a
  // counter that reset to zero.
  startedAt: number;
  questions: CachedQuestion[];
  // "pending-submit" means: the student hit submit (or the timer hit
  // zero) but the server hasn't confirmed yet - e.g. they were offline
  // at that moment. On reopening the app in this state, we skip
  // rendering the exam entirely and go straight to retrying the submit.
  status: "in-progress" | "pending-submit" | "submitted";
}

export interface AnswerRecord {
  examId: string;
  questionId: string;
  selectedOption?: string;
  textAnswer?: string;
  updatedAt: number; // client timestamp - also used for last-write-wins merge on the server
  synced: boolean;
}

interface ExamDB extends DBSchema {
  sessions: {
    key: string; // examId
    value: ExamSessionRecord;
  };
  answers: {
    key: [string, string]; // [examId, questionId]
    value: AnswerRecord;
    indexes: { byExam: string };
  };
}

let dbPromise: Promise<IDBPDatabase<ExamDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ExamDB>> {
  if (typeof window === "undefined") {
    throw new Error("Exam offline storage is only available in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<ExamDB>("exam-offline-store", 1, {
      upgrade(db) {
        db.createObjectStore("sessions", { keyPath: "examId" });
        const answerStore = db.createObjectStore("answers", {
          keyPath: ["examId", "questionId"],
        });
        answerStore.createIndex("byExam", "examId");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: ExamSessionRecord): Promise<void> {
  const db = await getDB();
  await db.put("sessions", session);
}

export async function getSession(examId: string): Promise<ExamSessionRecord | undefined> {
  const db = await getDB();
  return db.get("sessions", examId);
}

export async function updateSessionStatus(
  examId: string,
  status: ExamSessionRecord["status"],
): Promise<void> {
  const db = await getDB();
  const session = await db.get("sessions", examId);
  if (!session) return;
  session.status = status;
  await db.put("sessions", session);
}

// Called on every keystroke/option click. Writes straight to IndexedDB
// before anything else - this is the durability guarantee. React state
// updates for the UI happen separately and can be lost on a crash/reload;
// this can't be, short of the device's storage itself failing.
export async function saveAnswerLocally(
  examId: string,
  questionId: string,
  data: { selectedOption?: string; textAnswer?: string },
): Promise<void> {
  const db = await getDB();
  await db.put("answers", {
    examId,
    questionId,
    ...data,
    updatedAt: Date.now(),
    synced: false,
  });
}

export async function getAllAnswers(examId: string): Promise<AnswerRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex("answers", "byExam", examId);
}

export async function getUnsyncedAnswers(examId: string): Promise<AnswerRecord[]> {
  const all = await getAllAnswers(examId);
  return all.filter((a) => !a.synced);
}

export async function markAnswersSynced(examId: string, questionIds: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("answers", "readwrite");
  for (const questionId of questionIds) {
    const record = await tx.store.get([examId, questionId]);
    if (record) {
      record.synced = true;
      await tx.store.put(record);
    }
  }
  await tx.done;
}

export async function clearSession(examId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["sessions", "answers"], "readwrite");
  await tx.objectStore("sessions").delete(examId);
  const answerStore = tx.objectStore("answers");
  const answerIndex = answerStore.index("byExam");
  let cursor = await answerIndex.openCursor(examId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
