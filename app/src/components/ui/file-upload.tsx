import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  value?: string;
  showPreview?: boolean;
  className?: string;
  accept?: string;
  maxSize?: number;
}

export function FileUpload({
  onFileChange,
  value,
  showPreview = true,
  className,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    value || null
  );
  const [isDragging, setIsDragging] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    processFile(file);
  };

  const processFile = (file: File | null) => {
    if (file) {
      if (maxSize && file.size > maxSize) {
        alert(
          `File size exceeds the maximum allowed size (${
            maxSize / (1024 * 1024)
          }MB)`
        );
        return;
      }

      onFileChange(file);
      if (showPreview) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } else {
      onFileChange(null);
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0] || null;
    processFile(file);

    // Update the input value
    if (file && inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputRef.current.files = dataTransfer.files;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors",
          isDragging
            ? "border-neutral-400 bg-neutral-50"
            : "border-neutral-200",
          previewUrl ? "h-[250px]" : "h-[150px]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="h-full w-full flex items-center justify-center overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <UploadCloud className="h-10 w-10 text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500 mb-1">
              Drag and drop your image here, or click to browse
            </p>
            <p className="text-xs text-neutral-400">
              PNG, JPG, or WEBP up to 5MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm text-neutral-500 hover:underline"
      >
        {previewUrl ? "Change image" : "Select image"}
      </button>
    </div>
  );
}
