import Link from "next/link";

interface PageHeaderAction {
  label: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary";
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A5C]">{title}</h1>
        {description && <p className="text-[#5A7A9A] text-sm">{description}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2 ${
                action.variant === "secondary"
                  ? "bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C]"
                  : "bg-[#1A3A5C] hover:bg-[#14304D] text-white"
              }`}>
              {action.icon && action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
