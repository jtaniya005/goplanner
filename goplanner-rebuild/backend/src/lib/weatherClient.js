import AppError from '../utils/AppError.js';

// Open-Meteo is free, keyless, and reliable enough for planning-grade forecasts —
// avoids requiring users to provision an OpenWeather API key just to demo the app.
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// Subset of WMO weather codes relevant to "should I re-plan outdoor activities".
const BAD_WEATHER_CODES = new Set([
  51, 53, 55, 56, 57,       // drizzle
  61, 63, 65, 66, 67,       // rain
  71, 73, 75, 77,           // snow
  80, 81, 82,               // rain showers
  85, 86,                   // snow showers
  95, 96, 99                // thunderstorm
]);

function describeCode(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm'
  };
  return map[code] || 'Unknown';
}

export async function geocode(destination) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new AppError('Weather geocoding lookup failed.', 502);
  const data = await res.json();
  const hit = data?.results?.[0];
  if (!hit) return null;
  return { lat: hit.latitude, lon: hit.longitude, resolvedName: `${hit.name}${hit.country ? ', ' + hit.country : ''}` };
}

/**
 * Returns a per-day forecast summary for a destination starting on `startDate`
 * (Date object) for `days` days. Returns null entries for days beyond the
 * ~16-day forecast horizon rather than throwing, since trips can be planned
 * far in advance.
 */
export async function getDailyForecast(destination, startDate, days) {
  const place = await geocode(destination);
  if (!place) return { place: null, forecast: [] };

  const url = `${FORECAST_URL}?latitude=${place.lat}&longitude=${place.lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=16`;

  const res = await fetch(url);
  if (!res.ok) throw new AppError('Weather forecast lookup failed.', 502);
  const data = await res.json();

  const dates = data?.daily?.time || [];
  const start = startDate ? new Date(startDate) : new Date();

  const forecast = [];
  for (let i = 0; i < days; i++) {
    const target = new Date(start);
    target.setDate(target.getDate() + i);
    const iso = target.toISOString().slice(0, 10);
    const idx = dates.indexOf(iso);

    if (idx === -1) {
      forecast.push({ day: i + 1, date: iso, available: false });
      continue;
    }

    const code = data.daily.weathercode[idx];
    forecast.push({
      day: i + 1,
      date: iso,
      available: true,
      condition: describeCode(code),
      code,
      isBadWeather: BAD_WEATHER_CODES.has(code),
      tempMaxC: data.daily.temperature_2m_max[idx],
      tempMinC: data.daily.temperature_2m_min[idx],
      precipitationProbability: data.daily.precipitation_probability_max?.[idx] ?? null
    });
  }

  return { place, forecast };
}

export default { geocode, getDailyForecast };
