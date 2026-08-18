"use client";

import React from "react";

import Sidebar from "@/components/admin/Sidebar";
import MobileHeader from "@/components/admin/MobileHeader";
import SidebarOverlay from "@/components/admin/SidebarOverlay";
import SkipToContent from "@/components/admin/SkipToContent";
import PageAnnouncement from "@/components/admin/PageAnnouncement";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAdminLayout } from "@/hooks/useAdminLayout";
import { adminNavItems } from "@/config/admin-navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
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
  } = useAdminLayout(adminNavItems);

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
      />

      <SidebarOverlay isVisible={isMobile && isSidebarOpen} onClose={closeSidebar} />

      <Sidebar
        ref={sidebarRef}
        navItems={adminNavItems}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        isLoading={isLoading}
        onClose={closeSidebar}
        onLogout={handleLogout}
      />

      {/* Main Content */}
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
        description="You'll need to sign in again to access the admin panel."
        confirmLabel="Log Out"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

export default AdminLayout;
