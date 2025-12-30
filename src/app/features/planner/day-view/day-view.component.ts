import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PlannerService } from '../../../core/services/planner.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import { DayEntry, DayTask, TaskStatus, PlannerHelpers } from '../../../core/models/planner.models';
import { CalendarDialogComponent } from '../calendar-dialog/calendar-dialog.component';

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, RouterLink, CalendarDialogComponent],
  templateUrl: './day-view.component.html',
  styleUrls: ['./day-view.component.css'],
})
export class DayViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private notificationService = inject(NotificationService);
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  // Calendar dialog state
  showCalendarDialog = signal(false);

  // State
  currentDate = signal<string>(PlannerHelpers.getToday());
  dayEntry = signal<DayEntry | null>(null);
  loading = signal(false);
  savingJournal = signal(false);

  // Task management
  newTaskText = signal('');
  editingTaskId = signal<string | null>(null);
  editingTaskText = signal('');

  // Journal state
  freeText = signal('');
  wentWell = signal('');
  challenges = signal('');
  takeaway = signal('');
  selectedMood = signal<string | null>(null);
  tagInput = signal('');
  currentTags = signal<string[]>([]);

  // UI state
  showGuidedJournal = signal(false);

  // Navigation state
  hasPreviousEntry = signal(false);
  hasNextEntry = signal(false);

  // Computed
  tasks = computed(() => {
    const entry = this.dayEntry();
    if (!entry || !entry.tasks) return [];
    return [...entry.tasks].sort((a, b) => a.task_order - b.task_order);
  });

  todoTasks = computed(() => this.tasks().filter((t) => t.status === 'todo'));
  doneTasks = computed(() => this.tasks().filter((t) => t.status === 'done'));
  postponedTasks = computed(() => this.tasks().filter((t) => t.status === 'postponed'));

  formattedDate = computed(() => {
    const date = PlannerHelpers.parseDate(this.currentDate());
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  moods = [
    { value: 'great', emoji: '😊', label: 'Great' },
    { value: 'good', emoji: '🙂', label: 'Good' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'bad', emoji: '😔', label: 'Bad' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'angry', emoji: '😠', label: 'Angry' },
    { value: 'stressed', emoji: '😰', label: 'Stressed' },
  ];

  private autoSaveTimeout: any = null;

  async ngOnInit() {
    // Get date from route or use today
    this.route.paramMap.subscribe((params) => {
      const dateParam = params.get('date');
      if (dateParam && PlannerHelpers.isValidDateString(dateParam)) {
        this.currentDate.set(dateParam);
      } else {
        this.currentDate.set(PlannerHelpers.getToday());
      }
      this.loadDayEntry();
    });

    this.pageHeaderService.setHeader('Planner & Journal');
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.pageHeaderActionsService.clearActions();
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  }

  async loadDayEntry() {
    this.loading.set(true);
    const entry = await this.plannerService.getDayEntry(this.currentDate());

    if (entry) {
      this.dayEntry.set(entry);

      // Load journal data
      if (entry.journal) {
        this.freeText.set(entry.journal.free_text || '');
        this.wentWell.set(entry.journal.went_well || '');
        this.challenges.set(entry.journal.challenges || '');
        this.takeaway.set(entry.journal.takeaway || '');
        this.currentTags.set(entry.journal.tags || []);
      } else {
        this.resetJournalFields();
      }

      // Load mood
      this.selectedMood.set(entry.mood);
    }

    // Check for previous and next entries
    await this.checkNavigationAvailability();

    this.loading.set(false);
  }

  // ==================== DATE NAVIGATION ====================

  async checkNavigationAvailability() {
    // Check if there's a previous entry
    const previousDate = await this.plannerService.getNearestDayWithEntries(
      this.currentDate(),
      'previous',
      1
    );
    this.hasPreviousEntry.set(!!previousDate);

    // Check if there's a next entry
    const nextDate = await this.plannerService.getNearestDayWithEntries(
      this.currentDate(),
      'next',
      1
    );
    this.hasNextEntry.set(!!nextDate);
  }

  async goToPreviousDay() {
    // Find the nearest previous day with entries
    const previousDate = await this.plannerService.getNearestDayWithEntries(
      this.currentDate(),
      'previous'
    );

    if (previousDate) {
      this.router.navigate(['/planner/day', previousDate]);
    } else {
      this.notificationService.info('No previous entries found');
    }
  }

  async goToNextDay() {
    // Find the nearest next day with entries
    const nextDate = await this.plannerService.getNearestDayWithEntries(this.currentDate(), 'next');

    if (nextDate) {
      this.router.navigate(['/planner/day', nextDate]);
    } else {
      this.notificationService.info('No next entries found');
    }
  }

  goToToday() {
    this.router.navigate(['/planner/today']);
  }

  openCalendarDialog() {
    this.showCalendarDialog.set(true);
  }

  closeCalendarDialog() {
    this.showCalendarDialog.set(false);
  }

  // ==================== TASK MANAGEMENT ====================

  async addTask() {
    const text = this.newTaskText().trim();
    if (!text || !this.dayEntry()) return;

    const entry = this.dayEntry()!;
    const task = await this.plannerService.createTask(entry.id, {
      text,
      status: 'todo',
      task_order: this.tasks().length,
    });

    if (task) {
      this.dayEntry.update((e) => {
        if (!e) return e;
        return {
          ...e,
          tasks: [...(e.tasks || []), task],
        };
      });
      this.newTaskText.set('');
    } else {
      this.notificationService.error('Error creating task');
    }
  }

  async toggleTaskStatus(task: DayTask) {
    const newStatus: TaskStatus = task.status === 'todo' ? 'done' : 'todo';
    const success = await this.plannerService.updateTask(task.id, { status: newStatus });

    if (success) {
      this.dayEntry.update((e) => {
        if (!e || !e.tasks) return e;
        return {
          ...e,
          tasks: e.tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
        };
      });
    } else {
      this.notificationService.error('Error updating task');
    }
  }

  async markAsPostponed(task: DayTask) {
    const success = await this.plannerService.updateTask(task.id, { status: 'postponed' });

    if (success) {
      this.dayEntry.update((e) => {
        if (!e || !e.tasks) return e;
        return {
          ...e,
          tasks: e.tasks.map((t) => (t.id === task.id ? { ...t, status: 'postponed' } : t)),
        };
      });
    } else {
      this.notificationService.error('Error updating task');
    }
  }

  startEditTask(task: DayTask) {
    this.editingTaskId.set(task.id);
    this.editingTaskText.set(task.text);
  }

  cancelEditTask() {
    this.editingTaskId.set(null);
    this.editingTaskText.set('');
  }

  async saveEditTask(task: DayTask) {
    const newText = this.editingTaskText().trim();
    if (!newText) return;

    const success = await this.plannerService.updateTask(task.id, { text: newText });

    if (success) {
      this.dayEntry.update((e) => {
        if (!e || !e.tasks) return e;
        return {
          ...e,
          tasks: e.tasks.map((t) => (t.id === task.id ? { ...t, text: newText } : t)),
        };
      });
      this.editingTaskId.set(null);
      this.editingTaskText.set('');
    } else {
      this.notificationService.error('Error updating task');
    }
  }

  async deleteTask(task: DayTask) {
    if (!confirm('Eliminare questo task?')) return;

    const success = await this.plannerService.deleteTask(task.id);

    if (success) {
      this.dayEntry.update((e) => {
        if (!e || !e.tasks) return e;
        return {
          ...e,
          tasks: e.tasks.filter((t) => t.id !== task.id),
        };
      });
    } else {
      this.notificationService.error('Error deleting task');
    }
  }

  async onTaskDrop(event: CdkDragDrop<DayTask[]>) {
    const tasksList = this.tasks();
    moveItemInArray(tasksList, event.previousIndex, event.currentIndex);

    // Update orders
    const updates = tasksList.map((task, index) => ({
      id: task.id,
      task_order: index,
    }));

    const success = await this.plannerService.updateTaskOrders(updates);

    if (success) {
      this.dayEntry.update((e) => {
        if (!e) return e;
        return {
          ...e,
          tasks: tasksList,
        };
      });
    } else {
      this.notificationService.error('Error reordering tasks');
      // Reload to revert
      this.loadDayEntry();
    }
  }

  // ==================== MOOD ====================

  async selectMood(mood: string | null) {
    if (!this.dayEntry()) return;

    this.selectedMood.set(mood);

    const success = await this.plannerService.updateDayEntry(this.dayEntry()!.id, { mood });

    if (!success) {
      this.notificationService.error('Error saving mood');
    }
  }

  // ==================== JOURNAL ====================

  onJournalChange() {
    // Trigger auto-save with debounce
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveJournal();
    }, 1000);
  }

  async saveJournal() {
    if (!this.dayEntry() || this.savingJournal()) return;

    this.savingJournal.set(true);

    const success = await this.plannerService.updateJournal(this.dayEntry()!.id, {
      free_text: this.freeText() || null,
      went_well: this.wentWell() || null,
      challenges: this.challenges() || null,
      takeaway: this.takeaway() || null,
      tags: this.currentTags(),
    });

    this.savingJournal.set(false);

    if (!success) {
      this.notificationService.error('Error saving journal');
    }
  }

  // ==================== TAGS ====================

  addTag() {
    const tag = this.tagInput().trim();
    if (!tag) return;

    const normalized = PlannerHelpers.normalizeTag(tag);

    if (!this.currentTags().includes(normalized)) {
      this.currentTags.update((tags) => [...tags, normalized]);
      this.tagInput.set('');
      this.saveJournal();
    } else {
      this.tagInput.set('');
    }
  }

  removeTag(tag: string) {
    this.currentTags.update((tags) => tags.filter((t) => t !== tag));
    this.saveJournal();
  }

  onTagKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  // ==================== HELPERS ====================

  private resetJournalFields() {
    this.freeText.set('');
    this.wentWell.set('');
    this.challenges.set('');
    this.takeaway.set('');
    this.currentTags.set([]);
  }

  toggleGuidedJournal() {
    this.showGuidedJournal.update((v) => !v);
  }
}
