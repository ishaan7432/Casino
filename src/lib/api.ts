/**
 * API Service Layer
 *
 * Centralized API communication with Django backend.
 * Change NEXT_PUBLIC_API_BASE_URL in .env.local for deployment.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
  errors?: Record<string, string[]>;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    }
    return { success: false, error: "Unexpected response format" };
  } catch (error) {
    console.error("API Request Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ==================== Sportsbooks (main table) ====================

export interface Sportsbook {
  id: number;
  sportsbook_id: string | null;
  sportsbook_name: string;
  display_name: string | null;
  player_trend_display: string | null;
  api_response: string | null;
  link: string;
  logo_url: string | null;
  square_logo_url: string | null;
  promo_code: string | null;
  min_deposit: string | null;
  bg_color: string | null;
  list_of_locations: string[] | null;
  hidden: boolean;
  display_order: number;
}

export const sportsbooksAdminApi = {
  list: async (params?: { search?: string; hidden?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.hidden !== undefined) q.append("hidden", String(params.hidden));
    const qs = q.toString();
    return apiRequest<Sportsbook[]>(`/admin/sportsbooks/${qs ? `?${qs}` : ""}`);
  },

  get: async (id: number) => apiRequest<Sportsbook>(`/admin/sportsbooks/${id}/`),

  create: async (data: Omit<Sportsbook, "id">) =>
    apiRequest<Sportsbook>("/admin/sportsbooks/create/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id: number, data: Partial<Sportsbook>) =>
    apiRequest<Sportsbook>(`/admin/sportsbooks/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id: number) =>
    apiRequest<void>(`/admin/sportsbooks/${id}/delete/`, { method: "DELETE" }),
};

// ==================== Casinos (main table) ====================

export interface Casino {
  id: number;
  casino_id: string | null;
  display_name: string;
  link: string | null;
  logo_url: string | null;
  square_logo_url: string | null;
  promo_code: string | null;
  bg_color: string | null;
  list_of_locations: string[] | null;
  social_casino: boolean;
  hidden: boolean;
  display_order: number;
  add_parameter: string | null;
  ca_parameter: string | null;
  us_parameter: string | null;
  parent_casino_id: string | null;
  signup_tutorial_link: string | null;
  superbowl_flag: boolean;
}

export const casinosAdminApi = {
  list: async (params?: { search?: string; hidden?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.hidden !== undefined) q.append("hidden", String(params.hidden));
    const qs = q.toString();
    return apiRequest<Casino[]>(`/admin/casinos/${qs ? `?${qs}` : ""}`);
  },

  get: async (id: number) => apiRequest<Casino>(`/admin/casinos/${id}/`),

  create: async (data: Omit<Casino, "id">) =>
    apiRequest<Casino>("/admin/casinos/create/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: async (id: number, data: Partial<Casino>) =>
    apiRequest<Casino>(`/admin/casinos/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: async (id: number) =>
    apiRequest<void>(`/admin/casinos/${id}/delete/`, { method: "DELETE" }),
};

// ==================== Locations (sportsbook access per province) ====================

export interface Location {
  id: number;
  location_id: string;
  name: string;
  country: string | null;
  sportsbook_ids: string[] | null;
}

export const locationsAdminApi = {
  list: async () => apiRequest<Location[]>("/admin/locations/"),
  get: async (id: number) => apiRequest<Location>(`/admin/locations/${id}/`),
  update: async (id: number, sportsbook_ids: string[]) =>
    apiRequest<Location>(`/admin/locations/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify({ sportsbook_ids }),
    }),
};

// ==================== LocationCasinos (casino access per province) ====================

export interface LocationCasino {
  id: number;
  location_casino_id: string;
  name: string;
  country: string | null;
  casino_ids: string[] | null;
}

export const locationCasinosAdminApi = {
  list: async () => apiRequest<LocationCasino[]>("/admin/location-casinos/"),
  get: async (id: number) => apiRequest<LocationCasino>(`/admin/location-casinos/${id}/`),
  update: async (id: number, casino_ids: string[]) =>
    apiRequest<LocationCasino>(`/admin/location-casinos/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify({ casino_ids }),
    }),
};

// ==================== Bootstrap (single call for all panel data) ====================

export interface AdminBootstrapData {
  sportsbooks: Sportsbook[];
  casinos: Casino[];
  locations: Location[];
  location_casinos: LocationCasino[];
}

export const adminBootstrapApi = {
  fetch: async () => apiRequest<AdminBootstrapData>("/admin/bootstrap/"),
};

export { API_BASE_URL };
