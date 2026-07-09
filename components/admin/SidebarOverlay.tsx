"use client";

import React from "react";

interface SidebarOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
};

export default SidebarOverlay;
