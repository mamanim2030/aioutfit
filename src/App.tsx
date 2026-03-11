/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ImageUpload } from './components/ImageUpload';
import { GeneratedImage } from './components/GeneratedImage';
import { AccessGate } from './components/AccessGate';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Camera, ZoomIn, Shirt, Lock, Settings, Key, X, Save } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type GenerationState = {
  loading: boolean;
  image: string | null;
};

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [manualApiKey, setManualApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [selectedModelPreview, setSelectedModelPreview] = useState<string | null>(null);
  
  const [cleanUpState, setCleanUpState] = useState<GenerationState>({ loading: false, image: null });
  const [modelFrontState, setModelFrontState] = useState<GenerationState>({ loading: false, image: null });
  const [modelSideState, setModelSideState] = useState<GenerationState>({ loading: false, image: null });
  
  // 3 Detail Shots
  const [detailTextureState, setDetailTextureState] = useState<GenerationState>({ loading: false, image: null });
  const [detailStitchState, setDetailStitchState] = useState<GenerationState>({ loading: false, image: null });
  const [detailDesignState, setDetailDesignState] = useState<GenerationState>({ loading: false, image: null });

  useEffect(() => {
    // Check for session authorization
    const authorized = sessionStorage.getItem('is_authorized');
    if (authorized) {
      setIsAuthorized(true);
    }

    checkApiKey();
    const storedKey = localStorage.getItem('gemini_manual_key');
    if (storedKey) {
      setManualApiKey(storedKey);
      setHasApiKey(true);
    }
  }, []);

  const handleAccessGranted = () => {
    setIsAuthorized(true);
    sessionStorage.setItem('is_authorized', 'true');
  };

  const checkApiKey = async () => {
    try {
      if (manualApiKey) {
        setHasApiKey(true);
        setIsCheckingKey(false);
        return;
      }

      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for dev environments without the aistudio object
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error checking API key:", e);
      // Don't set false immediately if we might have a manual key
      if (!manualApiKey) setHasApiKey(false);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Error selecting API key:", e);
    }
  };

  const handleSaveManualKey = () => {
    if (tempApiKey.trim()) {
      setManualApiKey(tempApiKey.trim());
      localStorage.setItem('gemini_manual_key', tempApiKey.trim());
      setHasApiKey(true);
      setShowApiKeyModal(false);
    }
  };

  const getAIClient = () => {
    if (manualApiKey) {
      return new GoogleGenAI({ apiKey: manualApiKey });
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  };

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset states
    setCleanUpState({ loading: false, image: null });
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
    setDetailTextureState({ loading: false, image: null });
    setDetailStitchState({ loading: false, image: null });
    setDetailDesignState({ loading: false, image: null });
  };

  const handleModelSelect = (file: File) => {
    setSelectedModelFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedModelPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset model states
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
  };

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedImagePreview(null);
    setCleanUpState({ loading: false, image: null });
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
    setDetailTextureState({ loading: false, image: null });
    setDetailStitchState({ loading: false, image: null });
    setDetailDesignState({ loading: false, image: null });
  };

  const handleModelClear = () => {
    setSelectedModelFile(null);
    setSelectedModelPreview(null);
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
  };

  const fileToGenerativePart = async (file: File) => {
    return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateAll = async () => {
    if (!selectedFile) return;

    generateCleanUp();
    generateModelFrontShot();
    generateModelSideShot();
    generateDetailShots();
  };

  const generateCleanUp = async () => {
    if (!selectedFile) return;
    setCleanUpState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const imagePart = await fileToGenerativePart(selectedFile);
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            imagePart,
            { text: "Professional product photography of this exact clothing item. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Smooth texture, perfect studio lighting, clean white or neutral grey background. High resolution, 4k. Keep the original design and color exactly as is, just make it look pristine and brand new." }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setCleanUpState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
      } else {
        setCleanUpState({ loading: false, image: null });
      }
    } catch (error) {
      console.error("Error generating clean up:", error);
      setCleanUpState({ loading: false, image: null });
    }
  };

  const generateModelFrontShot = async () => {
    if (!selectedFile) return;
    setModelFrontState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = await fileToGenerativePart(selectedFile);
      const parts: any[] = [clothingPart];
      
      let prompt = "A professional Korean fashion model wearing this exact clothing item. Front view. Full body shot. High fashion editorial style photography. Neutral, elegant background. The model should be posing naturally. Ensure the clothing item looks realistic and fits well. Cinematic lighting.";

      if (selectedModelFile) {
        const modelPart = await fileToGenerativePart(selectedModelFile);
        parts.push(modelPart);
        prompt = "Image 1 is the clothing item. Image 2 is the target person. Generate a highly realistic, professional fashion editorial photo of the person in Image 2 wearing the exact clothing item from Image 1. Front view. Full body shot. Cinematic lighting. Ensure the clothing fits naturally and the person's identity and facial features are preserved.";
      }
      
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setModelFrontState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
      } else {
        setModelFrontState({ loading: false, image: null });
      }
    } catch (error) {
      console.error("Error generating model front shot:", error);
      setModelFrontState({ loading: false, image: null });
    }
  };

  const generateModelSideShot = async () => {
    if (!selectedFile) return;
    setModelSideState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = await fileToGenerativePart(selectedFile);
      const parts: any[] = [clothingPart];
      
      let prompt = "A professional Korean fashion model wearing this exact clothing item. Side profile view. Full body or 3/4 shot. High fashion editorial style photography. Neutral, elegant background. The model should be posing naturally. Ensure the clothing item looks realistic and fits well. Cinematic lighting.";

      if (selectedModelFile) {
        const modelPart = await fileToGenerativePart(selectedModelFile);
        parts.push(modelPart);
        prompt = "Image 1 is the clothing item. Image 2 is the target person. Generate a highly realistic, professional fashion editorial photo of the person in Image 2 wearing the exact clothing item from Image 1. Side profile view. Full body or 3/4 shot. Cinematic lighting. Ensure the clothing fits naturally and the person's identity and facial features are preserved.";
      }
      
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "1K"
          }
        }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setModelSideState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
      } else {
        setModelSideState({ loading: false, image: null });
      }
    } catch (error) {
      console.error("Error generating model side shot:", error);
      setModelSideState({ loading: false, image: null });
    }
  };

  const generateDetailShots = async () => {
    if (!selectedFile) return;
    
    // 1. Texture
    setDetailTextureState({ loading: true, image: null });
    generateSingleDetail(
      "Extreme close-up macro photography of the fabric texture. Focus on the weave and material quality. Shallow depth of field.",
      setDetailTextureState
    );

    // 2. Stitching
    setDetailStitchState({ loading: true, image: null });
    generateSingleDetail(
      "Macro shot focusing on the stitching details, seams, and construction quality of the clothing. High contrast, sharp details.",
      setDetailStitchState
    );

    // 3. Design Elements
    setDetailDesignState({ loading: true, image: null });
    generateSingleDetail(
      "Close-up detail shot of unique design elements, buttons, zippers, or patterns. Artistic composition.",
      setDetailDesignState
    );
  };

  const generateSingleDetail = async (prompt: string, setState: React.Dispatch<React.SetStateAction<GenerationState>>) => {
    if (!selectedFile) return;
    try {
      const ai = getAIClient();
      const imagePart = await fileToGenerativePart(selectedFile);
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            imagePart,
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
      } else {
        setState({ loading: false, image: null });
      }
    } catch (error) {
      console.error("Error generating detail shot:", error);
      setState({ loading: false, image: null });
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) {
    return <AccessGate onAccessGranted={handleAccessGranted} />;
  }

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/20 pb-20 relative">
      {/* API Key Modal */}
      <AnimatePresence>
        {showApiKeyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif">API Key Configuration</h3>
                <button onClick={() => setShowApiKeyModal(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Google Cloud Project</label>
                  <button
                    onClick={handleSelectKey}
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors text-sm"
                  >
                    <span>Select Project via AI Studio</span>
                    <Sparkles className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1a1a1a] px-2 text-white/40">Or enter manually</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Manual API Key</label>
                  <input 
                    type="password" 
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                <button
                  onClick={handleSaveManualKey}
                  className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="pt-12 pb-8 px-6 md:px-12 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="font-serif text-5xl md:text-7xl font-light tracking-tight text-white mb-2">
              AI Outfit Studio
            </h1>
            <p className="text-white/40 font-sans text-sm tracking-widest uppercase">
              Professional Fashion Enhancement
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <div className="flex gap-8 text-xs font-medium tracking-widest text-white/40 uppercase">
                <span>Clean Up</span>
                <span>Korean Model</span>
                <span>3x Details</span>
              </div>
            </div>
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="API Key Settings"
            >
              <Settings className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </header>

      {!hasApiKey ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-white/40 mt-1 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-medium text-white">Access Required</h3>
                  <p className="text-sm text-white/40">
                    Please configure your API key to start generating images.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="w-full py-4 bg-white text-black rounded-full font-medium tracking-wide hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              Configure Access
            </button>
          </div>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 md:px-12 mt-12">
          {/* Upload Section */}
          <section className="mb-20">
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <ImageUpload 
                  title="Upload Clothing Item"
                  subtitle="Required: Drag and drop or click to browse"
                  onImageSelect={handleImageSelect} 
                  selectedImage={selectedImagePreview}
                  onClear={handleClear}
                />
                <ImageUpload 
                  title="Upload Custom Model"
                  subtitle="Optional: For custom try-on shots"
                  onImageSelect={handleModelSelect} 
                  selectedImage={selectedModelPreview}
                  onClear={handleModelClear}
                />
              </div>
              
              {selectedFile && !cleanUpState.loading && !cleanUpState.image && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={generateAll}
                  className="mt-12 group relative px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate All Assets
                  </span>
                  <div className="absolute inset-0 bg-gray-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </motion.button>
              )}
            </div>
          </section>

          {/* Results Grid */}
          {(cleanUpState.loading || cleanUpState.image || modelFrontState.loading || modelFrontState.image) && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              
              {/* 1. Clean Up */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GeneratedImage
                  title="Pristine Clean-Up"
                  description="Wrinkle-free, studio-quality product shot."
                  image={cleanUpState.image}
                  loading={cleanUpState.loading}
                  aspectRatio="square"
                  onDownload={cleanUpState.image ? () => downloadImage(cleanUpState.image!, 'cleanup.png') : undefined}
                />
              </motion.div>

              {/* 2. Model Front */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GeneratedImage
                  title="Korean Model (Front)"
                  description="Front view editorial shot."
                  image={modelFrontState.image}
                  loading={modelFrontState.loading}
                  aspectRatio="portrait"
                  onDownload={modelFrontState.image ? () => downloadImage(modelFrontState.image!, 'model-front.png') : undefined}
                />
              </motion.div>

              {/* 3. Model Side */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GeneratedImage
                  title="Korean Model (Side)"
                  description="Side profile editorial shot."
                  image={modelSideState.image}
                  loading={modelSideState.loading}
                  aspectRatio="portrait"
                  onDownload={modelSideState.image ? () => downloadImage(modelSideState.image!, 'model-side.png') : undefined}
                />
              </motion.div>
            </section>
          )}

          {/* Detail Shots Grid */}
          {(detailTextureState.loading || detailTextureState.image) && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 4. Texture */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GeneratedImage
                  title="Texture Detail"
                  description="Macro focus on fabric weave."
                  image={detailTextureState.image}
                  loading={detailTextureState.loading}
                  aspectRatio="square"
                  onDownload={detailTextureState.image ? () => downloadImage(detailTextureState.image!, 'detail-texture.png') : undefined}
                />
              </motion.div>

              {/* 5. Stitching */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GeneratedImage
                  title="Stitching Detail"
                  description="Focus on seams and construction."
                  image={detailStitchState.image}
                  loading={detailStitchState.loading}
                  aspectRatio="square"
                  onDownload={detailStitchState.image ? () => downloadImage(detailStitchState.image!, 'detail-stitching.png') : undefined}
                />
              </motion.div>

              {/* 6. Design */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GeneratedImage
                  title="Design Detail"
                  description="Focus on unique elements."
                  image={detailDesignState.image}
                  loading={detailDesignState.loading}
                  aspectRatio="square"
                  onDownload={detailDesignState.image ? () => downloadImage(detailDesignState.image!, 'detail-design.png') : undefined}
                />
              </motion.div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

