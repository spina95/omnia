import { Component, OnInit, signal, computed, inject, ViewChild, TemplateRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PlannerService } from '../../../core/services/planner.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import { NotificationService } from '../../../core/services/notification.service';

interface MoodDay {
  date: string;
  day: number;
  mood: string | null;
  emoji: string;
  color: string;
}

interface MonthData {
  name: string;
  year: number;
  month: number; // 0-11
  days: MoodDay[];
}

const MOOD_CONFIG: Record<
  string,
  { emoji: string; color: string; label: string }
> = {
  great: { emoji: '😊', color: '#22c55e', label: 'Great' },
  good: { emoji: '🙂', color: '#84cc16', label: 'Good' },
  neutral: { emoji: '😐', color: '#eab308', label: 'Neutral' },
  tired: { emoji: '😴', color: '#8b5cf6', label: 'Tired' },
  bad: { emoji: '😔', color: '#f97316', label: 'Bad' },
  angry: { emoji: '😠', color: '#ef4444', label: 'Angry' },
  stressed: { emoji: '😰', color: '#dc2626', label: 'Stressed' },
};

@Component({
  selector: 'app-mood-calendar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mood-calendar.component.html',
  styleUrl: './mood-calendar.component.css',
})
export class MoodCalendarComponent implements OnInit, AfterViewInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  loading = signal(false);
  monthsData = signal<MonthData[]>([]);

  async ngOnInit() {
    this.pageHeaderService.setHeader('Mood Calendar');
    await this.loadMoodData();
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.pageHeaderActionsService.clearActions();
  }

  async loadMoodData() {
    this.loading.set(true);

    try {
      // Calculate date range: last 12 months
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 11);
      startDate.setDate(1); // Start from first day of the month

      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      // Fetch mood history
      const moodHistory = await this.plannerService.getMoodHistory(
        startDateStr,
        endDateStr
      );

      // Create a map for quick lookup
      const moodMap = new Map<string, string>();
      moodHistory.forEach((entry) => {
        moodMap.set(entry.date, entry.mood);
      });

      // Build months data
      const months: MonthData[] = [];
      const currentDate = new Date(startDate);

      for (let i = 0; i < 12; i++) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days: MoodDay[] = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateStr = this.formatDate(date);
          const mood = moodMap.get(dateStr) || null;

          days.push({
            date: dateStr,
            day,
            mood,
            emoji: mood ? MOOD_CONFIG[mood]?.emoji || '' : '',
            color: mood ? MOOD_CONFIG[mood]?.color || '#4b5563' : '#27272a',
          });
        }

        months.push({
          name: this.getMonthName(month),
          year,
          month,
          days,
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      this.monthsData.set(months);
    } catch (error) {
      console.error('Error loading mood data:', error);
      this.notificationService.error('Error loading mood calendar');
    } finally {
      this.loading.set(false);
    }
  }

  navigateToDay(date: string) {
    this.router.navigate(['/planner/day', date]);
  }

  goBack() {
    this.router.navigate(['/planner/today']);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMonthName(month: number): string {
    const monthNames = [
      'Gen',
      'Feb',
      'Mar',
      'Apr',
      'Mag',
      'Giu',
      'Lug',
      'Ago',
      'Set',
      'Ott',
      'Nov',
      'Dic',
    ];
    return monthNames[month];
  }

  getMoodLabel(mood: string | null): string {
    if (!mood) return 'No mood';
    return MOOD_CONFIG[mood]?.label || mood;
  }
}
