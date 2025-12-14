import { Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/auth/auth';
import {
  VisitedPlace,
  VisitedCountryStats,
  UserTravelStats,
  AddVisitedPlacePayload,
} from './visited-place.interface';
import { from, map, Observable, switchMap, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VisitedPlacesService {
  constructor(private supabaseService: SupabaseService, private authService: AuthService) {}

  private getCurrentUserId(): Observable<string> {
    return this.authService.getUserAsObservable().pipe(
      take(1),
      map((user) => {
        if (!user) {
          throw new Error('User not authenticated');
        }
        return user.id;
      })
    );
  }

  getVisitedPlacesForCurrentUser(): Observable<VisitedPlace[]> {
    return this.getCurrentUserId().pipe(
      switchMap((userId) =>
        from(
          this.supabaseService.client
            .from('visited_place')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        )
      ),
      map((response) => {
        if (response.error) {
          throw response.error;
        }
        return response.data as VisitedPlace[];
      })
    );
  }

  addVisitedPlace(payload: AddVisitedPlacePayload): Observable<VisitedPlace> {
    return this.getCurrentUserId().pipe(
      switchMap((userId) =>
        from(
          this.supabaseService.client
            .from('visited_place')
            .insert({
              ...payload,
              user_id: userId,
            })
            .select()
            .single()
        )
      ),
      map((response) => {
        if (response.error) {
          throw response.error;
        }
        return response.data as VisitedPlace;
      })
    );
  }

  updateVisitedPlace(
    id: string,
    payload: Partial<AddVisitedPlacePayload>
  ): Observable<VisitedPlace> {
    return from(
      this.supabaseService.client
        .from('visited_place')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map((response) => {
        if (response.error) {
          throw response.error;
        }
        return response.data as VisitedPlace;
      })
    );
  }

  deleteVisitedPlace(id: string): Observable<void> {
    return from(this.supabaseService.client.from('visited_place').delete().eq('id', id)).pipe(
      map((response) => {
        if (response.error) {
          throw response.error;
        }
      })
    );
  }

  getStatsForCurrentUser(): Observable<UserTravelStats> {
    return this.getCurrentUserId().pipe(
      switchMap((userId) =>
        from(this.supabaseService.client.rpc('get_user_travel_stats', { p_user_id: userId }))
      ),
      map((response) => {
        if (response.error) {
          throw response.error;
        }
        const data = response.data as any[];
        if (data.length === 0) {
          return {
            total_countries: 0,
            total_places: 0,
            countries_visited: [],
          };
        }
        return data[0] as UserTravelStats;
      })
    );
  }

  getCountryStatsForCurrentUser(): Observable<VisitedCountryStats[]> {
    return this.getCurrentUserId().pipe(
      switchMap((userId) =>
        from(
          this.supabaseService.client
            .from('visited_country_stats')
            .select('*')
            .eq('user_id', userId)
            .order('places_count', { ascending: false })
        )
      ),
      map((response) => {
        if (response.error) {
          throw response.error;
        }
        return response.data as VisitedCountryStats[];
      })
    );
  }
}
