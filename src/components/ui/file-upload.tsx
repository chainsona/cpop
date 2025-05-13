'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSupabase } from '@/hooks/use-supabase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { XCircle, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  label?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  className,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  label = 'Drag & drop or click to upload',
}: FileUploadProps) {
  const { uploadImage, loading, error } = useSupabase();
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleUpload = useCallback(async (file: File) => {
    setUploadState('uploading');
    setProgress(10);

    // Simulate progress while waiting for server response
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 5;
        return next > 90 ? 90 : next;
      });
    }, 200);

    try {
      const url = await uploadImage(file);

      if (url) {
        clearInterval(progressInterval);
        setProgress(100);
        setUploadedUrl(url);
        setUploadState('success');
        onUploadComplete?.(url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setUploadState('error');
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  }, [uploadImage, onUploadComplete, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const resetUpload = () => {
    setUploadState('idle');
    setProgress(0);
    setUploadedUrl('');
  };

  const renderContent = () => {
    if (uploadState === 'success') {
      return (
        <div className="flex flex-col items-center">
          <div className="mb-2 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-sm text-green-600">Upload successful</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetUpload} 
            className="mt-4"
          >
            Upload Another File
          </Button>
        </div>
      );
    }

    if (uploadState === 'error' || error) {
      return (
        <div className="flex flex-col items-center">
          <div className="mb-2 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-red-600">{error || 'Upload failed'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetUpload} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (uploadState === 'uploading') {
      return (
        <div className="w-full max-w-xs">
          <p className="mb-2 text-sm text-center">Uploading...</p>
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-xs text-center text-muted-foreground">{progress}%</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB</p>
        {fileRejections.length > 0 && (
          <p className="mt-2 text-xs text-red-600">
            {fileRejections[0].errors[0].message}
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
        uploadState === 'error' ? "border-red-500/50 bg-red-500/5" : "",
        uploadState === 'success' ? "border-green-500/50 bg-green-500/5" : "",
        className
      )}
    >
      <input {...getInputProps()} />
      {renderContent()}
    </div>
  );
}
