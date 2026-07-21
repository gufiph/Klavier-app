import { useState } from 'react';

interface OnboardingScreenProps {
  onDone: () => void;
}

const SLIDES = [
  {
    emoji: '🎹',
    title: 'Willkommen!',
    text: 'Klavier Lernen macht Spaß! Spiel auf deinem echten Klavier und die App hört dir zu.',
    bg: 'linear-gradient(135deg, #7c3aed, #2563eb)',
  },
  {
    emoji: '⬇️',
    title: 'Noten fallen herab',
    text: 'Bunte Blöcke zeigen dir, welche Taste du als nächstes spielen sollst. Die Farbe verrät die Note!',
    bg: 'linear-gradient(135deg, #059669, #0284c7)',
  },
  {
    emoji: '🎤',
    title: 'Das Mikrofon hört zu',
    text: 'Spiel die richtige Taste und die App erkennt deinen Ton automatisch. Kein Tippen nötig!',
    bg: 'linear-gradient(135deg, #d97706, #dc2626)',
  },
  {
    emoji: '⭐',
    title: 'Sammle Sterne!',
    text: 'Je weniger Fehler, desto mehr Sterne bekommst du. Schaffst du überall 3 Sterne?',
    bg: 'linear-gradient(135deg, #7c3aed, #db2777)',
  },
];

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      className="flex flex-col items-center justify-between h-[100dvh] text-white p-8 transition-all duration-500"
      style={{ background: current.bg }}
    >
      <button
        onClick={onDone}
        className="self-end text-white/60 text-sm font-semibold"
      >
        Überspringen
      </button>

      <div className="flex flex-col items-center gap-6 text-center max-w-xs">
        <div className="text-8xl leading-none" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))' }}>
          {current.emoji}
        </div>
        <h1 className="text-3xl font-black tracking-tight">{current.title}</h1>
        <p className="text-white/80 text-base leading-relaxed">{current.text}</p>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        {/* Dot indicator */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === slide ? 20 : 8,
                height: 8,
                background: i === slide ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => isLast ? onDone() : setSlide(s => s + 1)}
          className="w-full py-4 rounded-2xl text-lg font-black text-gray-900 transition-transform active:scale-95"
          style={{ background: 'white' }}
        >
          {isLast ? '🎵 Los geht\'s!' : 'Weiter →'}
        </button>
      </div>
    </div>
  );
}
