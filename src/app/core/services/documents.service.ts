import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly bucket = 'documents';

  constructor(private supabaseService: SupabaseService) {}

  private async getCurrentUserId(): Promise<string | null> {
    const { data } = await this.supabaseService.client.auth.getUser();
    return data?.user?.id ?? null;
  }

  // Categories
  async listCategories(): Promise<any[]> {
    const userId = await this.getCurrentUserId();
    let query = this.supabaseService.client.from('document_categories').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async createCategory(payload: { name: string; description?: string }) {
    const userId = await this.getCurrentUserId();
    const toInsert = { ...payload, user_id: userId };
    const { data, error } = await this.supabaseService.client.from('document_categories').insert([toInsert]).select().single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: number) {
    const userId = await this.getCurrentUserId();
    let query = this.supabaseService.client.from('document_categories').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  }

  // Documents (metadata)
  async createDocumentMetadata(payload: any) {
    const userId = await this.getCurrentUserId();
    const toInsert = { ...payload, user_id: userId };
    // Ensure category_id is null or a number
    if (toInsert.category_id !== null && toInsert.category_id !== undefined) {
      toInsert.category_id = Number(toInsert.category_id);
    } else {
      toInsert.category_id = null;
    }
    // Debug: log insert payload
    console.debug('DocumentsService.createDocumentMetadata: toInsert =', toInsert);
    const { data, error } = await this.supabaseService.client.from('documents').insert([toInsert]).select().single();
    if (error) throw error;
    return data;
  }

  async listDocuments(params: { categoryId?: number | null } = {}) {
    const userId = await this.getCurrentUserId();
    const page = (params as any).page ?? 1;
    const pageSize = (params as any).pageSize ?? 12;
    const search = (params as any).search ?? '';
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabaseService.client
      .from('documents')
      .select('*, document_categories(id, name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params.categoryId) query = query.eq('category_id', Number(params.categoryId));
    if (userId) query = query.eq('user_id', userId);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query.range(from, to as number);
    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  // Upload file to storage (private bucket) and return storage path
  async uploadFile(file: File, path: string) {
    const { data, error } = await this.supabaseService.client.storage.from(this.bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    return data;
  }

  async generateSignedDownloadUrl(path: string, expiresIn = 300) {
    const { data, error } = await this.supabaseService.client.storage.from(this.bucket).createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data;
  }

  async deleteFileFromStorage(path: string) {
    const { data, error } = await this.supabaseService.client.storage.from(this.bucket).remove([path]);
    if (error) throw error;
    return data;
  }

  async deleteDocument(id: string) {
    const userId = await this.getCurrentUserId();
    let queryBuilder = this.supabaseService.client.from('documents').delete().eq('id', id);
    if (userId) queryBuilder = queryBuilder.eq('user_id', userId);
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  }

  async updateDocument(id: string, payload: any) {
    const userId = await this.getCurrentUserId();
    let queryBuilder = this.supabaseService.client.from('documents').update(payload).eq('id', id);
    if (userId) queryBuilder = queryBuilder.eq('user_id', userId);
    const { data, error } = await queryBuilder.select().single();
    if (error) throw error;
    return data;
  }
}
