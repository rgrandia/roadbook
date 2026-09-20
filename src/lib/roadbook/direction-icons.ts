import type { CustomDirectionIcon, DirectionType } from "./types";

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

// ---- Simple turns: one parametric curve covers everything from a barely-there
// bend up through a normal 90 degree turn; only the hairpin needs a sharper,
// hand-tuned hook shape (a single quadratic pinches when start/end get close). ----

export function turn(angleDeg: number, radius = 9.5): DirectionGlyph {
  const exit = polar(CENTER, radius, angleDeg);
  return { bold: [curve(ENTRY, [12, 12], exit), arrowHead(exit, angleDeg)], dot: DOT };
}

const TURN_STRAIGHT = turn(0);
const TURN_VERY_SLIGHT_RIGHT = turn(15);
const TURN_SLIGHT_RIGHT = turn(30);
const TURN_MEDIUM_RIGHT = turn(60);
const TURN_RIGHT = turn(90);

const TURN_HAIRPIN_RIGHT: DirectionGlyph = {
  bold: [doubleCurve(ENTRY, [12, 9], [19, 6], [24, 9], [19, 16]), arrowHead([19, 16], 160)],
  dot: DOT,
};

/** T-junction / crossroads: bold entry + turn, thin stub(s) for the untaken arm(s). Right side; mirror for left. */
export function junction(takenAngle: number, otherAngles: number[]): DirectionGlyph {
  const bend: Point = [12, 13];
  const exit = polar(CENTER, 8.5, takenAngle);
  return {
    bold: [line(ENTRY, bend), curve(bend, CENTER, exit), arrowHead(exit, takenAngle)],
    thin: otherAngles.map((a) => line(polar(CENTER, 2.5, a), polar(CENTER, 9, a))),
    dot: DOT,
  };
}

/** Roundabout: a bold turn (same recipe as the simple turns) with a circle drawn behind it. */
export function roundabout(exitAngle: number): DirectionGlyph {
  const r = 4.5;
  const exit = polar(CENTER, 10, exitAngle);
  return {
    circle: [CENTER[0], CENTER[1], r],
    bold: [curve(ENTRY, CENTER, exit), arrowHead(exit, exitAngle)],
    dot: DOT,
  };
}

/** Gentle Y-shaped fork: bold on the branch kept, thin on the other. `keepAngle` right-side; mirror for left. */
function fork(keepAngle: number): DirectionGlyph {
  const bend: Point = [12, 15];
  const exit = polar(CENTER, 10, keepAngle);
  const otherExit = polar(CENTER, 9, keepAngle > 0 ? keepAngle - 70 : keepAngle + 70);
  return {
    bold: [line(ENTRY, bend), curve(bend, [16, 10], exit), arrowHead(exit, keepAngle)],
    thin: [curve(bend, [10, 10], otherExit)],
    dot: DOT,
  };
}

const FORK_RIGHT = fork(35);
const FORK_SLIGHT_RIGHT = fork(20);
const FORK_SHARP_RIGHT = fork(55);

/** Multi-lane motorway pictograms: a bold lane at `angleDeg` plus a thin parallel lane. Right side; mirror for left. */
function motorwayKeep(angleDeg: number): DirectionGlyph {
  const sign = angleDeg >= 0 ? 1 : -1;
  const exit = polar(CENTER, 9.5, angleDeg);
  return {
    bold: [curve(ENTRY, [12, 13], exit), arrowHead(exit, angleDeg)],
    thin: [curve([12 - 4 * sign, 21], [12 - 3 * sign, 13], [exit[0] - 4 * sign, exit[1] + 1])],
    dot: DOT,
  };
}

function motorwayExit(angleDeg: number): DirectionGlyph {
  const exit = polar(CENTER, 10, angleDeg);
  return {
    bold: [curve(ENTRY, [12, 14], exit), arrowHead(exit, angleDeg)],
    thin: [line([12, 20], [12, 2])],
    dot: DOT,
  };
}

function motorwayFork(angleDeg: number): DirectionGlyph {
  const sign = angleDeg >= 0 ? 1 : -1;
  const exit = polar(CENTER, 10, angleDeg);
  const otherExit = polar(CENTER, 9, -angleDeg * 0.4);
  return {
    bold: [line(ENTRY, [12, 15]), curve([12, 15], [12 + 4 * sign, 10], exit), arrowHead(exit, angleDeg)],
    thin: [curve([12, 15], [12 - 2 * sign, 10], otherExit)],
    dot: DOT,
  };
}

const MOTORWAY_KEEP_RIGHT = motorwayKeep(28);
const MOTORWAY_EXIT_RIGHT = motorwayExit(65);
const MOTORWAY_EXIT_SLIGHT_RIGHT = motorwayExit(40);
const MOTORWAY_FORK_RIGHT = motorwayFork(30);

