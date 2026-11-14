import { memo } from 'react';

const LEAF =
  'M0 0 C-13 -18 -28 -28 -39 -31 L-32 -38 L-49 -39 L-44 -48 L-56 -53 L-42 -59 L-50 -69 L-31 -70 L-31 -84 L-18 -75 C-9 -55 -3 -30 0 0Z';
const LAYERS: [number, number, number, number, number, string][] = [
  [0, 20, 32, 12, 27, '#e4e6e4'],
  [1, 18, 25, 11, 23, '#f3f3f0'],
  [2, 15, 16, 10, 18, '#ffffff'],
];

/** 원본 v10의 흰 국화 SVG */
export const Chrysanthemum = memo(function Chrysanthemum({ seed }: { seed: number }) {
  const petals = LAYERS.flatMap(([layer, n, dist, rx, ry, color]) =>
    Array.from({ length: n }, (_, j) => {
      const a = (j * 360) / n + layer * 10 + Math.sin(seed + j * 3.7) * 4;
      const variance = Math.sin(j * 2.31 + seed) * 3;
      return (
        <ellipse
          key={`${layer}-${j}`}
          cx="0"
          cy={-dist - variance}
          rx={rx}
          ry={ry}
          fill={color}
          opacity={layer === 0 ? 0.95 : 1}
          transform={`rotate(${a})`}
        />
      );
    }),
  );
  return (
    <svg viewBox="0 0 170 242" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 229 Q72 181 112 83" stroke="#83a894" strokeWidth="8" fill="none" strokeLinecap="round" />
      <g transform="translate(74 158) rotate(-33) scale(.82)">
        <path d={LEAF} fill="#83a894" />
      </g>
      <g transform="translate(94 123) rotate(148) scale(.66)">
        <path d={LEAF} fill="#83a894" />
      </g>
      <g transform="translate(112 79)">
        {petals}
        <circle r="14" fill="#fdfdfb" />
        <circle r="8" fill="#ffffff" />
      </g>
    </svg>
  );
});
