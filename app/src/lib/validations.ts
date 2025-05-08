import { z } from 'zod';
import { parse, isValid } from 'date-fns';

// Custom date parser for flexibility in inputs
const dateSchema = z.preprocess(
  // Input can be a Date, string in MM/DD/YYYY format, or ISO string, or undefined
  arg => {
    if (arg instanceof Date) return arg;
    if (typeof arg === 'string') {
      try {
        // Check if it's an ISO string first
        const isoDate = new Date(arg);
        if (isValid(isoDate)) return isoDate;

        // Fall back to parsing as MM/DD/YYYY
        const parsed = parse(arg, 'MM/dd/yyyy', new Date());
        return isValid(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  },
  z.date({
    required_error: 'Please select a date.',
    invalid_type_error: 'Please enter a valid date in MM/DD/YYYY format.',
  })
);

export const poapFormSchema = z
  .object({
    title: z.string().min(3, {
      message: 'Title must be at least 3 characters.',
    }),
    description: z.string().min(10, {
      message: 'Description must be at least 10 characters.',
    }),
    imageUrl: z
      .string()
      .min(1, {
        message: 'Please upload an image or provide an image URL.',
      })
      .refine(val => val.startsWith('http') || val.startsWith('data:image'), {
        message: 'Please provide a valid image URL or upload an image.',
      }),
    website: z
      .string()
      .url({
        message: 'Please enter a valid website URL.',
      })
      .optional()
      .or(z.literal('')),
    startDate: dateSchema,
    endDate: dateSchema,
    supply: z.number().int().positive().optional().nullable(),
    status: z.enum(['Draft', 'Published', 'Distributed']).default('Draft'),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        // Allow end date to be the same as start date
        // Start date is considered 00:00:00 UTC and end date is 23:59:59.999 UTC
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after the start date.',
      path: ['endDate'],
    }
  );

// Export type for the form values
export type PoapFormValues = z.infer<typeof poapFormSchema>;
