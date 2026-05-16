import { generateChatViaRouter } from '../../../src/lib/aiClient.js';

// The endpoint accepts either { messages: [...] } OR the simplified { days, destination } payload.
// By default the fixed model is used (env `HF_MODEL` or the moonshotai model).
const FIXED_MODEL = process.env.HF_MODEL || 'moonshotai/Kimi-K2-Instruct-0905';

function buildItineraryPrompt(days, destination) {
  return `Generate a day-by-day trip plan for ${days} day${days === 1 ? '' : 's'} in ${destination}. Respond with only valid JSON (no explanation). Use this exact schema:\n\n{\n  "city": string,\n  "days": number,\n  "places": [string],\n  "itinerary": [\n    {\n      "day": number,\n      "date": null | ISO-string,\n      "activities": [ { "start":"HH:MM","end":"HH:MM","activity":string,"location":string,"notes":string } ]\n    }\n  ],\n  "totalEstimatedCostUSD": number,\n  "notes": string\n}\n\nRules:\n- Provide morning/afternoon/evening activities where possible.\n- Keep each activity time windows realistic and contiguous; include travel time between activities.\n- Limit activities per day to 4-6.\n- Round cost to nearest whole USD and give a single total estimate.\n\nGenerate the plan now for ${days} day(s) in ${destination}.`;
}

export const chatProxy = async (req, res) => {
  try {
    const body = req.body || {};

    // If messages provided, prefer pass-through behavior
    if (Array.isArray(body.messages) && body.messages.length) {
      const content = await generateChatViaRouter(FIXED_MODEL, body.messages);
      return res.json({ success: true, model: FIXED_MODEL, raw: content });
    }

    // Otherwise accept the simplified payload: { days, destination }
    const days = Number(body.days ?? body.day ?? body.daysCount);
    const destination = (body.destination || body.place || body.city || '').trim();

    if (!Number.isFinite(days) || days <= 0) return res.status(400).json({ success: false, message: 'days must be a positive integer' });
    if (!destination) return res.status(400).json({ success: false, message: 'destination is required' });

    const systemMessage = {
      role: 'system',
      content: 'You are a helpful travel itinerary generator. Always respond with only valid JSON and nothing else. Follow the schema exactly.'
    };

    const userMessage = {
      role: 'user',
      content: buildItineraryPrompt(days, destination)
    };

    const messages = [systemMessage, userMessage];
    const raw = await generateChatViaRouter(FIXED_MODEL, messages);

    // Try to parse JSON from the assistant content
    let parsed = null;
    if (raw && typeof raw === 'string') {
      const jsonMatch = raw.match(/\{[\s\S]*\}$/);
      const jsonText = jsonMatch ? jsonMatch[0] : raw;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        // leave parsed null if JSON invali
      }
    }

    return res.json({ success: true, model: FIXED_MODEL, raw, parsed });
  } catch (err) {
    console.error('AI chat proxy error:', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
};

export default { chatProxy };
