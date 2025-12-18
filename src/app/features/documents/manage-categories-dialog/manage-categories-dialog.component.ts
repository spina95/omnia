import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentsService } from '../../../core/services/documents.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-manage-categories-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationDialogComponent],
  templateUrl: './manage-categories-dialog.component.html',
  styleUrls: ['./manage-categories-dialog.component.css'],
})
export class ManageCategoriesDialogComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  categories: any[] = [];
  newCategoryName = '';
  newCategoryDescription = '';
  isCreating = false;
  showDeleteConfirm = false;
  categoryToDelete: any = null;

  constructor(
    private documentsService: DocumentsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      this.categories = await this.documentsService.listCategories();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to load categories');
    }
  }

  async createCategory() {
    if (!this.newCategoryName.trim()) {
      this.notificationService.error('Category name is required');
      return;
    }

    this.isCreating = true;
    try {
      await this.documentsService.createCategory({
        name: this.newCategoryName.trim(),
        description: this.newCategoryDescription.trim() || undefined,
      });
      this.notificationService.success('Category created');
      this.newCategoryName = '';
      this.newCategoryDescription = '';
      await this.loadCategories();
      this.updated.emit();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to create category');
    } finally {
      this.isCreating = false;
    }
  }

  confirmDelete(category: any) {
    this.categoryToDelete = category;
    this.showDeleteConfirm = true;
  }

  async deleteCategory() {
    if (!this.categoryToDelete) return;

    try {
      await this.documentsService.deleteCategory(this.categoryToDelete.id);
      this.notificationService.success('Category deleted');
      this.showDeleteConfirm = false;
      this.categoryToDelete = null;
      await this.loadCategories();
      this.updated.emit();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to delete category');
    }
  }

  close() {
    this.closeDialog.emit();
  }

  getDeleteMessage(): string {
    if (!this.categoryToDelete) return '';
    return `Are you sure you want to delete the category "${this.categoryToDelete.name}"? Documents in this category will not be deleted, but will become uncategorized.`;
  }
}
