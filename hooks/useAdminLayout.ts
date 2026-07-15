"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { NavItem } from "@/config/admin-navigation";

export const useAdminLayout = (navItems: NavItem[]) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [routeAnnouncement, setRouteAnnouncement] = useState("");
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }

    const matched = navItems.find((item) =>
      item.href === "/admin"
        ? pathname === "/admin" || pathname === "/admin/"
        : pathname === item.href || pathname?.startsWith(item.href + "/"),
    );

    setRouteAnnouncement(matched ? `${matched.label} page loaded` : "Page loaded");
  }, [pathname, isMobile, navItems]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSidebarOpen && isMobile) {
        setIsSidebarOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSidebarOpen, isMobile]);

  // Sidebar's logout button opens the confirm dialog instead of logging
  // out immediately - actual sign-out happens in confirmLogout below.
  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const cancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  // Clears the NextAuth session (cookie + JWT) and redirects. Only called
  // once the user confirms via the dialog.
  const confirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    setIsLoading(true);
    signOut({ redirect: true, callbackUrl: "/admin/login" }).catch(() => {
      // Only reached if signOut itself throws before it can redirect -
      // otherwise the browser navigates away and this component unmounts.
      setIsLoading(false);
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
    if (!isSidebarOpen) {
      setTimeout(() => {
        sidebarRef.current?.focus();
      }, 100);
    }
  }, [isSidebarOpen]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const mainIsInert = isMobile && isSidebarOpen;

  return {
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
  };
};
