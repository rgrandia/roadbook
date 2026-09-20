import { Circle, Path, Svg } from "@react-pdf/renderer";
import { DIRECTION_GLYPHS, type DirectionGlyph } from "@/lib/roadbook/direction-icons";
import type { DirectionType } from "@/lib/roadbook/types";

/** PDF counterpart of components/roadbook/direction-icon.tsx - same path data, @react-pdf primitives. */
export function DirectionIconPdf({
  direction,
  glyph: glyphOverride,
  size = 20,
  color = "#0f172a",
}: {
  direction: DirectionType;
  /** Precomputed glyph to render instead of the built-in table lookup (custom icons). */
  glyph?: DirectionGlyph;
  size?: number;
  color?: string;
}) {
  const glyph = glyphOverride ?? DIRECTION_GLYPHS[direction];
  if (!glyph || glyph.bold.length === 0) return null;

  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      {glyph.circle ? (
        <Circle
          cx={glyph.circle[0]}
          cy={glyph.circle[1]}
          r={glyph.circle[2]}
          stroke={color}
          strokeWidth={0.9}
          fill="none"
        />
      ) : null}
      {glyph.thin?.map((d, i) => (
        <Path key={`thin-${i}`} d={d} stroke={color} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      ))}
      {glyph.bold.map((d, i) => (
        <Path
          key={`bold-${i}`}
          d={d}
          stroke={color}
          strokeWidth={1.7}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {glyph.dot ? <Circle cx={glyph.dot[0]} cy={glyph.dot[1]} r={glyph.dot[2]} fill={color} /> : null}
    </Svg>
  );
}
