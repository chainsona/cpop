import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_BUCKET = 'poap-images';

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

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      onProgress?.(80);

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

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

    // Extract the file name from the URL
    const fileName = imageUrl.split('/').pop();

    if (!fileName) {
      throw new Error('Invalid image URL');
    }

    // Delete the file from storage
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);

    if (error) {
      throw error;
    }

    console.log('Image deleted successfully:', fileName);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}
