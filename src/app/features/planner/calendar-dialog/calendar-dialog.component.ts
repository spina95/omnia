import { Component, signal, computed, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlannerService } from '../../../core/services/planner.service';

interface CalendarDay {
  date: Date;
  dateString: string;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEntries: boolean;
}

@Component({
  selector: 'app-calendar-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      (click)="closeDialog()"
    >
      <div
        class="bg-background-card border border-zinc-800 rounded-lg p-6 max-w-md w-full"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">Select a day</h3>
          <button
            (click)="closeDialog()"
            class="p-1 text-zinc-500 hover:text-white rounded transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Month Navigation -->
        <div class="flex items-center justify-between mb-4">
          <button
            (click)="previousMonth()"
            class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 class="text-base font-medium text-white">{{ monthYear() }}</h4>
          <button
            (click)="nextMonth()"
            class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Calendar Grid -->
        <div class="mb-4">
          <!-- Day headers -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <div
              *ngFor="let day of weekDays"
              class="text-center text-xs font-medium text-zinc-500 py-2"
            >
              {{ day }}
            </div>
          </div>

          <!-- Days -->
          <div class="grid grid-cols-7 gap-1">
            <button
              *ngFor="let day of calendarDays()"
              (click)="selectDay(day)"
              [disabled]="!day.isCurrentMonth"
              class="relative aspect-square flex items-center justify-center rounded-md text-sm transition-all"
              [class.text-zinc-600]="!day.isCurrentMonth"
              [class.text-zinc-300]="day.isCurrentMonth && !day.isToday"
              [class.text-white]="day.isCurrentMonth"
              [class.bg-brand]="day.isToday"
              [class.text-black]="day.isToday"
              [class.hover:bg-zinc-800]="day.isCurrentMonth && !day.isToday"
              [class.cursor-not-allowed]="!day.isCurrentMonth"
            >
              {{ day.day }}
              <div
                *ngIf="day.hasEntries"
                class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                [class.bg-brand]="!day.isToday"
                [class.bg-black]="day.isToday"
              ></div>
            </button>
          </div>
        </div>

        <!-- Legend -->
        <div
          class="flex items-center justify-center gap-4 text-xs text-zinc-400 pt-4 border-t border-zinc-800"
        >
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-brand"></div>
            <span>Has entries</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CalendarDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private router = inject(Router);
  private plannerService = inject(PlannerService);

  currentMonth = signal(new Date());
  daysWithEntries = signal<Set<string>>(new Set());
  loading = signal(true);

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthYear = computed(() => {
    const date = this.currentMonth();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  });

  calendarDays = computed(() => {
    const currentDate = this.currentMonth();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Days from previous month
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: CalendarDay[] = [];
    const daysSet = this.daysWithEntries();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        dateString: this.formatDate(date),
        day,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
        isToday: false,
        hasEntries: daysSet.has(this.formatDate(date)),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = this.formatDate(date);
      days.push({
        date,
        dateString: dateStr,
        day,
        month,
        year,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        hasEntries: daysSet.has(dateStr),
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dateString: this.formatDate(date),
        day,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
        isToday: false,
        hasEntries: daysSet.has(this.formatDate(date)),
      });
    }

    return days;
  });

  async ngOnInit() {
    await this.loadEntriesForMonth();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async loadEntriesForMonth() {
    this.loading.set(true);
    const month = this.currentMonth();

    try {
      const days = await this.plannerService.getDaysWithEntries(
        month.getFullYear(),
        month.getMonth() + 1
      );

      this.daysWithEntries.set(new Set(days));
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async previousMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    await this.loadEntriesForMonth();
  }

  async nextMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    await this.loadEntriesForMonth();
  }

  selectDay(day: CalendarDay) {
    if (!day.isCurrentMonth) return;

    this.close.emit();
    this.router.navigate(['/planner/day', day.dateString]);
  }

  closeDialog() {
    this.close.emit();
  }
}
