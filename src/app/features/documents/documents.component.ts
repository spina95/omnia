import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentsService } from '../../core/services/documents.service';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { UploadDocumentDialogComponent } from './upload-document-dialog/upload-document-dialog.component';
import { AuthService } from '../../core/auth/auth';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { SelectComponent } from '../../shared/components/select/select.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent, UploadDocumentDialogComponent],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
})
export class DocumentsComponent implements OnInit, OnDestroy {
  categories: any[] = [];
  categoriesOptions: { value: number | null; label: string }[] = [];
  documents: any[] = [];
  selectedCategory: number | null = null;
  uploading = false;
  private sub: Subscription | null = null;
  // pagination/search
  page = 1;
  pageSize = 12;
  total = 0;
  search = '';
  previewUrl: string | null = null;

  constructor(
    private documentsService: DocumentsService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {
    // load after auth in ngOnInit
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadDocuments();
    // listen for global update events when documents change (upload/delete)
    window.addEventListener('documentsUpdated', this.handleDocumentsUpdated);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    window.removeEventListener('documentsUpdated', this.handleDocumentsUpdated);
  }

  async loadCategories() {
    this.categories = await this.documentsService.listCategories();
    this.categoriesOptions = [{ value: null, label: 'All categories' }, ...this.categories.map((c: any) => ({ value: Number(c.id), label: c.name }))];
    this.cd.detectChanges();
  }

  // (kept below) loadDocuments with pagination/search

  onCategoryChange() {
    this.loadDocuments();
  }

  async openUpload() {
    window.dispatchEvent(new CustomEvent('openUploadDialog'));
  }

  async download(doc: any) {
    const { signedUrl } = await this.documentsService.generateSignedDownloadUrl(doc.storage_path, 300);
    window.open(signedUrl, '_blank');
  }

  async delete(doc: any) {
    try {
      await this.documentsService.deleteFileFromStorage(doc.storage_path);
      await this.documentsService.deleteDocument(doc.id);
      this.notificationService.success('Document deleted');
      await this.loadDocuments();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to delete document');
    }
  }

  async preview(doc: any) {
    try {
      const res = await this.documentsService.generateSignedDownloadUrl(doc.storage_path, 300);
      this.previewUrl = res.signedUrl;
    } catch (e: any) {
      this.notificationService.error('Failed to get preview URL');
    }
  }

  async loadDocuments() {
    const res = await this.documentsService.listDocuments({
      categoryId: this.selectedCategory ?? undefined,
      page: this.page,
      pageSize: this.pageSize,
      search: this.search,
    } as any);
    this.documents = res.data;
    this.total = res.count;
    // ensure Angular updates the view after async assignments
    this.cd.detectChanges();
  }

  private handleDocumentsUpdated = async () => {
    await this.loadDocuments();
  };

  async onSearch() {
    this.page = 1;
    await this.loadDocuments();
  }

  async onPageChange(next: number) {
    this.page = next;
    await this.loadDocuments();
  }
}
