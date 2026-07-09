"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/config/admin-navigation";

interface SidebarProps {
  navItems: NavItem[];
  isOpen: boolean;
  isMobile: boolean;
  isLoading: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ navItems, isOpen, isMobile, isLoading, onClose, onLogout }, ref) => {
    const pathname = usePathname();

    const isNavItemActive = (item: NavItem) => {
      if (item.href === "/admin") {
        return pathname === "/admin" || pathname === "/admin/";
      }
      return pathname === item.href || pathname?.startsWith(item.href + "/");
    };

    return (
      <aside
        id="sidebar"
        ref={ref}
        className={`fixed top-0 left-0 h-full w-64 bg-[#1A3A5C] shadow-xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 focus:outline-none`}
        tabIndex={-1}>
        {/* Sidebar Header */}
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-white tracking-wide">Admin Panel</h1>
          <p className="text-[#8BB8E8] text-xs mt-1">Bethesda Home & School</p>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4" aria-label="Admin navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={isMobile ? onClose : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}>
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
            onClick={onLogout}
            disabled={isLoading}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#8BB8E8] disabled:opacity-50"
            aria-label={isLoading ? "Logging out, please wait" : "Logout from admin panel"}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{isLoading ? "Logging out..." : "Logout"}</span>
          </button>
          <p className="text-[#8A9CAE] text-xs text-center mt-2">© {new Date().getFullYear()}</p>
        </div>
      </aside>
    );
  },
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
