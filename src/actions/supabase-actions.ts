'use server';

import { revalidatePath } from 'next/cache';
import * as supabaseServer from '@/lib/supabase';

/**
 * Server action to upload an image
 */
export async function uploadImage(formData: FormData): Promise<{ url: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { url: '', error: 'No file provided' };
    }
    
    const url = await supabaseServer.uploadImage(file);
    return { url };
  } catch (error) {
    console.error('Error in uploadImage action:', error);
    return { 
      url: '', 
      error: error instanceof Error ? error.message : 'Failed to upload image' 
    };
  }
}

/**
 * Server action to delete an image
 */
export async function deleteImage(
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabaseServer.deleteImage(imageUrl);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteImage action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete image' 
    };
  }
}

/**
 * Server action to upload JSON metadata
 */
export async function uploadJsonMetadata(
  metadata: Record<string, any>,
  filename?: string
): Promise<{ url: string; error?: string }> {
  try {
    const url = await supabaseServer.uploadJsonMetadata(metadata, filename);
    return { url };
  } catch (error) {
    console.error('Error in uploadJsonMetadata action:', error);
    return { 
      url: '', 
      error: error instanceof Error ? error.message : 'Failed to upload metadata' 
    };
  }
}

/**
 * Server action to query data
 */
export async function queryData<T = any>(
  tableName: string,
  queryParams: Record<string, any>,
  path?: string
): Promise<{ data: T[]; error?: string }> {
  try {
    const data = await supabaseServer.query<T>(tableName, (query) => {
      let modifiedQuery = query;
      
      // Apply filters from queryParams
      Object.entries(queryParams).forEach(([key, value]) => {
        if (key === 'order') {
          const [column, direction] = (value as string).split(':');
          modifiedQuery = modifiedQuery.order(column, { ascending: direction === 'asc' });
        } else if (key === 'limit') {
          modifiedQuery = modifiedQuery.limit(Number(value));
        } else if (typeof value === 'string') {
          modifiedQuery = modifiedQuery.eq(key, value);
        }
      });
      
      return modifiedQuery;
    });
    
    // Revalidate the path if provided
    if (path) {
      revalidatePath(path);
    }
    
    return { data };
  } catch (error) {
    console.error(`Error in queryData action for ${tableName}:`, error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : `Failed to query ${tableName}` 
    };
  }
}

/**
 * Server action to insert data
 */
export async function insertData<T = any>(
  tableName: string,
  data: Record<string, any>,
  path?: string
): Promise<{ data?: T; error?: string }> {
  try {
    const result = await supabaseServer.insert<T>(tableName, data);
    
    // Revalidate the path if provided
    if (path) {
      revalidatePath(path);
    }
    
    return { data: result };
  } catch (error) {
    console.error(`Error in insertData action for ${tableName}:`, error);
    return { 
      error: error instanceof Error ? error.message : `Failed to insert into ${tableName}` 
    };
  }
}

/**
 * Server action to update data
 */
export async function updateData<T = any>(
  tableName: string,
  id: string | number,
  data: Record<string, any>,
  path?: string
): Promise<{ data?: T; error?: string }> {
  try {
    const result = await supabaseServer.update<T>(tableName, id, data);
    
    // Revalidate the path if provided
    if (path) {
      revalidatePath(path);
    }
    
    return { data: result };
  } catch (error) {
    console.error(`Error in updateData action for ${tableName}:`, error);
    return { 
      error: error instanceof Error ? error.message : `Failed to update ${tableName}` 
    };
  }
}

/**
 * Server action to delete data
 */
export async function deleteData(
  tableName: string,
  id: string | number,
  path?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabaseServer.remove(tableName, id);
    
    // Revalidate the path if provided
    if (path) {
      revalidatePath(path);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error in deleteData action for ${tableName}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Failed to delete from ${tableName}` 
    };
  }
} 