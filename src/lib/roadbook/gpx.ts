/**
 * Minimal GPX parsing for the "Importa GPX" dialog. Deliberately hand-rolled
 * with the browser's built-in DOMParser rather than a GPX library: the
 * subset we need (named waypoints, track points) is a handful of elements,
 * and pulling in a dependency for it isn't worth it.
 *
 * Uses getElementsByTagNameNS("*", tag) rather than querySelectorAll(tag):
 * GPX files declare a default namespace (commonly
 * "http://www.topografix.com/GPX/1/1"), and CSS selectors on an XML
 * document are namespace-sensitive in a way that makes unprefixed
 * querySelectorAll unreliable here - matching by local name regardless of
 * namespace is what we actually want.
 */

export interface GpxPoint {
  lat: number;
  lon: number;
  name?: string;
}

export interface ParsedGpx {
  waypoints: GpxPoint[];
  trackPoints: GpxPoint[];
}

function readPoints(doc: Document, tagName: string): GpxPoint[] {
  const points: GpxPoint[] = [];
  const elements = doc.getElementsByTagNameNS("*", tagName);
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const lat = Number(el.getAttribute("lat"));
    const lon = Number(el.getAttribute("lon"));
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    const nameEl = el.getElementsByTagNameNS("*", "name")[0];
    const name = nameEl?.textContent?.trim();
    points.push({ lat, lon, name: name || undefined });
  }
  return points;
}

/** Parses raw GPX XML text. Returns empty lists (never throws) on malformed input. */
export function parseGpxFile(xmlText: string): ParsedGpx {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    return { waypoints: [], trackPoints: [] };
  }
  return {
    waypoints: readPoints(doc, "wpt"),
    trackPoints: readPoints(doc, "trkpt"),
  };
}

/** Keeps every Nth point (always including the first and last), to turn a dense recorded track into a manageable instruction count. */
export function samplePoints<T>(points: T[], everyN: number): T[] {
  if (everyN <= 1 || points.length <= 2) return points;
  const sampled = points.filter((_, i) => i % everyN === 0);
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}
