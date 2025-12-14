import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
  address: {
    country: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  geocodeLocation(countryCode: string, city?: string): Observable<GeocodingResult | null> {
    if (!countryCode) {
      return of(null);
    }

    // Build query
    let query = '';
    if (city && city.trim()) {
      query = `${city}, ${countryCode}`;
    } else {
      query = countryCode;
    }

    const params = {
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      countrycodes: countryCode,
    };

    return this.http.get<any[]>(this.NOMINATIM_API, { params }).pipe(
      map((results) => {
        if (results && results.length > 0) {
          const result = results[0];
          return {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            display_name: result.display_name,
            address: result.address || {},
          };
        }
        return null;
      }),
      catchError((error) => {
        console.error('Geocoding error:', error);
        return of(null);
      })
    );
  }

  // Get coordinates for a country code only
  geocodeCountry(countryCode: string): Observable<GeocodingResult | null> {
    return this.geocodeLocation(countryCode);
  }

  // Get coordinates for a city and country
  geocodeCity(city: string, countryCode: string): Observable<GeocodingResult | null> {
    return this.geocodeLocation(countryCode, city);
  }
}
