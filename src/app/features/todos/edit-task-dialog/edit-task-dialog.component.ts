import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';
import { TodoTask } from '../../../core/services/todos.service';

@Component({
  selector: 'app-edit-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './edit-task-dialog.component.html',
  styleUrls: ['./edit-task-dialog.component.css'],
})
export class EditTaskDialogComponent implements OnInit {
  @Input() task: TodoTask | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Partial<TodoTask>>();

  title = '';
  priority: string | null = null;
  category: string = 'task';

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

  ngOnInit(): void {
    if (this.task) {
      this.title = this.task.title || '';
      this.priority = this.task.priority || null;
      this.category = this.task.category || 'task';
    }
  }

  onDialogPriorityChange(value: string | number | null) {
    this.priority = value as string | null;
  }

  onDialogCategoryChange(value: string | number | null) {
    this.category = value as string;
  }

  onCancel() {
    this.close.emit();
  }

  onSave() {
    const updates: Partial<TodoTask> = {
      title: this.title.trim(),
      priority: (this.priority as any) || undefined,
      category: this.category as any,
    };

    this.saved.emit(updates);
    this.close.emit();
  }
}
