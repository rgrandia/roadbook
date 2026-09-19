import type { DirectionType } from "./types";

/**
 * Direction glyphs as raw SVG path data in a 24x24 viewBox, stroke-based
 * (fill="none", round caps/joins) so they read consistently at small sizes.
 *
 * This is the single source of truth for direction icons: the web editor
 * renders these paths in a plain <svg>, and the PDF document renders the
 * exact same `d` strings through @react-pdf/renderer's <Svg>/<Path>. Neither
 * side uses an icon font or a component library for these, because
 * @react-pdf/renderer cannot render arbitrary React/DOM SVG (e.g. lucide-react)
 * components - only its own primitives - so sharing raw path strings is what
 * keeps the on-screen icon and the printed icon identical.
 */
export interface DirectionGlyph {
  /** One or more path `d` strings, drawn in order. */
  paths: string[];
  /** Optional filled circle marker [cx, cy, r]. */
  dot?: [number, number, number];
  /** Rotation in degrees applied around the 12,12 center. */
  rotate?: number;
  /** Horizontal mirror. */
  mirror?: boolean;
}

const ARROW = "M12 20V5M6 11L12 5L18 11";
const HOOK_U_TURN = "M7 4v7a5 5 0 0 0 10 0V6M13 5l4 -1.2v6";
const ROUNDABOUT_CIRCLE = "M4 12a8 8 0 1 1 16 0a8 8 0 1 1 -16 0";
const ROUNDABOUT_ENTRY = "M12 21v-5M9 19l3 -3l3 3";
const JUNCTION_T = "M12 20V4M4 11h16";
const MERGE = "M6 20L11 9M18 20L13 9M9 6l3 -3l3 3M12 3v6";
const EXIT = "M8 20V9M8 9l7 -6M15 3h4v4";
const FORK_LEFT = "M12 20V13M12 13L6 4M12 13L17 6M6 4l0 4M6 4l4 1";
const FORK_RIGHT = "M12 20V13M12 13L18 4M12 13L7 6M18 4l0 4M18 4l-4 1";

/** Direction -> glyph definition. Most reuse a single arrow rotated in place. */
export const DIRECTION_GLYPHS: Record<DirectionType, DirectionGlyph> = {
  straight: { paths: [ARROW], rotate: 0 },
  right: { paths: [ARROW], rotate: 90 },
  left: { paths: [ARROW], rotate: -90 },
  "slight-right": { paths: [ARROW], rotate: 45 },
  "slight-left": { paths: [ARROW], rotate: -45 },
  "hairpin-right": { paths: [ARROW], rotate: 150 },
  "hairpin-left": { paths: [ARROW], rotate: -150 },
  "u-turn": { paths: [HOOK_U_TURN] },
  roundabout: { paths: [ROUNDABOUT_CIRCLE, ROUNDABOUT_ENTRY] },
  junction: { paths: [JUNCTION_T], dot: [12, 11, 1.6] },
  merge: { paths: [MERGE] },
  exit: { paths: [EXIT] },
  "fork-left": { paths: [FORK_LEFT] },
  "fork-right": { paths: [FORK_RIGHT] },
  none: { paths: [] },
};

export const DIRECTION_LABELS: Record<DirectionType, string> = {
  straight: "Recte",
  right: "Dreta",
  left: "Esquerra",
  "slight-right": "Lleuger dreta",
  "slight-left": "Lleuger esquerra",
  "hairpin-right": "Tancat dreta",
  "hairpin-left": "Tancat esquerra",
  "u-turn": "Mitja volta",
  roundabout: "Rotonda",
  junction: "Cruïlla",
  merge: "Incorporació",
  exit: "Sortida de via",
  "fork-left": "Desviament esquerra",
  "fork-right": "Desviament dreta",
  none: "Sense direcció",
};

export const DIRECTION_ORDER: DirectionType[] = [
  "left",
  "right",
  "straight",
  "hairpin-left",
  "hairpin-right",
  "slight-left",
  "slight-right",
  "fork-left",
  "fork-right",
  "roundabout",
  "junction",
  "merge",
  "exit",
  "u-turn",
];
