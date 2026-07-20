import type { Song } from '../../types/music';
import type { FeedbackState } from '../../types/game';
import { getNoteColor } from '../../constants/boomwhacker';

interface SheetMusicViewProps {
  song: Song;
  currentNoteIndex: number;
  feedback: FeedbackState;
  coloredNotes: boolean;
}

// Staff step: E4=0, +1 per diatonic step upward
// Staff lines at steps 0(E4), 2(G4), 4(B4), 6(D5), 8(F5)
function noteToStep(name: string): number {
  const m = name.match(/^([A-G])(#?)(\d)$/);
  if (!m) return 0;
  const d: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  return (parseInt(m[3]) - 4) * 7 + ((d[m[1]] ?? 0) - 2);
}

function germanName(name: string): string {
  return name.replace(/\d/, '').replace('B', 'H').replace('#', '♯');
}

// SVG geometry
const VB_W = 580;
const VB_H = 160;
const CLEF_W = 55;
const PREV = 2;
const NEXT = 7;
const TOTAL = PREV + 1 + NEXT;
const SLOT_W = (VB_W - CLEF_W) / TOTAL;

const HALF_STEP = 6;
const BOTTOM_Y = 96;   // Y of E4 (step 0, bottom staff line)
const NOTE_RX = 7.5;
const NOTE_RY = 5.5;
const STEM_LEN = 30;

function ny(step: number): number {
  return BOTTOM_Y - step * HALF_STEP;
}

const STAFF_YS = [0, 2, 4, 6, 8].map(ny);
const STAFF_TOP_Y = ny(8);
const STAFF_BOT_Y = ny(0);

export function SheetMusicView({ song, currentNoteIndex, feedback, coloredNotes }: SheetMusicViewProps) {
  const startIdx = Math.max(0, currentNoteIndex - PREV);
  const slots = song.notes.slice(startIdx, startIdx + TOTAL);
  const curInView = currentNoteIndex - startIdx;

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden flex flex-col items-center justify-center">
      {/* Staff label */}
      <div className="absolute top-2 right-3 text-gray-700 text-xs font-mono select-none">Noten</div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        style={{ maxHeight: '100%' }}
      >
        {/* Staff lines */}
        {STAFF_YS.map((y, i) => (
          <line key={i}
            x1={CLEF_W - 4} y1={y} x2={VB_W - 4} y2={y}
            stroke="#374151" strokeWidth={1} />
        ))}

        {/* Opening barline */}
        <line x1={CLEF_W} y1={STAFF_TOP_Y} x2={CLEF_W} y2={STAFF_BOT_Y}
          stroke="#4b5563" strokeWidth={1.5} />

        {/* Treble clef (𝄞) */}
        <text
          x={3} y={STAFF_BOT_Y + 7}
          fontSize={60}
          fontFamily="'Times New Roman', Georgia, serif"
          fill="#6b7280"
        >
          𝄞
        </text>

        {/* Current note highlight */}
        {curInView >= 0 && curInView < TOTAL && (
          <rect
            x={CLEF_W + curInView * SLOT_W + 1}
            y={STAFF_TOP_Y - 18}
            width={SLOT_W - 2}
            height={STAFF_BOT_Y - STAFF_TOP_Y + 36}
            fill={feedback === 'correct' ? '#22c55e18' : '#ffffff09'}
            rx={6}
            stroke={feedback === 'correct' ? '#22c55e50' : '#ffffff18'}
            strokeWidth={1}
          />
        )}

        {/* Notes */}
        {slots.map((event, si) => {
          const globalIdx = startIdx + si;
          const isPast = globalIdx < currentNoteIndex;
          const isCurrent = globalIdx === currentNoteIndex;
          const distAhead = globalIdx - currentNoteIndex;
          const opacity = isPast ? 0.22 : isCurrent ? 1 : Math.max(0.35, 1 - distAhead * 0.11);
          const cx = CLEF_W + (si + 0.5) * SLOT_W;

          if (event.rest) {
            return (
              <g key={globalIdx} opacity={opacity}>
                <text x={cx} y={ny(4) + 6}
                  textAnchor="middle" fontSize={20}
                  fontFamily="'Times New Roman', serif"
                  fill={isCurrent ? '#ffffff' : '#4b5563'}
                >
                  𝄽
                </text>
              </g>
            );
          }

          const step = noteToStep(event.note);
          const isSharp = event.note.includes('#');
          const isWhole = event.duration === 'whole';
          const isHalf = event.duration === 'half';
          const isFilled = !isWhole && !isHalf;
          const stemUp = step < 4;
          const y = ny(step);
          const stemX = stemUp ? cx + NOTE_RX - 1 : cx - NOTE_RX + 1;
          const stemY2 = stemUp ? y - STEM_LEN : y + STEM_LEN;

          const bwColor = getNoteColor(event.note);
          const color = isPast
            ? '#2d3748'
            : coloredNotes
              ? bwColor
              : (isCurrent ? '#ffffff' : '#9ca3af');

          // Ledger lines below staff (at even steps ≤ -2)
          const ledgers: number[] = [];
          if (step <= -2) {
            for (let ls = -2; ls >= step; ls -= 2) ledgers.push(ls);
          }
          if (step >= 10) {
            for (let ls = 10; ls <= step; ls += 2) ledgers.push(ls);
          }

          return (
            <g key={globalIdx} opacity={opacity}>
              {/* Ledger lines */}
              {ledgers.map(ls => (
                <line key={ls}
                  x1={cx - NOTE_RX - 5} y1={ny(ls)}
                  x2={cx + NOTE_RX + 5} y2={ny(ls)}
                  stroke="#4b5563" strokeWidth={1} />
              ))}

              {/* Sharp sign */}
              {isSharp && (
                <text x={cx - NOTE_RX - 9} y={y + 4}
                  fontSize={11} fontFamily="serif"
                  fill={color} textAnchor="middle">
                  ♯
                </text>
              )}

              {/* Note head */}
              <ellipse cx={cx} cy={y} rx={NOTE_RX} ry={NOTE_RY}
                fill={isFilled ? color : 'none'}
                stroke={color} strokeWidth={1.5}
              />

              {/* Half note inner hole */}
              {isHalf && (
                <ellipse cx={cx} cy={y} rx={NOTE_RX - 3} ry={NOTE_RY - 2.5}
                  fill="#030712" />
              )}

              {/* Stem */}
              {!isWhole && (
                <line x1={stemX} y1={y} x2={stemX} y2={stemY2}
                  stroke={color} strokeWidth={1.5} />
              )}

              {/* Eighth flag */}
              {event.duration === 'eighth' && stemUp && (
                <path
                  d={`M${stemX},${stemY2} C${stemX + 12},${stemY2 + 8} ${stemX + 10},${stemY2 + 18} ${stemX},${stemY2 + 22}`}
                  fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
              )}
              {event.duration === 'eighth' && !stemUp && (
                <path
                  d={`M${stemX},${stemY2} C${stemX - 12},${stemY2 - 8} ${stemX - 10},${stemY2 - 18} ${stemX},${stemY2 - 22}`}
                  fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
              )}

              {/* Note name label */}
              {!isPast && (
                <text
                  x={cx}
                  y={stemUp ? y + NOTE_RY + 12 : y - NOTE_RY - 5}
                  textAnchor="middle"
                  fontSize={isCurrent ? 9 : 7.5}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  fill={isCurrent ? (coloredNotes ? bwColor : '#fff') : '#4b5563'}
                >
                  {germanName(event.note)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
