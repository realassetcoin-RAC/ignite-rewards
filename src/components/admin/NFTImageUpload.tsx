import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
// Removed Supabase import - using local file handling instead

interface NFTImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  tooltip?: string;
  acceptedFormats?: string[];
  maxSizeMB?: number;
}

export default function NFTImageUpload({
  label,
  value,
  onChange,
  placeholder = "https://example.com/image.png",
  tooltip,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  maxSizeMB = 5
}: NFTImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generate preview URL when value changes
  React.useEffect(() => {
    if (value && (value.startsWith('http') || value.startsWith('blob:'))) {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedFormats.map(f => f.split('/')[1]?.toUpperCase()).join(', ')}`;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      // For local development, create a blob URL instead of uploading to Supabase
      // In production, this would be replaced with a proper file upload endpoint
      const blobUrl = URL.createObjectURL(file);
      
      // Generate a unique identifier for the file
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const fileName = `nft-${timestamp}-${randomId}.${file.name.split('.').pop()}`;
      
      // For now, return the blob URL with a descriptive name
      // In a real implementation, this would upload to a local file server
      const localUrl = `${blobUrl}#${fileName}`;
      
      toast({
        title: "File Ready",
        description: `File ${fileName} is ready for use (local development mode)`,
      });
      
      return localUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File processing failed';
      toast({
        title: "File Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      onChange(uploadedUrl);
      toast({
        title: "Upload Successful",
        description: "Image uploaded and URL generated successfully",
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    onChange('');
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {tooltip && (
          <span className="text-xs text-muted-foreground">({tooltip})</span>
        )}
      </Label>
      
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            {previewUrl ? (
              <div className="relative w-full max-w-xs">
                <img
                  src={previewUrl}
                  alt="NFT Preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Drag and drop an image here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports: {acceptedFormats.map(f => f.split('/')[1]?.toUpperCase()).join(', ')} (max {maxSizeMB}MB)
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
              
              {previewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Input (for manual entry or editing) */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Or enter URL manually:</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
