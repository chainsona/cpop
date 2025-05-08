'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { poapFormSchema } from '@/lib/validations';
import { AlertCircle, UploadCloud, Image as ImageIcon, X } from 'lucide-react';

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
    status?: 'Draft' | 'Published' | 'Distributed';
  };
  onSuccess?: (data: any) => void;
}

export function POAPForm({ mode = 'create', initialData, onSuccess }: POAPFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Store selected dates in local state for better control
  const [startDate, setStartDate] = useState<Date | undefined>(initialData?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialData?.endDate);

  // Using a more permissive type to avoid TS issues while preserving functionality
  const form = useForm({
    resolver: zodResolver(poapFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      imageUrl: initialData?.imageUrl || '',
      website: initialData?.website || '',
      startDate: initialData?.startDate,
      endDate: initialData?.endDate,
      supply: initialData?.supply,
      status: initialData?.status || 'Draft',
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

  // Server-side upload function with progress simulation
  const uploadImageToServer = async (file: File): Promise<string> => {
    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress since fetch doesn't have built-in progress tracking
      setUploadProgress(10);

      // Simulate progress to 40% after 500ms to show activity
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const nextProgress = prev + 5;
          return nextProgress < 40 ? nextProgress : 40;
        });
      }, 500);

      // Upload the file to our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      setUploadProgress(90);

      const data = await response.json();
      setUploadProgress(100);

      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle image upload first before form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setUploadError(null);
    setUploadProgress(0);

    // Initial validation for required fields
    if (!startDate) {
      setUploadError('Please select a start date');
      setIsSubmitting(false);
      return;
    }

    if (!endDate) {
      setUploadError('Please select an end date');
      setIsSubmitting(false);
      return;
    }

    // Debug dates
    console.log('Start date before submission:', {
      value: startDate,
      type: typeof startDate,
      isDate: startDate instanceof Date,
      iso: startDate instanceof Date ? startDate.toISOString() : 'Not a date',
    });

    console.log('End date before submission:', {
      value: endDate,
      type: typeof endDate,
      isDate: endDate instanceof Date,
      iso: endDate instanceof Date ? endDate.toISOString() : 'Not a date',
    });

    try {
      // Handle image upload first if there's a file
      let imageUrl = form.getValues('imageUrl');

      if (imageFile) {
        try {
          // Use server-side upload instead of direct Supabase upload
          imageUrl = await uploadImageToServer(imageFile);
          form.setValue('imageUrl', imageUrl, { shouldValidate: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
          setUploadError(errorMessage);
          setIsSubmitting(false);
          return;
        }
      }

      // Now trigger the form validation and submission
      form.handleSubmit(onSubmit)();
    } catch (error) {
      console.error('Error in submission:', error);
      setUploadError(error instanceof Error ? error.message : 'Error processing form');
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // At this point, startDate and endDate should be defined
      // because we check them in the handleSubmit function
      if (!startDate || !endDate) {
        throw new Error('Missing date values');
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

      // Submit the form data to the API
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API response error:', responseData);
        throw new Error(responseData.error || responseData.message || 'Failed to process POAP');
      }

      // Handle success
      if (onSuccess) {
        onSuccess(responseData);
      } else {
        // Default redirect to POAPs list
        window.location.href = '/poaps';
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} POAP:`, error);
      setUploadError(error instanceof Error ? error.message : `Failed to ${mode} POAP`);
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (file: File | null) => {
    setImageFile(file);
    setUploadError(null);
    if (file) {
      // Set a temporary URL for preview
      const reader = new FileReader();
      reader.onload = () => {
        form.setValue('imageUrl', ''); // Clear any existing URL
        setUploadProgress(0); // Reset progress
      };
      reader.readAsDataURL(file);
    }
  };

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
              <FormLabel>Title</FormLabel>
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
              <FormLabel>Description</FormLabel>
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
              <FormLabel>
                Image <span className="text-xs text-neutral-500">(stored in Supabase Storage)</span>
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {/* File Upload Area */}
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors 
                    ${imageFile ? 'h-[250px]' : 'h-[150px]'} 
                    ${
                      uploadError
                        ? 'border-red-300 bg-red-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    {imageFile ? (
                      <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
                        {/* Preview */}
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain"
                        />

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-white rounded-lg p-4 w-64 shadow-lg">
                              <div className="text-xs font-medium mb-1">
                                Uploading to Supabase Storage...
                              </div>
                              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                              <div className="text-right text-xs mt-1 text-neutral-500">
                                {uploadProgress}%
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Clear Button */}
                        <button
                          type="button"
                          onClick={() => {
                            handleFileChange(null);
                            field.onChange('');
                          }}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full text-neutral-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : field.value && !field.value.startsWith('data:') ? (
                      // Remote Image URL display
                      <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
                        <img
                          src={field.value}
                          alt="Image URL preview"
                          className="max-h-full max-w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange('');
                          }}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full text-neutral-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      // Upload prompt
                      <div className="flex flex-col items-center justify-center text-center h-full">
                        <UploadCloud className="h-10 w-10 text-neutral-400 mb-2" />
                        <p className="text-sm text-neutral-500 mb-1">
                          Drag and drop your image here, or click to browse
                        </p>
                        <p className="text-xs text-neutral-400">JPG, PNG, WEBP, or GIF up to 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange(file);
                      }}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <p className="text-xs text-neutral-500 font-medium">Or enter an image URL:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={field.value}
                        onChange={e => {
                          field.onChange(e.target.value);
                          setImageFile(null);
                        }}
                        disabled={isSubmitting || !!imageFile}
                      />
                      {field.value && !imageFile && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => field.onChange('')}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
                    https://
                  </div>
                  <Input
                    className="pl-[72px]"
                    placeholder="example.com"
                    value={field.value?.replace(/^https?:\/\//, '') || ''}
                    onChange={e => {
                      const input = e.target.value;
                      // Remove any protocol prefix the user might type
                      const sanitized = input.replace(/^https?:\/\//, '');
                      // Add https:// prefix for the actual value
                      field.onChange(sanitized ? `https://${sanitized}` : '');
                    }}
                  />
                </div>
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
          name="supply"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supply (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter maximum supply"
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

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Distributed">Distributed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

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