const MOTORWAY_MERGE_RIGHT: DirectionGlyph = {
  bold: [line(ENTRY, [12, 3]), arrowHead([12, 3], 0)],
  thin: [line([19, 21], [13, 11])],
  dot: DOT,
};

/** S-bend: curves one way then the other, ending roughly back on the original heading. */
function sBend(firstSign: 1 | -1): DirectionGlyph {
  const end = polar(CENTER, 9, firstSign * -20);
  return {
    bold: [
      doubleCurve(
        ENTRY,
        [12 + firstSign * 6, 15],
        [12 + firstSign * 5, 11],
        [12 - firstSign * 6, 9],
        end,
      ),
      arrowHead(end, firstSign * -20),
    ],
    dot: DOT,
  };
}

const HOOK_U_TURN = "M7 4v7a5 5 0 0 0 10 0V6M13 5l4 -1.2v6";

export const DIRECTION_GLYPHS: Record<DirectionType, DirectionGlyph> = {
  straight: TURN_STRAIGHT,
  "very-slight-right": TURN_VERY_SLIGHT_RIGHT,
  "slight-right": TURN_SLIGHT_RIGHT,
  "medium-right": TURN_MEDIUM_RIGHT,
  right: TURN_RIGHT,
  "hairpin-right": TURN_HAIRPIN_RIGHT,
  "very-slight-left": mirrorGlyph(TURN_VERY_SLIGHT_RIGHT),
  "slight-left": mirrorGlyph(TURN_SLIGHT_RIGHT),
  "medium-left": mirrorGlyph(TURN_MEDIUM_RIGHT),
  left: mirrorGlyph(TURN_RIGHT),
  "hairpin-left": mirrorGlyph(TURN_HAIRPIN_RIGHT),

  "tjunction-right": junction(90, [-90]),
  "tjunction-left": junction(-90, [90]),
  "crossroads-straight": junction(0, [-90, 90]),
  "crossroads-right": junction(90, [0, -90]),
  "crossroads-left": junction(-90, [0, 90]),
  "crossroads-slight-right": junction(45, [-90, 90]),
  "crossroads-slight-left": junction(-45, [-90, 90]),

  "roundabout-1": roundabout(120),
  "roundabout-2": roundabout(60),
  "roundabout-3": roundabout(0),
  "roundabout-4": roundabout(-60),
  "roundabout-5": roundabout(-120),
  "roundabout-6": roundabout(-150),
  "roundabout-uturn": roundabout(155),

  "fork-right": FORK_RIGHT,
  "fork-left": mirrorGlyph(FORK_RIGHT),
  "fork-slight-right": FORK_SLIGHT_RIGHT,
  "fork-slight-left": mirrorGlyph(FORK_SLIGHT_RIGHT),
  "fork-sharp-right": FORK_SHARP_RIGHT,
  "fork-sharp-left": mirrorGlyph(FORK_SHARP_RIGHT),

  "motorway-keep-right": MOTORWAY_KEEP_RIGHT,
  "motorway-keep-left": mirrorGlyph(MOTORWAY_KEEP_RIGHT),
  "motorway-exit-right": MOTORWAY_EXIT_RIGHT,
  "motorway-exit-left": mirrorGlyph(MOTORWAY_EXIT_RIGHT),
  "motorway-exit-slight-right": MOTORWAY_EXIT_SLIGHT_RIGHT,
  "motorway-exit-slight-left": mirrorGlyph(MOTORWAY_EXIT_SLIGHT_RIGHT),
  "motorway-merge-right": MOTORWAY_MERGE_RIGHT,
  "motorway-merge-left": mirrorGlyph(MOTORWAY_MERGE_RIGHT),
  "motorway-fork-right": MOTORWAY_FORK_RIGHT,
  "motorway-fork-left": mirrorGlyph(MOTORWAY_FORK_RIGHT),

  "s-bend-left-right": sBend(-1),
  "s-bend-right-left": sBend(1),

  "u-turn": { bold: [HOOK_U_TURN], dot: DOT },
  none: { bold: [] },
  /** Never rendered directly - see buildCustomGlyph/resolveDirectionGlyph below. */
  custom: { bold: [] },
};

/**
 * Builds a glyph for a user-designed icon (see CustomDirectionIcon), reusing
 * the same `turn`/`junction`/`roundabout` generators as the built-in set so
 * custom icons stay visually consistent with the rest of the roadbook.
 */
export function buildCustomGlyph(spec: Pick<CustomDirectionIcon, "takenAngle" | "otherAngles" | "roundabout">): DirectionGlyph {
  if (spec.roundabout) return roundabout(spec.takenAngle);
  if (spec.otherAngles.length === 0) return turn(spec.takenAngle);
  return junction(spec.takenAngle, spec.otherAngles);
}

