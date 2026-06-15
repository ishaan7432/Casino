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

export interface Location {
  id: number;
  location_id: string;
  name: string;
  country: string | null;
  sportsbook_ids: string[] | null;
}

export interface LocationCasino {
  id: number;
  location_casino_id: string;
  name: string;
  country: string | null;
  casino_ids: string[] | null;
}

export type BrandType = "sportsbook" | "casino";

export interface Brand {
  id: string; // prefixed: "sportsbook-1" or "casino-1"
  type: BrandType;
  data: Sportsbook | Casino;
}
