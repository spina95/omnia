import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import {
  DayEntry,
  DayTask,
  JournalEntry,
  CreateDayEntryDTO,
  UpdateDayEntryDTO,
  CreateTaskDTO,
  UpdateTaskDTO,
  UpdateJournalDTO,
  SearchByTagsParams,
  SearchResult,
  TagStats,
  PlannerHelpers,
} from '../models/planner.models';

@Injectable({
  providedIn: 'root',
})
export class PlannerService {
  constructor(private supabaseService: SupabaseService) {}

  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabaseService.client.auth.getUser();
    return data?.user?.id ?? null;
  }

  // ==================== DAY ENTRIES ====================

  /**
   * Get or create day entry for a specific date
   */
  async getDayEntry(date: string): Promise<DayEntry | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    // Try to fetch existing entry with tasks and journal
    const { data: existing, error: fetchError } = await this.supabaseService.client
      .from('day_entries')
      .select(
        `
        *,
        tasks:day_tasks(*),
        journal:journal_entries(*)
      `
      )
      .eq('user_id', userId)
      .eq('entry_date', date)
      .single();

    if (!fetchError && existing) {
      return this.transformDayEntry(existing);
    }

    // If not found, create a new entry
    const { data: newEntry, error: createError } = await this.supabaseService.client
      .from('day_entries')
      .insert({
        user_id: userId,
        entry_date: date,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating day entry:', createError);
      return null;
    }

    // Return the new entry with empty tasks and journal
    return {
      ...newEntry,
      tasks: [],
      journal: undefined,
    } as DayEntry;
  }

  /**
   * Update day entry metadata (mood)
   */
  async updateDayEntry(entryId: string, updates: UpdateDayEntryDTO): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('day_entries')
      .update(updates)
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating day entry:', error);
      return false;
    }

    return true;
  }

  /**
   * Get recent day entries (for timeline view)
   */
  async getRecentDays(limit: number = 30): Promise<DayEntry[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await this.supabaseService.client
      .from('day_entries')
      .select(
        `
        *,
        tasks:day_tasks(id),
        journal:journal_entries(id, tags)
      `
      )
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent days:', error);
      return [];
    }

    return (data || []).map((entry) => this.transformDayEntry(entry));
  }

  // ==================== TASKS ====================

  /**
   * Create a new task for a day entry
   */
  async createTask(dayEntryId: string, task: CreateTaskDTO): Promise<DayTask | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    // Verify ownership of day_entry
    const { data: dayEntry } = await this.supabaseService.client
      .from('day_entries')
      .select('id')
      .eq('id', dayEntryId)
      .eq('user_id', userId)
      .single();

    if (!dayEntry) {
      console.error('Day entry not found or unauthorized');
      return null;
    }

    const { data, error } = await this.supabaseService.client
      .from('day_tasks')
      .insert({
        day_entry_id: dayEntryId,
        text: task.text,
        status: task.status || 'todo',
        task_order: task.task_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: UpdateTaskDTO): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    // The RLS policy will ensure the user owns the day_entry
    const { error } = await this.supabaseService.client
      .from('day_tasks')
      .update(updates)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client.from('day_tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  }

  /**
   * Bulk update task orders (for drag & drop)
   */
  async updateTaskOrders(updates: { id: string; task_order: number }[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    try {
      // Update each task individually (Supabase doesn't support bulk update with different values)
      const promises = updates.map((update) =>
        this.supabaseService.client
          .from('day_tasks')
          .update({ task_order: update.task_order })
          .eq('id', update.id)
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error updating task orders:', error);
      return false;
    }
  }

  // ==================== JOURNAL ====================

  /**
   * Update or create journal entry for a day
   */
  async updateJournal(dayEntryId: string, updates: UpdateJournalDTO): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    // Verify ownership
    const { data: dayEntry } = await this.supabaseService.client
      .from('day_entries')
      .select('id')
      .eq('id', dayEntryId)
      .eq('user_id', userId)
      .single();

    if (!dayEntry) {
      console.error('Day entry not found or unauthorized');
      return false;
    }

    // Normalize tags if provided
    const normalizedUpdates = { ...updates };
    if (updates.tags) {
      normalizedUpdates.tags = PlannerHelpers.normalizeTags(updates.tags);
    }

    // Check if journal exists
    const { data: existing } = await this.supabaseService.client
      .from('journal_entries')
      .select('id')
      .eq('day_entry_id', dayEntryId)
      .single();

    if (existing) {
      // Update existing journal
      const { error } = await this.supabaseService.client
        .from('journal_entries')
        .update(normalizedUpdates)
        .eq('day_entry_id', dayEntryId);

      if (error) {
        console.error('Error updating journal:', error);
        return false;
      }
    } else {
      // Create new journal
      const { error } = await this.supabaseService.client.from('journal_entries').insert({
        day_entry_id: dayEntryId,
        ...normalizedUpdates,
      });

      if (error) {
        console.error('Error creating journal:', error);
        return false;
      }
    }

    return true;
  }

  // ==================== SEARCH & TAGS ====================

  /**
   * Search day entries by tags
   */
  async searchByTags(
    params: SearchByTagsParams
  ): Promise<{ results: SearchResult[]; total: number }> {
    const userId = await this.getCurrentUserId();
    if (!userId) return { results: [], total: 0 };

    const { tags, mode, page = 1, pageSize = 12 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Normalize search tags
    const normalizedTags = PlannerHelpers.normalizeTags(tags);

    let query = this.supabaseService.client
      .from('day_entries')
      .select(
        `
        *,
        journal:journal_entries(*)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    // Build tag filter based on mode
    if (normalizedTags.length > 0) {
      if (mode === 'AND') {
        // All tags must be present
        query = query.contains('journal.tags', normalizedTags);
      } else {
        // At least one tag must be present (OR)
        query = query.overlaps('journal.tags', normalizedTags);
      }
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error searching by tags:', error);
      return { results: [], total: 0 };
    }

    const results: SearchResult[] = (data || [])
      .filter((entry) => entry.journal) // Only entries with journal
      .map((entry) => ({
        dayEntry: this.transformDayEntry(entry),
        excerpt: PlannerHelpers.createExcerpt(entry.journal.free_text),
        matchedTags: this.getMatchedTags(entry.journal.tags, normalizedTags),
      }));

    return { results, total: count || 0 };
  }

  /**
   * Get all unique tags with usage count
   */
  async getAllTags(): Promise<TagStats[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await this.supabaseService.client
      .from('journal_entries')
      .select('tags, day_entry_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    // Count tag occurrences
    const tagCounts = new Map<string, number>();

    (data || []).forEach((journal) => {
      if (journal.tags && Array.isArray(journal.tags)) {
        journal.tags.forEach((tag: string) => {
          const normalized = PlannerHelpers.normalizeTag(tag);
          tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
        });
      }
    });

    // Convert to array and sort by count
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get entries for a specific month (for calendar view)
   */
  async getEntriesForMonth(year: number, month: number): Promise<DayEntry[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    const { data, error } = await this.supabaseService.client
      .from('day_entries')
      .select(
        `
        *,
        tasks:day_tasks(id, status),
        journal:journal_entries(id)
      `
      )
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true });

    if (error) {
      console.error('Error fetching entries for month:', error);
      return [];
    }

    return (data || []).map((entry) => this.transformDayEntry(entry));
  }

  /**
   * Get days with entries (tasks, journal, tags, mood, or guided answers) for a specific month
   * Returns only the dates as strings for efficient calendar marking
   */
  async getDaysWithEntries(year: number, month: number): Promise<string[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    const { data, error } = await this.supabaseService.client
      .from('day_entries')
      .select(
        `
        entry_date,
        mood,
        tasks:day_tasks(id),
        journal:journal_entries(id, free_text, went_well, challenges, takeaway, tags)
      `
      )
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate);

    if (error) {
      console.error('Error fetching days with entries:', error);
      return [];
    }

    console.log('[getDaysWithEntries] Raw data:', JSON.stringify(data, null, 2));

    // Filter only days that have any content
    const daysWithData = (data || [])
      .filter((entry: any) => {
        // Has tasks
        const hasTasks = entry.tasks && entry.tasks.length > 0;

        // Has mood
        const hasMood = entry.mood && entry.mood.trim() !== '';

        // Has journal with any content
        const journal = entry.journal;
        let hasJournalContent = false;

        if (journal) {
          // journal could be an array or an object depending on the query
          const journalArray = Array.isArray(journal) ? journal : [journal];

          hasJournalContent = journalArray.some((j: any) => {
            if (!j) return false;

            const hasFreeText = j.free_text && j.free_text.trim() !== '';
            const hasWentWell = j.went_well && j.went_well.trim() !== '';
            const hasChallenges = j.challenges && j.challenges.trim() !== '';
            const hasTakeaway = j.takeaway && j.takeaway.trim() !== '';
            const hasTags = j.tags && Array.isArray(j.tags) && j.tags.length > 0;

            return hasFreeText || hasWentWell || hasChallenges || hasTakeaway || hasTags;
          });
        }

        return hasTasks || hasMood || hasJournalContent;
      })
      .map((entry: any) => entry.entry_date);

    return daysWithData;
  }

  /**
   * Get the nearest day with entries in a given direction (before or after a date)
   * @param fromDate - Starting date in YYYY-MM-DD format
   * @param direction - 'previous' or 'next'
   * @param maxDays - Maximum number of days to search (default: 365)
   * @returns The date string of the nearest day with entries, or null if none found
   */
  async getNearestDayWithEntries(
    fromDate: string,
    direction: 'previous' | 'next',
    maxDays: number = 365
  ): Promise<string | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const startDate = PlannerHelpers.parseDate(fromDate);
    const today = PlannerHelpers.getToday();
    const increment = direction === 'next' ? 1 : -1;

    for (let i = 1; i <= maxDays; i++) {
      const checkDate = new Date(startDate.getTime());
      checkDate.setUTCDate(checkDate.getUTCDate() + i * increment);
      const dateStr = PlannerHelpers.formatDate(checkDate);

      // Don't search beyond today when going forward
      if (direction === 'next' && dateStr > today) {
        break;
      }

      // Query to check if this day has any content
      const { data, error } = await this.supabaseService.client
        .from('day_entries')
        .select(
          `
          entry_date,
          mood,
          tasks:day_tasks(id),
          journal:journal_entries(id, free_text, went_well, challenges, takeaway, tags)
        `
        )
        .eq('user_id', userId)
        .eq('entry_date', dateStr)
        .maybeSingle();

      if (error) {
        console.error('Error checking day entry:', error);
        continue;
      }

      if (!data) continue;

      // Check if this entry has any content
      const hasTasks = data.tasks && data.tasks.length > 0;
      const hasMood = data.mood && data.mood.trim() !== '';

      const journal = data.journal;
      let hasJournalContent = false;

      if (journal) {
        const journalArray = Array.isArray(journal) ? journal : [journal];
        hasJournalContent = journalArray.some((j: any) => {
          if (!j) return false;
          const hasFreeText = j.free_text && j.free_text.trim() !== '';
          const hasWentWell = j.went_well && j.went_well.trim() !== '';
          const hasChallenges = j.challenges && j.challenges.trim() !== '';
          const hasTakeaway = j.takeaway && j.takeaway.trim() !== '';
          const hasTags = j.tags && Array.isArray(j.tags) && j.tags.length > 0;
          return hasFreeText || hasWentWell || hasChallenges || hasTakeaway || hasTags;
        });
      }

      if (hasTasks || hasMood || hasJournalContent) {
        return dateStr;
      }
    }

    return null;
  }

  // ==================== HELPER METHODS ====================

  private transformDayEntry(raw: any): DayEntry {
    return {
      id: raw.id,
      user_id: raw.user_id,
      entry_date: raw.entry_date,
      mood: raw.mood,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
      journal: raw.journal || undefined,
    };
  }

  private getMatchedTags(entryTags: string[], searchTags: string[]): string[] {
    if (!entryTags || !Array.isArray(entryTags)) return [];
    return entryTags.filter((tag) => searchTags.includes(PlannerHelpers.normalizeTag(tag)));
  }
}
