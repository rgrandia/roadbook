import { DIRECTION_GLYPHS } from "@/lib/roadbook/direction-icons";
import { cn } from "@/lib/utils";

/**
 * The brand mark is a right-turn tulip pulled straight from the direction
 * icon set (direction-icons.ts) rather than a generic logotype - the app's
 * whole visual identity is "the icon language", so the mark is literally
 * built from it instead of a separate one-off graphic.
 */
export function AppLogo({ size = 28, className }: { size?: number; className?: string }) {
  const glyph = DIRECTION_GLYPHS.right;
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg bg-red-600", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph.bold.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );
}
