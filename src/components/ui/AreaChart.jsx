// Courbe d'aire lissée (SVG) — rendu élégant pour les tendances.
function smoothPath(points) {
  if (points.length < 2) return "";
  const d = [`M ${points[0][0]},${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`);
  }
  return d.join(" ");
}

export default function AreaChart({ data = [], height = 130, color = "#e6c178", id = "area" }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = (v) => (v - min) / (max - min || 1);

  // viewBox 0..100, marge verticale de 12 %
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * 100,
    100 - (norm(v) * 76 + 12),
  ]);

  const line = smoothPath(pts);
  const area = `${line} L 100,100 L 0,100 Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${id})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute w-2 h-2 rounded-full"
        style={{
          left: `${last[0]}%`,
          top: `${last[1]}%`,
          transform: "translate(-50%, -50%)",
          background: color,
          boxShadow: `0 0 0 4px ${color}33, 0 0 12px ${color}aa`,
        }}
      />
    </div>
  );
}
