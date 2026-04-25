/**
 * Real TinyFish Fetch API wrapper. Renders a URL and returns clean content.
 * Falls back to plain fetch() if no API key is configured.
 *
 * Docs: https://docs.tinyfish.ai/fetch-api
 *   POST https://api.fetch.tinyfish.ai
 *   X-API-Key: <key>
 *   { "urls": ["https://example.com"] }
 */
export type TinyFishResult = {
  url: string;
  title: string | null;
  text: string;
  latencyMs: number;
  source: "tinyfish" | "fallback-fetch";
};

const TINYFISH_ENDPOINT = "https://api.fetch.tinyfish.ai";

export async function tinyfish_browse(args: { url: string }): Promise<TinyFishResult> {
  const apiKey = process.env.TINYFISH_API_KEY?.trim();
  const t0 = Date.now();

  if (apiKey) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(TINYFISH_ENDPOINT, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: [args.url] }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = (await res.json()) as {
          results: Array<{ url: string; title?: string | null; text?: string }>;
          errors?: unknown[];
        };
        const r = json.results?.[0];
        if (r) {
          return {
            url: r.url ?? args.url,
            title: r.title ?? null,
            text: (r.text ?? "").slice(0, 1500),
            latencyMs: Date.now() - t0,
            source: "tinyfish",
          };
        }
      } else {
        console.warn(`[TinyFish] ${res.status} ${res.statusText} \u2014 falling back`);
      }
    } catch (err) {
      console.warn("[TinyFish] error \u2014 falling back:", (err as Error).message);
    }
  }

  // Fallback: plain fetch
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 8_000);
    const res = await fetch(args.url, { signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timeout);
    const html = await res.text();
    const title = /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1] ?? null;
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500);
    return {
      url: args.url,
      title,
      text,
      latencyMs: Date.now() - t0,
      source: "fallback-fetch",
    };
  } catch (err) {
    return {
      url: args.url,
      title: null,
      text: `(unreachable: ${(err as Error).message})`,
      latencyMs: Date.now() - t0,
      source: "fallback-fetch",
    };
  }
}

/**
 * Estimated $ cost per TinyFish Fetch API call. Their actual Fetch pricing is
 * sub-cent per page; we use $0.001 as a conservative placeholder so the
 * sponsor integration shows up as a real (non-zero) line item without
 * dominating the LLM cost comparison.
 */
export const TINYFISH_COST_PER_CALL = 0.001;
