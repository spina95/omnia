import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav
      class="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-zinc-400 font-sans text-sm transition-all duration-300"
      [class.items-center]="collapsed"
      [class.w-20]="collapsed"
      [class.w-64]="!collapsed"
    >
      <!-- App Header -->
      <div
        class="h-16 flex items-center border-b border-sidebar-border mb-4 transition-all duration-300"
        [class.px-6]="!collapsed"
        [class.px-0]="collapsed"
        [class.justify-center]="collapsed"
      >
        <div
          class="h-6 w-6 rounded bg-brand flex-shrink-0 flex items-center justify-center text-black font-bold text-xs"
        >
          O
        </div>
        <h1
          *ngIf="!collapsed"
          class="font-semibold text-zinc-100 tracking-tight ml-3 whitespace-nowrap overflow-hidden"
        >
          Omnia
        </h1>
        <button
          (click)="toggleCollapse()"
          class="ml-auto p-1.5 rounded-md hover:bg-sidebar-hover text-zinc-400 hover:text-white transition-colors"
          [title]="collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              *ngIf="!collapsed"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
            <path
              *ngIf="collapsed"
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto py-2 w-full">
        <!-- Section: Manage -->
        <div class="mb-6 w-full" [class.px-2]="collapsed" [class.px-4]="!collapsed">
          <h2
            *ngIf="!collapsed"
            class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap overflow-hidden"
          >
            Manage
          </h2>
          <div class="space-y-0.5">
            <a
              routerLink="/home"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Dashboard' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Dashboard</span
              >
            </a>

            <a
              routerLink="/incomes"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Incomes' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Incomes</span
              >
            </a>

            <a
              routerLink="/outcomes"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Outcomes' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Outcomes</span
              >
            </a>

            <a
              routerLink="/budgets"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Budgets' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Budgets</span
              >
            </a>

            <a
              routerLink="/travel-map"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Travel Map' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.9c.52 0 1.02.18 1.41 1.42l1.42 1.42a1.99 1.99 0 002.83 0l1.42-1.42A1.99 1.99 0 0118 3.9c.52 0 1.02.18 1.41 1.42l1.42 1.42a1.99 1.99 0 010 2.83l-1.42 1.42a1.99 1.99 0 00-2.83 0l-1.42-1.42a1.99 1.99 0 01-2.83 0l-1.42 1.42a1.99 1.99 0 00-2.83 0l-1.42-1.42A1.99 1.99 0 013.055 3.9z"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Travel Map</span
              >
            </a>

            <a
              routerLink="/documents"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Documents' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h10v10H7z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 3h6l4 4v10" />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Documents</span
              >
            </a>

            <a
              routerLink="/videos"
              routerLinkActive="bg-brand/10 text-brand"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Videos' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Videos</span
              >
            </a>
          </div>
        </div>

        <!-- Section: Configuration -->
        <div class="mb-6 w-full" [class.px-2]="collapsed" [class.px-4]="!collapsed">
          <h2
            *ngIf="!collapsed"
            class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap overflow-hidden"
          >
            Configuration
          </h2>
          <div class="space-y-0.5">
            <a
              href="#"
              class="flex items-center py-1.5 rounded-md hover:bg-sidebar-hover group transition-colors relative"
              [class.px-2]="!collapsed"
              [class.justify-center]="collapsed"
              [title]="collapsed ? 'Settings' : ''"
            >
              <svg
                class="h-5 w-5 opacity-70 group-hover:opacity-100 transition-all flex-shrink-0"
                [class.mr-3]="!collapsed"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span
                class="whitespace-nowrap overflow-hidden transition-all duration-300"
                [class.w-0]="collapsed"
                [class.opacity-0]="collapsed"
                [class.ml-0]="collapsed"
                [class.w-auto]="!collapsed"
                [class.opacity-100]="!collapsed"
                [class.ml-3]="!collapsed"
                >Settings</span
              >
            </a>
          </div>
        </div>
      </div>

      <!-- User Profile / Logout -->
      <div class="p-4 border-t border-sidebar-border" [class.px-2]="collapsed">
        <button
          (click)="signOut()"
          class="flex w-full items-center py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-sidebar-hover transition-colors group"
          [class.justify-center]="collapsed"
          [class.px-2]="!collapsed"
          [title]="collapsed ? 'Sign Out' : ''"
        >
          <svg
            class="h-5 w-5 flex-shrink-0 transition-all group-hover:text-red-400"
            [class.mr-3]="!collapsed"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span
            *ngIf="!collapsed"
            class="whitespace-nowrap overflow-hidden group-hover:text-red-400"
            >Sign Out</span
          >
        </button>
      </div>
    </nav>
  `,
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  toggleCollapse() {
    this.toggle.emit();
  }

  signOut() {
    this.auth.signOut();
  }
}
