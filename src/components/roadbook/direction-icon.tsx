import { cn } from "@/lib/utils";
import { DIRECTION_GLYPHS, DIRECTION_LABELS } from "@/lib/roadbook/direction-icons";
import type { DirectionType } from "@/lib/roadbook/types";

interface DirectionIconProps {
  direction: DirectionType;
  className?: string;
  size?: number;
}

/**
 * Renders a direction glyph from the shared path-data table (see
 * direction-icons.ts). Kept as a plain <svg>, not a lucide component, so the
 * exact same `d` strings can be reused verbatim by the PDF renderer.
 */
export function DirectionIcon({ direction, className, size = 20 }: DirectionIconProps) {
  const glyph = DIRECTION_GLYPHS[direction];
  if (!glyph || glyph.paths.length === 0) {
    return <div className={cn("inline-block", className)} style={{ width: size, height: size }} aria-hidden />;
  }
  const transform = [
    glyph.rotate ? `rotate(${glyph.rotate} 12 12)` : null,
    glyph.mirror ? "scale(-1,1) translate(-24,0)" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block", className)}
      role="img"
      aria-label={DIRECTION_LABELS[direction]}
    >
      <g transform={transform || undefined}>
        {glyph.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
        {glyph.dot ? (
          <circle cx={glyph.dot[0]} cy={glyph.dot[1]} r={glyph.dot[2]} fill="currentColor" stroke="none" />
        ) : null}
      </g>
    </svg>
  );
}
