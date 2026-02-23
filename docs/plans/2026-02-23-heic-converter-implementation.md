# HEIC Converter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based HEIC to JPG/PNG converter with batch processing and GitHub Pages deployment.

**Architecture:** Single-page React app with all logic in App.tsx. Client-side conversion using heic2any, batch download via JSZip, settings persisted in localStorage.

**Tech Stack:** React, TypeScript, Vite, heic2any, jszip, file-saver

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install jszip and file-saver**

Run:
```bash
npm install jszip file-saver
```

Expected: Packages added to dependencies

**Step 2: Install TypeScript types**

Run:
```bash
npm install -D @types/file-saver
```

Expected: Type definitions installed

**Step 3: Verify installation**

Run:
```bash
npm list jszip file-saver
```

Expected: Both packages listed with versions

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add jszip and file-saver for batch conversion"
```

---

## Task 2: Configure Vite for GitHub Pages

**Files:**
- Modify: `vite.config.ts`

**Step 1: Update vite.config.ts**

Replace entire file content:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/converter/',
})
```

**Step 2: Verify config syntax**

Run:
```bash
npm run build
```

Expected: Build succeeds, output to dist/

**Step 3: Clean build artifacts**

Run:
```bash
rm -rf dist
```

**Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "config: set base path for GitHub Pages deployment"
```

---

## Task 3: Create TypeScript Types

**Files:**
- Create: `src/types.ts`

**Step 1: Create types file**

Create `src/types.ts`:

```typescript
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run build
```

Expected: No TypeScript errors

**Step 3: Clean build**

Run:
```bash
rm -rf dist
```

**Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript types for converter"
```

---

## Task 4: Implement Settings Persistence Utilities

**Files:**
- Create: `src/utils/settings.ts`

**Step 1: Create settings utility**

Create `src/utils/settings.ts`:

```typescript
import { SavedSettings } from '../types';

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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run build
```

Expected: No errors

**Step 3: Clean build**

Run:
```bash
rm -rf dist
```

**Step 4: Commit**

```bash
git add src/utils/settings.ts
git commit -m "feat: add localStorage settings persistence"
```

---

## Task 5: Implement Image Resize Utility

**Files:**
- Create: `src/utils/resize.ts`

**Step 1: Create resize utility**

Create `src/utils/resize.ts`:

```typescript
interface ResizeOptions {
  maxWidth: number | null;
  maxHeight: number | null;
}

export const resizeImage = async (
  blob: Blob,
  options: ResizeOptions
): Promise<Blob> => {
  const { maxWidth, maxHeight } = options;

  // No resize needed
  if (!maxWidth && !maxHeight) {
    return blob;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions
      if (maxWidth && maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      } else if (maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height *= ratio;
      } else if (maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width *= ratio;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        blob.type,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run build
```

Expected: No errors

**Step 3: Clean build**

Run:
```bash
rm -rf dist
```

**Step 4: Commit**

```bash
git add src/utils/resize.ts
git commit -m "feat: add image resize utility with aspect ratio preservation"
```

---

## Task 6: Implement File Conversion Logic

**Files:**
- Create: `src/utils/converter.ts`

**Step 1: Create converter utility**

Create `src/utils/converter.ts`:

```typescript
import heic2any from 'heic2any';
import { ConversionSettings, ConversionResult } from '../types';
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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run build
```

Expected: No errors

**Step 3: Clean build**

Run:
```bash
rm -rf dist
```

**Step 4: Commit**

```bash
git add src/utils/converter.ts
git commit -m "feat: add HEIC conversion with metadata preservation"
```

---

## Task 7: Implement ZIP Download Utility

**Files:**
- Create: `src/utils/download.ts`

**Step 1: Create download utility**

Create `src/utils/download.ts`:

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ConversionResult } from '../types';

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
```

**Step 2: Verify TypeScript compilation**

Run:
```bash
npm run build
```

Expected: No errors

**Step 3: Clean build**

Run:
```bash
rm -rf dist
```

**Step 4: Commit**

```bash
git add src/utils/download.ts
git commit -m "feat: add ZIP download with timestamped filenames"
```

---

## Task 8: Clean Up Default Styles

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.css`

