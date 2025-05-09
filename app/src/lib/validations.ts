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

// Optional date schema that allows undefined values
const optionalDateSchema = dateSchema.optional();

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
    attendees: z.number().int().positive().optional().nullable(),
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

// Distribution validation schemas

// Claim Links validation
export const claimLinksSchema = z.object({
  amount: z.number().int().min(1, { message: 'You must create at least 1 claim link' }),
  expiryDate: optionalDateSchema,
});

export type ClaimLinksValues = z.infer<typeof claimLinksSchema>;

// Secret Word validation
export const secretWordSchema = z
  .object({
    word: z.string().min(3, { message: 'Secret word must be at least 3 characters' }),
    maxClaims: z.number().int().positive().nullable().optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after the start date.',
      path: ['endDate'],
    }
  );

export type SecretWordValues = z.infer<typeof secretWordSchema>;

// Location Based validation
export const locationBasedSchema = z
  .object({
    city: z.string().min(1, { message: 'City is required' }),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    radius: z.number().int().min(50).max(5000).default(500),
    maxClaims: z.number().int().positive().nullable().optional(),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after the start date.',
      path: ['endDate'],
    }
  );

export type LocationBasedValues = z.infer<typeof locationBasedSchema>;

// Attributes validation schemas

// Artist validation
export const artistSchema = z.object({
  name: z.string().min(1, { message: 'Artist name is required' }),
  url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

export type ArtistValues = z.infer<typeof artistSchema>;

// Organization validation
export const organizationSchema = z.object({
  name: z.string().min(1, { message: 'Organization name is required' }),
  url: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

export type OrganizationValues = z.infer<typeof organizationSchema>;

// Attributes validation (includes artists and organization)
export const attributesSchema = z.object({
  eventType: z.enum(['Physical', 'Online']).default('Physical'),
  platform: z.string().optional().nullable(),
  platformUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')).nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  artists: z.array(artistSchema).optional().nullable(),
  organization: organizationSchema.optional().nullable(),
});

export type AttributesValues = z.infer<typeof attributesSchema>;

// Settings validation schema
export const settingsSchema = z
  .object({
    defaultStartDate: optionalDateSchema.nullable(),
    defaultEndDate: optionalDateSchema.nullable(),
    includeTime: z.boolean().default(false),
    visibility: z.enum(['Public', 'Unlisted', 'Private']).default('Public'),
    allowSearch: z.boolean().default(true),
    notifyOnClaim: z.boolean().default(true),
  })
  .refine(
    data => {
      if (data.defaultStartDate && data.defaultEndDate) {
        return data.defaultEndDate >= data.defaultStartDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after the start date.',
      path: ['defaultEndDate'],
    }
  );

export type SettingsValues = z.infer<typeof settingsSchema>;
