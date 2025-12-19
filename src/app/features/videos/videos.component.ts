import {
  Component,
  OnInit,
  ChangeDetectorRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideosService, Video, VideoCategory } from '../../core/services/videos.service';
import { NotificationService } from '../../core/services/notification.service';
import { SelectComponent } from '../../shared/components/select/select.component';
import { AddVideoDialogComponent } from './add-video-dialog/add-video-dialog.component';
import { ManageVideoCategoriesDialogComponent } from './manage-video-categories-dialog/manage-video-categories-dialog.component';

@Component({
  selector: 'app-videos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectComponent,
    AddVideoDialogComponent,
    ManageVideoCategoriesDialogComponent,
  ],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.css'],
})
export class VideosComponent implements OnInit {
  videos = signal<Video[]>([]);
  categories = signal<VideoCategory[]>([]);
  
  searchQuery = signal('');
  selectedCategoryId = signal<number | null>(null);
  selectedRating = signal<number | null>(null);
  showToWatchOnly = signal(false);
  
  currentPage = signal(1);
  pageSize = 12;
  totalVideos = signal(0);
  
  loading = signal(false);
  showAddVideoDialog = signal(false);
  showManageCategoriesDialog = signal(false);
  editingVideo = signal<Video | null>(null);

  totalPages = computed(() => Math.ceil(this.totalVideos() / this.pageSize));
  
  startItem = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize, this.totalVideos()));

  categoryOptions = computed(() => [
    { value: null, label: 'All Categories' },
    ...this.categories().map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ]);

  ratingOptions = [
    { value: null, label: 'All Ratings' },
    { value: 5, label: '5 Stars' },
    { value: 4, label: '4 Stars' },
    { value: 3, label: '3 Stars' },
    { value: 2, label: '2 Stars' },
    { value: 1, label: '1 Star' },
    { value: 0, label: 'Unrated' },
  ];

  constructor(
    private videosService: VideosService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadVideos();
  }

  async loadCategories() {
    const categories = await this.videosService.getCategories();
    this.categories.set(categories);
    this.cdr.detectChanges();
  }

  async loadVideos() {
    this.loading.set(true);
    
    const { videos, total } = await this.videosService.getVideos({
      search: this.searchQuery() || undefined,
      categoryId: this.selectedCategoryId(),
      rating: this.selectedRating(),
      toWatch: this.showToWatchOnly() ? true : null,
      page: this.currentPage(),
      pageSize: this.pageSize,
    });

    this.videos.set(videos);
    this.totalVideos.set(total);
    this.loading.set(false);
    this.cdr.detectChanges();
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(1);
    this.loadVideos();
  }

  onCategoryChange(categoryId: number | null) {
    this.selectedCategoryId.set(categoryId);
    this.currentPage.set(1);
    this.loadVideos();
  }

  onRatingChange(rating: number | null) {
    this.selectedRating.set(rating);
    this.currentPage.set(1);
    this.loadVideos();
  }

  onToWatchFilterChange() {
    this.showToWatchOnly.update(val => !val);
    this.currentPage.set(1);
    this.loadVideos();
  }

  async toggleToWatch(video: Video, event: Event) {
    event.stopPropagation();
    const newValue = !video.to_watch;
    const success = await this.videosService.toggleToWatch(video.id, newValue);
    if (success) {
      video.to_watch = newValue;
      this.cdr.detectChanges();
    }
  }

  openAddVideoDialog() {
    this.editingVideo.set(null);
    this.showAddVideoDialog.set(true);
  }

  openEditVideoDialog(video: Video) {
    this.editingVideo.set(video);
    this.showAddVideoDialog.set(true);
  }

  closeAddVideoDialog() {
    this.showAddVideoDialog.set(false);
    this.editingVideo.set(null);
  }

  async onVideoSaved() {
    this.closeAddVideoDialog();
    await this.loadVideos();
    this.notificationService.success('Video saved successfully');
  }

  openManageCategoriesDialog() {
    this.showManageCategoriesDialog.set(true);
  }

  closeManageCategoriesDialog() {
    this.showManageCategoriesDialog.set(false);
  }

  async onCategoriesUpdated() {
    await this.loadCategories();
    await this.loadVideos();
  }

  async deleteVideo(video: Video) {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) {
      return;
    }

    const success = await this.videosService.deleteVideo(video.id);
    if (success) {
      this.notificationService.success('Video deleted successfully');
      await this.loadVideos();
    } else {
      this.notificationService.error('Failed to delete video');
    }
  }

  getCategoryById(categoryId?: number): VideoCategory | undefined {
    return this.categories().find((cat) => cat.id === categoryId);
  }

  getStarsArray(rating?: number): boolean[] {
    const r = rating ?? 0;
    return Array(5)
      .fill(false)
      .map((_, i) => i < r);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadVideos();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
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

  openVideoInNewTab(url: string) {
    window.open(url, '_blank');
  }
}
