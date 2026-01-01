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
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { AddTodoListDialogComponent } from '../add-todo-list-dialog/add-todo-list-dialog.component';
import { EditTaskDialogComponent } from '../edit-task-dialog/edit-task-dialog.component';

@Component({
  selector: 'app-todo-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ConfirmationDialogComponent,
    CheckboxComponent,
    SelectComponent,
    AddTodoListDialogComponent,
    EditTaskDialogComponent,
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
  newTaskPriority = signal<string | null>('medium');
  newTaskCategory = signal<string>('task');
  addingTask = signal(false);

  sortOrder = signal<'none' | 'priority-asc' | 'priority-desc'>('none');

  showEditDialog = signal(false);
  showDeleteListConfirmation = signal(false);
  showDeleteTaskConfirmation = signal(false);
  taskToDelete = signal<TodoTask | null>(null);
  showEditTaskDialog = signal(false);
  editingTaskForDialog = signal<TodoTask | null>(null);
  editingTaskId = signal<string | null>(null);
  editingTaskTitle = signal('');

  priorityOptions: SelectOption[] = [
    { value: null, label: 'No Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  categoryOptions: SelectOption[] = [
    { value: 'task', label: 'Task' },
    { value: 'idea', label: 'Idea' },
    { value: 'optional', label: 'Optional' },
  ];

  sortOptions: SelectOption[] = [
    { value: 'none', label: 'Default Order' },
    { value: 'priority-asc', label: 'Priority Low to High' },
    { value: 'priority-desc', label: 'Priority High to Low' },
  ];

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
    this.applySorting();
    this.cdr.detectChanges();
  }

  applySorting() {
    const order = this.sortOrder();

    const priorityValues = { high: 3, medium: 2, low: 1, undefined: 0 };

    this.tasks.update((tasks) => {
      // Always put incomplete tasks first, completed tasks at the end
      const incomplete = tasks.filter((t) => !t.completed);
      const completed = tasks.filter((t) => t.completed);

      const sortByPriority = (arr: TodoTask[]) => {
        return arr.sort((a, b) => {
          const priorityA = priorityValues[a.priority || 'undefined'];
          const priorityB = priorityValues[b.priority || 'undefined'];
          if (order === 'priority-desc') return priorityB - priorityA;
          if (order === 'priority-asc') return priorityA - priorityB;
          return 0;
        });
      };

      if (order === 'priority-asc' || order === 'priority-desc') {
        sortByPriority(incomplete);
        sortByPriority(completed);
      }

      return [...incomplete, ...completed];
    });
  }

  setSortOrder(order: 'none' | 'priority-asc' | 'priority-desc') {
    this.sortOrder.set(order);
    this.applySorting();
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
      priority: this.newTaskPriority() as 'low' | 'medium' | 'high' | undefined,
      category: this.newTaskCategory() as 'optional' | 'task' | 'idea',
    });

    this.addingTask.set(false);

    if (task) {
      this.newTaskTitle.set('');
      this.newTaskPriority.set('medium');
      this.newTaskCategory.set('task');
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

  startEditingTask(task: TodoTask, event: Event) {
    event.stopPropagation();
    this.editingTaskId.set(task.id);
    this.editingTaskTitle.set(task.title);
  }

  async saveTaskEdit(task: TodoTask) {
    const newTitle = this.editingTaskTitle().trim();
    if (!newTitle) {
      this.notificationService.error('Task title cannot be empty');
      this.cancelTaskEdit();
      return;
    }

    if (newTitle === task.title) {
      this.cancelTaskEdit();
      return;
    }

    const success = await this.todosService.updateTask(task.id, { title: newTitle });

    if (success) {
      this.tasks.update((tasks) =>
        tasks.map((t) => (t.id === task.id ? { ...t, title: newTitle } : t))
      );
      this.notificationService.success('Task updated successfully');
      this.cancelTaskEdit();
      this.cdr.detectChanges();
    } else {
      this.notificationService.error('Failed to update task');
    }
  }

  cancelTaskEdit() {
    this.editingTaskId.set(null);
    this.editingTaskTitle.set('');
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

  // Task priority and category helpers
  getTaskPriorityBadgeClass(priority?: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    }
  }

  getTaskPriorityLabel(priority?: string): string {
    if (!priority) return 'No Priority';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  getTaskCategoryBadgeClass(category?: string): string {
    switch (category) {
      case 'task':
        return 'bg-brand/20 text-brand border-brand/30';
      case 'idea':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'optional':
        return 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30';
      default:
        return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    }
  }

  getTaskCategoryLabel(category?: string): string {
    if (!category) return 'Task';
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  onPriorityChange(value: string | number | null) {
    this.newTaskPriority.set(value as string | null);
  }

  onCategoryChange(value: string | number | null) {
    this.newTaskCategory.set(value as string);
  }

  onSortOrderChange(value: string | number | null) {
    this.setSortOrder(value as 'none' | 'priority-asc' | 'priority-desc');
  }

  async updateTaskPriority(task: TodoTask, priority: string | number | null) {
    const newPriority = priority === null ? undefined : (priority as 'low' | 'medium' | 'high');
    const success = await this.todosService.updateTask(task.id, { priority: newPriority });

    if (success) {
      this.tasks.update((tasks) =>
        tasks.map((t) => (t.id === task.id ? { ...t, priority: newPriority } : t))
      );
      this.notificationService.success('Task priority updated');
      this.cdr.detectChanges();
    } else {
      this.notificationService.error('Failed to update task priority');
    }
  }

  async updateTaskCategory(task: TodoTask, category: string | number | null) {
    const newCategory = category as 'optional' | 'task' | 'idea';
    const success = await this.todosService.updateTask(task.id, { category: newCategory });

    if (success) {
      this.tasks.update((tasks) =>
        tasks.map((t) => (t.id === task.id ? { ...t, category: newCategory } : t))
      );
      this.notificationService.success('Task category updated');
      this.cdr.detectChanges();
    } else {
      this.notificationService.error('Failed to update task category');
    }
  }

  openEditTaskDialog(task: TodoTask, event?: Event) {
    if (event) event.stopPropagation();
    this.editingTaskForDialog.set(task);
    this.showEditTaskDialog.set(true);
    this.cdr.detectChanges();
  }

  closeEditTaskDialog() {
    this.showEditTaskDialog.set(false);
    this.editingTaskForDialog.set(null);
  }

  async onTaskDialogSaved(updates: Partial<TodoTask>) {
    const task = this.editingTaskForDialog();
    if (!task) return;

    const success = await this.todosService.updateTask(task.id, updates);
    if (success) {
      this.tasks.update((tasks) => tasks.map((t) => (t.id === task.id ? { ...t, ...updates } : t)));
      this.notificationService.success('Task updated');
      this.cdr.detectChanges();
    } else {
      this.notificationService.error('Failed to update task');
    }

    this.closeEditTaskDialog();
  }
}
