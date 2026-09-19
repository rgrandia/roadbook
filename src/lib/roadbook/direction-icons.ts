import type { DirectionType } from "./types";

/**
 * Direction pictograms ("tulip diagrams") as raw SVG path data in a 24x24
 * viewBox: schematic top-down junction drawings in the tradition of printed
 * rally roadbooks, not simple rotated arrows. Convention, matching entry
 * from the bottom of the icon:
 *
 * - `bold`: the road actually travelled (entry through to the exit taken),
 *   drawn thicker, always ending in an arrowhead.
 * - `thin`: the other roads/exits at the same junction that are NOT taken,
 *   drawn as short thin stubs so the junction shape reads correctly.
 * - `circle`: the roundabout body (stroke only).
 * - `dot`: filled circle marking the traveller's position, as in the
 *   reference roadbooks.
 *
 * This is the single source of truth for direction icons: the web editor
 * renders these paths in a plain <svg>, and the PDF renders the exact same
 * `d` strings through @react-pdf/renderer's <Svg>/<Path>, because
 * @react-pdf/renderer cannot render arbitrary React/DOM SVG components (e.g.
 * lucide-react) - only its own primitives - so sharing raw path strings is
 * what keeps the on-screen icon and the printed icon identical.
 *
 * The table below is generated once, at module load, by small geometry
 * helpers (`polar`, `arrowHead`...) instead of hand-typed coordinates for
 * every icon - this keeps ~27 pictograms consistent and free of transcription
 * errors, while the exported table itself stays a fixed, static set (no
 * runtime/user-facing parametrization).
 */
export interface DirectionGlyph {
  bold: string[];
  thin?: string[];
  circle?: [number, number, number];
  dot?: [number, number, number];
}

type Point = [number, number];

const CENTER: Point = [12, 12];
const ENTRY: Point = [12, 22];
const DOT: [number, number, number] = [12, 21, 1];

