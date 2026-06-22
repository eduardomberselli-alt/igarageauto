/**
 * Geocodificação via Nominatim (OpenStreetMap).
 * Política de uso: máx. 1 req/s e User-Agent identificável.
 */
export type GeocodeResult = {
  latitude: number;
  longitude: number;
  neighborhood: string | null;
  displayName: string;
};

let lastCall = 0;
const MIN_INTERVAL = 1100; // 1s + folga

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const q = address.trim();
  if (!q) return null;

  // Throttle simples para respeitar a política do Nominatim
  const wait = Math.max(0, MIN_INTERVAL - (Date.now() - lastCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    q,
  )}&format=json&addressdetails=1&limit=1`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  }>;
  if (!data || data.length === 0) return null;

  const first = data[0];
  const addr = first.address ?? {};
  const neighborhood =
    addr.suburb ||
    addr.neighbourhood ||
    addr.city_district ||
    addr.quarter ||
    addr.village ||
    null;

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    neighborhood,
    displayName: first.display_name,
  };
}
