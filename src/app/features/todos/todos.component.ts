import {
  Component,
  OnInit,
  ChangeDetectorRef,
  signal,
  computed,
  inject,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TodosService, TodoList } from '../../core/services/todos.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../core/services/page-header-actions.service';
import { SelectComponent } from '../../shared/components/select/select.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { AddTodoListDialogComponent } from './add-todo-list-dialog/add-todo-list-dialog.component';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectComponent,
    ConfirmationDialogComponent,
    AddTodoListDialogComponent,
  ],
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.css'],
})
export class TodosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private router = inject(Router);

  todoLists = signal<TodoList[]>([]);

  searchQuery = signal('');
  selectedPriority = signal<string | null>(null);

  currentPage = signal(1);
  pageSize = 12;
  totalLists = signal(0);

  loading = signal(false);
  showAddDialog = signal(false);
  showDeleteConfirmation = signal(false);
  editingList = signal<TodoList | null>(null);
  listToDelete = signal<TodoList | null>(null);

  totalPages = computed(() => Math.ceil(this.totalLists() / this.pageSize));

  startItem = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize, this.totalLists()));

  priorityOptions = [
    { value: null, label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  constructor(
    private todosService: TodosService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.pageHeaderService.setHeader('Todo Lists');
    this.loadLists();
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.pageHeaderActionsService.clearActions();
  }

  async loadLists() {
    this.loading.set(true);

    const { lists, total } = await this.todosService.getLists({
      search: this.searchQuery() || undefined,
      priority: this.selectedPriority(),
      page: this.currentPage(),
      pageSize: this.pageSize,
    });

    this.todoLists.set(lists);
    this.totalLists.set(total);
    this.loading.set(false);
    this.cdr.detectChanges();
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadLists();
  }

  onPriorityChange(priority: string | null) {
    this.selectedPriority.set(priority === 'all' ? null : priority);
    this.currentPage.set(1);
    this.loadLists();
  }

  openAddDialog() {
    this.editingList.set(null);
    this.showAddDialog.set(true);
  }

  openEditDialog(list: TodoList, event: Event) {
    event.stopPropagation();
    this.editingList.set(list);
    this.showAddDialog.set(true);
  }

  closeAddDialog() {
    this.showAddDialog.set(false);
    this.editingList.set(null);
  }

  onSaveDialog() {
    this.loadLists();
  }

  confirmDelete(list: TodoList, event: Event) {
    event.stopPropagation();
    this.listToDelete.set(list);
    this.showDeleteConfirmation.set(true);
  }

  async onDeleteConfirmed() {
    const list = this.listToDelete();
    if (!list) return;

    const success = await this.todosService.deleteList(list.id);

    if (success) {
      this.notificationService.success('Todo list deleted successfully');
      this.loadLists();
    } else {
      this.notificationService.error('Failed to delete todo list');
    }

    this.showDeleteConfirmation.set(false);
    this.listToDelete.set(null);
  }

  onDeleteCancelled() {
    this.showDeleteConfirmation.set(false);
    this.listToDelete.set(null);
  }

  openListDetail(list: TodoList) {
    this.router.navigate(['/todos', list.id]);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadLists();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadLists();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadLists();
    }
  }

  // Helper methods for UI
  getPriorityBadgeClass(priority?: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  }

  getPriorityLabel(priority?: string): string {
    if (!priority) return 'No Priority';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  getDueDateBadgeClass(dueDate?: string): string {
    if (!dueDate) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'bg-red-500/20 text-red-400 border-red-500/30'; // overdue
    if (diffDays === 0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'; // today
    if (diffDays <= 3) return 'bg-brand/20 text-brand border-brand/30'; // upcoming
    return 'bg-zinc-800 text-zinc-400 border-zinc-700'; // future
  }

  getDueDateLabel(dueDate?: string): string {
    if (!dueDate) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`;
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays}d`;

    return due.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getProgressPercentage(list: TodoList): number {
    if (!list.totalTasksCount || list.totalTasksCount === 0) return 0;
    return Math.round((list.completedTasksCount! / list.totalTasksCount) * 100);
  }

  getProgressBarColor(percentage: number): string {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-brand';
    if (percentage > 0) return 'bg-yellow-500';
    return 'bg-zinc-700';
  }
}
