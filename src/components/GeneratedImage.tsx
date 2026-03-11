import React from 'react';
import { Download, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface GeneratedImageProps {
  image: string | null;
  loading: boolean;
  title: string;
  description: string;
  onDownload?: () => void;
  onRegenerate?: () => void;
  aspectRatio?: "square" | "portrait";
}

export function GeneratedImage({ 
  image, 
  loading, 
  title, 
  description, 
  onDownload,
  onRegenerate,
  aspectRatio = "square" 
}: GeneratedImageProps) {
  return (
    <div className="group relative flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-serif font-light text-white tracking-wide">{title}</h3>
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">AI Generated</span>
      </div>
      
      <div className={cn(
        "relative w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all duration-500",
        aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
        loading && "animate-pulse"
      )}>
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-xs uppercase tracking-widest">Processing</span>
          </div>
        ) : image ? (
          <>
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            
            {/* Actions Overlay */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              {onRegenerate && (
                <button 
                  onClick={onRegenerate}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 transition-all"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              {onDownload && (
                <button 
                  onClick={onDownload}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 transition-all"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/10">
            <Maximize2 className="w-12 h-12" />
          </div>
        )}
      </div>
      
      <p className="mt-3 text-sm text-white/50 font-light leading-relaxed">
        {description}
      </p>
    </div>
  );
}
