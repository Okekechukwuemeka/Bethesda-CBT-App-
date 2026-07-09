interface BadgeProps {
  variant?: "default" | "status" | "type";
  value: string;
  getColor?: (value: string) => string;
  getLabel?: (value: string) => string;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  value,
  getColor,
  getLabel,
  className = "",
}) => {
  const colorClass = getColor ? getColor(value) : "bg-gray-100 text-gray-800";
  const label = getLabel ? getLabel(value) : value;

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass} ${className}`}>
      {label}
    </span>
  );
};

export default Badge;
