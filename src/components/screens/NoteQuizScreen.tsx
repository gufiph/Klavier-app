import { useState, useCallback } from 'react';
import { getNoteColor } from '../../constants/boomwhacker';
import { PIANO_KEYS } from '../../constants/keyboard';

interface NoteQuizScreenProps {
  onBack: () => void;
}

// Notes in treble clef range for the quiz (C4 to G5)
const QUIZ_NOTES = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5'];

// Y offset from bottom staff line (E4) per note, step = 10px
const NOTE_Y_OFFSET: Record<string, number> = {
  'C4': 20, 'D4': 15, 'E4': 10, 'F4': 5, 'G4': 0, 'A4': -5,
  'B4': -10, 'C5': -15, 'D5': -20, 'E5': -25, 'F5': -30, 'G5': -35,
};

// Which notes need ledger lines: C4 needs 1 below, D4 needs 1 below (no line just space)
const LEDGER_BELOW: Record<string, number[]> = { 'C4': [20] }; // y positions of ledger lines
const LEDGER_ABOVE: Record<string, number[]> = { 'G5': [-35] };

function getDisplayName(note: string): string {
  const letter = note.replace(/[#\d]/g, '');
  const octave = note.replace(/[^0-9]/g, '');
  const display = letter === 'B' ? 'H' : letter;
  return `${display}${octave}`;
}

function StaffNote({ note }: { note: string }) {
  const staffTop = 40;
  const lineSpacing = 10;
  // Lines at Y: staffTop, staffTop+10, staffTop+20, staffTop+30, staffTop+40 (top to bottom = F5 D5 B4 G4 E4)
  const bottomLineY = staffTop + 4 * lineSpacing; // E4
  const noteYOffset = NOTE_Y_OFFSET[note] ?? 0;
  const noteY = bottomLineY - noteYOffset;
  const color = getNoteColor(note);
  const ledgerBelow = LEDGER_BELOW[note] ?? [];
  const ledgerAbove = LEDGER_ABOVE[note] ?? [];

  return (
    <svg viewBox="0 0 200 110" width="200" height="110" className="overflow-visible">
      {/* Treble clef simplified */}
      <text x="10" y={bottomLineY + 10} fontSize="55" fill="#6b7280" style={{ fontFamily: 'serif' }}>𝄞</text>

      {/* Staff lines */}
      {[0,1,2,3,4].map(i => (
        <line key={i} x1="30" y1={staffTop + i * lineSpacing} x2="190" y2={staffTop + i * lineSpacing}
          stroke="#6b7280" strokeWidth="1" />
      ))}

      {/* Ledger lines */}
      {[...ledgerBelow.map(dy => bottomLineY - dy + bottomLineY - bottomLineY), ...ledgerAbove.map(dy => bottomLineY - dy)].map((ly, i) => {
        // Actually let me just draw ledger line at noteY if needed
        return null;
      })}
      {note === 'C4' && (
        <line x1="95" y1={noteY} x2="125" y2={noteY} stroke="#9ca3af" strokeWidth="1.5" />
      )}
      {note === 'G5' && (
        <line x1="95" y1={noteY} x2="125" y2={noteY} stroke="#9ca3af" strokeWidth="1.5" />
      )}

      {/* Note head */}
      <ellipse cx="110" cy={noteY} rx="9" ry="7" fill={color} />
      {/* Stem */}
      <line x1="119" y1={noteY} x2="119" y2={noteY - 30} stroke={color} strokeWidth="2" />

      {/* Note name label */}
      <text x="110" y={noteY + 25} textAnchor="middle" fill="#9ca3af" fontSize="11">
        {getDisplayName(note)}?
      </text>
    </svg>
  );
}

const KEYBOARD_NOTES = PIANO_KEYS.filter(k => {
  const oct = parseInt(k.note.slice(-1));
  return oct >= 4 && oct <= 5 && !k.note.includes('#');
});

function pickRandom(exclude?: string): string {
  const pool = exclude ? QUIZ_NOTES.filter(n => n !== exclude) : QUIZ_NOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function NoteQuizScreen({ onBack }: NoteQuizScreenProps) {
  const [target, setTarget] = useState(() => pickRandom());
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [streak, setStreak] = useState(0);

  const handleKey = useCallback((note: string) => {
    if (result) return;
    const noteBase = note.replace(/[#]/g, '').toUpperCase();
    const targetBase = target.replace(/[#]/g, '');
    const isCorrect = note === target;
    setResult(isCorrect ? 'correct' : 'wrong');
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    setStreak(s => isCorrect ? s + 1 : 0);
    void noteBase; void targetBase;

    setTimeout(() => {
      setResult(null);
      setTarget(pickRandom(target));
    }, 800);
  }, [result, target]);

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 flex-shrink-0">
        <button onClick={onBack} className="text-xl p-1.5 rounded-xl hover:bg-gray-800 transition-colors">◄</button>
        <h1 className="text-lg font-black flex-1">Noten-Quiz</h1>
        <div className="text-right">
          <div className="text-xs text-gray-500">{score.correct}/{score.total}</div>
          {score.total > 0 && <div className="text-xs font-bold text-emerald-400">{accuracy}%</div>}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between p-4 pb-2">
        {/* Streak */}
        {streak > 1 && (
          <div className="text-xs font-black text-amber-400 animate-bounce">
            🔥 {streak}× hintereinander richtig!
          </div>
        )}

        {/* Instruction */}
        <div className="text-gray-400 text-sm text-center mt-2">
          Welche Taste ist diese Note?
        </div>

        {/* Staff + Note */}
        <div
          className="flex items-center justify-center rounded-2xl p-4"
          style={{
            background: result === 'correct' ? 'rgba(34,197,94,0.15)' : result === 'wrong' ? 'rgba(239,68,68,0.15)' : 'rgba(17,24,39,0.8)',
            border: `2px solid ${result === 'correct' ? '#22c55e' : result === 'wrong' ? '#ef4444' : '#374151'}`,
            transition: 'all 0.2s',
          }}
        >
          <StaffNote note={target} />
        </div>

        {result && (
          <div className={`text-2xl font-black ${result === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
            {result === 'correct' ? '✓ Richtig!' : `✗ Es war ${getDisplayName(target)}`}
          </div>
        )}

        {/* Simplified keyboard */}
        <div className="w-full">
          <p className="text-xs text-gray-600 text-center mb-2">Tippe auf die richtige Taste</p>
          <div className="flex justify-center gap-1 flex-wrap">
            {KEYBOARD_NOTES.map(key => {
              const color = getNoteColor(key.note);
              const letter = key.note.replace(/\d/, '');
              const displayLetter = letter === 'B' ? 'H' : letter;
              const octave = key.note.slice(-1);
              return (
                <button
                  key={key.note}
                  onClick={() => handleKey(key.note)}
                  className="flex flex-col items-center justify-end pb-1 rounded-b-lg border border-gray-400 transition-all active:scale-95"
                  style={{
                    width: 'clamp(28px, 6vw, 44px)',
                    height: 'clamp(60px, 12vw, 90px)',
                    background: key.note === target && result === 'correct' ? color : '#f8fafc',
                    boxShadow: key.note === target && result === 'correct' ? `0 0 12px ${color}` : undefined,
                  }}
                >
                  <span className="text-gray-700 font-bold" style={{ fontSize: 'clamp(8px, 1.5vw, 12px)' }}>
                    {displayLetter}
                  </span>
                  <span className="text-gray-400" style={{ fontSize: 'clamp(6px, 1vw, 9px)' }}>
                    {octave}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
