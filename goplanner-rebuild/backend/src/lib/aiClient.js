import { env } from '../config/env.js';
import AppError from '../utils/AppError.js';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

/**
 * Low-level call to the Hugging Face router's OpenAI-compatible chat endpoint.
 */
async function callModel(messages, { temperature = 0.3, maxTokens = 1500 } = {}) {
  const apiKey = env.hfApiKey;
  const apiUrl = HF_API_URL;

  if (!apiKey) {
    throw new AppError('AI is not configured on this server (HF_API_KEY missing).', 503);
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: env.hfModel,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AppError(`AI provider returned a non-JSON response: ${text.slice(0, 200)}`, 502);
  }

  if (!res.ok) {
    throw new AppError(`AI provider error (${res.status}): ${data?.error?.message || JSON.stringify(data)}`, 502);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new AppError('AI provider returned an empty response.', 502);
  return content;
}

/**
 * Extracts and parses the first top-level JSON object/array found in a string.
 * Models occasionally wrap JSON in prose or code fences despite instructions.
 */
function extractJson(raw) {
  const cleaned = String(raw).trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through to brace matching
  }

  const start = cleaned.search(/[{[]/);
  if (start === -1) return null;
  const openChar = cleaned[start];
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === openChar) depth++;
    else if (cleaned[i] === closeChar) {
      depth--;
      if (depth === 0) {
        const candidate = cleaned.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Calls the model expecting strict JSON back. If parsing fails, re-prompts
 * once asking the model to fix its own output — cheaper and more reliable
 * than failing the whole request over a stray trailing comma.
 */
async function generateJson(messages, opts = {}) {
  const raw = await callModel(messages, opts);
  let parsed = extractJson(raw);

  if (!parsed) {
    const repairMessages = [
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: 'That was not valid JSON. Reply again with ONLY the corrected valid JSON object — no prose, no code fences.' }
    ];
    const repaired = await callModel(repairMessages, opts);
    parsed = extractJson(repaired);
  }

  if (!parsed) throw new AppError('AI returned output that could not be parsed as JSON after one repair attempt.', 502);
  return parsed;
}

const ITINERARY_SCHEMA_NOTE = `Respond with ONLY valid JSON (no prose, no markdown fences) matching this shape:
{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "start": "09:00",
          "end": "10:30",
          "activity": "string, short name",
          "location": "string",
          "estimatedCost": 0,
          "reason": "one short sentence explaining why this was picked (e.g. weather, proximity, rating, budget fit)",
          "weatherSensitive": false
        }
      ]
    }
  ]
}
Rules:
- 3 to 6 activities per day, realistic contiguous time windows with travel time between stops.
- estimatedCost is a number in the trip's currency, 0 if free.
- weatherSensitive true only for primarily outdoor activities.
- "reason" is required for every activity and must be a genuine one-line justification, not filler.`;

export async function generateItinerary({ destination, days, budget, currency = 'USD', description = '' }) {
  const budgetLine = budget
    ? `Total budget: ${budget} ${currency} for the whole trip. Stay at or under this total; prefer lower-cost options once you approach the limit.`
    : 'No fixed budget — choose a reasonable mid-range cost.';

  const messages = [
    { role: 'system', content: 'You are a meticulous travel-itinerary generator. You always respond with strictly valid JSON and nothing else.' },
    {
      role: 'user',
      content: `Create a ${days}-day itinerary for ${destination}.
${description ? `Traveler notes: ${description}` : ''}
${budgetLine}

${ITINERARY_SCHEMA_NOTE}`
    }
  ];

  const parsed = await generateJson(messages, { maxTokens: 500 + days * 350 });
  if (!Array.isArray(parsed?.days)) throw new AppError('AI itinerary response was missing a "days" array.', 502);
  return parsed.days;
}

export async function reviseItineraryForBudget({ destination, days, budget, currency, overBy }) {
  const messages = [
    { role: 'system', content: 'You are a meticulous travel-itinerary generator. You always respond with strictly valid JSON and nothing else.' },
    {
      role: 'user',
      content: `Revise a ${days}-day itinerary for ${destination} so the total cost fits within ${budget} ${currency}.
The previous plan was ${overBy} ${currency} over budget. Swap in cheaper or free alternatives (parks, walking tours, local markets) where reasonable, without removing the trip's structure.

${ITINERARY_SCHEMA_NOTE}`
    }
  ];

  const parsed = await generateJson(messages, { maxTokens: 500 + days * 350 });
  if (!Array.isArray(parsed?.days)) throw new AppError('AI budget-revision response was missing a "days" array.', 502);
  return parsed.days;
}

export async function replanActivity({ destination, day, timeWindow, currentActivity, reason, budgetRemaining, currency }) {
  const reasonText = {
    weather: 'The current activity is outdoors and the forecast for that day is bad (rain/storm/extreme heat).',
    closed: 'The current activity/venue is closed or unavailable.',
    other: 'The traveler wants a different option for this slot.'
  }[reason] || 'The traveler wants a different option for this slot.';

  const messages = [
    { role: 'system', content: 'You are a meticulous travel-itinerary generator. You always respond with strictly valid JSON and nothing else.' },
    {
      role: 'user',
      content: `Replace one activity in a day trip to ${destination}.
Time slot: ${timeWindow.start}-${timeWindow.end} on day ${day}.
Current activity: "${currentActivity}".
Why it needs replacing: ${reasonText}
${typeof budgetRemaining === 'number' ? `Try to keep the new activity's cost at or under ${budgetRemaining} ${currency} if possible.` : ''}
${reason === 'weather' ? 'Prefer an indoor or weather-proof alternative (museum, gallery, market hall, cafe, indoor attraction).' : ''}

Respond with ONLY valid JSON matching this shape (a single activity, same schema as itinerary activities):
{
  "start": "${timeWindow.start}",
  "end": "${timeWindow.end}",
  "activity": "string",
  "location": "string",
  "estimatedCost": 0,
  "reason": "one short sentence explaining why this replacement was picked",
  "weatherSensitive": false
}`
    }
  ];

  const parsed = await generateJson(messages, { maxTokens: 400 });
  if (!parsed?.activity) throw new AppError('AI replan response was missing an "activity" field.', 502);
  return parsed;
}

export default { generateItinerary, reviseItineraryForBudget, replanActivity };
