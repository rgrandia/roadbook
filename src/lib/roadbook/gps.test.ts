import { describe, expect, it } from "vitest";
import { formatCoordinate, haversineDistanceKm, parseCoordinate, parseLatLng } from "./gps";

describe("parseCoordinate", () => {
  it("parses a plain decimal", () => {
    expect(parseCoordinate("41.9903")).toBeCloseTo(41.9903, 4);
    expect(parseCoordinate("-41.9903")).toBeCloseTo(-41.9903, 4);
  });

  it("parses a comma-decimal", () => {
    expect(parseCoordinate("41,9903")).toBeCloseTo(41.9903, 4);
  });

  it("parses a leading or trailing hemisphere letter", () => {
    expect(parseCoordinate("N 41.9903")).toBeCloseTo(41.9903, 4);
    expect(parseCoordinate("41.9903N")).toBeCloseTo(41.9903, 4);
    expect(parseCoordinate("S 41.9903")).toBeCloseTo(-41.9903, 4);
    expect(parseCoordinate("W 2.8241")).toBeCloseTo(-2.8241, 4);
  });

  it("parses degrees + decimal minutes (the existing roadbook fixture format)", () => {
    expect(parseCoordinate("N 41 59.420")).toBeCloseTo(41.99033, 4);
  });

  it("parses full degrees/minutes/seconds", () => {
    expect(parseCoordinate(`41°59'23.4"N`)).toBeCloseTo(41.98983, 4);
  });

  it("returns null for unparseable or empty input", () => {
    expect(parseCoordinate("not a coordinate")).toBeNull();
    expect(parseCoordinate("")).toBeNull();
    expect(parseCoordinate(undefined)).toBeNull();
    expect(parseCoordinate("1 2 3 4")).toBeNull();
  });
});

describe("parseLatLng", () => {
  it("returns a LatLng only when both parse successfully", () => {
    expect(parseLatLng("N 41.9903", "E 2.8241")).toEqual({ lat: 41.9903, lng: 2.8241 });
    expect(parseLatLng("N 41.9903", undefined)).toBeNull();
    expect(parseLatLng(undefined, undefined)).toBeNull();
  });
});

describe("formatCoordinate", () => {
  it("formats to 5 decimals", () => {
    expect(formatCoordinate(41.990333)).toBe("41.99033");
  });
});

describe("haversineDistanceKm", () => {
  it("returns ~0 for the same point", () => {
    expect(haversineDistanceKm({ lat: 41.99, lng: 2.82 }, { lat: 41.99, lng: 2.82 })).toBeCloseTo(0, 5);
  });

  it("matches a known distance (Girona to Barcelona, ~85km great-circle)", () => {
    const girona = { lat: 41.9794, lng: 2.8214 };
    const barcelona = { lat: 41.3874, lng: 2.1686 };
    const km = haversineDistanceKm(girona, barcelona);
    expect(km).toBeGreaterThan(80);
    expect(km).toBeLessThan(90);
  });
});
