import React from "react";

interface TimerAnnouncementProps {
  announcement: string;
}

const TimerAnnouncement: React.FC<TimerAnnouncementProps> = ({ announcement }) => {
  return (
    <span className="sr-only" role="timer" aria-live="polite" aria-atomic="true">
      {announcement}
    </span>
  );
};

export default TimerAnnouncement;
