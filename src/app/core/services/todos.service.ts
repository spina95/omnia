import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface TodoList {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
  tasks?: TodoTask[];
  completedTasksCount?: number;
  totalTasksCount?: number;
}

export interface TodoTask {
  id: string;
  list_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  priority?: 'low' | 'medium' | 'high';
  category?: 'optional' | 'task' | 'idea';
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class TodosService {
  constructor(private supabaseService: SupabaseService) {}

  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabaseService.client.auth.getUser();
    return data?.user?.id ?? null;
  }

  // ============ TODO LISTS ============

  async getLists(
    params: {
      search?: string;
      priority?: string | null;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ lists: TodoList[]; total: number }> {
    const userId = await this.getCurrentUserId();
    if (!userId) return { lists: [], total: 0 };

    const { search, priority, page = 1, pageSize = 12 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabaseService.client
      .from('todo_lists')
      .select('*, todo_tasks(id, completed)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching todo lists:', error);
      return { lists: [], total: 0 };
    }

    // Calculate task counts for each list
    const lists = (data || []).map((list: any) => {
      const tasks = list.todo_tasks || [];
      const completedTasksCount = tasks.filter((t: any) => t.completed).length;
      const totalTasksCount = tasks.length;

      // Remove the tasks array from the response, keep only counts
      const { todo_tasks, ...listData } = list;

      return {
        ...listData,
        completedTasksCount,
        totalTasksCount,
      };
    });

    return { lists, total: count || 0 };
  }

  async getListById(id: string): Promise<TodoList | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabaseService.client
      .from('todo_lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching todo list:', error);
      return null;
    }

    return data;
  }

  async createList(list: Partial<TodoList>): Promise<TodoList | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await this.supabaseService.client
      .from('todo_lists')
      .insert({ ...list, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating todo list:', error);
      return null;
    }

    return data;
  }

  async updateList(id: string, updates: Partial<TodoList>): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('todo_lists')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating todo list:', error);
      return false;
    }

    return true;
  }

  async deleteList(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('todo_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting todo list:', error);
      return false;
    }

    return true;
  }

  // ============ TODO TASKS ============

  async getTasks(listId: string): Promise<TodoTask[]> {
    const userId = await this.getCurrentUserId();
    if (!userId) return [];

    // Verify list ownership
    const list = await this.getListById(listId);
    if (!list) return [];

    const { data, error } = await this.supabaseService.client
      .from('todo_tasks')
      .select('*')
      .eq('list_id', listId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  }

  async createTask(task: Partial<TodoTask>): Promise<TodoTask | null> {
    const userId = await this.getCurrentUserId();
    if (!userId) return null;

    // Verify list ownership
    if (task.list_id) {
      const list = await this.getListById(task.list_id);
      if (!list) return null;
    }

    const { data, error } = await this.supabaseService.client
      .from('todo_tasks')
      .insert(task)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data;
  }

  async updateTask(id: string, updates: Partial<TodoTask>): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client
      .from('todo_tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    return true;
  }

  async deleteTask(id: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    const { error } = await this.supabaseService.client.from('todo_tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  }

  async toggleTaskCompleted(id: string, completed: boolean): Promise<boolean> {
    return this.updateTask(id, { completed });
  }

  async reorderTasks(listId: string, taskIds: string[]): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) return false;

    // Verify list ownership
    const list = await this.getListById(listId);
    if (!list) return false;

    try {
      // Update each task with its new order_index
      const updates = taskIds.map((taskId, index) =>
        this.supabaseService.client
          .from('todo_tasks')
          .update({ order_index: index })
          .eq('id', taskId)
          .eq('list_id', listId)
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error reordering tasks:', error);
      return false;
    }
  }
}
