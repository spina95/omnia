import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'omnia-theme';
  
  // Signal per tracciare se siamo in dark mode
  isDarkMode = signal<boolean>(true);

  constructor() {
    // Carica tema salvato da localStorage o usa default (dark)
    this.loadTheme();
    
    // Effect per sincronizzare il tema con il DOM e localStorage
    effect(() => {
      const isDark = this.isDarkMode();
      this.applyTheme(isDark);
      this.saveTheme(isDark);
    });
  }

  /**
   * Carica il tema salvato da localStorage
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);
    
    if (savedTheme === 'light') {
      this.isDarkMode.set(false);
    } else if (savedTheme === 'dark') {
      this.isDarkMode.set(true);
    } else {
      // Default: dark mode
      // Potremmo anche controllare prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }
  }

  /**
   * Salva il tema in localStorage
   */
  private saveTheme(isDark: boolean): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }

  /**
   * Applica il tema al DOM
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  /**
   * Toggle tra light e dark mode
   */
  toggleTheme(): void {
    this.isDarkMode.update(current => !current);
  }

  /**
   * Imposta esplicitamente il tema
   */
  setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
  }

  /**
   * Imposta light mode
   */
  setLightMode(): void {
    this.setTheme(false);
  }

  /**
   * Imposta dark mode
   */
  setDarkMode(): void {
    this.setTheme(true);
  }
}
