import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DatePickerProps {
  date?: Date;
  onChange: (date?: Date) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showFormatHint?: boolean;
}

export function DatePicker({
  date,
  onChange,
  disabled,
  className,
  placeholder = 'Pick a date',
  showFormatHint = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(date ? format(date, 'MM/dd/yyyy') : '');
  const [error, setError] = React.useState<string | null>(null);

  // Update input value when date prop changes from outside
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, 'MM/dd/yyyy'));
      setError(null);
    } else if (date === undefined) {
      setInputValue('');
      setError(null);
    }
  }, [date]);

  const handleSelect = (selected: Date | undefined) => {
    onChange(selected);
    setError(null);
    setIsOpen(false);
  };

  // Convert string to date using strict validation
  const parseDate = (value: string): Date | undefined => {
    try {
      // Skip empty values
      if (!value.trim()) return undefined;

      // Try to parse using format MM/dd/yyyy
      const parsedDate = parse(value, 'MM/dd/yyyy', new Date());

      // Check if valid date and within reasonable range
      if (isValid(parsedDate)) {
        const year = parsedDate.getFullYear();
        // Validate year is reasonable (not too far in past or future)
        if (year >= 1900 && year <= 2100) {
          return parsedDate;
        }
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);

    // Try to parse the date from input
    const parsedDate = parseDate(value);

    // Only update if the date is valid or empty
    if (parsedDate) {
      console.log('Manual date input parsed:', parsedDate);
      onChange(parsedDate);
    } else if (!value) {
      // Empty input, clear the date
      onChange(undefined);
    }
  };

  const handleInputBlur = () => {
    const parsedDate = parseDate(inputValue);

    // On blur, either update with valid date or show error
    if (parsedDate) {
      onChange(parsedDate);
      // Format it consistently
      setInputValue(format(parsedDate, 'MM/dd/yyyy'));
      setError(null);
    } else if (!inputValue) {
      // Empty is valid - just no date
      onChange(undefined);
      setError(null);
    } else {
      // Invalid date format
      setError('Invalid date format');

      // If we already had a date, restore it
      if (date) {
        setInputValue(format(date, 'MM/dd/yyyy'));
      } else {
        setInputValue('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit on Enter key if date is valid
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    }
  };

  return (
    <div className={cn('relative space-y-1', className)}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={placeholder}
            aria-invalid={!!error}
            className={cn('w-full pr-3', error && 'border-red-500 focus-visible:ring-red-500')}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="h-10 w-10 p-0 flex-shrink-0"
          aria-label="Open calendar"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {showFormatHint && !error && (
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Info className="h-3 w-3" />
          <span>Format: MM/DD/YYYY (e.g., 01/31/2024)</span>
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 rounded-md border bg-white p-3 shadow-md">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect}
            showOutsideDays
            className="p-0"
            classNames={{
              day_selected: 'bg-neutral-900 text-white',
              day_today: 'bg-neutral-100',
            }}
          />
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
