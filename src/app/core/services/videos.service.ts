import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface VideoCategory {
  id: number;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  url: string;
  title: string;
  channel: string;
  description?: string;
  category_id?: number;
  rating?: number;
  thumbnail_url?: string;
  to_watch?: boolean;
  created_at: string;
}

export interface VideoMetadata {
  title: string;
  channel: string;
  thumbnail_url: string;
}

@Injectable({
  providedIn: 'root',
})
export class VideosService {
  constructor(private supabaseService: SupabaseService) {}

  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabaseService.client.auth.getUser();
    return data?.user?.id ?? null;
  }

  // ============ VIDEO CATEGORIES ============

  async getCategories(): Promise<VideoCategory[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await this.supabaseService.client
      .from('video_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching video categories:', error);
      return [];
    }

    return data || [];
  }

  async createCategory(name: string, color: string): Promise<VideoCategory | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabaseService.client
      .from('video_categories')
      .insert({ user_id: userId, name, color })
      .select()
      .single();

    if (error) {
      console.error('Error creating video category:', error);
      return null;
    }

    return data;
  }

  async updateCategory(id: number, name: string, color: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('video_categories')
      .update({ name, color })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating video category:', error);
      return false;
    }

    return true;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('video_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting video category:', error);
      return false;
    }

    return true;
  }

  // ============ VIDEOS ============

  async getVideos(params: {
    search?: string;
    categoryId?: number | null;
    rating?: number | null;
    toWatch?: boolean | null;
    page?: number;
    pageSize?: number;
  } = {}): Promise<{ videos: Video[]; total: number }> {
    const userId = await this.getCurrentUserId();
    if (!userId) return { videos: [], total: 0 };

    const { search, categoryId, rating, toWatch, page = 1, pageSize = 12 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabaseService.client
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (search) {
      query = query.or(`title.ilike.%${search}%,channel.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (rating !== null && rating !== undefined) {
      query = query.eq('rating', rating);
    }

    if (toWatch === true) {
      query = query.eq('to_watch', true);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching videos:', error);
      return { videos: [], total: 0 };
    }

    return { videos: data || [], total: count || 0 };
  }

  async getVideoById(id: string): Promise<Video | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabaseService.client
      .from('videos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching video:', error);
      return null;
    }

    return data;
  }

  async createVideo(video: {
    url: string;
    title: string;
    channel: string;
    description?: string;
    category_id?: number;
    rating?: number;
    thumbnail_url?: string;
  }): Promise<Video | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabaseService.client
      .from('videos')
      .insert({ ...video, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating video:', error);
      return null;
    }

    return data;
  }

  async updateVideo(
    id: string,
    updates: {
      url?: string;
      title?: string;
      channel?: string;
      description?: string;
      category_id?: number | null;
      rating?: number | null;
      thumbnail_url?: string;
    }
  ): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('videos')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating video:', error);
      return false;
    }

    return true;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting video:', error);
      return false;
    }

    return true;
  }

  async toggleToWatch(id: string, toWatch: boolean): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('videos')
      .update({ to_watch: toWatch })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error toggling to_watch:', error);
      return false;
    }

    return true;
  }

  // ============ YOUTUBE METADATA ============

  async fetchYouTubeMetadata(url: string): Promise<VideoMetadata | null> {
    try {
      // Extract video ID from URL
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) {
        console.error('Invalid YouTube URL');
        return null;
      }

      // Use YouTube oEmbed API (no API key required)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        console.error('Failed to fetch YouTube metadata');
        return null;
      }

      const data = await response.json();
      
      return {
        title: data.title || 'Unknown Title',
        channel: data.author_name || 'Unknown Channel',
        thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      };
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      return null;
    }
  }

  private extractYouTubeVideoId(url: string): string | null {
    // Support multiple YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  isValidYouTubeUrl(url: string): boolean {
    return this.extractYouTubeVideoId(url) !== null;
  }
}
