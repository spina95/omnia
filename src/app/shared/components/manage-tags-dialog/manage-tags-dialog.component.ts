import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, ExpenseTag } from '../../../core/services/finance';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-manage-tags-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent],
  templateUrl: './manage-tags-dialog.component.html',
  styleUrls: ['./manage-tags-dialog.component.css'],
})
export class ManageTagsDialogComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  tags: ExpenseTag[] = [];
  newTagName = '';
  newTagColor = '';
  isCreating = false;
  isEditing = false;
  showDeleteConfirm = false;
  tagToDelete: ExpenseTag | null = null;
  editingTag: ExpenseTag | null = null;

  constructor(
    private financeService: FinanceService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTags();
  }

  async loadTags() {
    try {
      this.tags = await this.financeService.getTags();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to load tags');
    }
  }

  async createTag() {
    if (!this.newTagName.trim()) {
      this.notificationService.error('Tag name is required');
      return;
    }

    this.isCreating = true;
    try {
      await this.financeService.createTag(
        this.newTagName.trim(),
        this.newTagColor || undefined
      );
      this.notificationService.success('Tag created');
      this.newTagName = '';
      this.newTagColor = '';
      await this.loadTags();
      this.updated.emit();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to create tag');
    } finally {
      this.isCreating = false;
    }
  }

  startEdit(tag: ExpenseTag) {
    this.editingTag = { ...tag };
  }

  cancelEdit() {
    this.editingTag = null;
  }

  async saveEdit() {
    if (!this.editingTag) return;
    if (!this.editingTag.name.trim()) {
      this.notificationService.error('Tag name is required');
      return;
    }

    this.isEditing = true;
    try {
      await this.financeService.updateTag(
        this.editingTag.id,
        this.editingTag.name.trim(),
        this.editingTag.color
      );
      this.notificationService.success('Tag updated');
      this.editingTag = null;
      await this.loadTags();
      this.updated.emit();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to update tag');
    } finally {
      this.isEditing = false;
    }
  }

  confirmDelete(tag: ExpenseTag) {
    this.tagToDelete = tag;
    this.showDeleteConfirm = true;
  }

  async deleteTag() {
    if (!this.tagToDelete) return;

    try {
      await this.financeService.deleteTag(this.tagToDelete.id);
      this.notificationService.success('Tag deleted');
      this.showDeleteConfirm = false;
      this.tagToDelete = null;
      await this.loadTags();
      this.updated.emit();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to delete tag');
    }
  }

  close() {
    this.editingTag = null;
    this.closeDialog.emit();
  }

  getDeleteMessage(): string {
    if (!this.tagToDelete) return '';
    return `Are you sure you want to delete the tag "${this.tagToDelete.name}"? This will remove the tag from all expenses.`;
  }

  isEditingTag(tag: ExpenseTag): boolean {
    return this.editingTag?.id === tag.id;
  }
}
