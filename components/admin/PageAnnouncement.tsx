"use client";

import React from "react";

interface PageAnnouncementProps {
  announcement: string;
}

const PageAnnouncement: React.FC<PageAnnouncementProps> = ({ announcement }) => {
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement}
    </div>
  );
};

export default PageAnnouncement;
