import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from '../services/supabase';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals for reactive state
  private _session = signal<AuthSession | null>(null);
  private _user = signal<User | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._session());

  constructor(private supabaseService: SupabaseService, private router: Router) {
    // Initialize session from Supabase
    this.supabaseService.client.auth.getSession().then(({ data }) => {
      this._session.set(data.session);
      this._user.set(data.session?.user ?? null);
    });

    // Listen for auth changes
    this.supabaseService.client.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        this._session.set(session);
        this._user.set(session?.user ?? null);

        if (event === 'SIGNED_IN') {
          const currentUrl = this.router.url;
          // Only redirect to home if we are on the login page
          if (currentUrl.includes('/login')) {
            this.router.navigate(['/home']);
          }
        } else if (event === 'SIGNED_OUT') {
          this.router.navigate(['/login']);
        }
      }
    );
  }

  async signInWithEmail(email: string): Promise<{ error: any }> {
    return this.supabaseService.client.auth.signInWithOtp({ email });
  }

  // For email/password login as requested
  async signInWithPassword(email: string, password: string): Promise<{ error: any }> {
    return this.supabaseService.client.auth.signInWithPassword({
      email,
      password,
    });
  }

  async isAuthenticatedAsync(): Promise<boolean> {
    const { data } = await this.supabaseService.client.auth.getSession();
    return !!data.session;
  }

  async signOut(): Promise<{ error: any }> {
    return this.supabaseService.client.auth.signOut();
  }

  getUserAsObservable(): Observable<User | null> {
    return from(this.supabaseService.client.auth.getUser().then(({ data }) => data.user));
  }
}
