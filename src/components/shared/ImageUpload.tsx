import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string; // Base64 image data
  onChange: (imageData: string | null) => void;
  label?: string;
  error?: string;
  maxSizeKB?: number; // Maximum file size in KB
  acceptedFormats?: string[]; // Accepted image formats
}

export default function ImageUpload({
  value,
  onChange,
  label = "Question Image",
  error,
  maxSizeKB = 500, // 500KB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileSelect = (file: File) => {
    setUploadError('');
    setUploading(true);

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setUploadError(`Invalid file type. Please upload: ${acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}`);
      setUploading(false);
      return;
    }

    // Validate file size
    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxSizeKB) {
      setUploadError(`File too large. Maximum size: ${maxSizeKB}KB (Current: ${Math.round(fileSizeKB)}KB)`);
      setUploading(false);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      setUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const displayError = error || uploadError;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        <span className="text-gray-500 text-xs ml-1">(Optional)</span>
      </label>

      {value ? (
        // Image preview
        <div className="relative group">
          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <img
              src={value}
              alt="Question image"
              className="w-full h-auto max-h-64 object-contain bg-white"
            />
            
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md opacity-80 hover:opacity-100"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Change image button */}
          <button
            type="button"
            onClick={handleUploadClick}
            className="mt-2 w-full px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            Change Image
          </button>
        </div>
      ) : (
        // Upload area
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleUploadClick}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <div className="space-y-3">
            {uploading ? (
              <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            ) : (
              <ImageIcon className="mx-auto w-12 h-12 text-gray-400" />
            )}
            
            <div>
              <p className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading...' : dragOver ? 'Drop image here' : 'Add Question Image'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {uploading ? 'Please wait' : `Drag & drop or click to upload (Max: ${maxSizeKB}KB)`}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supports: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error message */}
      {displayError && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Add diagrams, circuits, charts, or any visual aid to help students understand the question better.
      </p>
    </div>
  );
} 