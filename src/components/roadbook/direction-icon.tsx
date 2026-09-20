import { cn } from "@/lib/utils";
import { DIRECTION_GLYPHS, DIRECTION_LABELS, type DirectionGlyph } from "@/lib/roadbook/direction-icons";
import type { DirectionType } from "@/lib/roadbook/types";

interface DirectionIconProps {
  direction: DirectionType;
  /** Precomputed glyph to render instead of the built-in table lookup (custom icons, live designer preview). */
  glyph?: DirectionGlyph;
  label?: string;
  className?: string;
  size?: number;
}

/**
 * Renders a direction pictogram ("tulip diagram") from the shared path-data
 * table (see direction-icons.ts). Kept as a plain <svg>, not a lucide
 * component, so the exact same `d` strings can be reused verbatim by the PDF
 * renderer.
 */
export function DirectionIcon({ direction, glyph: glyphOverride, label, className, size = 22 }: DirectionIconProps) {
  const glyph = glyphOverride ?? DIRECTION_GLYPHS[direction];
  if (!glyph || glyph.bold.length === 0) {
    return <div className={cn("inline-block", className)} style={{ width: size, height: size }} aria-hidden />;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block", className)}
      role="img"
      aria-label={label ?? DIRECTION_LABELS[direction]}
    >
      {glyph.circle ? <circle cx={glyph.circle[0]} cy={glyph.circle[1]} r={glyph.circle[2]} strokeWidth={1} /> : null}
      {glyph.thin?.map((d, i) => (
        <path key={`thin-${i}`} d={d} strokeWidth={1} />
      ))}
      {glyph.bold.map((d, i) => (
        <path key={`bold-${i}`} d={d} strokeWidth={1.9} />
      ))}
      {glyph.dot ? (
        <circle cx={glyph.dot[0]} cy={glyph.dot[1]} r={glyph.dot[2]} fill="currentColor" stroke="none" />
      ) : null}
    </svg>
  );
}
