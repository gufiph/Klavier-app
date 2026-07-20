import type { Song } from '../../types/music';

interface CompletionScreenProps {
  song: Song;
  onPlayAgain: () => void;
  onBackToSelector: () => void;
}

// Pre-defined confetti with staggered positions and timings
const CONFETTI = [
  { color: '#E21C48', left: '8%',  delay: '0s',   size: 12, dur: '2.8s' },
  { color: '#F36421', left: '15%', delay: '0.3s', size: 8,  dur: '3.2s' },
  { color: '#FFE011', left: '22%', delay: '0.1s', size: 10, dur: '2.5s' },
  { color: '#8DC63F', left: '30%', delay: '0.5s', size: 14, dur: '3.0s' },
  { color: '#009A44', left: '38%', delay: '0.2s', size: 9,  dur: '2.7s' },
  { color: '#6E4B9E', left: '46%', delay: '0.4s', size: 11, dur: '3.5s' },
  { color: '#F04E98', left: '55%', delay: '0.1s', size: 13, dur: '2.9s' },
  { color: '#E21C48', left: '63%', delay: '0.6s', size: 8,  dur: '3.1s' },
  { color: '#F36421', left: '71%', delay: '0.2s', size: 12, dur: '2.6s' },
  { color: '#FFE011', left: '79%', delay: '0.4s', size: 9,  dur: '3.3s' },
  { color: '#8DC63F', left: '87%', delay: '0.1s', size: 11, dur: '2.8s' },
  { color: '#6E4B9E', left: '93%', delay: '0.3s', size: 10, dur: '3.0s' },
  { color: '#F04E98', left: '5%',  delay: '1.4s', size: 9,  dur: '2.8s' },
  { color: '#009A44', left: '25%', delay: '1.1s', size: 13, dur: '3.2s' },
  { color: '#E21C48', left: '43%', delay: '1.3s', size: 8,  dur: '2.5s' },
  { color: '#FFE011', left: '58%', delay: '1.2s', size: 12, dur: '3.0s' },
  { color: '#F36421', left: '75%', delay: '1.5s', size: 10, dur: '2.7s' },
  { color: '#6E4B9E', left: '88%', delay: '1.1s', size: 11, dur: '3.5s' },
];

const DIFF_STARS = ['', '⭐', '⭐⭐', '⭐⭐⭐'];

export function CompletionScreen({ song, onPlayAgain, onBackToSelector }: CompletionScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gray-950 text-white p-6 text-center overflow-hidden">

      {/* Confetti rain */}
      {CONFETTI.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none animate-confetti"
          style={{
            left: c.left,
            top: '-3%',
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            animationDelay: c.delay,
            animationDuration: c.dur,
          }}
        />
      ))}

      {/* Content card */}
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-sm w-full">
        <div className="text-7xl animate-bounce drop-shadow-lg">🎉</div>

        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Super gemacht!</h1>
          <p className="text-gray-400 text-sm">Du hast das Lied gespielt!</p>
        </div>

        <div
          className="w-full rounded-3xl p-6 border border-gray-700/60"
          style={{ background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div className="text-5xl mb-2">{song.coverEmoji}</div>
          <div className="font-bold text-white text-lg leading-tight mb-1">{song.title}</div>
          {song.subtitle && (
            <div className="text-gray-500 text-sm mb-2">{song.subtitle}</div>
          )}
          <div className="text-2xl">{DIFF_STARS[song.difficulty]}</div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="w-full text-white font-black py-4 rounded-2xl text-xl transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #4ade80, #16a34a)',
              boxShadow: '0 0 24px rgba(34,197,94,0.3), 0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            🔄 Nochmal spielen
          </button>
          <button
            onClick={onBackToSelector}
            className="w-full bg-gray-800 hover:bg-gray-700 active:scale-95 text-white font-bold py-4 rounded-2xl text-lg transition-colors border border-gray-700"
          >
            🎵 Anderes Lied
          </button>
        </div>
      </div>
    </div>
  );
}
