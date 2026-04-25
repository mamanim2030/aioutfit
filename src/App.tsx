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
import { Sparkles, Camera, ZoomIn, Shirt, Lock, Settings, Key, X, Save, RefreshCw, ChevronDown, ChevronUp, BookOpen, Info } from 'lucide-react';

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
  
  const [selectedBackFile, setSelectedBackFile] = useState<File | null>(null);
  const [selectedBackPreview, setSelectedBackPreview] = useState<string | null>(null);
  
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState<File | null>(null);
  const [selectedBackgroundPreview, setSelectedBackgroundPreview] = useState<string | null>(null);
  
  const [scaleReferenceFile, setScaleReferenceFile] = useState<File | null>(null);
  const [scaleReferencePreview, setScaleReferencePreview] = useState<string | null>(null);
  
  const [cleanUpFrontState, setCleanUpFrontState] = useState<GenerationState>({ loading: false, image: null });
  const [cleanUpBackState, setCleanUpBackState] = useState<GenerationState>({ loading: false, image: null });
  const [modelFrontState, setModelFrontState] = useState<GenerationState>({ loading: false, image: null });
  const [modelSideState, setModelSideState] = useState<GenerationState>({ loading: false, image: null });
  const [modelBackState, setModelBackState] = useState<GenerationState>({ loading: false, image: null });
  const [modelFullBodyState, setModelFullBodyState] = useState<GenerationState>({ loading: false, image: null });
  const [modelCoordinationState, setModelCoordinationState] = useState<GenerationState>({ loading: false, image: null });
  
  // 3 Detail Shots
  const [detailTextureState, setDetailTextureState] = useState<GenerationState>({ loading: false, image: null });
  const [detailStitchState, setDetailStitchState] = useState<GenerationState>({ loading: false, image: null });
  const [detailDesignState, setDetailDesignState] = useState<GenerationState>({ loading: false, image: null });
  
  const [enableDetailShots, setEnableDetailShots] = useState(false);
  const [enableCoordinationShot, setEnableCoordinationShot] = useState(false);
  const [modelGender, setModelGender] = useState<'female' | 'male' | 'unisex'>('female');
  const [modelFit, setModelFit] = useState<'overfit' | 'regular' | 'slim'>('regular');
  const [modelStyle, setModelStyle] = useState<'Casual' | 'Classic' | 'Streetwear' | 'Business casual' | 'Chic' | 'Preppy' | 'Athleisure'>('Classic');
  const [modelPose, setModelPose] = useState<'natural' | 'walking' | 'hands-in-pockets' | 'slight-turn' | 'dynamic'>('natural');
  const [targetColor, setTargetColor] = useState<string>('');
  const [clothingCategory, setClothingCategory] = useState<'auto' | 'top' | 'bottom' | 'outerwear' | 'dress' | 'accessory'>('auto');
  const [showManual, setShowManual] = useState(false);

  const getFramingInstruction = (isCloseUp: boolean, viewBack?: boolean) => {
    let focusInstruction = '';
    
    if (isCloseUp) {
      if (clothingCategory === 'accessory') {
        focusInstruction = 'CRITICAL REQUIREMENT: The item is an ACCESSORY (hat, bag, shoes, etc.). You MUST tightly frame the shot to clearly feature the accessory correctly worn or held by the model.';
      } else if (clothingCategory === 'bottom') {
        focusInstruction = 'CRITICAL REQUIREMENT: The clothing item is a BOTTOM (pants, skirt, shorts, etc). You MUST frame the shot from the waist down to the shoes. NEVER crop the legs. The lower body and feet must be completely visible.';
      } else if (clothingCategory === 'top') {
        focusInstruction = 'CRITICAL REQUIREMENT: The clothing item is a TOP. Focus the crop heavily on the torso and upper body.';
      } else if (clothingCategory === 'dress') {
        focusInstruction = 'CRITICAL REQUIREMENT: The clothing item is a DRESS or FULL-BODY piece. Ensure the framing shows the entire length of the garment.';
      } else if (clothingCategory === 'outerwear') {
        focusInstruction = 'CRITICAL REQUIREMENT: The clothing item is OUTERWEAR. Focus the crop on the upper body and layering.';
      } else {
        focusInstruction = 'CRITICAL REQUIREMENT: Visually analyze the uploaded item. If it is an accessory, frame it correctly. If it is a BOTTOM, frame from waist down. If it is a top, focus the crop on the torso.';
      }

      return `CLOSE-UP SHOT focusing heavily on the item's details and fit. ${focusInstruction} The crop should be tight on the target item while obeying the framing requirement.`;
    } else {
      if (clothingCategory === 'accessory') {
        focusInstruction = 'Ensure the accessory is clearly visible and correctly proportioned to the full body.';
      } else if (clothingCategory === 'bottom') {
        focusInstruction = 'Ensure the styling highlights the lower body.';
      } else if (clothingCategory === 'top') {
        focusInstruction = 'Ensure the outfit is perfectly coordinated with matching bottoms.';
      }

      return `FULL BODY SHOT cropped from the chin down. CRITICAL REQUIREMENT: The torso, legs, and shoes MUST all be completely visible in the frame. DO NOT crop the image to only show the lower body. The full silhouette from the neck down to the feet must be clearly shown. The face must NOT be visible. ${focusInstruction}`;
    }
  };

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
      if (manualApiKey || localStorage.getItem('gemini_manual_key')) {
        setHasApiKey(true);
        setIsCheckingKey(false);
        return;
      }

      setHasApiKey(false);
    } catch (e) {
      console.error("Error checking API key:", e);
      if (!manualApiKey) setHasApiKey(false);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSaveManualKey = () => {
    const key = tempApiKey.trim();
    setManualApiKey(key);
    if (key) {
      localStorage.setItem('gemini_manual_key', key);
      setHasApiKey(true);
    } else {
      localStorage.removeItem('gemini_manual_key');
      setHasApiKey(false);
    }
    setShowApiKeyModal(false);
  };

  const getAIClient = () => {
    if (manualApiKey) {
      return new GoogleGenAI({ apiKey: manualApiKey });
    }
    
    // If no key is available, prompt the user
    setShowApiKeyModal(true);
    throw new Error("API key is missing. Please enter your Gemini API key in Settings.");
  };

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset states
    setCleanUpFrontState({ loading: false, image: null });
    setCleanUpBackState({ loading: false, image: null });
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
    setModelFullBodyState({ loading: false, image: null });
    setModelCoordinationState({ loading: false, image: null });
    setDetailTextureState({ loading: false, image: null });
    setDetailStitchState({ loading: false, image: null });
    setDetailDesignState({ loading: false, image: null });
  };

  const handleBackSelect = (file: File) => {
    setSelectedBackFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedBackPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset back related states
    setCleanUpBackState({ loading: false, image: null });
  };

  const handleBackgroundSelect = (file: File) => {
    setSelectedBackgroundFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedBackgroundPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset background related states
    setModelFullBodyState({ loading: false, image: null });
  };

  const handleScaleReferenceSelect = (file: File) => {
    setScaleReferenceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setScaleReferencePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Reset model states
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
    setModelBackState({ loading: false, image: null });
    setModelFullBodyState({ loading: false, image: null });
  };

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedImagePreview(null);
    setSelectedBackFile(null);
    setSelectedBackPreview(null);
    setSelectedBackgroundFile(null);
    setSelectedBackgroundPreview(null);
    setScaleReferenceFile(null);
    setScaleReferencePreview(null);
    setCleanUpFrontState({ loading: false, image: null });
    setCleanUpBackState({ loading: false, image: null });
    setModelFrontState({ loading: false, image: null });
    setModelSideState({ loading: false, image: null });
    setModelFullBodyState({ loading: false, image: null });
    setModelCoordinationState({ loading: false, image: null });
    setDetailTextureState({ loading: false, image: null });
    setDetailStitchState({ loading: false, image: null });
    setDetailDesignState({ loading: false, image: null });
  };

  const handleBackClear = () => {
    setSelectedBackFile(null);
    setSelectedBackPreview(null);
    setCleanUpBackState({ loading: false, image: null });
  };

  const handleBackgroundClear = () => {
    setSelectedBackgroundFile(null);
    setSelectedBackgroundPreview(null);
    setModelFullBodyState({ loading: false, image: null });
  };

  const handleScaleReferenceClear = () => {
    setScaleReferenceFile(null);
    setScaleReferencePreview(null);
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

  const getCleanUpSourcePart = async () => {
    if (cleanUpFrontState.image) {
      return {
        inlineData: {
          data: cleanUpFrontState.image.split(',')[1],
          mimeType: 'image/png'
        }
      };
    } else if (selectedFile) {
      return await fileToGenerativePart(selectedFile);
    }
    return undefined;
  };

  const generateAll = async () => {
    if (!selectedFile) return;

    // Start detail shots immediately if enabled
    if (enableDetailShots) {
      generateDetailShots();
    }

    // Generate clean up front and back
    const cleanUpFrontBase64 = await generateCleanUpFront();
    const cleanUpBackBase64 = await generateCleanUpBack(cleanUpFrontBase64);
    
    let sourcePart;
    if (cleanUpFrontBase64) {
      sourcePart = {
        inlineData: {
          data: cleanUpFrontBase64,
          mimeType: 'image/png'
        }
      };
    } else {
      sourcePart = await fileToGenerativePart(selectedFile);
    }

    let backSourcePart;
    if (cleanUpBackBase64) {
      backSourcePart = {
        inlineData: {
          data: cleanUpBackBase64,
          mimeType: 'image/png'
        }
      };
    } else if (selectedBackFile) {
      backSourcePart = await fileToGenerativePart(selectedBackFile);
    } else {
      backSourcePart = sourcePart; // Fallback to front if no back image exists
    }

    // Pass the cleaned-up image (or original fallback) to model shots
    generateModelFrontShot(sourcePart);
    generateModelSideShot(sourcePart);
    generateModelBackShot(backSourcePart);
    
    // Generate coordination first, then use it for full body
    let coordinationPart;
    if (enableCoordinationShot) {
      const coordinationBase64 = await generateCoordination(sourcePart);
      if (coordinationBase64) {
        coordinationPart = {
          inlineData: {
            data: coordinationBase64,
            mimeType: 'image/png'
          }
        };
      }
    }
    generateModelFullBody(sourcePart, coordinationPart);
  };

  const generateCleanUpFront = async () => {
    if (!selectedFile) return null;
    setCleanUpFrontState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const imagePart = await fileToGenerativePart(selectedFile);
      
      let prompt = "Professional product photography of this exact clothing item. Front view. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Smooth texture, perfect studio lighting, clean white or neutral grey background. High resolution, 4k. ";
      if (targetColor) {
        prompt += `Change the color of the clothing to exactly match this hex color code: ${targetColor}. Ensure the fabric texture and shading remain realistic while adopting this new color. `;
      } else {
        prompt += "Keep the original design and color exactly as is, just make it look pristine and brand new.";
      }

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
        setCleanUpFrontState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
        return generatedImage;
      } else {
        setCleanUpFrontState({ loading: false, image: null });
        return null;
      }
    } catch (error) {
      console.error("Error generating clean up front:", error);
      setCleanUpFrontState({ loading: false, image: null });
      return null;
    }
  };

  const generateCleanUpBack = async (frontBase64?: string | null) => {
    if (!selectedFile && !selectedBackFile) return null;
    setCleanUpBackState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      
      const sourceFile = selectedBackFile || selectedFile!;
      const imagePart = await fileToGenerativePart(sourceFile);
      const parts: any[] = [imagePart];
      
      let prompt = "Professional product photography of this exact clothing item. Back view. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Smooth texture, perfect studio lighting, clean white or neutral grey background. High resolution, 4k. ";
      if (targetColor) {
        prompt += `Change the color of the clothing to exactly match this hex color code: ${targetColor}. Ensure the fabric texture and shading remain realistic while adopting this new color. `;
      } else {
        prompt += "Keep the original design and color exactly as is, just make it look pristine and brand new.";
      }

      const referenceFront = frontBase64 || (cleanUpFrontState.image ? cleanUpFrontState.image.split(',')[1] : null);

      if (referenceFront) {
        parts.push({
          inlineData: {
            data: referenceFront,
            mimeType: 'image/png'
          }
        });
        
        if (selectedBackFile) {
          prompt = "Image 1 is the original clothing (back view). Image 2 is the cleaned-up FRONT view of the SAME clothing. Generate the cleaned-up BACK view of this clothing based on Image 1. It is ABSOLUTELY CRITICAL that the color, fabric texture, and lighting of the back view EXACTLY MATCH Image 2. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Clean white or neutral grey background. High resolution, 4k.";
        } else {
          prompt = "Image 1 is the original clothing (front view). Image 2 is the cleaned-up FRONT view of the SAME clothing. Generate the cleaned-up BACK view of this clothing. It is ABSOLUTELY CRITICAL that the color, fabric texture, and lighting of the back view EXACTLY MATCH Image 2. Flat lay or invisible mannequin. Completely remove all wrinkles and creases. Clean white or neutral grey background. High resolution, 4k.";
        }
        
        if (targetColor) {
           prompt += ` The clothing color MUST be changed to the hex color code: ${targetColor}, matching Image 2.`;
        }
      }

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setCleanUpBackState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
        return generatedImage;
      } else {
        setCleanUpBackState({ loading: false, image: null });
        return null;
      }
    } catch (error) {
      console.error("Error generating clean up back:", error);
      setCleanUpBackState({ loading: false, image: null });
      return null;
    }
  };

  const generateModelFrontShot = async (sourcePartOverride?: any) => {
    if (!selectedFile && !sourcePartOverride) return;
    setModelFrontState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = sourcePartOverride || await fileToGenerativePart(selectedFile!);
      const parts: any[] = [clothingPart];
      
      const genderText = modelGender === 'unisex' ? '' : modelGender.toUpperCase();
      const bodyTypeInstruction = modelGender === 'female' ? ' The model MUST have a tall, slim figure with long legs.' : '';
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      
      const getPosePrompt = () => {
        switch(modelPose) {
          case 'walking': return ' The model is captured mid-walk, showing dynamic movement.';
          case 'hands-in-pockets': return ' The model is standing casually with hands in pockets.';
          case 'slight-turn': return ' The model is standing with a slight turn, showing off the garment\'s angle.';
          case 'dynamic': return ' The model is striking a dynamic, high-fashion editorial pose.';
          default: return ' Natural, relaxed standing pose.';
        }
      };
      const poseInstruction = getPosePrompt();

      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;
      
      const framing = getFramingInstruction(true);

      let preamble = "Image 1 is the item. ";
      let scaleInstruction = "";

      if (scaleReferenceFile) {
        const scalePart = await fileToGenerativePart(scaleReferenceFile);
        parts.push(scalePart);
        preamble += `Image ${parts.length} is a wearing shot for scale reference ONLY. `;
        scaleInstruction = ` CRITICAL: Use Image ${parts.length} ONLY to estimate the physical size and correct scale of the item relative to the human model. Do NOT copy the model, pose, styling, or background from Image ${parts.length}.`;
      }

      let prompt = `${preamble}A photorealistic image of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1.${bodyTypeInstruction} The item MUST be worn by a person, NOT displayed flat. Front view (face must NOT be visible). ${framing} Perfectly tailored, high-fashion fit, premium silhouette, elegant drape. Trendy Seoul street style or modern minimalist cafe look.${fitInstruction}${styleInstruction} Strictly avoid outdated styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction}${poseInstruction} Cinematic lighting.${scaleInstruction}`;
      
      if (selectedBackgroundFile) {
        const bgPart = await fileToGenerativePart(selectedBackgroundFile);
        parts.push(bgPart);
        prompt = `${preamble}Image ${parts.length} is the target background environment. Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1.${bodyTypeInstruction} The model MUST be placed naturally into the environment shown in Image ${parts.length}. Front view (face must NOT be visible). ${framing} CRITICAL: Because this is a close-up shot, the background from Image ${parts.length} MUST be appropriately zoomed-in and cropped to match the scale and perspective of the subject. DO NOT squeeze the entire background image into the frame; use only a natural, out-of-focus portion of it. Perfectly tailored, high-fashion fit. Trendy Seoul street style.${fitInstruction}${styleInstruction} Strictly avoid outdated styling.${colorInstruction}${poseInstruction} Cinematic lighting perfectly matching the background environment. Ensure the item fits naturally and it looks like a single photorealistic photograph.${scaleInstruction}`;
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

  const generateModelSideShot = async (sourcePartOverride?: any) => {
    if (!selectedFile && !sourcePartOverride) return;
    setModelSideState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = sourcePartOverride || await fileToGenerativePart(selectedFile!);
      const parts: any[] = [clothingPart];
      
      const genderText = modelGender === 'unisex' ? '' : modelGender.toUpperCase();
      const bodyTypeInstruction = modelGender === 'female' ? ' The model MUST have a tall, slim figure with long legs.' : '';
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      
      const getPosePrompt = () => {
        switch(modelPose) {
          case 'walking': return ' The model is captured mid-walk, showing dynamic movement.';
          case 'hands-in-pockets': return ' The model is standing casually with hands in pockets.';
          case 'slight-turn': return ' The model is standing with a slight turn, showing off the garment\'s angle.';
          case 'dynamic': return ' The model is striking a dynamic, high-fashion editorial pose.';
          default: return ' Natural, relaxed standing pose.';
        }
      };
      const poseInstruction = getPosePrompt();

      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;

      const framing = getFramingInstruction(true);

      let preamble = "Image 1 is the item. ";
      let scaleInstruction = "";

      if (scaleReferenceFile) {
        const scalePart = await fileToGenerativePart(scaleReferenceFile);
        parts.push(scalePart);
        preamble += `Image ${parts.length} is a wearing shot for scale reference ONLY. `;
        scaleInstruction = ` CRITICAL: Use Image ${parts.length} ONLY to estimate the physical size and correct scale of the item relative to the human model. Do NOT copy the model, pose, styling, or background from Image ${parts.length}.`;
      }

      let prompt = `${preamble}A photorealistic image of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1.${bodyTypeInstruction} The item MUST be worn by a person, NOT displayed flat. Side profile view (face must NOT be visible). ${framing} Perfectly tailored, high-fashion fit, premium silhouette, elegant drape. Trendy Seoul street style or modern minimalist cafe look.${fitInstruction}${styleInstruction} Strictly avoid outdated styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction}${poseInstruction} Cinematic lighting.${scaleInstruction}`;
      
      if (selectedBackgroundFile) {
        const bgPart = await fileToGenerativePart(selectedBackgroundFile);
        parts.push(bgPart);
        prompt = `${preamble}Image ${parts.length} is the target background environment. Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1.${bodyTypeInstruction} The model MUST be placed naturally into the environment shown in Image ${parts.length}. Side profile view (face must NOT be visible). ${framing} CRITICAL: Because this is a close-up shot, the background from Image ${parts.length} MUST be appropriately zoomed-in and cropped to match the scale and perspective of the subject. DO NOT squeeze the entire background image into the frame; use only a natural, out-of-focus portion of it. Perfectly tailored, high-fashion fit. Trendy Seoul street style.${fitInstruction}${styleInstruction} Strictly avoid outdated styling.${colorInstruction}${poseInstruction} Cinematic lighting perfectly matching the background environment. Ensure the item fits naturally and it looks like a single photorealistic photograph.${scaleInstruction}`;
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

  const generateModelBackShot = async (sourcePartOverride?: any) => {
    if (!selectedFile && !sourcePartOverride) return;
    setModelBackState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = sourcePartOverride || await fileToGenerativePart(selectedFile!);
      const parts: any[] = [clothingPart];
      
      const genderText = modelGender === 'unisex' ? '' : modelGender.toUpperCase();
      const bodyTypeInstruction = modelGender === 'female' ? ' The model MUST have a tall, slim figure with long legs.' : '';
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      
      const getPosePrompt = () => {
        switch(modelPose) {
          case 'walking': return ' The model is captured mid-walk from behind, showing dynamic movement.';
          case 'hands-in-pockets': return ' The model is standing casually from behind.';
          case 'slight-turn': return ' The model is standing with a slight turn from behind, showing off the garment\'s angle.';
          case 'dynamic': return ' The model is striking a dynamic, high-fashion editorial pose from behind.';
          default: return ' Natural, relaxed standing pose from behind.';
        }
      };
      const poseInstruction = getPosePrompt();

      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;

      const framing = getFramingInstruction(true);

      let preamble = "Image 1 is the item. ";
      let scaleInstruction = "";

      if (scaleReferenceFile) {
        const scalePart = await fileToGenerativePart(scaleReferenceFile);
        parts.push(scalePart);
        preamble += `Image ${parts.length} is a wearing shot for scale reference ONLY. `;
        scaleInstruction = ` CRITICAL: Use Image ${parts.length} ONLY to estimate the physical size and correct scale of the item relative to the human model. Do NOT copy the model, pose, styling, or background from Image ${parts.length}.`;
      }

      let prompt = `${preamble}A photorealistic image of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1.${bodyTypeInstruction} The item MUST be worn by a person, NOT displayed flat. Back profile view (face must NOT be visible). ${framing} Perfectly tailored, high-fashion fit, premium silhouette, elegant drape. Trendy Seoul street style or modern minimalist cafe look.${fitInstruction}${styleInstruction} Strictly avoid outdated styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction}${poseInstruction} Cinematic lighting.${scaleInstruction}`;
      
      if (selectedBackgroundFile) {
        const bgPart = await fileToGenerativePart(selectedBackgroundFile);
        parts.push(bgPart);
        prompt = `${preamble}Image ${parts.length} is the target background environment. Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1.${bodyTypeInstruction} The model MUST be placed naturally into the environment shown in Image ${parts.length}. Back profile view (face must NOT be visible). ${framing} CRITICAL: Because this is a close-up shot, the background from Image ${parts.length} MUST be appropriately zoomed-in and cropped to match the scale and perspective of the subject. DO NOT squeeze the entire background image into the frame; use only a natural, out-of-focus portion of it. Perfectly tailored, high-fashion fit. Trendy Seoul street style.${fitInstruction}${styleInstruction} Strictly avoid outdated styling.${colorInstruction}${poseInstruction} Cinematic lighting perfectly matching the background environment. Ensure the item fits naturally and it looks like a single photorealistic photograph.${scaleInstruction}`;
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
        setModelBackState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
      } else {
        setModelBackState({ loading: false, image: null });
      }
    } catch (error) {
      console.error("Error generating model back shot:", error);
      setModelBackState({ loading: false, image: null });
    }
  };

  const generateModelFullBody = async (sourcePartOverride?: any, coordinationPartOverride?: any) => {
    if (!selectedFile && !sourcePartOverride) return;
    setModelFullBodyState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = sourcePartOverride || await fileToGenerativePart(selectedFile!);
      const parts: any[] = [clothingPart];
      
      let coordPart = coordinationPartOverride;
      if (!coordPart && modelCoordinationState.image) {
        coordPart = {
          inlineData: {
            data: modelCoordinationState.image.split(',')[1],
            mimeType: 'image/png'
          }
        };
      }

      if (coordPart) {
        parts.push(coordPart);
      }
      
      const genderText = modelGender === 'unisex' ? '' : modelGender.toUpperCase();
      const bodyTypeInstruction = modelGender === 'female' ? ' The model MUST have a tall, slim figure with long legs.' : '';
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      
      const getPosePrompt = () => {
        switch(modelPose) {
          case 'walking': return ' The model is captured mid-walk, showing dynamic movement.';
          case 'hands-in-pockets': return ' The model is standing casually with hands in pockets.';
          case 'slight-turn': return ' The model is standing with a slight turn, showing off the garment\'s angle.';
          case 'dynamic': return ' The model is striking a dynamic, high-fashion editorial pose.';
          default: return ' Natural, relaxed standing pose.';
        }
      };
      const poseInstruction = getPosePrompt();

      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;

      const framing = getFramingInstruction(false);

      let preamble = "Image 1 is the main item. ";
      
      if (coordPart) {
        preamble += `Image 2 is the recommended coordination outfit. `;
      }

      let scaleInstruction = "";
      if (scaleReferenceFile) {
        const scalePart = await fileToGenerativePart(scaleReferenceFile);
        parts.push(scalePart);
        preamble += `Image ${parts.length} is a wearing shot for scale reference ONLY. `;
        scaleInstruction = ` CRITICAL: Use Image ${parts.length} ONLY to estimate the physical size and correct scale of the item relative to the human model. Do NOT copy the model, pose, styling, or background from Image ${parts.length}.`;
      }

      let coordInstruction = coordPart ? `styled EXACTLY with the matching items (bottoms, shoes) shown in Image 2` : `wearing a highly trendy, youthful Seoul street style or modern minimalist cafe look coordination`;

      let prompt = `${preamble}Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1, ${coordInstruction}.${bodyTypeInstruction} The item MUST be worn by a person, NOT displayed flat. ${framing} Perfectly tailored, high-fashion fit, premium silhouette.${fitInstruction}${styleInstruction} Strictly avoid outdated styling. If the item is not an accessory itself, DO NOT add unnecessary accessories. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction}${poseInstruction} Cinematic lighting.${scaleInstruction}`;

      if (selectedBackgroundFile) {
        const bgPart = await fileToGenerativePart(selectedBackgroundFile);
        parts.push(bgPart);
        preamble += `Image ${parts.length} is the target background environment. `;
        
        prompt = `${preamble}Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact item from Image 1, ${coordInstruction}.${bodyTypeInstruction} The model MUST be placed naturally into the exact environment shown in Image ${parts.length}. ${framing} Perfectly tailored, high-fashion fit.${fitInstruction}${styleInstruction} Strictly avoid outdated styling. If the item is not an accessory itself, DO NOT add unnecessary accessories.${colorInstruction}${poseInstruction} Cinematic lighting perfectly matching the background environment. Ensure the subject is perfectly integrated into the environment with realistic shadows and natural depth of field. It MUST NOT look like a cheap composite. Ensure the item fits naturally.${scaleInstruction}`;
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
        setModelFullBodyState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
      } else {
        setModelFullBodyState({ loading: false, image: null });
      }
    } catch (error) {
      console.error("Error generating model full body shot:", error);
      setModelFullBodyState({ loading: false, image: null });
    }
  };

  const generateCoordination = async (sourcePartOverride?: any) => {
    if (!selectedFile && !sourcePartOverride) return null;
    setModelCoordinationState({ loading: true, image: null });

    try {
      const ai = getAIClient();
      const clothingPart = sourcePartOverride || await fileToGenerativePart(selectedFile!);
      const parts: any[] = [clothingPart];
      
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the main clothing item to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling)`;

      const prompt = `A highly stylish fashion coordination flat lay (outfit grid) featuring this exact clothing item as the centerpiece. Pair it with trendy matching bottoms (like wide-fit slacks or trendy denim) and stylish sneakers or modern shoes to create a sophisticated, modern 20-something Korean fashion look (Seoul street style or minimalist cafe aesthetic).${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling. DO NOT include any weird, unnecessary, or excessive props like strange hats, heavy jewelry, random bags, or unrelated objects. Keep the flat lay clean, minimal, and focused ONLY on the main clothing, bottoms, and shoes. High fashion editorial style, luxurious cream background${colorInstruction}, perfect lighting, neat arrangement.`;
      
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      const generatedImage = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (generatedImage) {
        setModelCoordinationState({ loading: false, image: `data:image/png;base64,${generatedImage}` });
        return generatedImage;
      } else {
        setModelCoordinationState({ loading: false, image: null });
        return null;
      }
    } catch (error) {
      console.error("Error generating coordination shot:", error);
      setModelCoordinationState({ loading: false, image: null });
      return null;
    }
  };

  const generateDetailTexture = async () => {
    if (!selectedFile) return;
    let colorInstruction = targetColor ? ` CRITICAL: Change the color of the fabric to exactly match this hex color code: ${targetColor}. DO NOT keep the original color.` : ` Use the exact same colors and pattern as the provided reference image.`;
    setDetailTextureState({ loading: true, image: null });
    await generateSingleDetail(
      `Macro photography of the fabric texture. Extreme close-up showing the weave and material.${colorInstruction}`,
      setDetailTextureState
    );
  };

  const generateDetailStitch = async () => {
    if (!selectedFile) return;
    let colorInstruction = targetColor ? ` CRITICAL: Change the color of the fabric to exactly match this hex color code: ${targetColor}. DO NOT keep the original color.` : ` Use the exact same colors and pattern as the provided reference image.`;
    setDetailStitchState({ loading: true, image: null });
    await generateSingleDetail(
      `Macro photography of a seam or stitching. Extreme close-up.${colorInstruction} Single image, no collages.`,
      setDetailStitchState
    );
  };

  const generateDetailDesign = async () => {
    if (!selectedFile) return;
    let colorInstruction = targetColor ? ` CRITICAL: Change the color of the fabric to exactly match this hex color code: ${targetColor}. DO NOT keep the original color.` : ` Use the exact same colors and pattern as the provided reference image.`;
    setDetailDesignState({ loading: true, image: null });
    await generateSingleDetail(
      `Macro photography of a specific design detail (like a button, edge, or fold). Extreme close-up.${colorInstruction}`,
      setDetailDesignState
    );
  };

  const generateDetailShots = async () => {
    if (!selectedFile) return;
    
    generateDetailTexture();
    generateDetailStitch();
    generateDetailDesign();
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
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Fill white background in case of transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const jpegUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = jpegUrl;
      link.download = filename.replace(/\.png$/, '.jpg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = dataUrl;
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
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <p className="text-xs text-white/40 mt-2">
                    Your API key is stored locally in your browser and never sent to our servers.
                  </p>
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
          
          {/* User Manual Section */}
          <section className="mb-16">
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setShowManual(!showManual)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-medium text-white">How to Use (사용 설명서)</h2>
                    <p className="text-sm text-white/50 mt-1">Click to view detailed instructions for creating AI fashion shots</p>
                  </div>
                </div>
                {showManual ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
              </button>
              
              <AnimatePresence>
                {showManual && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5"
                  >
                    <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-white/70">
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="flex items-center gap-2 text-white font-medium mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs">1</span>
                            Upload Images (이미지 업로드)
                          </h3>
                          <ul className="space-y-3 ml-2 list-disc pl-5">
                            <li><strong>Front Item (필수):</strong> The main front-view photo of your clothing or accessory. (의류나 악세사리의 정면 사진을 올려주세요)</li>
                            <li><strong>Back Item (선택):</strong> The back-view if you want back-facing model shots. (후면 모델샷이 필요할 경우 뒷면 사진을 올려주세요)</li>
                            <li><strong>Background (선택):</strong> A specific background scene. The AI will place the model here naturally. (원하는 배경이 있다면 올려주세요)</li>
                            <li><strong>Scale Reference (선택):</strong> Use this ONLY for accessories (bags, hats, shoes) to help AI understand the physical size. Please upload a wearing shot. (악세사리의 크기나 비율을 참고하기 위한 착용샷입니다. 모델 포즈나 배경은 무시되고 오직 '사이즈/비율' 파악에만 사용됩니다)</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="flex items-center gap-2 text-white font-medium mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs">2</span>
                            Set Options (옵션 설정)
                          </h3>
                          <ul className="space-y-3 ml-2 list-disc pl-5">
                            <li><strong>Model Gender / Fit / Style (모델 설정):</strong> Choose the target audience, outfit fit, and fashion style (e.g., Casual, Streetwear). (모델의 성별, 핏, 스타일을 선택하세요)</li>
                            <li><strong>Clothing Category (카테고리):</strong> Tell the AI what the item is. Choose 'Accessory' for bags/hats/shoes to ensure they are held or worn correctly! (아이템 종류를 선택하세요. 악세사리의 경우 반드시 'Accessory'를 선택해야 디테일이 보장됩니다)</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className="flex items-center gap-2 text-white font-medium mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs">3</span>
                            Generating Images (이미지 생성)
                          </h3>
                          <div className="bg-white/5 rounded-xl p-4 space-y-4">
                            <div>
                              <strong className="text-white block mb-1">Clean Up Image (누끼 및 주름제거)</strong>
                              <p>Removes background and flattens out wrinkles to make the item look brand new. (배경을 제거하고 상품을 깔끔하게 정리해줍니다)</p>
                            </div>
                            <div>
                              <strong className="text-white block mb-1">Model Shots (모델 착용샷)</strong>
                              <p>Generates high-fashion model shots wearing the item. You can request Front, Side, Back, or Full Body. (상품을 착용한 고화질 패션 모델샷을 생성합니다. 정면, 측면, 후면, 전신 등 다양하게 생성해보세요!)</p>
                            </div>
                            <div>
                              <strong className="text-white block mb-1">Detailed Shots (디테일 컷)</strong>
                              <p>Check the "Enable Macro Detail Shots" to generate ultra close-ups of fabric textures, zippers, or logos. ("매크로 디테일 컷 활성화"를 체크하면 원단, 스티치, 디자인 포인트의 초근접샷을 생성할 수 있습니다.)</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-200">
                          <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
                          <p className="text-xs leading-relaxed">
                            <strong>PRO TIP:</strong> If you upload a Custom Background and a Scale Reference for an accessory, the AI will naturally blend the accessory onto a model at the correct size into that specific environment!
                            <br/><br/>
                            <strong>꿀팁:</strong> 악세사리 상품에 자체 배경과 사이즈 측정용 착용샷을 지정하면, AI가 정확한 비율로 해당 배경에 자연스럽게 모델 착용샷을 합성해줍니다!
                          </p>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Upload Section */}
          <section className="mb-20">
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-7xl">
                <ImageUpload 
                  title="Front Item"
                  subtitle="Required: Upload front view"
                  onImageSelect={handleImageSelect} 
                  selectedImage={selectedImagePreview}
                  onClear={handleClear}
                />
                <ImageUpload 
                  title="Back Item"
                  subtitle="Optional: Upload back view"
                  onImageSelect={handleBackSelect} 
                  selectedImage={selectedBackPreview}
                  onClear={handleBackClear}
                />
                <ImageUpload 
                  title="Background"
                  subtitle="Optional: For full body shot"
                  onImageSelect={handleBackgroundSelect} 
                  selectedImage={selectedBackgroundPreview}
                  onClear={handleBackgroundClear}
                />
                <ImageUpload 
                  title="Scale Reference"
                  subtitle="Optional: Wearing shot for scale"
                  onImageSelect={handleScaleReferenceSelect} 
                  selectedImage={scaleReferencePreview}
                  onClear={handleScaleReferenceClear}
                />
              </div>

              <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-6 w-full max-w-5xl flex-wrap">
                <div className="flex items-center gap-4 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl w-full md:w-auto shadow-lg">
                  <div className="flex flex-col mr-4">
                    <span className="text-base font-medium text-white">Model Gender</span>
                    <span className="text-xs text-white/50">Select preferred model gender</span>
                  </div>
                  <div className="flex bg-white/5 rounded-lg p-1">
                    {(['female', 'male', 'unisex'] as const).map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setModelGender(gender)}
                        className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                          modelGender === gender 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl w-full md:w-auto shadow-lg">
                  <div className="flex flex-col mr-4">
                    <span className="text-base font-medium text-white">Fit</span>
                    <span className="text-xs text-white/50">Select clothing fit</span>
                  </div>
                  <div className="flex bg-white/5 rounded-lg p-1">
                    {(['overfit', 'regular', 'slim'] as const).map((fit) => (
                      <button
                        key={fit}
                        onClick={() => setModelFit(fit)}
                        className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                          modelFit === fit 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl w-full md:w-auto shadow-lg">
                  <div className="flex flex-col mr-4">
                    <span className="text-base font-medium text-white">Style</span>
                    <span className="text-xs text-white/50">Select outfit style</span>
                  </div>
                  <select
                    value={modelStyle}
                    onChange={(e) => setModelStyle(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    {['Casual', 'Classic', 'Streetwear', 'Business casual', 'Chic', 'Preppy', 'Athleisure'].map((style) => (
                      <option key={style} value={style} className="bg-[#1a1a1a] text-white">
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl w-full md:w-auto shadow-lg">
                  <div className="flex flex-col mr-4">
                    <span className="text-base font-medium text-white">Item Category</span>
                    <span className="text-xs text-white/50">Used to frame the shots</span>
                  </div>
                  <select
                    value={clothingCategory}
                    onChange={(e) => setClothingCategory(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="auto" className="bg-[#1a1a1a] text-white">Auto</option>
                    <option value="top" className="bg-[#1a1a1a] text-white">Top</option>
                    <option value="bottom" className="bg-[#1a1a1a] text-white">Bottom</option>
                    <option value="outerwear" className="bg-[#1a1a1a] text-white">Outerwear</option>
                    <option value="dress" className="bg-[#1a1a1a] text-white">Dress / Full Body</option>
                    <option value="accessory" className="bg-[#1a1a1a] text-white">Accessory (Hat, Bag, Shoes)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl w-full md:w-auto shadow-lg">
                  <div className="flex flex-col mr-4">
                    <span className="text-base font-medium text-white">Pose</span>
                    <span className="text-xs text-white/50">Select model pose</span>
                  </div>
                  <select
                    value={modelPose}
                    onChange={(e) => setModelPose(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="natural" className="bg-[#1a1a1a] text-white">Natural</option>
                    <option value="walking" className="bg-[#1a1a1a] text-white">Walking</option>
                    <option value="hands-in-pockets" className="bg-[#1a1a1a] text-white">Hands in Pockets</option>
                    <option value="slight-turn" className="bg-[#1a1a1a] text-white">Slight Turn</option>
                    <option value="dynamic" className="bg-[#1a1a1a] text-white">Dynamic</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl w-full md:w-auto shadow-lg">
                  <div className="flex flex-col mr-4">
                    <span className="text-base font-medium text-white">Target Color</span>
                    <span className="text-xs text-white/50">Optional: Change clothing color</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={targetColor || '#ffffff'} 
                      onChange={(e) => setTargetColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    {targetColor && (
                      <button 
                        onClick={() => setTargetColor('')}
                        className="text-xs text-white/50 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-4 cursor-pointer p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl hover:bg-white/5 transition-colors w-full md:w-auto shadow-lg">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableDetailShots}
                      onChange={(e) => setEnableDetailShots(e.target.checked)}
                    />
                    <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/40"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-white">Generate Detail Shots</span>
                    <span className="text-xs text-white/50">Includes Texture, Stitching, and Design close-ups</span>
                  </div>
                </label>

                <label className="flex items-center gap-4 cursor-pointer p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl hover:bg-white/5 transition-colors w-full md:w-auto shadow-lg">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableCoordinationShot}
                      onChange={(e) => setEnableCoordinationShot(e.target.checked)}
                    />
                    <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/40"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-medium text-white">Generate Coordination Shot</span>
                    <span className="text-xs text-white/50">Includes outfit grid flat lay</span>
                  </div>
                </label>
              </div>
              
              {selectedFile && !cleanUpFrontState.loading && !cleanUpFrontState.image && (
                <div className="mt-12 flex flex-col items-center gap-6">
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={generateAll}
                    className="group relative px-8 py-4 bg-white text-black rounded-full font-medium tracking-wide overflow-hidden shadow-xl"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate All Assets
                    </span>
                    <div className="absolute inset-0 bg-gray-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </motion.button>
                </div>
              )}
            </div>
          </section>

          {/* Results Grid */}
          {(cleanUpFrontState.loading || cleanUpFrontState.image || modelFrontState.loading || modelFrontState.image) && (
            <div className="space-y-16 mb-16">
              <div className="flex justify-end mb-8">
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={generateAll}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/20 text-sm font-medium tracking-wide shadow-lg backdrop-blur-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate All Images
                </motion.button>
              </div>

              {/* Clean Up Section */}
              <section>
                <h2 className="text-2xl font-serif italic mb-6 text-white/80">Pristine Clean-Up</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <GeneratedImage
                      title="Front View"
                      description="Wrinkle-free, studio-quality front shot."
                      image={cleanUpFrontState.image}
                      loading={cleanUpFrontState.loading}
                      aspectRatio="square"
                      onDownload={cleanUpFrontState.image ? () => downloadImage(cleanUpFrontState.image!, 'cleanup-front.png') : undefined}
                      onRegenerate={generateCleanUpFront}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GeneratedImage
                      title="Back View"
                      description="Wrinkle-free, studio-quality back shot."
                      image={cleanUpBackState.image}
                      loading={cleanUpBackState.loading}
                      aspectRatio="square"
                      onDownload={cleanUpBackState.image ? () => downloadImage(cleanUpBackState.image!, 'cleanup-back.png') : undefined}
                      onRegenerate={generateCleanUpBack}
                    />
                  </motion.div>
                </div>
              </section>

              {/* Model Fitting Section */}
              <section>
                <h2 className="text-2xl font-serif italic mb-6 text-white/80">Model Fitting</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <GeneratedImage
                      title="Front Shot"
                      description="Front view editorial shot."
                      image={modelFrontState.image}
                      loading={modelFrontState.loading}
                      aspectRatio="portrait"
                      onDownload={modelFrontState.image ? () => downloadImage(modelFrontState.image!, 'model-front.png') : undefined}
                      onRegenerate={async () => generateModelFrontShot(await getCleanUpSourcePart())}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <GeneratedImage
                      title="Side Shot"
                      description="Side profile editorial shot."
                      image={modelSideState.image}
                      loading={modelSideState.loading}
                      aspectRatio="portrait"
                      onDownload={modelSideState.image ? () => downloadImage(modelSideState.image!, 'model-side.png') : undefined}
                      onRegenerate={async () => generateModelSideShot(await getCleanUpSourcePart())}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                    <GeneratedImage
                      title="Back Shot"
                      description="Back view editorial shot."
                      image={modelBackState.image}
                      loading={modelBackState.loading}
                      aspectRatio="portrait"
                      onDownload={modelBackState.image ? () => downloadImage(modelBackState.image!, 'model-back.png') : undefined}
                      onRegenerate={async () => {
                        let backSourcePart;
                        if (cleanUpBackState.image) {
                          backSourcePart = { inlineData: { data: cleanUpBackState.image.split(',')[1], mimeType: 'image/png' } };
                        } else if (selectedBackFile) {
                          backSourcePart = await fileToGenerativePart(selectedBackFile);
                        } else {
                          backSourcePart = await getCleanUpSourcePart();
                        }
                        generateModelBackShot(backSourcePart);
                      }}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <GeneratedImage
                      title="Full Body Shot"
                      description="Chin-down full body with stylish coordination."
                      image={modelFullBodyState.image}
                      loading={modelFullBodyState.loading}
                      aspectRatio="portrait"
                      onDownload={modelFullBodyState.image ? () => downloadImage(modelFullBodyState.image!, 'model-fullbody.png') : undefined}
                      onRegenerate={async () => generateModelFullBody(await getCleanUpSourcePart())}
                    />
                  </motion.div>
                </div>
              </section>

              {/* Coordination Recommendation Section */}
              {enableCoordinationShot && (
                <section>
                  <h2 className="text-2xl font-serif italic mb-6 text-white/80">Coordination Recommendation</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                      <GeneratedImage
                        title="Outfit Flat Lay"
                        description="Recommended styling and accessories."
                        image={modelCoordinationState.image}
                        loading={modelCoordinationState.loading}
                        aspectRatio="square"
                        onDownload={modelCoordinationState.image ? () => downloadImage(modelCoordinationState.image!, 'coordination.png') : undefined}
                        onRegenerate={async () => generateCoordination(await getCleanUpSourcePart())}
                      />
                    </motion.div>
                  </div>
                </section>
              )}
            </div>
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
                  onRegenerate={generateDetailTexture}
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
                  onRegenerate={generateDetailStitch}
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
                  onRegenerate={generateDetailDesign}
                />
              </motion.div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

