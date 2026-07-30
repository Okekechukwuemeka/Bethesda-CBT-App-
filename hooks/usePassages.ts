"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { BlockingQuestion, Passage, PassageInput } from "@/types/question";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

interface ApiErrorPayload {
  error?: string;
  blockedByQuestions?: BlockingQuestion[];
}

type ShowStatus = (message: StatusMessage, durationMs?: number) => void;

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data: ApiErrorPayload = await res.json().catch(() => ({}));
  return data.error || fallback;
}

async function parseErrorPayload(
  res: Response,
  fallback: string,
): Promise<Error & ApiErrorPayload> {
  const data: ApiErrorPayload = await res.json().catch(() => ({}));
  const error = new Error(data.error || fallback) as Error & ApiErrorPayload;
  error.blockedByQuestions = data.blockedByQuestions;
  return error;
}

const emptyPassageForm: PassageInput = {
  title: "",
  text: "",
  kind: "comprehension",
  subject: "",
  class: "",
};

// Owns all passage data and CRUD state, the same way useQuestionBank owns
// question data. Called FROM useQuestionBank (not as a sibling hook) so
// the status messages produced here (passage created/updated/deleted)
// funnel through the one showStatus/statusMessage that page.tsx already
// renders, rather than needing a second status region on the page.
export const usePassages = (showStatus: ShowStatus) => {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [isLoadingPassages, setIsLoadingPassages] = useState(true);
  const [passagesError, setPassagesError] = useState<string | null>(null);

  // --- manager modal (list + create/edit views in one modal) ---
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerView, setManagerView] = useState<"list" | "form">("list");
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [passageFormData, setPassageFormData] = useState<PassageInput>(emptyPassageForm);
  const [passageFormError, setPassageFormError] = useState<string | null>(null);
  const [isSavingPassage, setIsSavingPassage] = useState(false);
  const managerTriggerRef = useRef<HTMLElement | null>(null);

  // --- delete confirmation ---
  const [pendingDeletePassage, setPendingDeletePassage] = useState<Passage | null>(null);
  const [isDeletingPassage, setIsDeletingPassage] = useState(false);
  const [deletePassageError, setDeletePassageError] = useState<string | null>(null);
  const [deleteBlockedByQuestions, setDeleteBlockedByQuestions] = useState<
    BlockingQuestion[] | null
  >(null);

  const fetchPassagesList = useCallback(async (subject?: string, classLevel?: string) => {
    setIsLoadingPassages(true);
    setPassagesError(null);
    try {
      const params = new URLSearchParams();
      if (subject) params.set("subject", subject);
      if (classLevel) params.set("class", classLevel);

      const res = await fetch(`/api/admin/passages?${params.toString()}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load passages"));
      const { passages: apiPassages } = await res.json();
      setPassages(apiPassages);
    } catch (err) {
      setPassagesError(err instanceof Error ? err.message : "Failed to load passages.");
    } finally {
      setIsLoadingPassages(false);
    }
  }, []);

  useEffect(() => {
    fetchPassagesList();
  }, [fetchPassagesList]);

  // --- manager: open/close ---
  const openPassageManager = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      managerTriggerRef.current = e.currentTarget;
      setIsManagerOpen(true);
      setManagerView("list");
      fetchPassagesList();
    },
    [fetchPassagesList],
  );

  const closePassageManager = useCallback(() => {
    if (isSavingPassage || isDeletingPassage) return;
    setIsManagerOpen(false);
    setManagerView("list");
    setEditingPassage(null);
    setPendingDeletePassage(null);
  }, [isSavingPassage, isDeletingPassage]);

  // --- manager: create/edit form ---
  const startCreatePassage = useCallback(() => {
    setEditingPassage(null);
    setPassageFormData(emptyPassageForm);
    setPassageFormError(null);
    setManagerView("form");
  }, []);

  const startEditPassage = useCallback((passage: Passage) => {
    setEditingPassage(passage);
    setPassageFormData({
      title: passage.title ?? "",
      text: passage.text,
      kind: passage.kind,
      subject: typeof passage.subject === "string" ? passage.subject : passage.subject._id,
      class: passage.class,
    });
    setPassageFormError(null);
    setManagerView("form");
  }, []);

  // Escape inside the form view goes back to the list, not out of the
  // modal entirely - the modal only fully closes from the list view.
  const cancelPassageForm = useCallback(() => {
    if (isSavingPassage) return;
    setManagerView("list");
    setEditingPassage(null);
    setPassageFormError(null);
  }, [isSavingPassage]);

  const handlePassageFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setPassageFormData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const submitPassageForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPassageFormError(null);

      if (!passageFormData.text.trim()) {
        return setPassageFormError("Please enter the passage text.");
      }
      if (!passageFormData.subject) {
        return setPassageFormError("Please select a subject.");
      }
      if (!passageFormData.class) {
        return setPassageFormError("Please select a class.");
      }

      setIsSavingPassage(true);
      try {
        const url = editingPassage
          ? `/api/admin/passages/${editingPassage._id}`
          : "/api/admin/passages";
        const method = editingPassage ? "PATCH" : "POST";
        // PATCH only accepts title/text (see the route) - subject/class/kind
        // are set once at creation and not editable afterward, so this is
        // safe to send as-is either way; the route just ignores the extra
        // fields on PATCH.
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(passageFormData),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to save passage"));

        showStatus({
          type: "success",
          text: editingPassage ? "Passage updated successfully." : "Passage created successfully.",
        });
        setManagerView("list");
        setEditingPassage(null);
        fetchPassagesList();
      } catch (err) {
        setPassageFormError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsSavingPassage(false);
      }
    },
    [passageFormData, editingPassage, showStatus, fetchPassagesList],
  );

  // --- manager: delete ---
  const requestDeletePassage = useCallback((passage: Passage) => {
    setPendingDeletePassage(passage);
    setDeletePassageError(null);
    setDeleteBlockedByQuestions(null);
  }, []);

  const cancelDeletePassage = useCallback(() => {
    if (isDeletingPassage) return;
    setPendingDeletePassage(null);
    setDeletePassageError(null);
    setDeleteBlockedByQuestions(null);
  }, [isDeletingPassage]);

  const confirmDeletePassage = useCallback(async () => {
    if (!pendingDeletePassage) return;
    setIsDeletingPassage(true);
    setDeletePassageError(null);
    try {
      const res = await fetch(`/api/admin/passages/${pendingDeletePassage._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await parseErrorPayload(res, "Failed to delete passage");
        if (res.status === 409 && error.blockedByQuestions) {
          setDeleteBlockedByQuestions(error.blockedByQuestions);
          return;
        }
        throw error;
      }
      showStatus({ type: "warning", text: "Passage deleted successfully." });
      setPendingDeletePassage(null);
      fetchPassagesList();
    } catch (err) {
      setDeletePassageError(err instanceof Error ? err.message : "Failed to delete passage.");
    } finally {
      setIsDeletingPassage(false);
    }
  }, [pendingDeletePassage, showStatus, fetchPassagesList]);

  return {
    passages,
    isLoadingPassages,
    passagesError,
    fetchPassagesList,

    isManagerOpen,
    managerView,
    editingPassage,
    managerTriggerRef,
    openPassageManager,
    closePassageManager,
    startCreatePassage,
    startEditPassage,
    cancelPassageForm,

    passageFormData,
    passageFormError,
    isSavingPassage,
    handlePassageFormChange,
    submitPassageForm,

    pendingDeletePassage,
    isDeletingPassage,
    deletePassageError,
    deleteBlockedByQuestions,
    requestDeletePassage,
    cancelDeletePassage,
    confirmDeletePassage,
  };
};
