import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideosService, Video, VideoCategory } from '../../../core/services/videos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SelectComponent } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-add-video-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './add-video-dialog.component.html',
  styleUrls: ['./add-video-dialog.component.css'],
})
export class AddVideoDialogComponent implements OnInit {
  @Input() video: Video | null = null;
  @Input() categories: VideoCategory[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  url = signal('');
  title = signal('');
  channel = signal('');
  description = signal('');
  categoryId = signal<number | null>(null);
  rating = signal<number>(0);
  thumbnailUrl = signal('');

  loading = signal(false);
  fetchingMetadata = signal(false);
  urlError = signal('');

  isEditMode = computed(() => this.video !== null);

  categoryOptions = computed(() => [
    { value: null, label: 'No Category' },
    ...this.categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ]);

  constructor(
    private videosService: VideosService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    if (this.video) {
      this.url.set(this.video.url);
      this.title.set(this.video.title);
      this.channel.set(this.video.channel);
      this.description.set(this.video.description || '');
      this.categoryId.set(this.video.category_id || null);
      this.rating.set(this.video.rating || 0);
      this.thumbnailUrl.set(this.video.thumbnail_url || '');
    }
  }

  async onUrlBlur() {
    const url = this.url().trim();
    
    if (!url) {
      this.urlError.set('');
      return;
    }

    // Validate YouTube URL
    if (!this.videosService.isValidYouTubeUrl(url)) {
      this.urlError.set('Please enter a valid YouTube URL');
      return;
    }

    this.urlError.set('');

    // Auto-fetch metadata if not in edit mode or if URL changed
    if (!this.isEditMode() || url !== this.video?.url) {
      await this.fetchMetadata();
    }
  }

  async fetchMetadata() {
    const url = this.url().trim();
    if (!url) return;

    this.fetchingMetadata.set(true);

    const metadata = await this.videosService.fetchYouTubeMetadata(url);
    
    if (metadata) {
      this.title.set(metadata.title);
      this.channel.set(metadata.channel);
      this.thumbnailUrl.set(metadata.thumbnail_url);
      this.notificationService.success('Video metadata fetched successfully');
    } else {
      this.notificationService.error('Failed to fetch video metadata');
    }

    this.fetchingMetadata.set(false);
  }

  setRating(rating: number) {
    this.rating.set(rating);
  }

  getStarsArray(): boolean[] {
    const r = this.rating();
    return Array(5)
      .fill(false)
      .map((_, i) => i < r);
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onClose() {
    this.close.emit();
  }

  async onSave() {
    const url = this.url().trim();
    const title = this.title().trim();
    const channel = this.channel().trim();

    // Validation
    if (!url) {
      this.notificationService.error('Please enter a video URL');
      return;
    }

    if (!this.videosService.isValidYouTubeUrl(url)) {
      this.notificationService.error('Please enter a valid YouTube URL');
      return;
    }

    if (!title) {
      this.notificationService.error('Please enter a video title');
      return;
    }

    if (!channel) {
      this.notificationService.error('Please enter a channel name');
      return;
    }

    this.loading.set(true);

    try {
      if (this.isEditMode() && this.video) {
        // Update existing video
        const success = await this.videosService.updateVideo(this.video.id, {
          url,
          title,
          channel,
          description: this.description().trim() || undefined,
          category_id: this.categoryId() || undefined,
          rating: this.rating() || undefined,
          thumbnail_url: this.thumbnailUrl() || undefined,
        });

        if (success) {
          this.save.emit();
        } else {
          this.notificationService.error('Failed to update video');
        }
      } else {
        // Create new video
        const newVideo = await this.videosService.createVideo({
          url,
          title,
          channel,
          description: this.description().trim() || undefined,
          category_id: this.categoryId() || undefined,
          rating: this.rating() || undefined,
          thumbnail_url: this.thumbnailUrl() || undefined,
        });

        if (newVideo) {
          this.save.emit();
        } else {
          this.notificationService.error('Failed to create video');
        }
      }
    } finally {
      this.loading.set(false);
    }
  }
}
