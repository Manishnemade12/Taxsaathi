import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export type TaxBuddyLiveState = {
  mode: "general" | "salary" | "capital_gains" | "business" | "house_property" | "deductions" | "tax_paid" | "review";
  step: number;
  answers: Record<string, string>;
  last_field: string;
  completed: boolean;
  itr_form: string;
  expected_fields: string[];
};

export type TaxBuddyLiveResponse = {
  success: boolean;
  assistant_text: string;
  field_name: string;
  field_hint: string;
  example_value: string;
  state: TaxBuddyLiveState;
  completed: boolean;
  quick_checklist?: string[];
};

async function getToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function liveRequest<T>(path: string, body: Record<string, unknown>) {
  const token = await getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Cannot reach backend at ${API_BASE || "current-origin"}. Start backend and retry.`);
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 404) {
      throw new Error(`Live coach API route not found (${path}). Ensure backend is restarted with latest routes.`);
    }
    try {
      const payload = JSON.parse(text) as { error?: string };
      throw new Error(payload.error || `Request failed: ${response.status}`);
    } catch {
      throw new Error(text || `Request failed: ${response.status}`);
    }
  }

  return (await response.json()) as T;
}

export async function startTaxBuddyLive(name?: string) {
  return liveRequest<TaxBuddyLiveResponse>("/api/taxbuddy/live/start", {
    name: name || "",
  });
}

export async function sendTaxBuddyLiveMessage(message: string, state: TaxBuddyLiveState) {
  return liveRequest<TaxBuddyLiveResponse>("/api/taxbuddy/live/message", {
    message,
    state,
  });
}