/**
 * Resolves whichever glyph an instruction should show: the built-in table
 * for a normal DirectionType, or a custom icon looked up by id. Falls back
 * to an empty glyph if the referenced custom icon was deleted.
 */
export function resolveDirectionGlyph(
  direction: DirectionType,
  customIconId: string | undefined,
  customIcons: CustomDirectionIcon[],
): DirectionGlyph {
  if (direction !== "custom") return DIRECTION_GLYPHS[direction];
  const spec = customIcons.find((icon) => icon.id === customIconId);
  return spec ? buildCustomGlyph(spec) : { bold: [] };
}

export const DIRECTION_LABELS: Record<DirectionType, string> = {
  straight: "Seguir recte",
  "very-slight-right": "Molt lleuger dreta",
  "slight-right": "Lleuger dreta",
  "medium-right": "Dreta mitjà",
  right: "Dreta",
  "hairpin-right": "Tancat dreta",
  "very-slight-left": "Molt lleuger esquerra",
  "slight-left": "Lleuger esquerra",
  "medium-left": "Esquerra mitjà",
  left: "Esquerra",
  "hairpin-left": "Tancat esquerra",
  "tjunction-right": "Cruïlla en T, dreta",
  "tjunction-left": "Cruïlla en T, esquerra",
  "crossroads-straight": "Encreuament, recte",
  "crossroads-right": "Encreuament, dreta",
  "crossroads-left": "Encreuament, esquerra",
  "crossroads-slight-right": "Encreuament, diagonal dreta",
  "crossroads-slight-left": "Encreuament, diagonal esquerra",
  "roundabout-1": "Rotonda, 1a sortida",
  "roundabout-2": "Rotonda, 2a sortida",
  "roundabout-3": "Rotonda, 3a sortida",
  "roundabout-4": "Rotonda, 4a sortida",
  "roundabout-5": "Rotonda, 5a sortida",
  "roundabout-6": "Rotonda, 6a sortida",
  "roundabout-uturn": "Rotonda, mitja volta",
  "fork-right": "Desviament dreta",
  "fork-left": "Desviament esquerra",
  "fork-slight-right": "Desviament lleuger dreta",
  "fork-slight-left": "Desviament lleuger esquerra",
  "fork-sharp-right": "Desviament tancat dreta",
  "fork-sharp-left": "Desviament tancat esquerra",
  "motorway-keep-right": "Mantenir-se a la dreta",
  "motorway-keep-left": "Mantenir-se a l'esquerra",
  "motorway-exit-right": "Sortida per la dreta",
  "motorway-exit-left": "Sortida per l'esquerra",
  "motorway-exit-slight-right": "Sortida suau per la dreta",
  "motorway-exit-slight-left": "Sortida suau per l'esquerra",
  "motorway-merge-right": "Incorporació per la dreta",
  "motorway-merge-left": "Incorporació per l'esquerra",
  "motorway-fork-right": "Bifurcació, carril dreta",
  "motorway-fork-left": "Bifurcació, carril esquerra",
  "s-bend-left-right": "Revolt en S, esquerra-dreta",
  "s-bend-right-left": "Revolt en S, dreta-esquerra",
  "u-turn": "Mitja volta",
  none: "Sense direcció",
  custom: "Icona personalitzada",
};

/** Grouped for the direction picker popover (spec section 7/16). */
export const DIRECTION_GROUPS: { label: string; directions: DirectionType[] }[] = [
  {
    label: "Girs",
    directions: [
      "straight",
      "very-slight-left",
      "very-slight-right",
      "slight-left",
      "slight-right",
      "medium-left",
      "medium-right",
      "left",
      "right",
      "hairpin-left",
      "hairpin-right",
    ],
  },
  {
    label: "Cruïlles",
    directions: [
      "tjunction-left",
      "tjunction-right",
      "crossroads-left",
      "crossroads-right",
      "crossroads-straight",
      "crossroads-slight-left",
      "crossroads-slight-right",
    ],
  },
  {
    label: "Rotondes",
    directions: [
      "roundabout-1",
      "roundabout-2",
      "roundabout-3",
      "roundabout-4",
      "roundabout-5",
      "roundabout-6",
      "roundabout-uturn",
    ],
  },
  {
    label: "Desviaments",
    directions: ["fork-slight-left", "fork-slight-right", "fork-left", "fork-right", "fork-sharp-left", "fork-sharp-right"],
  },
  {
    label: "Autopista / autovia",
    directions: [
      "motorway-keep-left",
      "motorway-keep-right",
      "motorway-exit-slight-left",
      "motorway-exit-slight-right",
      "motorway-exit-left",
      "motorway-exit-right",
      "motorway-merge-left",
      "motorway-merge-right",
      "motorway-fork-left",
      "motorway-fork-right",
    ],
  },
  { label: "Altres", directions: ["s-bend-left-right", "s-bend-right-left", "u-turn"] },
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
