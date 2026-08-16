import * as SecureStore from "expo-secure-store";

// Set EXPO_PUBLIC_API_URL in your environment (e.g. .env at project root, or
// `eas.json`/app config) to point at your deployed backend. Falls back to a
// typical local-dev address for the Expo Go / simulator workflow.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const TOKEN_KEY = "goplanner_token";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null) {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response (shouldn't normally happen for API routes)
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed with status ${res.status}`, res.status);
  }
  return data as T;
}

// ---- Auth ----
export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<{ success: boolean; user: any }>("/api/auth/me"),
};

// ---- Trips ----
export type Activity = {
  _id?: string;
  start: string;
  end: string;
  activity: string;
  location: string;
  estimatedCost: number;
  reason: string;
  weatherSensitive: boolean;
  status: "planned" | "replaced" | "cancelled";
  replacedReason?: string | null;
};

export type TripDay = {
  day: number;
  date: string | null;
  weatherSummary?: {
    condition: string | null;
    tempMaxC: number | null;
    tempMinC: number | null;
    precipitationProbability: number | null;
    fetchedAt: string | null;
  };
  activities: Activity[];
};

export type Trip = {
  _id: string;
  destination: string;
  description: string;
  days: number;
  startDate: string | null;
  currency: string;
  budget: number | null;
  totalEstimatedCost: number;
  overBudget: boolean;
  itinerary: TripDay[];
  status: string;
  createdAt: string;
};

export const tripApi = {
  list: () => request<{ success: boolean; data: Trip[] }>("/api/trips"),
  get: (id: string) => request<{ success: boolean; data: Trip }>(`/api/trips/${id}`),
  create: (body: {
    destination: string;
    days: number;
    description?: string;
    budget?: number | null;
    currency?: string;
    startDate?: string | null;
  }) =>
    request<{ success: boolean; data: Trip; meta: { budgetRevisionAttempted: boolean } }>("/api/trips", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  remove: (id: string) => request<{ success: boolean }>(`/api/trips/${id}`, { method: "DELETE" }),
  replanActivity: (id: string, day: number, index: number, reason: "weather" | "closed" | "other") =>
    request<{ success: boolean; data: Trip }>(`/api/trips/${id}/days/${day}/activities/${index}/replan`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  refreshWeather: (id: string) =>
    request<{ success: boolean; data: Trip; atRisk: any[]; resolvedLocation: string }>(
      `/api/trips/${id}/weather/refresh`,
      { method: "POST" }
    ),
  exportUrl: (id: string, format: "ics" | "pdf") => `${API_URL}/api/trips/${id}/export/${format}`,
};

export { API_URL };
