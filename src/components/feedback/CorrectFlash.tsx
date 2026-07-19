interface CorrectFlashProps {
  show: boolean;
}

export function CorrectFlash({ show }: CorrectFlashProps) {
  if (!show) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none z-40"
      style={{
        backgroundColor: '#22c55e18',
        boxShadow: 'inset 0 0 80px #22c55e33',
      }}
    />
  );
}
