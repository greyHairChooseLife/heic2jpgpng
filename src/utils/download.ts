import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ConversionResult } from '../types';

const formatTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hour}${min}${sec}`;
};

const getConvertedFilename = (originalName: string, format: string): string => {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const ext = format === 'image/jpeg' ? 'jpg' : 'png';
  return `converted_${nameWithoutExt}.${ext}`;
};

export const downloadAsZip = async (
  results: ConversionResult[],
  format: string
): Promise<void> => {
  const zip = new JSZip();

  // Add successfully converted files to ZIP
  results
    .filter((result) => result.success)
    .forEach((result) => {
      const filename = getConvertedFilename(result.originalName, format);
      zip.file(filename, result.blob);
    });

  // Generate ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Download
  const filename = `heic-converted-${formatTimestamp()}.zip`;
  saveAs(zipBlob, filename);
};
