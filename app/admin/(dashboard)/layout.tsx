"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  ariaLabel: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/admin",
      ariaLabel: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: "students",
      label: "Students",
      href: "/admin/students",
      ariaLabel: "Manage Students",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      id: "questions",
      label: "Questions",
      href: "/admin/questions",
      ariaLabel: "Manage Questions",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "exams",
      label: "Exams",
      href: "/admin/exams",
      ariaLabel: "Manage Exams",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "results",
      label: "Results",
      href: "/admin/results",
      ariaLabel: "View Results",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
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
  }, [pathname, isMobile]);

  // Handle Escape key to close sidebar
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

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      setIsLoading(true);
      setTimeout(() => {
        router.push("/admin/login");
      }, 500);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    if (!isSidebarOpen) {
      setTimeout(() => {
        sidebarRef.current?.focus();
      }, 100);
    }
  };

  // Helper function to check if a nav item is active
  const isNavItemActive = (item: NavItem) => {
    // For dashboard, only match exactly "/admin" or "/admin/"
    if (item.href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    // For other items, match the path or any subpaths
    return pathname === item.href || pathname?.startsWith(item.href + "/");
  };

  return (
    <div className="min-h-screen bg-[#E8F0FE] font-sans">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-[#1A3A5C] focus:p-4 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-[#2B6CB0]">
        Skip to main content
      </a>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#1A3A5C] px-4 py-3 flex items-center justify-between">
        <button
          ref={toggleButtonRef}
          onClick={toggleSidebar}
          className="text-white hover:text-[#8BB8E8] focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] rounded p-1"
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="text-white font-bold text-sm">Admin Panel</span>
        <button
          onClick={handleLogout}
          className="text-white hover:text-[#8BB8E8] focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] rounded p-1 text-sm"
          aria-label="Logout">
          Logout
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-64 bg-[#1A3A5C] shadow-xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 focus:outline-none`}
        role="navigation"
        aria-label="Admin navigation"
        tabIndex={-1}>
        {/* Sidebar Header */}
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white tracking-wide">Admin Panel</h1>
          <p className="text-[#8BB8E8] text-xs mt-1">Bethesda Home & School</p>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.ariaLabel}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] disabled:opacity-50"
            aria-label="Logout from admin panel">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{isLoading ? "Logging out..." : "Logout"}</span>
          </button>
          <p className="text-[8A9CAE] text-xs text-center mt-2">© {new Date().getFullYear()}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className={`transition-all duration-300 ${
          isSidebarOpen && !isMobile ? "lg:ml-64" : "ml-0"
        } ${isMobile ? "pt-16" : ""}`}
        role="main"
        aria-label="Main content">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
