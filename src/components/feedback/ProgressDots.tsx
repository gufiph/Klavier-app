interface ProgressDotsProps {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: ProgressDotsProps) {
  const MAX_DOTS = 20;
  const safeTot = total || 1;
  const dotCount = Math.min(safeTot, MAX_DOTS);
  const step = safeTot / dotCount;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-800 flex-shrink-0">
      <div className="flex gap-1 flex-1 justify-center items-center">
        {Array.from({ length: dotCount }).map((_, i) => {
          const threshold = i * step;
          const isPassed = current > threshold;
          const isCurrent = current >= threshold && current < threshold + step;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: isCurrent ? 12 : 8,
                height: isCurrent ? 12 : 8,
                backgroundColor: isPassed ? '#22c55e' : isCurrent ? '#ffffff' : '#374151',
              }}
            />
          );
        })}
      </div>
      <span className="text-gray-500 text-xs ml-3 flex-shrink-0">
        {current}/{total}
      </span>
    </div>
  );
}
