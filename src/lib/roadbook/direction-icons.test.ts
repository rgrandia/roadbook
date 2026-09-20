import { describe, expect, it } from "vitest";
import { DIRECTION_GLYPHS, buildCustomGlyph, resolveDirectionGlyph } from "./direction-icons";
import type { CustomDirectionIcon } from "./types";

function makeIcon(overrides: Partial<CustomDirectionIcon> = {}): CustomDirectionIcon {
  return {
    id: "icon-1",
    name: "Test",
    takenAngle: 45,
    otherAngles: [],
    roundabout: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildCustomGlyph", () => {
  it("draws a plain turn when there are no other arms and it's not a roundabout", () => {
    const glyph = buildCustomGlyph({ takenAngle: 45, otherAngles: [], roundabout: false });
    expect(glyph.bold.length).toBeGreaterThan(0);
    expect(glyph.circle).toBeUndefined();
    expect(glyph.thin).toBeUndefined();
  });

  it("draws thin stubs for each other arm at a junction", () => {
    const glyph = buildCustomGlyph({ takenAngle: 90, otherAngles: [-90, 0], roundabout: false });
    expect(glyph.bold.length).toBeGreaterThan(0);
    expect(glyph.thin).toHaveLength(2);
  });

  it("draws a circle and ignores other arms when it's a roundabout", () => {
    const glyph = buildCustomGlyph({ takenAngle: 120, otherAngles: [-90, 0, 90], roundabout: true });
    expect(glyph.circle).toBeDefined();
    expect(glyph.thin).toBeUndefined();
  });
});

describe("resolveDirectionGlyph", () => {
  it("returns the built-in glyph for a normal direction, ignoring customIcons", () => {
    const glyph = resolveDirectionGlyph("right", undefined, [makeIcon()]);
    expect(glyph).toBe(DIRECTION_GLYPHS.right);
  });

  it("resolves a custom glyph by id when direction is 'custom'", () => {
    const icon = makeIcon({ id: "abc", takenAngle: -60 });
    const glyph = resolveDirectionGlyph("custom", "abc", [icon]);
    expect(glyph).toEqual(buildCustomGlyph(icon));
  });

  it("falls back to an empty glyph when the referenced custom icon is missing", () => {
    const glyph = resolveDirectionGlyph("custom", "does-not-exist", [makeIcon({ id: "other" })]);
    expect(glyph.bold).toEqual([]);
  });

  it("falls back to an empty glyph when customIconId is undefined", () => {
    const glyph = resolveDirectionGlyph("custom", undefined, [makeIcon()]);
    expect(glyph.bold).toEqual([]);
  });
});
