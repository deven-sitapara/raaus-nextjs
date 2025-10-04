"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface FileUploadProps {
  label?: string;
  error?: string;
  required?: boolean;
  onChange: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  description?: string;
  className?: string;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      error,
      required,
      onChange,
      accept = "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp3,.wav,.ogg",
      multiple = true,
      maxFiles = 5,
      maxSize = 256,
      description,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [sizeError, setSizeError] = React.useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const filesArray = Array.from(files);

      // Check file count
      if (filesArray.length > maxFiles) {
        setSizeError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check total size
      const totalSize = filesArray.reduce((acc, file) => acc + file.size, 0);
      const totalSizeMB = totalSize / (1024 * 1024);

      if (totalSizeMB > maxSize) {
        setSizeError(`Total file size must not exceed ${maxSize}MB`);
        return;
      }

      setSizeError("");
      setSelectedFiles(filesArray);
      onChange(files);
    };

    const removeFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);

      // Create a new FileList-like object
      const dataTransfer = new DataTransfer();
      newFiles.forEach((file) => dataTransfer.items.add(file));
      onChange(dataTransfer.files);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        {description && (
          <p className="text-sm text-gray-500 mb-2">{description}</p>
        )}
        <div
          className={cn(
            "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg p-6",
            "border-gray-300 hover:border-gray-400 transition-colors",
            error && "border-red-500",
            className
          )}
        >
          <input
            ref={ref}
            type="file"
            onChange={handleFileChange}
            accept={accept}
            multiple={multiple}
            className="hidden"
            id="file-upload"
            {...props}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <svg
              className="w-10 h-10 text-gray-400 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, {maxSize}MB total
            </p>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {(error || sizeError) && (
          <p className="mt-1 text-sm text-red-600">{error || sizeError}</p>
        )}
      </div>
    );
  }
);
FileUpload.displayName = "FileUpload";

export { FileUpload };
