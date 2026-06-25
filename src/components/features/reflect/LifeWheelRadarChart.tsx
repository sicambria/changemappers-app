import { CATEGORIES } from './lifeWheel.config';

interface LifeWheelRadarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scores: Record<string, any>;
  time: 'past' | 'present' | 'future';
}

export function LifeWheelRadarChart({ scores, time }: Readonly<LifeWheelRadarChartProps>) {
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;

  const points = CATEGORIES.map((cat, i) => {
    const angle = (i * 360 / CATEGORIES.length - 90) * (Math.PI / 180);
    const score = scores[cat.id][time];
    const distance = (score / 10) * radius;
    return {
      id: cat.id,
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
      color: cat.color
    };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] mx-auto filter drop-shadow-sm">
      {/* Background Circles */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
        <circle
          key={r}
          cx={center}
          cy={center}
          r={radius * r}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground opacity-20"
        />
      ))}

      {/* Radar lines */}
      {points.map((p) => (
        <line
          key={p.id}
          x1={center}
          y1={center}
          x2={p.x}
          y2={p.y}
          stroke={p.color}
          strokeWidth="1.5"
          strokeOpacity="0.4"
        />
      ))}

      {/* Data points */}
      {points.map((p) => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={p.color}
        />
      ))}

      {/* Closing Polygon */}
      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="currentColor"
        className="text-primary opacity-5"
        stroke="none"
      />
    </svg>
  );
}
