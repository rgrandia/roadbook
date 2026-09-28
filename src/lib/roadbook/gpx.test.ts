import { describe, expect, it } from "vitest";
import { parseGpxFile, samplePoints } from "./gpx";

const SAMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="41.9903" lon="2.8241">
    <name>Sortida</name>
  </wpt>
  <wpt lat="41.9950" lon="2.8300">
    <name>Control 1</name>
  </wpt>
  <trk>
    <trkseg>
      <trkpt lat="41.9903" lon="2.8241"><ele>120</ele></trkpt>
      <trkpt lat="41.9910" lon="2.8250"></trkpt>
      <trkpt lat="41.9920" lon="2.8260"></trkpt>
      <trkpt lat="41.9950" lon="2.8300"></trkpt>
    </trkseg>
  </trk>
</gpx>`;

describe("parseGpxFile", () => {
  it("extracts named waypoints", () => {
    const { waypoints } = parseGpxFile(SAMPLE_GPX);
    expect(waypoints).toHaveLength(2);
    expect(waypoints[0]).toEqual({ lat: 41.9903, lon: 2.8241, name: "Sortida" });
    expect(waypoints[1].name).toBe("Control 1");
  });

  it("extracts track points regardless of the default GPX namespace", () => {
    const { trackPoints } = parseGpxFile(SAMPLE_GPX);
    expect(trackPoints).toHaveLength(4);
    expect(trackPoints[0]).toEqual({ lat: 41.9903, lon: 2.8241, name: undefined });
  });

  it("returns empty lists for malformed XML instead of throwing", () => {
    expect(parseGpxFile("not xml at all <<<")).toEqual({ waypoints: [], trackPoints: [] });
  });

  it("returns empty lists for a GPX file with no points", () => {
    expect(parseGpxFile(`<gpx xmlns="http://www.topografix.com/GPX/1/1"></gpx>`)).toEqual({
      waypoints: [],
      trackPoints: [],
    });
  });
});

describe("samplePoints", () => {
  const points = Array.from({ length: 10 }, (_, i) => i);

  it("returns every point when everyN is 1", () => {
    expect(samplePoints(points, 1)).toEqual(points);
  });

  it("keeps every Nth point plus the last one", () => {
    expect(samplePoints(points, 3)).toEqual([0, 3, 6, 9]);
  });

  it("always includes the last point even if it wasn't on the stride", () => {
    const eleven = [...points, 10];
    expect(samplePoints(eleven, 4)).toEqual([0, 4, 8, 10]);
  });

  it("leaves short lists untouched", () => {
    expect(samplePoints([1, 2], 5)).toEqual([1, 2]);
  });
});
