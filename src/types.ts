export interface Brand {
  id: string;
  name: string;
  type: "casino" | "sportsbook";
  logo: string; // URL, Base64 data, or empty string (for fallback)
  welcomeOffer: string;
  score: number; // 0.0 to 10.0
  locations: string[]; // E.g., ["US", "CA", "UK"]
  visibility: "visible" | "hidden";
  createdAt: string;
}
