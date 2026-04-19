import { RawApiResponseSchema, type RawExternalProperty } from "./types";

const EXTERNAL_API_URL =
  process.env.EXTERNAL_API_URL ?? "https://api.sampleapis.com/rentals/rentals";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithBackoff(url: string, attempt = 0): Promise<Response> {
  const res = await fetch(url, { cache: "no-store" });

  if (res.ok) return res;

  // 429 or 5xx → retry with exponential backoff
  const isRetryable = res.status === 429 || res.status >= 500;
  if (isRetryable && attempt < MAX_RETRIES) {
    const delay = BASE_DELAY_MS * Math.pow(2, attempt);
    await sleep(delay);
    return fetchWithBackoff(url, attempt + 1);
  }

  throw new Error(`External API responded with ${res.status}`);
}

export async function fetchExternalProperties(): Promise<RawExternalProperty[]> {
  const res = await fetchWithBackoff(EXTERNAL_API_URL);
  const raw: unknown = await res.json();

  const parsed = RawApiResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Unexpected API response shape: ${parsed.error.message}`);
  }

  return Array.isArray(parsed.data) ? parsed.data : parsed.data.data;
}
