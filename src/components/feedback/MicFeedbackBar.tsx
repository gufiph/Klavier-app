import { getNoteColor } from '../../constants/boomwhacker';
import type { DetectedPitch } from '../../types/game';

interface MicFeedbackBarProps {
  detectedPitch: DetectedPitch | null;
  isListening: boolean;
}

export function MicFeedbackBar({ detectedPitch, isListening }: MicFeedbackBarProps) {
  const color = detectedPitch?.noteName ? getNoteColor(detectedPitch.noteName) : '#6b7280';
  const clarityPct = detectedPitch ? Math.round(detectedPitch.clarity * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-y border-gray-800 flex-shrink-0">
      <span className="text-xl">{isListening ? '🎤' : '🔇'}</span>
      <div
        className="font-bold text-base w-10 text-center transition-colors font-mono"
        style={{ color }}
      >
        {detectedPitch?.noteName ?? (isListening ? '…' : '—')}
      </div>
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${clarityPct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-gray-400 text-xs w-9 text-right">{clarityPct}%</span>
    </div>
  );
}
