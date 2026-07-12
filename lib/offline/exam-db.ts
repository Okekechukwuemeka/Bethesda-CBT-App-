import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface CachedQuestion {
  _id: string;
  text: string;
  type: "Objective" | "Theory";
  marks: number;
  options?: string[];
  order: number;
}

export interface ExamSessionRecord {
  examCode: string; // primary key
  submissionId: string;
  examId: string;
  title: string;
  type: string;
  durationMinutes: number;
  // Authoritative, server-issued start time (ms since epoch). The timer is
  // ALWAYS derived from this + durationMinutes, never from a client-side
  // countdown - that's what makes it survive a closed tab or a dead
  // battery: on reopen we just recompute "how much time is left" from this
  // fixed point instead of resuming a counter that reset to zero.
  startedAt: number;
  questions: CachedQuestion[];
  status: "in-progress" | "pending-submit" | "submitted";
}

export interface AnswerRecord {
  examCode: string;
  questionId: string;
  selectedOption?: string;
  textAnswer?: string;
  updatedAt: number; // client timestamp - also used for last-write-wins merge on the server
  synced: boolean;
}

interface ExamDB extends DBSchema {
  sessions: {
    key: string; // examCode
    value: ExamSessionRecord;
  };
  answers: {
    key: [string, string]; // [examCode, questionId]
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
        db.createObjectStore("sessions", { keyPath: "examCode" });
        const answerStore = db.createObjectStore("answers", {
          keyPath: ["examCode", "questionId"],
        });
        answerStore.createIndex("byExam", "examCode");
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: ExamSessionRecord): Promise<void> {
  const db = await getDB();
  await db.put("sessions", session);
}

export async function getSession(examCode: string): Promise<ExamSessionRecord | undefined> {
  const db = await getDB();
  return db.get("sessions", examCode);
}

export async function updateSessionStatus(
  examCode: string,
  status: ExamSessionRecord["status"],
): Promise<void> {
  const db = await getDB();
  const session = await db.get("sessions", examCode);
  if (!session) return;
  session.status = status;
  await db.put("sessions", session);
}

// Called on every keystroke/option click. Writes straight to IndexedDB
// before anything else happens - this is the durability guarantee. React
// state updates for the UI happen separately and can be lost; this can't
// (short of the device's storage itself failing).
export async function saveAnswerLocally(
  examCode: string,
  questionId: string,
  data: { selectedOption?: string; textAnswer?: string },
): Promise<void> {
  const db = await getDB();
  await db.put("answers", {
    examCode,
    questionId,
    ...data,
    updatedAt: Date.now(),
    synced: false,
  });
}

export async function getAllAnswers(examCode: string): Promise<AnswerRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex("answers", "byExam", examCode);
}

export async function getUnsyncedAnswers(examCode: string): Promise<AnswerRecord[]> {
  const all = await getAllAnswers(examCode);
  return all.filter((a) => !a.synced);
}

export async function markAnswersSynced(examCode: string, questionIds: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("answers", "readwrite");
  for (const questionId of questionIds) {
    const record = await tx.store.get([examCode, questionId]);
    if (record) {
      record.synced = true;
      await tx.store.put(record);
    }
  }
  await tx.done;
}

export async function clearSession(examCode: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["sessions", "answers"], "readwrite");
  await tx.objectStore("sessions").delete(examCode);
  const answerStore = tx.objectStore("answers");
  const answerIndex = answerStore.index("byExam");
  let cursor = await answerIndex.openCursor(examCode);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
