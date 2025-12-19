import { Component, EventEmitter, Output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideosService, VideoCategory } from '../../../core/services/videos.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-manage-video-categories-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-video-categories-dialog.component.html',
  styleUrls: ['./manage-video-categories-dialog.component.css'],
})
export class ManageVideoCategoriesDialogComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() categoriesUpdated = new EventEmitter<void>();

  categories = signal<VideoCategory[]>([]);
  newCategoryName = signal('');
  newCategoryColor = signal('#3b82f6');
  isCreating = signal(false);
  categoryToDelete = signal<VideoCategory | null>(null);

  constructor(
    private videosService: VideosService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    const categories = await this.videosService.getCategories();
    this.categories.set(categories);
  }

  async createCategory() {
    const name = this.newCategoryName().trim();
    
    if (!name) {
      this.notificationService.error('Category name is required');
      return;
    }

    this.isCreating.set(true);
    
    try {
      const category = await this.videosService.createCategory(
        name,
        this.newCategoryColor()
      );
      
      if (category) {
        this.notificationService.success('Category created');
        this.newCategoryName.set('');
        this.newCategoryColor.set('#3b82f6');
        await this.loadCategories();
        this.categoriesUpdated.emit();
      } else {
        this.notificationService.error('Failed to create category');
      }
    } finally {
      this.isCreating.set(false);
    }
  }

  confirmDelete(category: VideoCategory) {
    this.categoryToDelete.set(category);
  }

  cancelDelete() {
    this.categoryToDelete.set(null);
  }

  async deleteCategory() {
    const category = this.categoryToDelete();
    if (!category) return;

    const success = await this.videosService.deleteCategory(category.id);
    
    if (success) {
      this.notificationService.success('Category deleted');
      this.categoryToDelete.set(null);
      await this.loadCategories();
      this.categoriesUpdated.emit();
    } else {
      this.notificationService.error('Failed to delete category');
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose() {
    this.close.emit();
  }
}