**Step 1: Replace index.css with minimal reset**

Replace `src/index.css` content:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  color: #333;
  background: #f5f5f5;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input {
  font-family: inherit;
}
```

**Step 2: Clear App.css**

Replace `src/App.css` content:

```css
.app {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}
```

**Step 3: Verify styles load**

Run:
```bash
npm run dev
```

Expected: Dev server starts, page loads with clean styles

**Step 4: Commit**

```bash
git add src/index.css src/App.css
git commit -m "style: replace default styles with minimal reset"
```

---

## Task 9: Implement File Upload Area

**Files:**
- Modify: `src/App.tsx`

**Step 1: Replace App.tsx with upload area**

Replace `src/App.tsx` content:

```typescript
import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')
    );

    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <h1 className="app-title">HEIC Converter</h1>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <p>Drag and drop HEIC files here, or click to select</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".heic,image/heic"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Files ({files.length})</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name}
                <button onClick={() => handleRemoveFile(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
```

**Step 2: Add upload area styles to App.css**

Append to `src/App.css`:

```css
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: #999;
  background: #fafafa;
}

.upload-area.dragging {
  border-color: #007bff;
  background: #e7f3ff;
}

.file-list {
  margin-top: 1.5rem;
}

.file-list h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.file-list ul {
  list-style: none;
}

.file-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.file-list button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  padding: 0 0.5rem;
}

.file-list button:hover {
  color: #f00;
}
```

**Step 3: Test upload functionality**

Run:
```bash
npm run dev
```

Expected: Drag-and-drop works, file selection works, file list displays

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: add file upload area with drag-and-drop"
```

---

## Task 10: Add Settings Panel

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Add settings state and UI**

Replace `src/App.tsx` with:

```typescript
import { useState, useRef, useEffect } from 'react';
import { loadSettings, saveSettings } from './utils/settings';
import { SavedSettings } from './types';
import './App.css';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SavedSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')
    );

    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <h1 className="app-title">HEIC Converter</h1>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <p>Drag and drop HEIC files here, or click to select</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".heic,image/heic"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="settings-panel">
        <h3>Settings</h3>

        <div className="setting-group">
          <label>Format:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="format"
                value="jpg"
                checked={settings.format === 'jpg'}
                onChange={(e) =>
                  setSettings({ ...settings, format: e.target.value as 'jpg' | 'png' })
                }
              />
              JPG
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="png"
                checked={settings.format === 'png'}
                onChange={(e) =>
                  setSettings({ ...settings, format: e.target.value as 'jpg' | 'png' })
                }
              />
              PNG
            </label>
          </div>
        </div>

        <div className="setting-group">
          <label>Quality: {settings.quality}%</label>
          <input
            type="range"
            min="70"
            max="100"
            value={settings.quality}
            onChange={(e) =>
              setSettings({ ...settings, quality: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="setting-group">
          <label>Max Width (optional):</label>
          <input
            type="number"
            placeholder="Original size"
            value={settings.maxWidth ?? ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxWidth: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </div>

        <div className="setting-group">
          <label>Max Height (optional):</label>
          <input
            type="number"
            placeholder="Original size"
            value={settings.maxHeight ?? ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxHeight: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Files ({files.length})</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name}
                <button onClick={() => handleRemoveFile(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
```

**Step 2: Add settings panel styles**

Append to `src/App.css`:

```css
.settings-panel {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.settings-panel h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group label {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  font-weight: 500;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: normal;
}

.setting-group input[type='range'] {
  width: 100%;
}

.setting-group input[type='number'] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
```

**Step 3: Test settings persistence**

Run:
```bash
npm run dev
```

