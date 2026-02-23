export interface ConversionSettings {
  format: 'image/jpeg' | 'image/png';
  quality: number;
  maxWidth: number | null;
  maxHeight: number | null;
}

export interface ConversionResult {
  blob: Blob;
  originalName: string;
  success: boolean;
  error?: string;
}

export interface SavedSettings {
  format: 'jpg' | 'png';
  quality: number;
  maxWidth: number | null;
  maxHeight: number | null;
}