function polar(center: Point, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return [round(center[0] + r * Math.sin(rad)), round(center[1] - r * Math.cos(rad))];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(p: Point): string {
  return `${p[0]} ${p[1]}`;
}

function line(a: Point, b: Point): string {
  return `M ${fmt(a)} L ${fmt(b)}`;
}

function curve(a: Point, control: Point, b: Point): string {
  return `M ${fmt(a)} Q ${fmt(control)} ${fmt(b)}`;
}

/** Two chained quadratic curves, for an S/hook shape (e.g. a hairpin). */
function doubleCurve(a: Point, c1: Point, mid: Point, c2: Point, b: Point): string {
  return `M ${fmt(a)} Q ${fmt(c1)} ${fmt(mid)} Q ${fmt(c2)} ${fmt(b)}`;
}

/**
 * Open-V arrowhead at `tip`, facing `angleDeg` (0 = up, 90 = right, clockwise).
 * `size` must stay well above the stroke width or the two
 * wings visually fuse into a solid wedge instead of reading as a chevron;
 * a wide-ish interior angle (~110 degrees, i.e. a 125 degree offset from the
 * facing direction) avoids the same fused look at any icon size.
 */
function arrowHead(tip: Point, angleDeg: number, size = 4.5): string {
  const p1 = polar(tip, size, angleDeg + 125);
  const p2 = polar(tip, size, angleDeg - 125);
  return `M ${fmt(p1)} L ${fmt(tip)} L ${fmt(p2)}`;
}

/** Mirrors a path's `d` string horizontally around x=12 (every "x y" coordinate pair). */
function mirrorD(d: string): string {
  return d.replace(
    /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g,
    (_, x: string, y: string) => `${round(24 - parseFloat(x))} ${y}`,
  );
}

function mirrorGlyph(g: DirectionGlyph): DirectionGlyph {
  return {
    bold: g.bold.map(mirrorD),
    thin: g.thin?.map(mirrorD),
    circle: g.circle ? [24 - g.circle[0], g.circle[1], g.circle[2]] : undefined,
    dot: g.dot ? [24 - g.dot[0], g.dot[1], g.dot[2]] : undefined,
  };
}

// ---- Simple turns: hand-tuned per magnitude, right side only - left is mirrored. ----

const TURN_STRAIGHT: DirectionGlyph = { bold: [line(ENTRY, [12, 3]), arrowHead([12, 3], 0)], dot: DOT };

const TURN_SLIGHT_RIGHT: DirectionGlyph = {
  bold: [curve(ENTRY, [12, 12], [18, 5]), arrowHead([18, 5], 35)],
  dot: DOT,
};

const TURN_RIGHT: DirectionGlyph = {
  bold: [curve(ENTRY, [12, 13], [21, 12]), arrowHead([21, 12], 90)],
  dot: DOT,
};

const TURN_HAIRPIN_RIGHT: DirectionGlyph = {
  bold: [doubleCurve(ENTRY, [12, 9], [19, 6], [24, 9], [19, 16]), arrowHead([19, 16], 160)],
  dot: DOT,
};

/** T-junction / crossroads: bold entry + turn, thin stub(s) for the untaken arm(s). Right side; mirror for left. */
function junction(takenAngle: number, otherAngles: number[]): DirectionGlyph {
  const bend: Point = [12, 13];
  const exit = polar(CENTER, 8.5, takenAngle);
  return {
    bold: [line(ENTRY, bend), curve(bend, CENTER, exit), arrowHead(exit, takenAngle)],
    thin: otherAngles.map((a) => line(polar(CENTER, 2.5, a), polar(CENTER, 9, a))),
    dot: DOT,
  };
}

/** Roundabout: a bold turn (same recipe as the simple turns) with a circle drawn behind it. */
function roundabout(exitAngle: number): DirectionGlyph {
  const r = 4.5;
  const exit = polar(CENTER, 10, exitAngle);
  return {
    circle: [CENTER[0], CENTER[1], r],
    bold: [curve(ENTRY, CENTER, exit), arrowHead(exit, exitAngle)],
    dot: DOT,
  };
}

/** Gentle Y-shaped fork: bold on the branch kept, thin on the other. Right side; mirror for left. */
const FORK_RIGHT: DirectionGlyph = {
  bold: [line(ENTRY, [12, 15]), curve([12, 15], [16, 10], [19, 5]), arrowHead([19, 5], 35)],
  thin: [curve([12, 15], [10, 10], [7, 5])],
  dot: DOT,
};

/** Multi-lane motorway pictograms: a slight/sharp bold lane plus a thin parallel lane. Right side; mirror for left. */
const MOTORWAY_KEEP_RIGHT: DirectionGlyph = {
  bold: [curve(ENTRY, [12, 13], [17, 4]), arrowHead([17, 4], 28)],
  thin: [curve([8, 21], [9, 13], [12, 4])],
  dot: DOT,
};

const MOTORWAY_EXIT_RIGHT: DirectionGlyph = {
  bold: [curve(ENTRY, [12, 14], [20, 9]), arrowHead([20, 9], 65)],
  thin: [line([12, 20], [12, 2])],
  dot: DOT,
};

const MOTORWAY_MERGE_RIGHT: DirectionGlyph = {
  bold: [line(ENTRY, [12, 3]), arrowHead([12, 3], 0)],
  thin: [line([19, 21], [13, 11])],
  dot: DOT,
};

const HOOK_U_TURN = "M7 4v7a5 5 0 0 0 10 0V6M13 5l4 -1.2v6";

export const DIRECTION_GLYPHS: Record<DirectionType, DirectionGlyph> = {
  straight: TURN_STRAIGHT,
  "slight-right": TURN_SLIGHT_RIGHT,
  right: TURN_RIGHT,
  "hairpin-right": TURN_HAIRPIN_RIGHT,
  "slight-left": mirrorGlyph(TURN_SLIGHT_RIGHT),
  left: mirrorGlyph(TURN_RIGHT),
  "hairpin-left": mirrorGlyph(TURN_HAIRPIN_RIGHT),

  "tjunction-right": junction(90, [-90]),
  "tjunction-left": junction(-90, [90]),
  "crossroads-straight": junction(0, [-90, 90]),
  "crossroads-right": junction(90, [0, -90]),
  "crossroads-left": junction(-90, [0, 90]),

  "roundabout-1": roundabout(120),
  "roundabout-2": roundabout(60),
  "roundabout-3": roundabout(0),
  "roundabout-4": roundabout(-60),
  "roundabout-5": roundabout(-120),

  "fork-right": FORK_RIGHT,
  "fork-left": mirrorGlyph(FORK_RIGHT),

  "motorway-keep-right": MOTORWAY_KEEP_RIGHT,
  "motorway-keep-left": mirrorGlyph(MOTORWAY_KEEP_RIGHT),
  "motorway-exit-right": MOTORWAY_EXIT_RIGHT,
  "motorway-exit-left": mirrorGlyph(MOTORWAY_EXIT_RIGHT),
  "motorway-merge-right": MOTORWAY_MERGE_RIGHT,
  "motorway-merge-left": mirrorGlyph(MOTORWAY_MERGE_RIGHT),

  "u-turn": { bold: [HOOK_U_TURN], dot: DOT },
  none: { bold: [] },
};

export const DIRECTION_LABELS: Record<DirectionType, string> = {
  straight: "Seguir recte",
  "slight-right": "Lleuger dreta",
  right: "Dreta",
  "hairpin-right": "Tancat dreta",
  "slight-left": "Lleuger esquerra",
  left: "Esquerra",
  "hairpin-left": "Tancat esquerra",
  "tjunction-right": "Cruïlla en T, dreta",
  "tjunction-left": "Cruïlla en T, esquerra",
  "crossroads-straight": "Encreuament, recte",
  "crossroads-right": "Encreuament, dreta",
  "crossroads-left": "Encreuament, esquerra",
  "roundabout-1": "Rotonda, 1a sortida",
  "roundabout-2": "Rotonda, 2a sortida",
  "roundabout-3": "Rotonda, 3a sortida",
  "roundabout-4": "Rotonda, 4a sortida",
  "roundabout-5": "Rotonda, 5a sortida",
  "fork-right": "Desviament dreta",
  "fork-left": "Desviament esquerra",
  "motorway-keep-right": "Mantenir-se a la dreta",
  "motorway-keep-left": "Mantenir-se a l'esquerra",
  "motorway-exit-right": "Sortida per la dreta",
  "motorway-exit-left": "Sortida per l'esquerra",
  "motorway-merge-right": "Incorporació per la dreta",
  "motorway-merge-left": "Incorporació per l'esquerra",
  "u-turn": "Mitja volta",
  none: "Sense direcció",
};

/** Grouped for the direction picker popover (spec section 7/16). */
export const DIRECTION_GROUPS: { label: string; directions: DirectionType[] }[] = [
  {
    label: "Girs",
    directions: ["left", "right", "straight", "slight-left", "slight-right", "hairpin-left", "hairpin-right"],
  },
  {
    label: "Cruïlles",
    directions: ["tjunction-left", "tjunction-right", "crossroads-left", "crossroads-right", "crossroads-straight"],
  },
  { label: "Rotondes", directions: ["roundabout-1", "roundabout-2", "roundabout-3", "roundabout-4", "roundabout-5"] },
  { label: "Desviaments", directions: ["fork-left", "fork-right"] },
  {
    label: "Autopista / autovia",
    directions: [
      "motorway-keep-left",
      "motorway-keep-right",
      "motorway-exit-left",
      "motorway-exit-right",
      "motorway-merge-left",
      "motorway-merge-right",
    ],
  },
  { label: "Altres", directions: ["u-turn"] },
];

/** Curated subset for the quick-add toolbar's big buttons - the rest live in the full picker. */
export const QUICK_DIRECTIONS: DirectionType[] = [
  "left",
  "right",
  "straight",
  "hairpin-left",
  "hairpin-right",
  "crossroads-straight",
  "roundabout-2",
  "roundabout-3",
  "fork-left",
  "fork-right",
  "motorway-exit-right",
  "u-turn",
];

export const DIRECTION_ORDER: DirectionType[] = DIRECTION_GROUPS.flatMap((g) => g.directions);
