export interface VisitedPlace {
  id: string;
  user_id: string;
  country_code: string;
  country_name: string;
  city?: string;
  lat: number;
  lng: number;
  visit_date?: string;
  notes?: string;
  created_at: string;
}

export interface VisitedCountryStats {
  user_id: string;
  country_code: string;
  country_name: string;
  places_count: number;
}

export interface UserTravelStats {
  total_countries: number;
  total_places: number;
  countries_visited: string[];
}

export interface AddVisitedPlacePayload {
  country_code: string;
  country_name: string;
  city?: string;
  lat: number;
  lng: number;
  visit_date?: string;
  notes?: string;
}

export interface Country {
  code: string;
  name: string;
}
