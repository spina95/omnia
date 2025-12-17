import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../../../shared/components/select/select.component';
import { DocumentsService } from '../../../core/services/documents.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-upload-document-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './upload-document-dialog.component.html',
  styleUrls: ['./upload-document-dialog.component.css'],
})
export class UploadDocumentDialogComponent {
  @Input() isOpen: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  @Output() uploaded = new EventEmitter<void>();

  categories: any[] = [];
  categoriesOptions: { value: number | null; label: string }[] = [];
  selectedCategory: number | null = null;
  description = '';
  name = '';
  file: File | null = null;
  uploading = false;

  constructor(private documentsService: DocumentsService, private notificationService: NotificationService) {
    this.loadCategories();
  }

  async loadCategories() {
    this.categories = await this.documentsService.listCategories();
    this.categoriesOptions = [{ value: null, label: 'Uncategorized' }, ...this.categories.map((c: any) => ({ value: Number(c.id), label: c.name }))];
  }

  onCategoryModelChange(val: string | number | null) {
    console.debug('UploadDocumentDialog: ngModelChange selectedCategory =>', val);
    // ensure internal model stays numeric or null
    this.selectedCategory = val !== null && val !== undefined ? Number(val) : null;
  }

  onFileChange(e: any) {
    this.file = e.target.files?.[0] ?? null;
    if (this.file && !this.name) this.name = this.file.name;
  }

  async submit() {
    if (!this.file) return;
    this.uploading = true;
    try {
      const path = `${Date.now()}_${this.file.name}`;
      await this.documentsService.uploadFile(this.file, path);
      // Debug: ensure selectedCategory is what we expect
      console.debug('UploadDocumentDialog: selectedCategory (raw) =', this.selectedCategory);
      const categoryId = this.selectedCategory !== null && this.selectedCategory !== undefined ? Number(this.selectedCategory) : null;
      console.debug('UploadDocumentDialog: categoryId (coerced) =', categoryId);
      const created = await this.documentsService.createDocumentMetadata({
        name: this.name,
        description: this.description,
        storage_path: path,
        storage_bucket: 'documents',
        content_type: this.file.type,
        size: this.file.size,
        category_id: categoryId,
      });
      // Ensure category_id saved: call update endpoint to set it explicitly if needed
      if (created && created.id) {
        try {
          await this.documentsService.updateDocument(created.id, { category_id: categoryId });
        } catch (e: any) {
          console.debug('UploadDocumentDialog: updateDocument failed', e?.message || e);
        }
      }
      this.notificationService.success('Document uploaded');
      // Notify any listeners that documents changed
      window.dispatchEvent(new CustomEvent('documentsUpdated'));
      this.uploaded.emit();
      this.closeDialog.emit();
    } finally {
      this.uploading = false;
    }
  }

  close() {
    this.closeDialog.emit();
  }
}
