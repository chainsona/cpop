'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { poapFormSchema } from '@/lib/validations';
import { z } from 'zod';
import { AlertCircle, UploadCloud, Image as ImageIcon, X, ExternalLink } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface POAPFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    website?: string;
    startDate?: Date;
    endDate?: Date;
    supply?: number;
    attendees?: number;
    settings?: {
      visibility?: 'Public' | 'Unlisted' | 'Private';
      allowSearch?: boolean;
    };
  };
  onSuccess?: (data: any) => void;
}

// Define type with status field to match the form
type FormValues = {
  title: string;
  description: string;
  imageUrl: string;
  startDate?: Date;
  endDate?: Date;
  attendees?: number;
  website?: string;
  settings?: {
    visibility: 'Public' | 'Unlisted' | 'Private';
    allowSearch: boolean;
  };
};

export function POAPForm({ mode = 'create', initialData, onSuccess }: POAPFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Track blob URLs for cleanup
  const [blobUrls, setBlobUrls] = useState<string[]>([]);

  // Store selected dates in local state for better control
  const [startDate, setStartDate] = useState<Date | undefined>(initialData?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialData?.endDate);
  
  // Visibility settings
  const [visibility, setVisibility] = useState<'Public' | 'Unlisted' | 'Private'>(
    initialData?.settings?.visibility || 'Public'
  );
  const [allowSearch, setAllowSearch] = useState<boolean>(
    initialData?.settings?.allowSearch !== undefined ? initialData.settings.allowSearch : true
  );

  // Using a more permissive type to avoid TS issues
  const form = useForm<any>({
    resolver: zodResolver(poapFormSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      imageUrl: initialData?.imageUrl || '',
      website: initialData?.website || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : undefined,
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      attendees: initialData?.attendees,
    },
  });

  // Sync local date state with form
  useEffect(() => {
    if (startDate) {
      form.setValue('startDate', startDate, { shouldValidate: true });
    }

    if (endDate) {
      form.setValue('endDate', endDate, { shouldValidate: true });
    }
  }, [startDate, endDate, form]);

  // Debug form state
  useEffect(() => {
    const subscription = form.watch(value => {
      console.log('Form values:', value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [blobUrls]);

  // Handle form submission including the image upload process
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields using react-hook-form
    const isValid = await form.trigger();
    if (!isValid) {
      console.error('Form validation failed');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setUploadError(null);
      
      const formData = form.getValues();
      let finalImageUrl = formData.imageUrl;
      
      // Upload the image file if one was selected or if the URL is a blob
      if (imageFile || (finalImageUrl && finalImageUrl.startsWith('blob:'))) {
        try {
          // Ensure we have the image file for blob URLs
          const file = imageFile;
          if (!file) {
            throw new Error('Image file is missing');
          }
          
          finalImageUrl = await uploadImage(file);
        } catch (error) {
          console.error('Image upload failed:', error);
          setUploadError('Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Continue with form submission with the image URL
      await onSubmit({
        ...formData,
        imageUrl: finalImageUrl,
        settings: {
          visibility,
          allowSearch,
        }
      });
    } catch (error) {
      console.error('Form submission failed:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image upload function
  const uploadImage = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      // Simulate upload progress (in a real app, you'd use actual upload progress events)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      // Convert the image to base64
      const reader = new FileReader();
      reader.onload = () => {
        // Clear the interval and set progress to 100% when done
        clearInterval(interval);
        setUploadProgress(100);
        
        // Resolve with the base64 data URL
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        clearInterval(interval);
        setUploadProgress(0);
        reject(new Error('Failed to read image file'));
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle image selection (via file input)
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Selected file is not an image');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setUploadError(null);
      
      // Set a temporary blob URL to show the preview and pass validation
      const blobUrl = URL.createObjectURL(file);
      setBlobUrls(prev => [...prev, blobUrl]);
      form.setValue('imageUrl', blobUrl, { shouldValidate: true });
    }
  };

  // Handle image drop (for drag and drop)
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Selected file is not an image');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setUploadError(null);
      
      // Set a temporary blob URL to show the preview and pass validation
      const blobUrl = URL.createObjectURL(file);
      setBlobUrls(prev => [...prev, blobUrl]);
      form.setValue('imageUrl', blobUrl, { shouldValidate: true });
    }
  };

  // Handle drag over (for drag and drop)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle external image URL input
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue('imageUrl', url, { shouldValidate: true });
    
    // Clear the file if an external URL is provided
    if (url && !url.startsWith('blob:') && imageFile) {
      setImageFile(null);
    }
  };

  // Clear the image selection
  const handleClearImage = () => {
    const currentUrl = form.getValues('imageUrl');
    
    // Revoke the blob URL if it exists
    if (currentUrl && currentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentUrl);
      setBlobUrls(prev => prev.filter(url => url !== currentUrl));
    }
    
    form.setValue('imageUrl', '', { shouldValidate: true });
    setImageFile(null);
  };

  const onSubmit = async (data: any) => {
    try {
      // At this point, startDate and endDate should be defined
      // because we check them in the handleSubmit function
      if (!startDate || !endDate) {
        throw new Error('Missing date values');
      }

      // If no image is provided, use the placeholder
      if (!data.imageUrl || data.imageUrl.trim() === '') {
        data.imageUrl = 'https://placehold.co/600x400?text=POAP+Image';
      }

      // Format dates for submission
      const formattedData = {
        ...data,
        // Ensure dates are properly formatted ISO strings for API transmission
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      console.log('Submitting data:', formattedData);

      // Determine if we're creating or updating
      const endpoint = mode === 'create' ? '/api/poaps' : `/api/poaps/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      console.log(`Making ${method} request to ${endpoint}`);

      // Submit the form data to the API
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const responseData = await response.json();

      console.log('API response:', responseData);

      if (!response.ok) {
        console.error('API response error:', responseData);
        throw new Error(responseData.error || responseData.message || 'Failed to process POAP');
      }

      // If we're editing and the update was successful, check if we need to update token metadata
      if (mode === 'edit' && initialData?.id) {
        const hasMetadataChanges =
          data.title !== initialData.title ||
          data.description !== initialData.description ||
          data.imageUrl !== initialData.imageUrl;

        if (hasMetadataChanges) {
          // Display banner on the next page informing the user to update metadata
          localStorage.setItem(`poap-${initialData.id}-metadata-outdated`, 'true');
        }
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(responseData);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setUploadError(error instanceof Error ? error.message : 'An unknown error occurred');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a preview if we have an image URL
  const showImagePreview = form.watch('imageUrl');

  // Handle date selection with local state
  const handleStartDateChange = (date: Date | undefined) => {
    console.log('Setting start date:', date);
    // Ensure we have a valid Date object
    setStartDate(date ? new Date(date) : undefined);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    console.log('Setting end date:', date);
    // Ensure we have a valid Date object
    setEndDate(date ? new Date(date) : undefined);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm">{uploadError}</p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Enter POAP title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter POAP description"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image</FormLabel>
              
              {/* Image Upload/Preview Area */}
              <div 
                className="border-2 border-dashed border-neutral-300 rounded-md p-4 text-center"
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
              >
                {showImagePreview ? (
                  <div className="relative">
                    <img 
                      src={field.value} 
                      alt="POAP Preview" 
                      className="mx-auto h-60 object-contain rounded-md"
                    />
                    
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <UploadCloud className="h-10 w-10 text-neutral-400" />
                    </div>
                    <div className="text-neutral-700">
                      <p className="font-medium">Drag & drop your image here (optional)</p>
                      <p className="text-sm text-neutral-500">
                        or click to select a file (PNG, JPG, GIF, up to 5MB)
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        A placeholder image will be used if none is provided
                      </p>
                    </div>
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-4">
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Uploading: {uploadProgress}%
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {!showImagePreview && (
                  <Button
                    type="button"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    variant="outline"
                    className="mt-4"
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Select Image
                  </Button>
                )}
              </div>
              
              {/* External URL Option */}
              <div className="mt-2">
                <FormLabel>or enter an image URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    onChange={handleImageUrlChange}
                    value={field.value && !field.value.startsWith('blob:') ? field.value : ''}
                  />
                </FormControl>
              </div>
              
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="col-span-full mb-2">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <p>
                You can enter dates by typing (MM/DD/YYYY format) or using the calendar picker.
                Start date and end date can be the same day.
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">
                  Start Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={startDate || (field.value as Date | undefined)}
                    onChange={handleStartDateChange}
                    placeholder="Enter start date"
                    showFormatHint={true}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-1">
                  End Date <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={endDate || (field.value as Date | undefined)}
                    onChange={handleEndDateChange}
                    placeholder="Enter end date"
                    showFormatHint={true}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="attendees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attendees</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter maximum attendees"
                  disabled={isSubmitting}
                  {...field}
                  onChange={e => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    field.onChange(value);
                  }}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="settings">
            <AccordionTrigger className="font-medium">Advanced Settings</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-2">
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <ExternalLink className="h-5 w-5 text-blue-600 mr-2" />
                    Visibility
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="visibility">Public Visibility</Label>
                      <Select value={visibility} onValueChange={(value: 'Public' | 'Unlisted' | 'Private') => setVisibility(value)}>
                        <SelectTrigger id="visibility" className="mt-1">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Public">Public (visible to everyone)</SelectItem>
                          <SelectItem value="Unlisted">Unlisted (only via direct link)</SelectItem>
                          <SelectItem value="Private">Private (only for specific users)</SelectItem>
                        </SelectContent>
                      </Select>

                      <p className="text-xs text-neutral-500 mt-1">
                        {visibility === 'Public' &&
                          'Your POAP will be visible to anyone and appear in public listings.'}
                        {visibility === 'Unlisted' &&
                          'Your POAP will only be visible to people with the direct link.'}
                        {visibility === 'Private' &&
                          'Your POAP will only be visible to specific users you designate.'}
                      </p>
                    </div>

                    {visibility !== 'Private' && (
                      <div className="flex items-center mt-4">
                        <input
                          type="checkbox"
                          id="allowSearch"
                          checked={allowSearch}
                          onChange={e => setAllowSearch(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="allowSearch" className="ml-2 text-sm font-normal cursor-pointer">
                          Allow this POAP to appear in search results
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                {uploadProgress > 0 && uploadProgress < 100
                  ? 'Uploading...'
                  : mode === 'create'
                    ? 'Creating...'
                    : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create POAP'
            ) : (
              'Update POAP'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
