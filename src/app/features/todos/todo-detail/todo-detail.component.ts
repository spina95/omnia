import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  signal,
  computed,
  inject,
  ViewChild,
  TemplateRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TodosService, TodoList, TodoTask } from '../../../core/services/todos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderService } from '../../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../../core/services/page-header-actions.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { AddTodoListDialogComponent } from '../add-todo-list-dialog/add-todo-list-dialog.component';

@Component({
  selector: 'app-todo-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ConfirmationDialogComponent,
    CheckboxComponent,
    AddTodoListDialogComponent,
  ],
  templateUrl: './todo-detail.component.html',
  styleUrls: ['./todo-detail.component.css'],
})
export class TodoDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;

  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  todoList = signal<TodoList | null>(null);
  tasks = signal<TodoTask[]>([]);

  loading = signal(false);
  newTaskTitle = signal('');
  addingTask = signal(false);

  showEditDialog = signal(false);
  showDeleteListConfirmation = signal(false);
  showDeleteTaskConfirmation = signal(false);
  taskToDelete = signal<TodoTask | null>(null);

  listId = computed(() => this.route.snapshot.paramMap.get('id'));

  constructor(
    private todosService: TodosService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const id = this.listId();
    if (id) {
      await this.loadList(id);
      await this.loadTasks(id);
    } else {
      this.router.navigate(['/todos']);
    }
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.pageHeaderActionsService.clearActions();
  }

  async loadList(id: string) {
    this.loading.set(true);
    const list = await this.todosService.getListById(id);

    if (list) {
      this.todoList.set(list);
      this.pageHeaderService.setHeader(list.title);
    } else {
      this.notificationService.error('Todo list not found');
      this.router.navigate(['/todos']);
    }

    this.loading.set(false);
    this.cdr.detectChanges();
  }

  async loadTasks(listId: string) {
    const tasks = await this.todosService.getTasks(listId);
    this.tasks.set(tasks);
    this.cdr.detectChanges();
  }

  async onAddTask() {
    const title = this.newTaskTitle().trim();
    if (!title) {
      this.notificationService.error('Task title is required');
      return;
    }

    const list = this.todoList();
    if (!list) return;

    this.addingTask.set(true);

    // Get the max order_index
    const maxOrder = this.tasks().reduce((max, task) => Math.max(max, task.order_index), -1);

    const task = await this.todosService.createTask({
      list_id: list.id,
      title,
      completed: false,
      order_index: maxOrder + 1,
    });

    this.addingTask.set(false);

    if (task) {
      this.newTaskTitle.set('');
      await this.loadTasks(list.id);
      this.notificationService.success('Task added successfully');
    } else {
      this.notificationService.error('Failed to add task');
    }
  }

  async onToggleCompleted(task: TodoTask) {
    const success = await this.todosService.toggleTaskCompleted(task.id, !task.completed);

    if (success) {
      // Update local state
      this.tasks.update((tasks) =>
        tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
      this.cdr.detectChanges();
    } else {
      this.notificationService.error('Failed to update task');
    }
  }

  confirmDeleteTask(task: TodoTask, event: Event) {
    event.stopPropagation();
    this.taskToDelete.set(task);
    this.showDeleteTaskConfirmation.set(true);
  }

  async onDeleteTaskConfirmed() {
    const task = this.taskToDelete();
    if (!task) return;

    const success = await this.todosService.deleteTask(task.id);

    if (success) {
      const list = this.todoList();
      if (list) {
        await this.loadTasks(list.id);
      }
      this.notificationService.success('Task deleted successfully');
    } else {
      this.notificationService.error('Failed to delete task');
    }

    this.showDeleteTaskConfirmation.set(false);
    this.taskToDelete.set(null);
  }

  onDeleteTaskCancelled() {
    this.showDeleteTaskConfirmation.set(false);
    this.taskToDelete.set(null);
  }

  async onTaskDrop(event: CdkDragDrop<TodoTask[]>) {
    const list = this.todoList();
    if (!list) return;

    const tasks = [...this.tasks()];
    moveItemInArray(tasks, event.previousIndex, event.currentIndex);

    // Update local state immediately for smooth UX
    this.tasks.set(tasks);

    // Update order_index in database
    const taskIds = tasks.map((t) => t.id);
    const success = await this.todosService.reorderTasks(list.id, taskIds);

    if (!success) {
      this.notificationService.error('Failed to reorder tasks');
      // Reload to restore correct order
      await this.loadTasks(list.id);
    }
  }

  openEditDialog() {
    this.showEditDialog.set(true);
  }

  closeEditDialog() {
    this.showEditDialog.set(false);
  }

  async onSaveDialog() {
    const list = this.todoList();
    if (list) {
      await this.loadList(list.id);
    }
  }

  confirmDeleteList() {
    this.showDeleteListConfirmation.set(true);
  }

  async onDeleteListConfirmed() {
    const list = this.todoList();
    if (!list) return;

    const success = await this.todosService.deleteList(list.id);

    if (success) {
      this.notificationService.success('Todo list deleted successfully');
      this.router.navigate(['/todos']);
    } else {
      this.notificationService.error('Failed to delete todo list');
    }

    this.showDeleteListConfirmation.set(false);
  }

  onDeleteListCancelled() {
    this.showDeleteListConfirmation.set(false);
  }

  goBack() {
    this.router.navigate(['/todos']);
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

  getCompletedCount(): number {
    return this.tasks().filter((t) => t.completed).length;
  }

  getTotalCount(): number {
    return this.tasks().length;
  }

  getProgressPercentage(): number {
    const total = this.getTotalCount();
    if (total === 0) return 0;
    return Math.round((this.getCompletedCount() / total) * 100);
  }
}
