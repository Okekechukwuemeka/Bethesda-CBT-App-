"use client";

import React, { useEffect } from "react";

import Sidebar from "@/components/admin/Sidebar";
import MobileHeader from "@/components/admin/MobileHeader";
import SidebarOverlay from "@/components/admin/SidebarOverlay";
import SkipToContent from "@/components/admin/SkipToContent";
import PageAnnouncement from "@/components/admin/PageAnnouncement";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAdminLayout } from "@/hooks/useAdminLayout";
import { staffNavItems } from "@/config/staff-navigation";
import { useTeacherProfileStore } from "@/store/useTeacherProfileStore";

interface StaffLayoutProps {
  children: React.ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const { profile, fetchProfile } = useTeacherProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Question Bank / Results only make sense for teachers - non-teaching
  // staff just get the plain dashboard link. Default to showing all items
  // until the profile loads so the sidebar doesn't flash empty.
  const visibleNavItems = staffNavItems.filter(
    (item) => !item.teacherOnly || !profile || profile.role === "teacher",
  );

  const {
    isSidebarOpen,
    isMobile,
    isLoading,
    showLogoutConfirm,
    routeAnnouncement,
    mainIsInert,
    sidebarRef,
    toggleButtonRef,
    handleLogout,
    confirmLogout,
    cancelLogout,
    toggleSidebar,
    closeSidebar,
  } = useAdminLayout(visibleNavItems, "/staff", "/staff/login");

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#E8F0FE] font-sans">
      <PageAnnouncement announcement={routeAnnouncement} />
      <SkipToContent />

      <MobileHeader
        isSidebarOpen={isSidebarOpen}
        isLoading={isLoading}
        onToggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        toggleButtonRef={toggleButtonRef}
        title="Staff Portal"
      />

      <SidebarOverlay isVisible={isMobile && isSidebarOpen} onClose={closeSidebar} />

      <Sidebar
        ref={sidebarRef}
        navItems={visibleNavItems}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        isLoading={isLoading}
        onClose={closeSidebar}
        onLogout={handleLogout}
        title="Staff Portal"
        homeHref="/staff"
        navAriaLabel="Staff navigation"
      />

      <main
        id="main-content"
        inert={mainIsInert}
        className={`transition-all duration-300 ${
          isSidebarOpen && !isMobile ? "lg:ml-64" : "ml-0"
        } ${isMobile ? "pt-16" : ""}`}>
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out?"
        description="You'll need to sign in again to access the staff portal."
        confirmLabel="Log Out"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

export default StaffLayout;
