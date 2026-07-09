"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavItem } from "@/components/admin/admin-navigation";

export const useAdminLayout = (navItems: NavItem[]) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleLogout = useCallback(() => {
    if (confirm("Are you sure you want to logout?")) {
      setIsLoading(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 500);
    }
  }, [router]);

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
    routeAnnouncement,
    mainIsInert,
    sidebarRef,
    toggleButtonRef,
    handleLogout,
    toggleSidebar,
    closeSidebar,
  };
};
