import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Get the current Supabase JWT token for authenticating with the backend.
 */
async function getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

/**
 * Make an authenticated request to the Node/Express backend.
 */
async function request<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getToken();
    if (!token) {
        throw new Error("Not authenticated");
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> || {}),
    };

    // Don't set Content-Type for FormData (browser sets it automatically with boundary)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `Request failed: ${response.status}`);
    }

    const text = await response.text();
    if (!text || text === "null") return null as T;
    return JSON.parse(text);
}

// ---------- Profile ----------

export async function getProfile() {
    return request("/api/profile");
}

export async function updateProfile(data: {
    full_name?: string;
    employment_type?: string;
    age_group?: string;
    tax_regime?: string;
}) {
    return request("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function completeOnboarding(data: {
    employment_type: string;
    income_sources: string[];
    age_group: string;
    tax_regime: string;
}) {
    return request("/api/onboarding/complete", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ---------- Documents ----------

export async function getDocuments() {
    return request("/api/documents");
}

export async function uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/documents/upload", {
        method: "POST",
        body: formData,
    });
}

export async function deleteDocument(id: string) {
    return request(`/api/documents/${id}`, { method: "DELETE" });
}

export async function analyzeDocument(id: string) {
    return request(`/api/documents/${id}/analyze`, { method: "POST" });
}

// ---------- Financial Data ----------

export async function getFinancialData() {
    return request("/api/financial-data");
}

export async function updateFinancialData(data: Record<string, any>) {
    return request("/api/financial-data", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// ---------- Tax Analysis ----------

export async function getTaxAnalysis() {
    return request("/api/tax-analysis");
}

export async function runTaxAnalysis(financialData: Record<string, any>, profile: Record<string, any>) {
    return request("/api/tax-analysis/run", {
        method: "POST",
        body: JSON.stringify({ financialData, profile }),
    });
}

// ---------- Dashboard ----------

export async function getDashboardStats() {
    return request<{
        documents: number;
        totalIncome: number;
        estimatedTax: number;
        savings: number;
        incomeData: Array<{ name: string; value: number }> | null;
    }>("/api/dashboard/stats");
}

// ---------- Schemes ----------

export async function getSchemes() {
    return request<{ schemes: any[] | null }>("/api/schemes");
}

export async function getPersonalizedSchemes() {
    return request<{ schemes: any[]; data: any }>("/api/schemes/personalized", {
        method: "POST",
    });
}

// ---------- TaxBuddy (Standalone) ----------

export async function getTaxBuddyStrategy(data: {
    age: number;
    res_status: "Resident" | "NRI" | "RNOR";
    has_business: boolean;
    has_cap_gains: boolean;
    est_income: number;
    has_agri: boolean;
    is_director: boolean;
}) {
    return request<{
        success: boolean;
        data: {
            strategy: string;
            itr_form: string;
            primary_reason: string;
            smart_alerts: string;
        };
    }>("/api/taxbuddy/strategy", {
        method: "POST",
        body: JSON.stringify(data),
    });
}
