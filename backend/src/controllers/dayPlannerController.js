import DayPlanner from '../../../src/model/DayPlanner.js';
import { generateDayPlan } from '../../../src/lib/aiClient.js';

// Create a new day planner
export const createDayPlanner = async (req, res) => {
  try {
    const { userId, title, date, items = [], meta } = req.body;
    const planner = await DayPlanner.create({ userId, title, date, items, meta });
    res.status(201).json({ success: true, planner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get planners for a user
export const getPlannersForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const planners = await DayPlanner.find({ userId }).sort({ date: 1 });
    res.json({ success: true, planners });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get planner by id
export const getPlannerById = async (req, res) => {
  try {
    const id = req.params.id;
    const planner = await DayPlanner.findById(id);
    if (!planner) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, planner });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Auto-schedule a day planner using AI or deterministic windows
export const autoScheduleDayPlanner = async (req, res) => {
  try {
    const {
      userId,
      title = 'Auto Scheduled Day',
      date,
      numMeetings = 0,
      meetingDuration = 60,
      // allow simplified numeric hours: startHour (e.g. 6) and endHour (e.g. 20)
      startHour = null,
      endHour = null,
      workStart = '09:00',
      workEnd = '18:00',
      includeBreaks = true,
      breakDuration = 15,
      tasks = [],
      meetingWindows = null,
      save = false
    } = req.body;

    // If simplified numeric hours provided, convert to HH:MM and set meetingWindows
    let windows = meetingWindows;
    if ((startHour !== null && startHour !== undefined) || (endHour !== null && endHour !== undefined)) {
      const s = Number(startHour ?? Math.floor(parseInt(workStart.split(':')[0], 10)));
      const e = Number(endHour ?? Math.floor(parseInt(workEnd.split(':')[0], 10)));
      if (Number.isNaN(s) || Number.isNaN(e) || s >= e) {
        return res.status(400).json({ success: false, error: 'Invalid startHour/endHour' });
      }
      const pad = (n) => String(n).padStart(2, '0') + ':00';
      windows = [`${pad(s)}-${pad(e)}`];
    }

    const aiResult = await generateDayPlan({
      numMeetings: Number(numMeetings) || 0,
      meetingDuration: Number(meetingDuration) || 60,
      workStart,
      workEnd,
      includeBreaks: Boolean(includeBreaks),
      breakDuration: Number(breakDuration) || 15,
      tasks: Array.isArray(tasks) ? tasks : (tasks ? [String(tasks)] : []),
      meetingWindows: windows
    });

    if (aiResult?.error) {
      return res.status(400).json({ success: false, error: aiResult.error, raw: aiResult.raw });
    }


    const plan = aiResult.day_plan || aiResult.dayPlan || aiResult.plan || [];

    // Helper parsers
    const toMinutes = (hhmm) => {
      if (!hhmm) return null;
      const clean = hhmm.replace(/[^0-9:]/g, '').trim();
      const parts = clean.split(':');
      const hh = Number(parts[0] ?? 0);
      const mm = Number(parts[1] ?? 0);
      return hh * 60 + mm;
    };
    const fmt = (min) => {
      const h = Math.floor(min / 60).toString().padStart(2, '0');
      const m = (min % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    // Convert returned plan into items with numeric times
    let items = (Array.isArray(plan) ? plan : []).map((p, idx) => {
      const time = p.time || p.slot || '';
      const activity = p.activity || p.title || p.task || '';
      const [start, end] = time.split('-').map(s => s.trim());
      return {
        startTime: start || null,
        endTime: end || null,
        startMin: start ? toMinutes(start) : null,
        endMin: end ? toMinutes(end) : null,
        activity: activity || `Item ${idx + 1}`,
        location: p.location || '',
        notes: p.notes || ''
      };
    });

    // If windows were provided from numeric hours, ensure lunch and focus time insertion
    if (windows && windows.length === 1) {
      const w = windows[0].split('-').map(s => s.trim());
      const windowStart = toMinutes(w[0]);
      const windowEnd = toMinutes(w[1]);

      // sort items by startMin
      items = items.filter(it => it.startMin !== null).sort((a, b) => a.startMin - b.startMin);

      // Insert Lunch at 12:00-13:00 if within window and not overlapping
      const lunchStart = Math.max(windowStart, toMinutes('12:00'));
      const lunchEnd = Math.min(windowEnd, toMinutes('13:00'));
      if (lunchEnd - lunchStart >= 30) {
        // check overlap
        const overlaps = items.some(it => !(it.endMin <= lunchStart || it.startMin >= lunchEnd));
        if (!overlaps) {
          items.push({ startTime: fmt(lunchStart), endTime: fmt(lunchEnd), startMin: lunchStart, endMin: lunchEnd, activity: 'Lunch', location: '', notes: '' });
        }
      }

      // Re-sort after potential lunch push
      items.sort((a, b) => (a.startMin || 0) - (b.startMin || 0));

      // Fill gaps between items with Focus Time or Buffer
      const filled = [];
      let cursor = windowStart;
      for (const it of items) {
        if (it.startMin > cursor + 15) {
          // create focus block between cursor and it.startMin (cap at 120 minutes)
          let gap = it.startMin - cursor;
          while (gap > 20) {
            const block = Math.min(60, gap);
            const s = cursor;
            const e = cursor + block;
            filled.push({ startTime: fmt(s), endTime: fmt(e), startMin: s, endMin: e, activity: 'Focus Time', location: '', notes: '' });
            cursor = e + 5; // small buffer
            gap = it.startMin - cursor;
          }
        }
        filled.push(it);
        cursor = Math.max(cursor, it.endMin || cursor);
      }
      // tail focus time until windowEnd
      if (cursor < windowEnd - 15) {
        let gap = windowEnd - cursor;
        while (gap > 20) {
          const block = Math.min(60, gap);
          const s = cursor;
          const e = cursor + block;
          filled.push({ startTime: fmt(s), endTime: fmt(e), startMin: s, endMin: e, activity: 'Focus Time', location: '', notes: '' });
          cursor = e + 5;
          gap = windowEnd - cursor;
        }
      }

      // Final sort and strip numeric fields
      filled.sort((a, b) => (a.startMin || 0) - (b.startMin || 0));
      items = filled.map(it => ({ startTime: it.startTime, endTime: it.endTime, activity: it.activity, location: it.location, notes: it.notes }));
    } else {
      // No numeric windows provided: just map items to simple objects
      items = items.map(it => ({ startTime: it.startTime, endTime: it.endTime, activity: it.activity, location: it.location, notes: it.notes }));
    }

    const plannerObj = { userId, title, date, items, meta: { generatedBy: 'ai' } };

    if (save) {
      const planner = await DayPlanner.create(plannerObj);
      return res.status(201).json({ success: true, planner, raw: aiResult });
    }

    return res.json({ success: true, planner: plannerObj, raw: aiResult });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
