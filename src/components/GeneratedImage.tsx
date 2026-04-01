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
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/10">
            <Maximize2 className="w-12 h-12" />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-start justify-between gap-4">
        <p className="text-sm text-white/50 font-light leading-relaxed flex-1">
          {description}
        </p>
        
        {image && !loading && (
          <div className="flex gap-2 shrink-0">
            {onRegenerate && (
              <button 
                onClick={onRegenerate}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-xs uppercase tracking-wider"
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}
            {onDownload && (
              <button 
                onClick={onDownload}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-xs uppercase tracking-wider"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
