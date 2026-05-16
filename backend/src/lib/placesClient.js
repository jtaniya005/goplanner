// Helper to get popular places for a given city/destination using the provider-agnostic aiClient.
import { generateText } from './aiClient.js';

export async function getPopularPlaces(destination, limit = 8) {
  if (!destination) return [destination];

  try {
    const prompt = `List the top ${limit} most popular tourist attractions or places to visit in ${destination}. Return only a JSON array of short names (strings), for example: ["Hawa Mahal","Amber Fort","City Palace"].`;
    const text = await generateText(prompt, { max_tokens: 200, temperature: 0.2 });
    if (!text) return [destination];

    // Try to parse a JSON array; if that fails, extract line items
    const match = String(text).match(/\[[\s\S]*\]/);
    const jsonText = match ? match[0] : null;
    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, limit).map(p => String(p));
      } catch (e) {
        // fall back to line parsing
      }
    }

    const candidates = String(text).split(/\n|,|;|\r/)
      .map(s => s.replace(/^\s*[-\d\.\)]+\s*/, '').replace(/^['\"]|['\"]$/g, '').trim())
      .filter(Boolean);
    if (candidates.length) return candidates.slice(0, limit).map(p => String(p));

    return [destination];
  } catch (err) {
    console.warn('Places lookup failed:', err?.message || err);
    return [destination];
  }
}

export async function getPopularPlacesStrict(destination, limit = 8) {
  return getPopularPlaces(destination, limit);
}
