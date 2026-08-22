"use client";

interface MobileHeaderProps {
  isSidebarOpen: boolean;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
  toggleButtonRef: React.RefObject<HTMLButtonElement | null>;
  title?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  isSidebarOpen,
  isLoading,
  onToggleSidebar,
  onLogout,
  toggleButtonRef,
  title = "Admin Panel",
}) => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1A3A5C] px-4 py-3 flex items-center justify-between">
      <button
        ref={toggleButtonRef}
        onClick={onToggleSidebar}
        className="text-white hover:text-[#8BB8E8] focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] rounded p-1"
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <span className="text-white font-bold text-sm">{title}</span>
      <button
        onClick={onLogout}
        disabled={isLoading}
        className="text-white hover:text-[#8BB8E8] focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] rounded p-1 text-sm disabled:opacity-50"
        aria-label={isLoading ? "Logging out, please wait" : "Logout"}>
        {isLoading ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
};

export default MobileHeader;
