'use server';

import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Check if required environment variables are available
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required in environment variables');
}

// Check if service role key is available for admin operations
if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Server operations will not work.');
}

// Create a Supabase client with the service role key for server operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch,
  },
});

const STORAGE_BUCKET = 'cpop';

/**
 * Upload an image to Supabase Storage and return the URL
 */
export async function uploadImage(
  file: File,
  onProgressUpdate?: (progress: number) => void
): Promise<string> {
  try {
    // This function is now a server action and will be called from the client
    // Progress updates will be sent back to the client
    
    // Check file type & size
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `img/${fileName}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Skip if URL is not from our Supabase storage
    if (!imageUrl.includes(supabaseUrl) || !imageUrl.includes(STORAGE_BUCKET)) {
      console.log('Image URL is not from our Supabase storage, skipping deletion');
      return;
    }

    // Extract the file path from the URL
    const urlParts = imageUrl.split(`${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL format');
    }

    const filePath = urlParts[1];

    // Delete the file from storage
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

    if (error) {
      throw error;
    }

    console.log('Image deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Uploads JSON metadata to Supabase Storage and returns the URL
 */
export async function uploadJsonMetadata(
  metadata: Record<string, any>,
  filename?: string
): Promise<string> {
  try {
    // Generate a unique filename if not provided
    const finalFilename =
      filename || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.json`;
    const filePath = `json/${finalFilename}`;

    // Convert JSON to Blob
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });

    // Create a Buffer from the Blob
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded metadata');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading JSON metadata:', error);
    throw error;
  }
}

/**
 * Generic database query function
 */
export async function query<T = any>(
  tableName: string,
  queryFn: (query: any) => any
): Promise<T[]> {
  try {
    let query = supabase.from(tableName).select();
    query = queryFn(query);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as T[];
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

/**
 * Insert a record into a table
 */
export async function insert<T = any>(
  tableName: string,
  data: Record<string, any>
): Promise<T> {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
}

/**
 * Update a record in a table
 */
export async function update<T = any>(
  tableName: string,
  id: string | number,
  data: Record<string, any>
): Promise<T> {
  try {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result as T;
  } catch (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete a record from a table
 */
export async function remove(
  tableName: string,
  id: string | number
): Promise<void> {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}
