import React, { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const [pageAnnouncement, setPageAnnouncement] = useState("");

  const handlePageChange = (page: number) => {
    onPageChange(page);
    const start = (page - 1) * itemsPerPage + 1;
    const end = Math.min(page * itemsPerPage, totalItems);
    setPageAnnouncement(
      `Page ${page} of ${totalPages}, showing students ${start} to ${end} of ${totalItems}`,
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8EEF5]">
      <p className="text-sm text-[#5A7A9A]">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems}{" "}
        students
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {pageAnnouncement}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-[#C5D8EC] rounded-lg hover:bg-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="Previous page">
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 text-sm rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
              currentPage === page
                ? "bg-[#1A3A5C] text-white"
                : "border border-[#C5D8EC] hover:bg-[#F8FAFE]"
            }`}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}>
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-[#C5D8EC] rounded-lg hover:bg-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="Next page">
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
