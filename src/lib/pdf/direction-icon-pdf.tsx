import { Circle, G, Path, Svg } from "@react-pdf/renderer";
import { DIRECTION_GLYPHS } from "@/lib/roadbook/direction-icons";
import type { DirectionType } from "@/lib/roadbook/types";

/** PDF counterpart of components/roadbook/direction-icon.tsx - same path data, @react-pdf primitives. */
export function DirectionIconPdf({
  direction,
  size = 14,
  color = "#0f172a",
}: {
  direction: DirectionType;
  size?: number;
  color?: string;
}) {
  const glyph = DIRECTION_GLYPHS[direction];
  if (!glyph || glyph.paths.length === 0) return null;
  const transform = [
    glyph.rotate ? `rotate(${glyph.rotate}, 12, 12)` : null,
    glyph.mirror ? "scale(-1,1) translate(-24,0)" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
      <G transform={transform || undefined}>
        {glyph.paths.map((d, i) => (
          <Path key={i} d={d} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}
        {glyph.dot ? <Circle cx={glyph.dot[0]} cy={glyph.dot[1]} r={glyph.dot[2]} fill={color} /> : null}
      </G>
    </Svg>
  );
}
