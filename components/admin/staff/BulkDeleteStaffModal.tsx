"use client";

import React from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useStaffStore } from "@/store/useStaffStore";

const BulkDeleteStaffModal: React.FC = () => {
  const { isBulkDeleteModalOpen, isBulkDeleting, selectedIds, closeBulkDeleteModal, confirmBulkDelete } =
    useStaffStore();

  return (
    <ConfirmDialog
      isOpen={isBulkDeleteModalOpen}
      title={`Delete ${selectedIds.size} staff member${selectedIds.size !== 1 ? "s" : ""}?`}
      description="This will permanently remove the selected staff records and their login access. This cannot be undone."
      confirmLabel="Delete"
      isDangerous
      isProcessing={isBulkDeleting}
      onConfirm={confirmBulkDelete}
      onCancel={closeBulkDeleteModal}
    />
  );
};

export default BulkDeleteStaffModal;
