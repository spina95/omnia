import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleTheme()"
      class="flex items-center gap-3 px-4 py-3 w-full transition-colors duration-200
             text-zinc-400 dark:text-zinc-400 
             hover:bg-sidebar-hover-light dark:hover:bg-sidebar-hover 
             hover:text-zinc-900 dark:hover:text-zinc-100
             rounded-lg group"
      title="Cambia tema"
    >
      <!-- Icona Sole (visibile in dark mode) -->
      <svg 
        *ngIf="themeService.isDarkMode()"
        class="w-5 h-5 flex-shrink-0 transition-colors duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      <!-- Icona Luna (visibile in light mode) -->
      <svg 
        *ngIf="!themeService.isDarkMode()"
        class="w-5 h-5 flex-shrink-0 transition-colors duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      <span class="text-sm font-medium transition-colors duration-200">
        {{ themeService.isDarkMode() ? 'Modalità Chiara' : 'Modalità Scura' }}
      </span>
    </button>
  `,
  styles: []
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
