"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import { useStaffStore } from "@/store/useStaffStore";

const StaffCreatedModal: React.FC = () => {
  const { isCreatedModalOpen, createdStaffInfo, closeCreatedModal } = useStaffStore();
  if (!createdStaffInfo) return null;

  return (
    <Modal isOpen={isCreatedModalOpen} onClose={closeCreatedModal} title="Staff Member Added">
      <div className="space-y-4">
        <p className="text-sm text-[#4A6A8A]">
          <strong className="text-[#1A3A5C]">{createdStaffInfo.name}</strong> has been added.
          Share these login details with them now — the password won't be shown again.
        </p>
        <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#5A7A9A]">Staff ID</span>
            <span className="font-mono font-medium text-[#1A3A5C]">{createdStaffInfo.staffId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5A7A9A]">Username</span>
            <span className="font-mono font-medium text-[#1A3A5C]">{createdStaffInfo.username}</span>
          </div>
          {createdStaffInfo.tempPassword && (
            <div className="flex justify-between text-sm">
              <span className="text-[#5A7A9A]">Temporary Password</span>
              <span className="font-mono font-medium text-[#1A3A5C]">
                {createdStaffInfo.tempPassword}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={closeCreatedModal}
          className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
          Done
        </button>
      </div>
    </Modal>
  );
};

export default StaffCreatedModal;
