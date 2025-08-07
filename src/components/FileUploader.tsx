import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  language: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, language }) => {
  const isArabic = language === 'ar';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "upload-area cursor-pointer",
        isDragActive && "drag-over"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-primary">
          <Upload className="w-8 h-8" />
          <FileText className="w-6 h-6" />
          <Image className="w-6 h-6" />
        </div>
        
        <div className="text-center">
          <h3 className="font-semibold text-lg text-foreground mb-2">
            {isArabic ? '📤 ارفع ملف التحليل' : '📤 Upload Lab Report'}
          </h3>
          <p className="text-muted-foreground">
            {isArabic 
              ? 'PDF أو صورة (JPG/PNG)' 
              : 'PDF or Image (JPG/PNG)'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isArabic 
              ? 'اسحب الملف هنا أو انقر للاختيار' 
              : 'Drag & drop here or click to select'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;