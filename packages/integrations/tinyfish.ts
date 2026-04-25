const TINYFISH_API_KEY = process.env.TINYFISH_API_KEY || '';
const TINYFISH_API_URL = 'https://agent.tinyfish.ai/v1';

export type TinyFishFetchResult = {
  url: string;
  content: string;
  screenshot?: string;
  timestamp: string;
  hash: string;
};

export type Exhibit = {
  id: string;
  kind: 'TINYFISH_FETCH' | 'TINYFISH_SCREENSHOT' | 'GUILD_SPAN' | 'WG_TRACE';
  sourceUrl?: string;
  hash?: string;
  payloadRef: string;
  metadata?: any;
};

export async function fetchWithTinyFish(url: string): Promise<TinyFishFetchResult> {
  if (!TINYFISH_API_KEY) {
    // Fallback: Return mock data if no API key
    return {
      url,
      content: `Mock content from ${url}. Flight UA123: $380, refundable.`,
      timestamp: new Date().toISOString(),
      hash: `mock-${Math.random().toString(36).substring(7)}`,
    };
  }

  try {
    const response = await fetch(`${TINYFISH_API_URL}/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TINYFISH_API_KEY}`,
      },
      body: JSON.stringify({
        url,
        format: 'markdown',
        screenshot: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`TinyFish API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      url,
      content: data.content || data.markdown || '',
      screenshot: data.screenshot?.url,
      timestamp: new Date().toISOString(),
      hash: data.hash || `tf-${Date.now()}`,
    };
  } catch (error) {
    console.error('TinyFish fetch error:', error);
    // Fallback to mock
    return {
      url,
      content: `Fallback content from ${url}. Could not reach TinyFish API.`,
      timestamp: new Date().toISOString(),
      hash: `fallback-${Math.random().toString(36).substring(7)}`,
    };
  }
}

export async function createExhibitFromTinyFish(
  caseId: string,
  url: string
): Promise<Exhibit> {
  const result = await fetchWithTinyFish(url);

  const exhibitId = `T-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  // Save screenshot to public/exhibits if available
  if (result.screenshot) {
    // In a real implementation, download and save the screenshot
    // For now, just store the URL
  }

  return {
    id: exhibitId,
    kind: 'TINYFISH_FETCH',
    sourceUrl: url,
    hash: result.hash,
    payloadRef: `/exhibits/${exhibitId}.json`,
    metadata: {
      timestamp: result.timestamp,
      screenshotUrl: result.screenshot,
      contentPreview: result.content.substring(0, 200),
    },
  };
}
