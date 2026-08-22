"use client";

import React from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useStaffStore } from "@/store/useStaffStore";

const DeleteStaffModal: React.FC = () => {
  const { isDeleteModalOpen, selectedStaff, closeDeleteModal, confirmDelete } = useStaffStore();

  return (
    <ConfirmDialog
      isOpen={isDeleteModalOpen}
      title="Delete staff member?"
      description={
        selectedStaff
          ? `This will permanently remove ${selectedStaff.firstName} ${selectedStaff.lastName} (${selectedStaff.staffId}) and their login access. This cannot be undone.`
          : ""
      }
      confirmLabel="Delete"
      isDangerous
      onConfirm={confirmDelete}
      onCancel={closeDeleteModal}
    />
  );
};

export default DeleteStaffModal;
