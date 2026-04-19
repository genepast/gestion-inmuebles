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

  const query = parts.join(", ");
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "gestion-inmuebles/1.0" }
  });

  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResult[];
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0];
  if (!first) return null;
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
}
