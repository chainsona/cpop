'use client';

import { useState } from 'react';
import { 
  uploadImage as uploadImageAction,
  deleteImage as deleteImageAction,
  uploadJsonMetadata as uploadJsonMetadataAction,
  queryData as queryDataAction,
  insertData as insertDataAction,
  updateData as updateDataAction,
  deleteData as deleteDataAction
} from '@/actions/supabase-actions';

/**
 * Hook to handle Supabase operations from the client
 */
export function useSupabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload an image to Supabase Storage
   */
  const uploadImage = async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadImageAction(formData);
      
      if (response.error) {
        setError(response.error);
        return '';
      }
      
      return response.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      return '';
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an image from Supabase Storage
   */
  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deleteImageAction(imageUrl);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      return response.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete image';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload JSON metadata to Supabase Storage
   */
  const uploadJsonMetadata = async (
    metadata: Record<string, any>,
    filename?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadJsonMetadataAction(metadata, filename);
      
      if (response.error) {
        setError(response.error);
        return '';
      }
      
      return response.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload metadata';
      setError(errorMessage);
      return '';
    } finally {
      setLoading(false);
    }
  };

  /**
   * Query data from a table
   */
  const queryData = async <T = any>(
    tableName: string,
    queryParams: Record<string, any> = {},
    path?: string
  ): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await queryDataAction<T>(tableName, queryParams, path);
      
      if (response.error) {
        setError(response.error);
        return [];
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to query ${tableName}`;
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Insert data into a table
   */
  const insertData = async <T = any>(
    tableName: string,
    data: Record<string, any>,
    path?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await insertDataAction<T>(tableName, data, path);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to insert into ${tableName}`;
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update data in a table
   */
  const updateData = async <T = any>(
    tableName: string,
    id: string | number,
    data: Record<string, any>,
    path?: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await updateDataAction<T>(tableName, id, data, path);
      
      if (response.error) {
        setError(response.error);
        return null;
      }
      
      return response.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to update ${tableName}`;
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete data from a table
   */
  const deleteData = async (
    tableName: string,
    id: string | number,
    path?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deleteDataAction(tableName, id, path);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      return response.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to delete from ${tableName}`;
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    uploadImage,
    deleteImage,
    uploadJsonMetadata,
    queryData,
    insertData,
    updateData,
    deleteData,
  };
} 