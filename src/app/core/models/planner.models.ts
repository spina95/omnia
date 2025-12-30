// Planner & Journal Models

export type TaskStatus = 'todo' | 'done' | 'postponed';

export interface DayTask {
  id: string;
  day_entry_id: string;
  text: string;
  status: TaskStatus;
  task_order: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  day_entry_id: string;
  free_text: string | null;
  went_well: string | null;
  challenges: string | null;
  takeaway: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DayEntry {
  id: string;
  user_id: string;
  entry_date: string; // ISO date string YYYY-MM-DD
  mood: string | null;
  created_at: string;
  updated_at: string;
  // Relations (loaded with joins)
  tasks?: DayTask[];
  journal?: JournalEntry;
}

// Helper types for creating/updating
export interface CreateDayEntryDTO {
  entry_date: string;
  mood?: string | null;
}

export interface UpdateDayEntryDTO {
  mood?: string | null;
}

export interface CreateTaskDTO {
  text: string;
  status?: TaskStatus;
  task_order?: number;
}

export interface UpdateTaskDTO {
  text?: string;
  status?: TaskStatus;
  task_order?: number;
}

export interface UpdateJournalDTO {
  free_text?: string | null;
  went_well?: string | null;
  challenges?: string | null;
  takeaway?: string | null;
  tags?: string[];
}

// Search params
export interface SearchByTagsParams {
  tags: string[];
  mode: 'AND' | 'OR';
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  dayEntry: DayEntry;
  excerpt: string; // First 150 chars of free_text
  matchedTags: string[];
}

// Tag statistics
export interface TagStats {
  tag: string;
  count: number;
}

// Helper functions
export class PlannerHelpers {
  /**
   * Normalize tag: lowercase, trim, remove multiple spaces
   */
  static normalizeTag(tag: string): string {
    return tag.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalize array of tags and remove duplicates
   */
  static normalizeTags(tags: string[]): string[] {
    const normalized = tags.map((t) => this.normalizeTag(t)).filter((t) => t.length > 0);
    return Array.from(new Set(normalized));
  }

  /**
   * Create excerpt from text (first 150 chars)
   */
  static createExcerpt(text: string | null, maxLength: number = 150): string {
    if (!text) return '';
    const cleaned = text.trim();
    if (cleaned.length <= maxLength) return cleaned;
    return cleaned.substring(0, maxLength).trim() + '...';
  }

  /**
   * Format date to YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse YYYY-MM-DD to Date object
   */
  static parseDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }

  /**
   * Get today's date as YYYY-MM-DD
   */
  static getToday(): string {
    return this.formatDate(new Date());
  }

  /**
   * Check if a date string is valid YYYY-MM-DD format
   */
  static isValidDateString(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = this.parseDate(dateString);
    return !isNaN(date.getTime());
  }
}
