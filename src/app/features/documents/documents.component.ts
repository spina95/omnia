import { Component, OnInit, OnDestroy, inject, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentsService } from '../../core/services/documents.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderService } from '../../core/services/page-header.service';
import { PageHeaderActionsService } from '../../core/services/page-header-actions.service';
import { SelectComponent } from '../../shared/components/select/select.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ManageCategoriesDialogComponent } from './manage-categories-dialog/manage-categories-dialog.component';
import { UploadDocumentDialogComponent } from './upload-document-dialog/upload-document-dialog.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent, ConfirmationDialogComponent, ManageCategoriesDialogComponent, UploadDocumentDialogComponent],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
})
export class DocumentsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerActions', { static: false }) headerActionsTemplate!: TemplateRef<any>;
  
  private pageHeaderService = inject(PageHeaderService);
  private pageHeaderActionsService = inject(PageHeaderActionsService);
  
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
  Math = Math;

  // Computed properties for pagination
  totalPages = computed(() => Math.ceil(this.total / this.pageSize));
  startItem = computed(() => (this.page - 1) * this.pageSize + 1);
  endItem = computed(() => Math.min(this.page * this.pageSize, this.total));

  // Confirmation Dialog state
  isConfirmDialogOpen = false;
  confirmDialogTitle = '';
  confirmDialogMessage = '';
  pendingDeleteDoc: any = null;
  showManageCategoriesDialog = false;
  showUploadDialog = false;
  
  // Edit document dialog state
  showEditDialog = false;
  editingDocument: any = null;
  editName = '';
  editDescription = '';
  editCategoryId: number | null = null;

  constructor(
    private documentsService: DocumentsService,
    private notificationService: NotificationService,
    private cd: ChangeDetectorRef
  ) {
    // load after auth in ngOnInit
  }

  ngOnInit(): void {
    this.pageHeaderService.setHeader('Documents');
    this.loadCategories();
    this.loadDocuments();
    // listen for global update events when documents change (upload/delete)
    window.addEventListener('documentsUpdated', this.handleDocumentsUpdated);
  }

  ngAfterViewInit() {
    this.pageHeaderActionsService.setActions(this.headerActionsTemplate);
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.pageHeaderActionsService.clearActions();
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
    this.showUploadDialog = true;
  }

  async download(doc: any) {
    const { signedUrl } = await this.documentsService.generateSignedDownloadUrl(doc.storage_path, 300);
    window.open(signedUrl, '_blank');
  }

  async delete(doc: any) {
    this.pendingDeleteDoc = doc;
    this.confirmDialogTitle = 'Delete Document';
    this.confirmDialogMessage = `Are you sure you want to delete "${doc.name}"? This action cannot be undone.`;
    this.isConfirmDialogOpen = true;
  }

  async confirmDelete() {
    if (!this.pendingDeleteDoc) return;
    
    const doc = this.pendingDeleteDoc;
    this.isConfirmDialogOpen = false;
    this.pendingDeleteDoc = null;

    try {
      await this.documentsService.deleteFileFromStorage(doc.storage_path);
      await this.documentsService.deleteDocument(doc.id);
      this.notificationService.success('Document deleted');
      await this.loadDocuments();
    } catch (e: any) {
      this.notificationService.error(e.message || 'Failed to delete document');
    }
  }

  cancelDelete() {
    this.isConfirmDialogOpen = false;
    this.pendingDeleteDoc = null;
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

  async onPageChange(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page = newPage;
    await this.loadDocuments();
  }

  goToPage(page: number) {
    this.onPageChange(page);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.page;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        pages.push(1, 2, 3, 4, -1, total);
      } else if (current >= total - 2) {
        pages.push(1, -1, total - 3, total - 2, total - 1, total);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }

    return pages;
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  openManageCategories() {
    this.showManageCategoriesDialog = true;
  }

  closeManageCategories() {
    this.showManageCategoriesDialog = false;
  }

  async onCategoriesUpdated() {
    await this.loadCategories();
    await this.loadDocuments();
  }

  closeUploadDialog() {
    this.showUploadDialog = false;
  }

  async onDocumentUploaded() {
    await this.loadDocuments();
  }

  editDocument(doc: any) {
    this.editingDocument = doc;
    this.editName = doc.name;
    this.editDescription = doc.description || '';
    this.editCategoryId = doc.category_id;
    this.showEditDialog = true;
  }

  closeEditDialog() {
    this.showEditDialog = false;
    this.editingDocument = null;
  }

  async saveDocumentChanges() {
    if (!this.editingDocument) return;

    try {
      await this.documentsService.updateDocument(this.editingDocument.id, {
        name: this.editName,
        description: this.editDescription,
        category_id: this.editCategoryId,
      });
      
      this.notificationService.success('Document updated successfully');
      await this.loadDocuments();
    } catch (error: any) {
      this.notificationService.error(error.message || 'Failed to update document');
    } finally {
      this.closeEditDialog();
    }
  }
}
