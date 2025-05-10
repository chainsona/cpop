import { createClient } from '@supabase/supabase-js';
import fetch from 'cross-fetch';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a Supabase client with the service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
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
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    onProgress?.(10);

    // Check file type & size
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    onProgress?.(20);

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    onProgress?.(40);

    try {
      // Skip bucket existence check - assume bucket exists

      onProgress?.(50);

      // Upload the file using admin client with service role key
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(`img/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      onProgress?.(80);

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`img/${fileName}`);

      onProgress?.(100);

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Supabase Storage error:', error);
      throw new Error(
        `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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

    // Delete the file from storage using admin client
    const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);

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
  filename: string
): Promise<string> {
  try {
    // Generate a unique filename if not provided
    const finalFilename =
      filename || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.json`;

    // Convert JSON to Blob
    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });

    // Create a Buffer from the Blob
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using admin client with service role key
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(`json/${finalFilename}`, buffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`json/${finalFilename}`);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded metadata');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading JSON metadata:', error);
    throw error;
  }
}
