import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannerService } from '../../../core/services/planner.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import { DayEntry, PlannerHelpers } from '../../../core/models/planner.models';

@Component({
  selector: 'app-journal-full-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-full-view.component.html',
  styleUrls: ['./journal-full-view.component.css'],
})
export class JournalFullViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private notificationService = inject(NotificationService);
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  // State
  currentDate = signal<string>(PlannerHelpers.getToday());
  dayEntry = signal<DayEntry | null>(null);
  loading = signal(false);
  savingJournal = signal(false);

  // Journal state
  freeText = signal('');
  wentWell = signal('');
  challenges = signal('');
  takeaway = signal('');
  tagInput = signal('');
  currentTags = signal<string[]>([]);

  // UI state
  showGuidedJournal = signal(false);

  // Computed
  formattedDate = computed(() => {
    const date = PlannerHelpers.parseDate(this.currentDate());
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  private autoSaveTimeout: any = null;

  async ngOnInit() {
    // Get date from route
    this.route.paramMap.subscribe((params) => {
      const dateParam = params.get('date');
      if (dateParam && PlannerHelpers.isValidDateString(dateParam)) {
        this.currentDate.set(dateParam);
      } else {
        this.currentDate.set(PlannerHelpers.getToday());
      }
      this.loadDayEntry();
    });

    this.pageHeaderService.setHeader(this.formattedDate());
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
    }

    this.loading.set(false);
  }

  goBack() {
    this.router.navigate(['/planner/day', this.currentDate()]);
  }

  onSearchJournals() {
    // TODO: implement search journals dialog or navigation
    this.notificationService.info('Search journals clicked');
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
