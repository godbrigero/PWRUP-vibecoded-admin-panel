interface ProgressBarProps {
  value: number;
  className?: string;
  color?: "blue" | "green" | "yellow" | "red";
}

export function ProgressBar({
  value,
  className = "",
  color = "blue",
}: ProgressBarProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const percentage = value > 1 ? value : value * 100;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`w-full bg-gray-700 rounded-full h-2 ${className}`}>
      <div
        className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}
