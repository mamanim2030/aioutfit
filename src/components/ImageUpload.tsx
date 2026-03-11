import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: string | null;
  onClear: () => void;
  title?: string;
  subtitle?: string;
}

export function ImageUpload({ 
  onImageSelect, 
  selectedImage, 
  onClear,
  title = "Upload your item",
  subtitle = "Drag and drop or click to browse"
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-8 h-full min-h-[250px] flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer group",
              isDragging 
                ? "border-white/50 bg-white/5" 
                : "border-white/10 hover:border-white/30 hover:bg-white/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById(`file-upload-${title.replace(/\s+/g, '-')}`)?.click()}
          >
            <input
              id={`file-upload-${title.replace(/\s+/g, '-')}`}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
            />
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8 text-white/70" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">{title}</p>
                <p className="text-sm text-white/40 mt-1">{subtitle}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-black/20 border border-white/10 h-full min-h-[250px]"
          >
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="w-full h-full absolute inset-0 object-contain bg-black/40" 
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors border border-white/10 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
              <p className="text-sm text-white/70 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {title}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
