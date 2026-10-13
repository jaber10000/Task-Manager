import { useMemo } from "react";

const COLORS = ["#3b6cf6", "#6a55f4", "#12a36a", "#f2a33a", "#e5487f", "#2bc4a0", "#ffd166"];

export default function Confetti({ burstKey }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 2.2 + Math.random() * 1.6,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burstKey]
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.55,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
