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
  
  const [cleanUpFrontState, setCleanUpFrontState] = useState<GenerationState>({ loading: false, image: null });
  const [cleanUpBackState, setCleanUpBackState] = useState<GenerationState>({ loading: false, image: null });
  const [modelFrontState, setModelFrontState] = useState<GenerationState>({ loading: false, image: null });
  const [modelSideState, setModelSideState] = useState<GenerationState>({ loading: false, image: null });
  const [modelFullBodyState, setModelFullBodyState] = useState<GenerationState>({ loading: false, image: null });
  const [modelCoordinationState, setModelCoordinationState] = useState<GenerationState>({ loading: false, image: null });
  
  // 3 Detail Shots
  const [detailTextureState, setDetailTextureState] = useState<GenerationState>({ loading: false, image: null });
  const [detailStitchState, setDetailStitchState] = useState<GenerationState>({ loading: false, image: null });
  const [detailDesignState, setDetailDesignState] = useState<GenerationState>({ loading: false, image: null });
  
  const [enableDetailShots, setEnableDetailShots] = useState(false);
  const [modelGender, setModelGender] = useState<'female' | 'male' | 'unisex'>('female');
  const [modelFit, setModelFit] = useState<'overfit' | 'regular' | 'slim'>('regular');
  const [modelStyle, setModelStyle] = useState<'Casual' | 'Classic' | 'Streetwear' | 'Business casual' | 'Chic' | 'Preppy' | 'Athleisure'>('Classic');
  const [targetColor, setTargetColor] = useState<string>('');

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

  const handleClear = () => {
    setSelectedFile(null);
    setSelectedImagePreview(null);
    setSelectedBackFile(null);
    setSelectedBackPreview(null);
    setSelectedBackgroundFile(null);
    setSelectedBackgroundPreview(null);
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
    generateCleanUpBack(cleanUpFrontBase64);
    
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

    // Pass the cleaned-up image (or original fallback) to model shots
    generateModelFrontShot(sourcePart);
    generateModelSideShot(sourcePart);
    
    // Generate coordination first, then use it for full body
    const coordinationBase64 = await generateCoordination(sourcePart);
    let coordinationPart;
    if (coordinationBase64) {
      coordinationPart = {
        inlineData: {
          data: coordinationBase64,
          mimeType: 'image/png'
        }
      };
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
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;

      let prompt = `A photorealistic image of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing this exact clothing item. The clothing MUST be worn by a person, NOT displayed flat. Front view. Cropped shot focusing heavily on the clothing item (zoomed in on the torso/upper body if it is a top). The model's face must NOT be visible (cropped below the face/eyes). Trendy Seoul street style or modern minimalist cafe look.${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction} Natural posing. Cinematic lighting.`;
      
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
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;

      let prompt = `A photorealistic image of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing this exact clothing item. The clothing MUST be worn by a person, NOT displayed flat. Side profile view. Cropped shot focusing heavily on the clothing item (zoomed in on the torso/upper body if it is a top). The model's face must NOT be visible (cropped below the face/eyes). Trendy Seoul street style or modern minimalist cafe look.${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction} Natural posing. Cinematic lighting.`;
      
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
      const fitInstruction = modelFit !== 'regular' ? ` The clothing fit should be ${modelFit}.` : '';
      const styleInstruction = ` The overall styling and outfit vibe is ${modelStyle}.`;
      let colorInstruction = targetColor ? ` CRITICAL: Change the color of the clothing to exactly match this hex color code: ${targetColor}. DO NOT keep the original color. Ensure the fabric texture and shading remain realistic while adopting this new color.` : ` (DO NOT change the original color of the clothing or styling to match the background, keep the clothing's original color and use diverse colors for styling).`;

      let prompt = `A photorealistic image of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing this exact clothing item. The clothing MUST be worn by a person, NOT displayed flat. Full body shot cropped from the chin down (face must NOT be visible). The model is wearing a highly trendy, youthful Seoul street style or modern minimalist cafe look coordination (e.g., wide-fit trousers, trendy sneakers or boots).${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction} Natural posing. Cinematic lighting.`;

      if (coordPart) {
        prompt = `Image 1 is the main clothing item. Image 2 is the recommended coordination outfit. Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact clothing item from Image 1, styled EXACTLY with the matching items (bottoms, shoes, accessories) shown in Image 2. The clothing MUST be worn by a person, NOT displayed flat. Full body shot cropped from the chin down (face must NOT be visible).${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling. High fashion Korean e-commerce style photography. Luxurious cream-colored background.${colorInstruction} Natural posing. Cinematic lighting.`;
      }

      if (selectedBackgroundFile) {
        const bgPart = await fileToGenerativePart(selectedBackgroundFile);
        parts.push(bgPart);
        
        if (coordPart) {
          prompt = `Image 1 is the main clothing item. Image 2 is the recommended coordination outfit. Image 3 is the target background environment. Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact clothing item from Image 1, styled EXACTLY with the matching items (bottoms, shoes, accessories) shown in Image 2. The model MUST be placed naturally into the exact environment shown in Image 3. Full body shot cropped from the chin down (face must NOT be visible).${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling.${colorInstruction} Cinematic lighting matching the background environment. Ensure the clothing fits naturally and the composite looks photorealistic.`;
        } else {
          prompt = `Image 1 is the clothing item. Image 2 is the target background environment. Generate a highly realistic, professional fashion editorial photo of a stylish 20-something Korean ${genderText} HUMAN fashion model physically wearing the exact clothing item from Image 1. The model MUST be placed naturally into the exact environment shown in Image 2. Full body shot cropped from the chin down (face must NOT be visible). The model is wearing a highly trendy, youthful Seoul street style or modern minimalist cafe look coordination.${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling.${colorInstruction} Cinematic lighting matching the background environment. Ensure the clothing fits naturally and the composite looks photorealistic.`;
        }
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

      const prompt = `A highly stylish fashion coordination flat lay (outfit grid) featuring this exact clothing item as the centerpiece. Pair it with trendy matching bottoms (like wide-fit slacks or trendy denim), stylish sneakers or modern shoes, and youthful accessories to create a sophisticated, modern 20-something Korean fashion look (Seoul street style or minimalist cafe aesthetic).${fitInstruction}${styleInstruction} Strictly avoid outdated or middle-aged styling. High fashion editorial style, luxurious cream background${colorInstruction}, perfect lighting, neat arrangement.`;
      
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
          {/* Upload Section */}
          <section className="mb-20">
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

