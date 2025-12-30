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
import { Router } from '@angular/router';
import { PlannerService } from '../../../core/services/planner.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import { SearchResult, TagStats, PlannerHelpers } from '../../../core/models/planner.models';

@Component({
  selector: 'app-search-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-view.component.html',
  styleUrls: ['./search-view.component.css'],
})
export class SearchViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private plannerService = inject(PlannerService);
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  // State
  allTags = signal<TagStats[]>([]);
  selectedTags = signal<string[]>([]);
  searchMode = signal<'AND' | 'OR'>('OR');
  searchResults = signal<SearchResult[]>([]);
  loading = signal(false);
  loadingTags = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = 12;
  total = signal(0);

  // Search input
  tagSearchQuery = signal('');

  // Computed
  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));
  startItem = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize, this.total()));

  filteredTags = computed(() => {
    const query = this.tagSearchQuery().toLowerCase().trim();
    if (!query) return this.allTags();
    return this.allTags().filter((t) => t.tag.toLowerCase().includes(query));
  });

  topTags = computed(() => {
    return this.allTags().slice(0, 20); // Show top 20 most used tags
  });

  hasSelectedTags = computed(() => this.selectedTags().length > 0);

  async ngOnInit() {
    this.pageHeaderService.setHeader('Cerca nei Journal');
    await this.loadAllTags();
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.pageHeaderActionsService.clearActions();
  }

  async loadAllTags() {
    this.loadingTags.set(true);
    const tags = await this.plannerService.getAllTags();
    this.allTags.set(tags);
    this.loadingTags.set(false);
  }

  toggleTag(tag: string) {
    const normalized = PlannerHelpers.normalizeTag(tag);
    const current = this.selectedTags();

    if (current.includes(normalized)) {
      this.selectedTags.set(current.filter((t) => t !== normalized));
    } else {
      this.selectedTags.set([...current, normalized]);
    }

    // Auto-search when tags change
    if (this.selectedTags().length > 0) {
      this.currentPage.set(1);
      this.search();
    } else {
      // Clear results when no tags selected
      this.searchResults.set([]);
      this.total.set(0);
    }
  }

  clearSelectedTags() {
    this.selectedTags.set([]);
    this.searchResults.set([]);
    this.total.set(0);
    this.currentPage.set(1);
  }

  toggleSearchMode() {
    this.searchMode.update((mode) => (mode === 'AND' ? 'OR' : 'AND'));
    if (this.hasSelectedTags()) {
      this.currentPage.set(1);
      this.search();
    }
  }

  async search() {
    if (this.selectedTags().length === 0) return;

    this.loading.set(true);

    const { results, total } = await this.plannerService.searchByTags({
      tags: this.selectedTags(),
      mode: this.searchMode(),
      page: this.currentPage(),
      pageSize: this.pageSize,
    });

    this.searchResults.set(results);
    this.total.set(total);
    this.loading.set(false);
  }

  goToDay(result: SearchResult) {
    this.router.navigate(['/planner/day', result.dayEntry.entry_date]);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.search();
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.search();
    }
  }

  formatDate(dateString: string): string {
    const date = PlannerHelpers.parseDate(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  goBack() {
    this.router.navigate(['/planner/today']);
  }
}
