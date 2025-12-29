import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodosService, TodoList } from '../../../core/services/todos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SelectComponent } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-add-todo-list-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './add-todo-list-dialog.component.html',
  styleUrls: ['./add-todo-list-dialog.component.css'],
})
export class AddTodoListDialogComponent implements OnInit {
  @Input() todoList: TodoList | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  title = signal('');
  description = signal('');
  priority = signal<string | null>(null);
  dueDate = signal('');

  loading = signal(false);

  isEditMode = computed(() => this.todoList !== null);

  priorityOptions = [
    { value: null, label: 'No Priority' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  constructor(
    private todosService: TodosService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    if (this.todoList) {
      this.title.set(this.todoList.title);
      this.description.set(this.todoList.description || '');
      this.priority.set(this.todoList.priority || null);

      // Convert ISO date to date format if exists
      if (this.todoList.due_date) {
        const date = new Date(this.todoList.due_date);
        const localDate = this.formatDateForInput(date);
        this.dueDate.set(localDate);
      }
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async onSave() {
    // Validation
    if (!this.title().trim()) {
      this.notificationService.error('Title is required');
      return;
    }

    this.loading.set(true);

    const listData: Partial<TodoList> = {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      priority: this.priority() as 'low' | 'medium' | 'high' | undefined,
      due_date: this.dueDate() || undefined,
    };

    let success = false;
    if (this.isEditMode()) {
      success = await this.todosService.updateList(this.todoList!.id, listData);
      if (success) {
        this.notificationService.success('Todo list updated successfully');
      }
    } else {
      const result = await this.todosService.createList(listData);
      success = result !== null;
      if (success) {
        this.notificationService.success('Todo list created successfully');
      }
    }

    this.loading.set(false);

    if (success) {
      this.save.emit();
      this.onClose();
    } else {
      this.notificationService.error('Failed to save todo list');
    }
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getPriorityColor(priority: string | null): string {
    switch (priority) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-zinc-400';
    }
  }

  getPriorityBgColor(priority: string | null): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-zinc-800/50 border-zinc-700';
    }
  }
}
