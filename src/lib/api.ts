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

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Check if response is ok before parsing
    if (!response.ok) {
      // Try to parse error as JSON, fallback to text
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse successful response
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      // Non-JSON response
      const text = await response.text();
      return {
        success: false,
        error: `Unexpected response format: ${text.substring(0, 100)}`,
      };
    }
  } catch (error) {
    console.error("API Request Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ==================== Sportsbook Offers ====================

export interface SportsbookOffer {
  id: number;
  name: string;
  logo: string | null;
  welcome_offer: string | null;
  score: number;
  locations: string[];
  visibility: boolean;
  created_at: string;
  updated_at: string;
}

export const sportsbookOffersApi = {
  // List all sportsbooks
  list: async (params?: { visibility?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.visibility) queryParams.append("visibility", params.visibility);
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiRequest<SportsbookOffer[]>(
      `/offers/sportsbooks/${query ? `?${query}` : ""}`
    );
  },

  // Get single sportsbook
  get: async (id: number) => {
    return apiRequest<SportsbookOffer>(`/offers/sportsbooks/${id}/`);
  },

  // Create sportsbook
  create: async (data: Omit<SportsbookOffer, "id" | "created_at" | "updated_at">) => {
    return apiRequest<SportsbookOffer>("/offers/sportsbooks/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update sportsbook
  update: async (id: number, data: Partial<SportsbookOffer>) => {
    return apiRequest<SportsbookOffer>(`/offers/sportsbooks/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete sportsbook
  delete: async (id: number) => {
    return apiRequest<void>(`/offers/sportsbooks/${id}/delete/`, {
      method: "DELETE",
    });
  },
};

// ==================== Casino Offers ====================

export interface CasinoOffer {
  id: number;
  name: string;
  logo: string | null;
  welcome_offer: string | null;
  score: number;
  locations: string[];
  visibility: boolean;
  created_at: string;
  updated_at: string;
}

export const casinoOffersApi = {
  // List all casinos
  list: async (params?: { visibility?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.visibility) queryParams.append("visibility", params.visibility);
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiRequest<CasinoOffer[]>(
      `/offers/casinos/${query ? `?${query}` : ""}`
    );
  },

  // Get single casino
  get: async (id: number) => {
    return apiRequest<CasinoOffer>(`/offers/casinos/${id}/`);
  },

  // Create casino
  create: async (data: Omit<CasinoOffer, "id" | "created_at" | "updated_at">) => {
    return apiRequest<CasinoOffer>("/offers/casinos/create/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update casino
  update: async (id: number, data: Partial<CasinoOffer>) => {
    return apiRequest<CasinoOffer>(`/offers/casinos/${id}/update/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete casino
  delete: async (id: number) => {
    return apiRequest<void>(`/offers/casinos/${id}/delete/`, {
      method: "DELETE",
    });
  },
};

// ==================== Sportsbooks Table (for logo selection) ====================

export interface Sportsbook {
  id: number | string;
  sportsbook_name: string;
  square_logo_url: string | null;
  logo_url: string | null;
  list_of_locations: string[] | null;
}

export const sportsbooksApi = {
  // List all sportsbooks from main table for logo selection
  list: async () => {
    const response = await apiRequest<{ success: boolean; count: number; results: Sportsbook[] }>(
      "/offers/sportsbooks/list/"
    );
    // The response already contains results at the top level
    return {
      ...response,
      data: (response as unknown as { results: Sportsbook[] }).results || [],
    };
  },
};

// ==================== Casinos Table (for logo selection) ====================

export interface Casino {
  id: number | string;
  display_name: string;
  square_logo_url: string | null;
  logo_url: string | null;
  list_of_locations: string[] | null;
}

export const casinosApi = {
  // List all casinos from main table for logo selection
  list: async () => {
    const response = await apiRequest<{ success: boolean; count: number; results: Casino[] }>(
      "/offers/casinos/list/"
    );
    // The response already contains results at the top level
    return {
      ...response,
      data: (response as unknown as { results: Casino[] }).results || [],
    };
  },
};

// ==================== Export Base URL for reference ====================

export { API_BASE_URL };
