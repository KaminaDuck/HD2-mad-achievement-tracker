interface ProgressBarProps {
  percent: number;
  earned?: boolean;
}

export function ProgressBar({ percent, earned }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          earned
            ? "bg-yellow-500"
            : clamped > 50
              ? "bg-blue-500"
              : "bg-gray-600"
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
