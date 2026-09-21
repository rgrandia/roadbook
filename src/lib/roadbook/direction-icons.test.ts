import { describe, expect, it } from "vitest";
import { DIRECTION_GLYPHS, buildCustomGlyph, resolveDirectionGlyph } from "./direction-icons";
import type { CustomDirectionIcon, CustomIconTemplate } from "./types";

function makeIcon(template: CustomIconTemplate, overrides: Partial<CustomDirectionIcon> = {}): CustomDirectionIcon {
  return {
    id: "icon-1",
    name: "Test",
    template,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildCustomGlyph", () => {
  it("draws a plain turn when there are no other arms", () => {
    const glyph = buildCustomGlyph({ kind: "turn", angle: 45, otherAngles: [] });
    expect(glyph.bold.length).toBeGreaterThan(0);
    expect(glyph.circle).toBeUndefined();
    expect(glyph.thin).toBeUndefined();
  });

  it("draws thin stubs for each other arm at a junction", () => {
    const glyph = buildCustomGlyph({ kind: "turn", angle: 90, otherAngles: [-90, 0] });
    expect(glyph.bold.length).toBeGreaterThan(0);
    expect(glyph.thin).toHaveLength(2);
  });

  it("draws a circle for a roundabout", () => {
    const glyph = buildCustomGlyph({ kind: "roundabout", angle: 120 });
    expect(glyph.circle).toBeDefined();
    expect(glyph.thin).toBeUndefined();
  });

  it("draws a fork with a thin untaken branch", () => {
    const glyph = buildCustomGlyph({ kind: "fork", angle: 35 });
    expect(glyph.bold.length).toBeGreaterThan(0);
    expect(glyph.thin).toHaveLength(1);
  });

  it.each([
    ["motorway-keep", { kind: "motorway-keep", angle: 28 }],
    ["motorway-exit", { kind: "motorway-exit", angle: 65 }],
    ["motorway-fork", { kind: "motorway-fork", angle: 30 }],
  ] satisfies [string, CustomIconTemplate][])("draws a %s glyph with a thin parallel lane", (_label, template) => {
    const glyph = buildCustomGlyph(template);
    expect(glyph.bold.length).toBeGreaterThan(0);
    expect(glyph.thin?.length).toBeGreaterThan(0);
  });

  it("draws an s-bend for either direction sign", () => {
    expect(buildCustomGlyph({ kind: "s-bend", firstSign: 1 }).bold.length).toBeGreaterThan(0);
    expect(buildCustomGlyph({ kind: "s-bend", firstSign: -1 }).bold.length).toBeGreaterThan(0);
  });
});

describe("resolveDirectionGlyph", () => {
  const turnIcon = () => makeIcon({ kind: "turn", angle: 45, otherAngles: [] });

  it("returns the built-in glyph for a normal direction, ignoring customIcons", () => {
    const glyph = resolveDirectionGlyph("right", undefined, [turnIcon()]);
    expect(glyph).toBe(DIRECTION_GLYPHS.right);
  });

  it("resolves a custom glyph by id when direction is 'custom'", () => {
    const icon = makeIcon({ kind: "turn", angle: -60, otherAngles: [] }, { id: "abc" });
    const glyph = resolveDirectionGlyph("custom", "abc", [icon]);
    expect(glyph).toEqual(buildCustomGlyph(icon.template));
  });

  it("falls back to an empty glyph when the referenced custom icon is missing", () => {
    const glyph = resolveDirectionGlyph("custom", "does-not-exist", [turnIcon()]);
    expect(glyph.bold).toEqual([]);
  });

  it("falls back to an empty glyph when customIconId is undefined", () => {
    const glyph = resolveDirectionGlyph("custom", undefined, [turnIcon()]);
    expect(glyph.bold).toEqual([]);
  });
});
