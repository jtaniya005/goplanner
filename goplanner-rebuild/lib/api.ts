import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Set EXPO_PUBLIC_API_URL in your environment (e.g. .env at project root, or
// `eas.json`/app config) to point at your deployed backend. Falls back to a
// typical local-dev address for the Expo Go / simulator workflow.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const TOKEN_KEY = "goplanner_token";

// SecureStore is not fully supported on web; fall back to localStorage.
export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string | null) {
  try {
    if (Platform.OS === "web") {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } else {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // silently ignore storage errors
  }
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
  exportUrl: (id: string, format: "ics" | "pdf", token?: string | null) =>
    `${API_URL}/api/trips/${id}/export/${format}${token ? `?token=${encodeURIComponent(token)}` : ""}`,

  createManual: (body: {
    destination: string;
    days: number;
    description?: string;
    budget?: number | null;
    currency?: string;
    startDate?: string | null;
    itinerary?: Array<{ day: number; activities: Array<any> }>;
  }) =>
    request<{ success: boolean; data: Trip }>("/api/trips/manual", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  addActivity: (id: string, day: number, body: {
    start: string;
    end: string;
    activity: string;
    location?: string;
    estimatedCost?: number;
    weatherSensitive?: boolean;
  }) =>
    request<{ success: boolean; data: Trip }>(`/api/trips/${id}/days/${day}/activities`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  editActivity: (id: string, day: number, index: number, body: {
    start?: string;
    end?: string;
    activity?: string;
    location?: string;
    estimatedCost?: number;
    weatherSensitive?: boolean;
    status?: string;
  }) =>
    request<{ success: boolean; data: Trip }>(`/api/trips/${id}/days/${day}/activities/${index}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteActivity: (id: string, day: number, index: number) =>
    request<{ success: boolean; data: Trip }>(`/api/trips/${id}/days/${day}/activities/${index}`, {
      method: "DELETE",
    }),
};

export const weatherApi = {
  lookup: (destination: string, days: number, startDate?: string) => {
    const params = new URLSearchParams();
    params.append("destination", destination);
    params.append("days", String(days));
    if (startDate) params.append("startDate", startDate);
    return request<{ success: boolean; data: any[]; place: any }>(`/api/trips/weather/lookup?${params.toString()}`);
  },
};

export const currencyApi = {
  convert: async (amount: number, from: string, to: string) => {
    if (from === to) return amount;
    const res = await request<{ success: boolean; convertedAmount: number }>(
      `/api/tools/convert-currency?amount=${amount}&from=${from}&to=${to}`
    );
    return res.convertedAmount;
  },
};

export const toolsApi = {
  getPackingList: (payload: { destination: string; days: number; tripType: string }) =>
    request<{ success: boolean; data: Array<{ name: string; items: string[] }> }>("/api/tools/packing-list", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export interface Task {
  _id: string;
  user: string;
  date: string;
  start: string;
  end: string;
  title: string;
  category: "meeting" | "appointment" | "personal" | "travel" | "other";
  location: string;
  notes: string;
  completed: boolean;
}

export const taskApi = {
  list: (date: string) =>
    request<{ success: boolean; data: Task[] }>(`/api/tasks?date=${encodeURIComponent(date)}`),
  create: (body: {
    date: string;
    start: string;
    end: string;
    title: string;
    category?: string;
    location?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; data: Task }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: {
    date?: string;
    start?: string;
    end?: string;
    title?: string;
    category?: string;
    location?: string;
    notes?: string;
    completed?: boolean;
  }) =>
    request<{ success: boolean; data: Task }>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<{ success: boolean; data: { id: string } }>(`/api/tasks/${id}`, {
      method: "DELETE",
    }),
};

export function getCurrencySymbol(currency?: string) {
  switch (currency) {
    case "INR":
      return "₹";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    default:
      return "$";
  }
}

export { API_URL };
