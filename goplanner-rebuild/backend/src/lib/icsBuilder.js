// Minimal RFC 5545 ICS builder — no external dependency needed for the
// straightforward "one VEVENT per activity" case we need here.

function foldLine(line) {
  // ICS lines should be folded at 75 octets; keeping it simple/safe for typical activity text.
  if (line.length <= 75) return line;
  const chunks = [];
  let rest = line;
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  chunks.push(rest);
  return chunks.join('\r\n');
}

function escapeText(str = '') {
  return String(str).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function toICSDateTime(date, time) {
  // date: Date object (day boundary), time: "HH:MM"
  const [h, m] = (time || '00:00').split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function buildTripICS(trip) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GoPlanner//Trip Export//EN',
    'CALSCALE:GREGORIAN'
  ];

  const baseDate = trip.startDate ? new Date(trip.startDate) : new Date();

  for (const day of trip.itinerary) {
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + (day.day - 1));

    for (const act of day.activities) {
      if (act.status === 'cancelled') continue;
      const uid = `${trip._id}-d${day.day}-${act._id || Math.random().toString(36).slice(2)}@goplanner`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${toICSDateTime(new Date(), '00:00')}Z`,
        `DTSTART:${toICSDateTime(dayDate, act.start)}`,
        `DTEND:${toICSDateTime(dayDate, act.end)}`,
        foldLine(`SUMMARY:${escapeText(act.activity)}`),
        foldLine(`LOCATION:${escapeText(act.location || '')}`),
        foldLine(`DESCRIPTION:${escapeText(act.reason || '')}${act.estimatedCost ? ` (Est. cost: ${act.estimatedCost} ${trip.currency})` : ''}`),
        'END:VEVENT'
      );
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default { buildTripICS };
