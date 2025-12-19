import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FabComponent } from '../../../shared/components/fab/fab.component';
import { ExpenseDialogComponent } from '../../../shared/components/expense-dialog/expense-dialog.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { PageHeaderComponent } from '../../../core/components/page-header/page-header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    FabComponent,
    ExpenseDialogComponent,
    ToastComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="flex h-screen bg-background overflow-hidden">
      <!-- Mobile Overlay -->
      <div
        *ngIf="isMobileMenuOpen()"
        class="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        (click)="toggleMobileMenu()"
      ></div>

      <!-- Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:flex flex-shrink-0 bg-sidebar border-r border-sidebar-border"
        [class.-translate-x-full]="!isMobileMenuOpen()"
        [class.translate-x-0]="isMobileMenuOpen()"
        [class.w-64]="!isDesktopSidebarCollapsed()"
        [class.w-20]="isDesktopSidebarCollapsed()"
      >
        <app-sidebar
          [collapsed]="isDesktopSidebarCollapsed()"
          (toggle)="toggleDesktopSidebar()"
        ></app-sidebar>
      </aside>

      <!-- Main Content Wrapper -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <!-- Mobile Header -->
        <header
          class="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border"
        >
          <button (click)="toggleMobileMenu()" class="text-zinc-400 hover:text-white">
            <span class="sr-only">Open menu</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span class="text-lg font-bold text-white">Omnia</span>
          <div class="w-6"></div>
          <!-- Spacer -->
        </header>

        <!-- Page Header -->
        <app-page-header></app-page-header>

        <!-- Main Content -->
        <main class="flex-1 overflow-auto bg-background relative">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
            <router-outlet></router-outlet>
          </div>

          <!-- Floating Action Button for Mobile -->
          <app-fab (openExpenseDialog)="onOpenExpenseDialog()"></app-fab>

          <!-- Expense Dialog -->
          <app-expense-dialog
            [isOpen]="isExpenseDialogOpen()"
            (closeDialog)="onCloseExpenseDialog()"
          ></app-expense-dialog>
          <!-- Toasts -->
          <app-toast></app-toast>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  isMobileMenuOpen = signal(false);
  isDesktopSidebarCollapsed = signal(false);
  isExpenseDialogOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update((v) => !v);
  }

  toggleDesktopSidebar() {
    this.isDesktopSidebarCollapsed.update((v) => !v);
  }

  onOpenExpenseDialog() {
    this.isExpenseDialogOpen.set(true);
  }

  onCloseExpenseDialog() {
    this.isExpenseDialogOpen.set(false);
  }
}
