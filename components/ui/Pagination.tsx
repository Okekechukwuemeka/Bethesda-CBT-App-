import React, { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  // Plural noun used in the summary, e.g. "exams" or "questions".
  itemLabel?: string;
}

// 1 … 4 5 [6] 7 8 … 20 - always the first and last page, plus a window
// around the current one, so the control stays compact however many pages
// there are.
export function getPageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) items.push("gap");
    items.push(page);
  });
  return items;
}

const buttonBase =
  "px-3 py-1 text-sm rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]";

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
}) => {
  const [announcement, setAnnouncement] = useState("");

  if (totalItems === 0) return null;

  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, totalItems);

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    setAnnouncement(
      `Page ${page} of ${totalPages}, showing ${itemLabel} ${start} to ${end} of ${totalItems}`,
    );
  };

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
      <p className="text-sm text-[#5A7A9A]">
        Showing {first} to {last} of {totalItems} {itemLabel}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${buttonBase} border border-[#C5D8EC] hover:bg-[#F8FAFE] disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Previous page">
            Previous
          </button>
          {getPageItems(currentPage, totalPages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-[#8A9CAE]">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goTo(item)}
                className={`${buttonBase} ${
                  currentPage === item
                    ? "bg-[#1A3A5C] text-white"
                    : "border border-[#C5D8EC] hover:bg-[#F8FAFE]"
                }`}
                aria-label={`Go to page ${item}`}
                aria-current={currentPage === item ? "page" : undefined}>
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${buttonBase} border border-[#C5D8EC] hover:bg-[#F8FAFE] disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Next page">
            Next
          </button>
        </div>
      )}
    </nav>
  );
};

export default Pagination;
