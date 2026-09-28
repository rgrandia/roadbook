/**
 * GPS coordinate parsing for the map view and GPX import.
 *
 * `Instruction.gpsLat`/`gpsLng` are deliberately free text ("any notation kept
 * as typed" - DMS, decimal, degrees+minutes...), because that's what a rally
 * navigator actually types from a roadnote. The map and GPX import both need
 * real decimal degrees, so this module is the one place that tolerantly
 * parses whatever was typed into a number, or gives up cleanly (`null`) if it
 * can't - callers must treat `null` as "no usable coordinate," never throw.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const HEMISPHERE_SIGN: Record<string, 1 | -1> = { N: 1, E: 1, S: -1, W: -1 };

/**
 * Parses a single coordinate value (one of lat or lng) from free text.
 * Handles: plain decimal ("41.9903", "-41.9903", comma-decimal "41,9903"),
 * a leading/trailing hemisphere letter ("N 41.9903", "41.9903N"), and
 * degrees[+minutes[+seconds]] groups separated by spaces or °/'/" symbols
 * ("N 41 59.420" - degrees + decimal minutes - or full DMS "41°59'23.4\"N").
 */
export function parseCoordinate(raw: string | undefined | null): number | null {
  if (!raw) return null;
  let text = raw.trim();
  if (!text) return null;

  let sign: 1 | -1 = 1;
  const leadingHemisphere = text.match(/^([NSEW])\s*/i);
  const trailingHemisphere = text.match(/\s*([NSEW])$/i);
  if (leadingHemisphere) {
    sign = HEMISPHERE_SIGN[leadingHemisphere[1].toUpperCase()];
    text = text.slice(leadingHemisphere[0].length);
  } else if (trailingHemisphere) {
    sign = HEMISPHERE_SIGN[trailingHemisphere[1].toUpperCase()];
    text = text.slice(0, -trailingHemisphere[0].length);
  }

  const parts = text
    .replace(/,/g, ".")
    .split(/[°'"\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(Number);

  if (parts.length === 0 || parts.length > 3 || parts.some((n) => Number.isNaN(n))) return null;

  const [deg = 0, min = 0, sec = 0] = parts;

  const magnitude = Math.abs(deg) + min / 60 + sec / 3600;
  const negative = deg < 0;
  return sign * (negative ? -magnitude : magnitude);
}

export function parseLatLng(gpsLat: string | undefined, gpsLng: string | undefined): LatLng | null {
  const lat = parseCoordinate(gpsLat);
  const lng = parseCoordinate(gpsLng);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

/** Formats a decimal-degree value for storage in gpsLat/gpsLng (5 decimals ~= 1m precision). */
export function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points, in kilometres. */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
