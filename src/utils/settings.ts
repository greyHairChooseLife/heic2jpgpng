import type { SavedSettings } from '../types';

const STORAGE_KEY = 'heic-converter-settings';

const DEFAULT_SETTINGS: SavedSettings = {
  format: 'jpg',
  quality: 95,
  maxWidth: null,
  maxHeight: null,
};

export const loadSettings = (): SavedSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: SavedSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};
