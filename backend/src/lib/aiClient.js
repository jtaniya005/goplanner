import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';

const HF_API = process.env.HF_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const PROVIDER = (process.env.AI_PROVIDER || (HF_API ? 'hf' : (OPENAI_KEY ? 'openai' : 'hf'))).toLowerCase();

async function generateWithHf(prompt, opts = {}) {
  const HF_API = process.env.HF_API_KEY;
  if (!HF_API) throw new Error('HF_API_KEY not set');
  // Construct HfInference client defensively: different versions expect different ctor signatures
  let hf = null;
  const tryConstructors = [
    () => new HfInference({ apiKey: HF_API }),
    () => new HfInference({ accessToken: HF_API }),
    () => new HfInference(HF_API),
  ];
  let ctorErr = null;
  for (const c of tryConstructors) {
    try {
      hf = c();
      break;
    } catch (e) {
      ctorErr = e;
    }
  }
  if (!hf) throw ctorErr || new Error('Failed to construct HfInference client');

  const tryModels = [
    process.env.HF_MODEL,
    'moonshotai/Kimi-K2-Instruct-0905'
  ].filter(Boolean);

  let lastErr = null;

  for (const modelId of tryModels) {
    try {
      // Use textGeneration for broad model support; pass parameters for token/temperature
      const parameters = { max_new_tokens: opts.max_tokens || 256, temperature: opts.temperature ?? 0.2 };
      let resp = null;
      try {
        resp = await hf.textGeneration({ model: modelId, inputs: prompt, parameters });
      } catch (e) {
        // some HF providers expose different method names; try generic `generate` or `chat` as fallback
        if (typeof hf.generate === 'function') {
          resp = await hf.generate({ model: modelId, inputs: prompt, parameters });
        } else if (typeof hf.chat === 'function') {
          // try chat-style API
          resp = await hf.chat({ model: modelId, messages: [{ role: 'user', content: prompt }], parameters });
        } else {
          throw e;
        }
      }

      // Normalize response to text
      if (!resp) throw new Error('Empty HF response');
      if (Array.isArray(resp)) {
        if (resp[0] && typeof resp[0].generated_text === 'string') return resp[0].generated_text;
        if (typeof resp[0] === 'string') return resp.join('\n');
      }
      if (typeof resp.generated_text === 'string') return resp.generated_text;
      if (typeof resp.text === 'string') return resp.text;
      if (resp?.output && Array.isArray(resp.output) && typeof resp.output[0] === 'string') return resp.output[0];
      return JSON.stringify(resp);
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  throw lastErr || new Error("No HF model worked");
}



async function generateWithOpenAI(prompt, opts = {}) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not set');
  const client = new OpenAI({ apiKey: OPENAI_KEY });
  // prefer chat completions when available
  try {
    const resp = await client.chat.completions.create({
      model: opts.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: opts.system || 'You are a JSON generator.' },
        { role: 'user', content: prompt }
      ],
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2,
      max_tokens: opts.max_tokens || 800
    });
    const text = resp?.choices?.[0]?.message?.content || resp?.choices?.[0]?.text;
    return text;
  } catch (e) {
    // fallback to completions.create older API
    const resp = await client.responses.create({ model: opts.model || 'gpt-3.5-turbo', input: prompt });
    const out = resp?.output?.[0]?.content?.find(c => c?.type === 'output_text')?.text;
    return out || JSON.stringify(resp);
  }
}

export async function generateText(prompt, opts = {}) {
  if (PROVIDER === 'hf') {
    try {
      return await generateWithHf(prompt, opts);
    } catch (err) {
      console.warn('HF generate failed, falling back to OpenAI if available:', err?.message || err);
      if (OPENAI_KEY) return generateWithOpenAI(prompt, opts);
      throw err;
    }
  }

  // default to OpenAI if configured
  if (PROVIDER === 'openai') return generateWithOpenAI(prompt, opts);

  // last-resort: try HF then OpenAI
  try { return await generateWithHf(prompt, opts); } catch (e) {}
  if (OPENAI_KEY) return generateWithOpenAI(prompt, opts);
  throw new Error('No AI provider configured (set AI_PROVIDER or API keys)');
}

export default { generateText };

// Direct router chat completions call for models that implement chat endpoint semantics.
export async function generateChatViaRouter(model, messages = []) {
  const HF_API = process.env.HF_API_KEY;
  if (!HF_API) throw new Error('HF_API_KEY not set');
  const url = `https://router.huggingface.co/v1/chat/completions`;
  const body = { model, messages };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error(`Invalid JSON from HF router: ${text}`); }

  if (!res.ok) {
    const msg = data?.error || JSON.stringify(data);
    throw new Error(`HF router error ${res.status}: ${msg}`);
  }

  // Expecting structure similar to OpenAI chat completions
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.content?.trim();
  if (content) return content;
  // Some providers use 'text' or 'generated_text'
  const alt = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.choices?.[0]?.message?.content;
  if (alt) return alt;
  return JSON.stringify(data);
}

