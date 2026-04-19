const NOMINATIM_TIMEOUT_MS = 10_000;
// Nominatim ToS: maximum 1 request per second.
const NOMINATIM_MIN_INTERVAL_MS = 1_000;

let lastCallTime = 0;

interface GeocodingResult {
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

export async function geocodeAddress(params: {
  address?: string;
  city?: string;
  province?: string;
  country?: string;
}): Promise<GeocodingResult | null> {
  const parts = [params.address, params.city, params.province, params.country].filter(Boolean);
  if (parts.length === 0) return null;

  const elapsed = Date.now() - lastCallTime;
  if (elapsed < NOMINATIM_MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, NOMINATIM_MIN_INTERVAL_MS - elapsed));
  }
  lastCallTime = Date.now();

  const query = parts.join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "gestion-inmuebles/1.0" },
      signal: controller.signal
    });

    if (!res.ok) return null;

    const data = (await res.json()) as NominatimResult[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const first = data[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