Expected: Settings load from localStorage, changes persist on reload

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: add settings panel with localStorage persistence"
```

---

## Task 11: Add Conversion Logic

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Add conversion state and handlers**

Replace `src/App.tsx` with:

```typescript
import { useState, useRef, useEffect } from 'react';
import { loadSettings, saveSettings } from './utils/settings';
import { convertFile } from './utils/converter';
import { downloadAsZip } from './utils/download';
import { SavedSettings, ConversionResult } from './types';
import './App.css';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SavedSettings>(() => loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')
    );

    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    setConverting(true);
    setProgress(0);
    setResults([]);
    setErrors([]);

    const conversionSettings = {
      format: settings.format === 'jpg' ? ('image/jpeg' as const) : ('image/png' as const),
      quality: settings.quality,
      maxWidth: settings.maxWidth,
      maxHeight: settings.maxHeight,
    };

    const convertedResults: ConversionResult[] = [];
    const errorMessages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);

      const result = await convertFile(file, conversionSettings);
      convertedResults.push(result);

      if (!result.success) {
        errorMessages.push(`${file.name}: ${result.error}`);
      }

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(convertedResults);
    setErrors(errorMessages);
    setCurrentFile('');
    setConverting(false);
  };

  const handleDownload = async () => {
    await downloadAsZip(results, settings.format === 'jpg' ? 'image/jpeg' : 'image/png');
  };

  const successCount = results.filter((r) => r.success).length;

  return (
    <div className="app">
      <h1 className="app-title">HEIC Converter</h1>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <p>Drag and drop HEIC files here, or click to select</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".heic,image/heic"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <div className="settings-panel">
        <h3>Settings</h3>

        <div className="setting-group">
          <label>Format:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="format"
                value="jpg"
                checked={settings.format === 'jpg'}
                onChange={(e) =>
                  setSettings({ ...settings, format: e.target.value as 'jpg' | 'png' })
                }
              />
              JPG
            </label>
            <label>
              <input
                type="radio"
                name="format"
                value="png"
                checked={settings.format === 'png'}
                onChange={(e) =>
                  setSettings({ ...settings, format: e.target.value as 'jpg' | 'png' })
                }
              />
              PNG
            </label>
          </div>
        </div>

        <div className="setting-group">
          <label>Quality: {settings.quality}%</label>
          <input
            type="range"
            min="70"
            max="100"
            value={settings.quality}
            onChange={(e) =>
              setSettings({ ...settings, quality: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="setting-group">
          <label>Max Width (optional):</label>
          <input
            type="number"
            placeholder="Original size"
            value={settings.maxWidth ?? ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxWidth: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </div>

        <div className="setting-group">
          <label>Max Height (optional):</label>
          <input
            type="number"
            placeholder="Original size"
            value={settings.maxHeight ?? ''}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxHeight: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h3>Files ({files.length})</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name}
                <button onClick={() => handleRemoveFile(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && !converting && results.length === 0 && (
        <button className="convert-btn" onClick={handleConvert}>
          Convert {files.length} file{files.length > 1 ? 's' : ''}
        </button>
      )}

      {converting && (
        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>
            Converting {currentFile}... {progress}%
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          <h3>
            Conversion Complete: {successCount} of {results.length} succeeded
          </h3>
          {errors.length > 0 && (
            <div className="errors">
              <h4>Errors:</h4>
              <ul>
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {successCount > 0 && (
            <button className="download-btn" onClick={handleDownload}>
              Download ZIP ({successCount} file{successCount > 1 ? 's' : ''})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
```

**Step 2: Add conversion UI styles**

Append to `src/App.css`:

```css
.convert-btn,
.download-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  margin-top: 1rem;
}

.convert-btn {
  background: #007bff;
  color: white;
}

.convert-btn:hover {
  background: #0056b3;
}

.download-btn {
  background: #28a745;
  color: white;
}

.download-btn:hover {
  background: #1e7e34;
}

.progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 20px;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s;
}

.progress p {
  font-size: 0.9rem;
  color: #666;
  text-align: center;
}

.results {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.results h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.errors {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 4px;
}

.errors h4 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #856404;
}

.errors ul {
  list-style: none;
  font-size: 0.85rem;
  color: #856404;
}

.errors li {
  padding: 0.25rem 0;
}
```

**Step 3: Test full conversion flow**

Run:
```bash
npm run dev
```

Expected: Upload HEIC files, convert, download ZIP

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "feat: add conversion and download functionality"
```

---

## Task 12: Add Footer and Polish UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.css`

**Step 1: Add footer to App.tsx**

Add footer before closing `</div>` in App.tsx:

```typescript
      <footer className="footer">
        <p>All conversion happens in your browser. No files are uploaded.</p>
      </footer>
    </div>
  );
}

export default App;
```

**Step 2: Add footer styles**

Append to `src/App.css`:

```css
.footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  text-align: center;
  font-size: 0.85rem;
  color: #999;
}
```

**Step 3: Test final UI**

Run:
```bash
npm run dev
```

Expected: Clean, polished UI with footer

**Step 4: Commit**

```bash
git add src/App.tsx src/App.css
git commit -m "style: add footer and polish UI"
```

---

## Task 13: Update README

**Files:**
- Modify: `README.md`

**Step 1: Replace README content**

Replace `README.md` with:

```markdown
# HEIC Converter

Browser-based HEIC to JPG/PNG converter for bloggers. All conversion happens client-side for privacy.

## Features

- Convert HEIC files to JPG or PNG
- Batch processing with ZIP download
- Quality control (70-100%, default 95%)
- Optional image resizing
- Settings persistence via localStorage
- Zero server costs, completely client-side

## Usage

1. Drag and drop HEIC files or click to select
2. Adjust settings (format, quality, size)
3. Click "Convert"
4. Download ZIP with converted files

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run build
cd dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:username/converter.git main:gh-pages
```

## Tech Stack

- React + TypeScript + Vite
- heic2any - HEIC conversion
- jszip - ZIP compression
- file-saver - Download utility

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with usage instructions"
```

---

## Task 14: Test Production Build

**Files:**
- None (testing only)

**Step 1: Create production build**

Run:
```bash
npm run build
```

Expected: Build succeeds, dist/ folder created

**Step 2: Preview production build**

Run:
```bash
npm run preview
```

Expected: Production build runs at http://localhost:4173/converter/

**Step 3: Test conversion in production mode**

Open browser to preview URL and test:
- File upload
- Settings persistence
- Conversion
- ZIP download

Expected: All features work

**Step 4: Clean up**

Run:
```bash
rm -rf dist
```

---

## Task 15: Final Commit

**Files:**
- All files

**Step 1: Check git status**

Run:
```bash
git status
```

Expected: Working tree clean

**Step 2: Create final tag**

Run:
```bash
git tag -a v1.0.0 -m "Initial release: HEIC converter with batch processing"
```

**Step 3: View commit log**

Run:
```bash
git log --oneline
```

Expected: Clean commit history with descriptive messages

---

## Deployment Instructions

**Manual GitHub Pages Deployment:**

```bash
# Build the app
npm run build

# Navigate to dist
cd dist

# Initialize git
git init
git add -A
git commit -m 'deploy'

# Push to gh-pages branch
git push -f git@github.com:username/converter.git main:gh-pages

# Go back to project root
cd ..
```

**Configure GitHub Pages:**
1. Go to repository Settings
2. Navigate to Pages section
3. Set source to "Deploy from branch"
4. Select "gh-pages" branch
5. Click Save

**Verify deployment:**
- Visit `https://username.github.io/converter/`
- Test full conversion workflow

---

## Success Criteria

✓ HEIC files convert to JPG/PNG
✓ Batch conversion with ZIP download
✓ Settings persist across sessions
✓ Drag-and-drop file upload
✓ Progress indication during conversion
✓ Error handling for failed conversions
✓ Responsive UI with clean design
✓ Production build works correctly
✓ Ready for GitHub Pages deployment
