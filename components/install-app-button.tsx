"use client";

import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallAppButton() {
  const { isInstallable, promptInstall } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div className="pt-2 text-center">
      <p className="text-xs text-[#4A6A8A] mb-2">
        Install this app on your computer for offline exam access
      </p>
      <button
        type="button"
        onClick={promptInstall}
        className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1"
        aria-label="Install the Bethesda CBT app on this computer">
        Install App
      </button>
    </div>
  );
}
