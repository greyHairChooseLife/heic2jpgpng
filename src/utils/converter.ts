import heic2any from 'heic2any';
import type { ConversionSettings, ConversionResult } from '../types';
import { resizeImage } from './resize';

export const convertFile = async (
  file: File,
  settings: ConversionSettings
): Promise<ConversionResult> => {
  try {
    // Convert HEIC to JPG/PNG
    const convertedBlob = await heic2any({
      blob: file,
      toType: settings.format,
      quality: settings.quality / 100,
    });

    // heic2any can return Blob or Blob[], we handle single file
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    // Apply resize if needed
    const finalBlob = await resizeImage(blob, {
      maxWidth: settings.maxWidth,
      maxHeight: settings.maxHeight,
    });

    // Preserve lastModified timestamp
    const resultBlob = new File([finalBlob], file.name, {
      type: settings.format,
      lastModified: file.lastModified,
    });

    return {
      blob: resultBlob,
      originalName: file.name,
      success: true,
    };
  } catch (error) {
    return {
      blob: new Blob(),
      originalName: file.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