export async function generateDayPlan({
  numMeetings = 0,
  meetingDuration = 30,
  workStart = "09:00",
  workEnd = "18:00",
  includeBreaks = true,
  breakDuration = 15,
  tasks = [],
  meetingWindows = null // optional array of time windows, e.g. ["09:00-11:30","13:00-16:00"] or [{start:"09:00",end:"11:30"}]
}) {
  // If meetingWindows provided, schedule deterministically without calling AI.
  if (meetingWindows && Array.isArray(meetingWindows) && meetingWindows.length > 0) {
    // Helper: convert HH:MM to minutes since midnight
    const toMinutes = (t) => {
      if (!t) return null;
      const [hh, mm] = t.split(':').map(s => parseInt(s, 10));
      return hh * 60 + (mm || 0);
    };

    const normalizeWindow = (w) => {
      if (typeof w === 'string') {
        const parts = w.split('-').map(s => s.trim());
        return { start: parts[0], end: parts[1] };
      }
      return { start: w.start, end: w.end };
    };

    const windows = meetingWindows.map(normalizeWindow).map(w => ({
      startMin: toMinutes(w.start) ?? toMinutes(workStart),
      endMin: toMinutes(w.end) ?? toMinutes(workEnd)
    })).filter(w => w.endMin > w.startMin);

    // total available minutes across windows
    const totalAvailable = windows.reduce((s, w) => s + Math.max(0, w.endMin - w.startMin), 0);
    const needed = numMeetings * meetingDuration + Math.max(0, numMeetings - 1) * (includeBreaks ? breakDuration : 0);

    if (totalAvailable < meetingDuration) {
      return { error: 'Not enough available time in provided windows' };
    }

    // Determine meetings per window proportionally
    const alloc = windows.map(w => {
      const avail = w.endMin - w.startMin;
      const proportion = avail / totalAvailable;
      return Math.floor(proportion * numMeetings);
    });

    // Adjust allocations to match numMeetings
    let allocated = alloc.reduce((a, b) => a + b, 0);
    let i = 0;
    while (allocated < numMeetings) {
      alloc[i % alloc.length]++;
      allocated++;
      i++;
    }
    // If overallocation occurred due to rounding, remove extras from end
    while (allocated > numMeetings) {
      for (let j = alloc.length - 1; j >= 0 && allocated > numMeetings; j--) {
        if (alloc[j] > 0) { alloc[j]--; allocated--; }
      }
    }

    const day_plan = [];
    let meetingCount = 0;

    for (let wi = 0; wi < windows.length; wi++) {
      const w = windows[wi];
      const count = alloc[wi];
      if (count <= 0) continue;

      // Spread meetings evenly within window
      const totalMeetingSpan = count * meetingDuration + Math.max(0, count - 1) * (includeBreaks ? breakDuration : 0);
      const gap = Math.max(0, (w.endMin - w.startMin - totalMeetingSpan) / (count + 1));
      // start time
      let cursor = Math.round(w.startMin + gap);

      for (let m = 0; m < count; m++) {
        const startMin = cursor;
        const endMin = startMin + meetingDuration;
        const format = (min) => {
          const hh = Math.floor(min / 60).toString().padStart(2, '0');
          const mm = (min % 60).toString().padStart(2, '0');
          return `${hh}:${mm}`;
        };
        meetingCount++;
        day_plan.push({ time: `${format(startMin)} - ${format(endMin)}`, activity: `Meeting ${meetingCount}` });

        // advance cursor past meeting and optional break
        cursor = endMin + (includeBreaks ? breakDuration : 0) + Math.round(gap);
      }
    }

    const summary = `Scheduled ${meetingCount} meeting${meetingCount === 1 ? '' : 's'} in provided windows.`;
    return { day_plan, summary };
  }

  // Fallback to AI generation when no explicit windows provided
  const prompt = `
You are a smart schedule generator. Create a detailed, realistic, structured day plan.

### Input Constraints
- Work hours: ${workStart} to ${workEnd}
- Number of meetings: ${numMeetings}
- Duration of each meeting: ${meetingDuration} minutes
- Include breaks: ${includeBreaks ? "yes" : "no"}
- Break duration: ${breakDuration} minutes
- Other tasks: ${tasks.length ? tasks.join(", ") : "None"}

### Requirements
1. Distribute meetings evenly through the day.
2. Add short focus tasks or buffer time between meetings.
3. Add breaks only if enabled.
4. Fit all tasks into the working hour window.
5. Output MUST be strictly valid JSON in this format:

{
  "day_plan": [
    { "time": "09:00 - 09:30", "activity": "Morning prep" },
    { "time": "09:30 - 10:00", "activity": "Meeting 1" }
  ],
  "summary": "Short description of the day."
}

### Generate only JSON. No text outside JSON.
`;

  let raw = await generateText(prompt, {
    temperature: 0.2,
    max_tokens: 900,
    system: "You generate day plans. Always return valid JSON."
  });

  // Clean JSON formatting if model returns fenced code block
  raw = raw.trim().replace(/^```json/, "").replace(/```$/, "").trim();

  try {
    return JSON.parse(raw);
  } catch (e) {
    // return raw output for debugging if invalid JSON
    return {
      error: "Invalid JSON returned by model",
      raw
    };
  }
}
