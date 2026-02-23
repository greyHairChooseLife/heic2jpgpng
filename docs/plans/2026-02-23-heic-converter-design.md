# HEIC to JPG/PNG Converter - Design Document

## Overview

A browser-based HEIC image converter for bloggers, deployed on GitHub Pages. Converts HEIC files to JPG/PNG with quality and size controls, all processing done client-side for privacy.

## Requirements

### Core Features
- Convert HEIC files to JPG or PNG
- Batch processing with ZIP download
- Quality control (70-100%, default 95%)
- Optional image resizing (width/height)
- Remember user preferences via localStorage
- Preserve file metadata (lastModified timestamp)
- Prepend "converted_" to output filenames

### Non-Goals
- Server-side processing
- Advanced editing features
- Format conversion beyond HEIC

## Architecture

### Approach
Single-page application with all logic in `App.tsx`. No component splitting to keep it lean and focused on core functionality.

### Tech Stack
- React + TypeScript + Vite
- `heic2any` - HEIC to JPG/PNG conversion
- `jszip` - Batch file compression
- `file-saver` - Download trigger
- `localStorage` - Settings persistence

### Data Flow
1. User uploads HEIC files (drag-and-drop or click)
2. Files stored in React state
3. User adjusts settings (format/quality/size)
4. Click "Convert" → iterate through files
5. Convert each file with `heic2any`
6. Apply resize if needed (Canvas API)
7. Bundle all converted files into ZIP
8. Download ZIP file

## Component Structure

### Single Component: App.tsx

**State:**
```typescript
files: File[]              // Uploaded HEIC files
format: 'jpg' | 'png'      // Output format
quality: number            // 70-100, default 95
maxWidth: number | null    // Optional max width
maxHeight: number | null   // Optional max height
converting: boolean        // Conversion in progress
progress: number           // Progress 0-100
convertedFiles: Blob[]     // Converted file blobs
```

**UI Sections:**
1. Drag-and-drop upload area
2. Settings panel
   - Format selector (radio: JPG/PNG)
   - Quality slider (70-100%)
   - Resize inputs (optional numeric)
3. File list (uploaded files)
4. Convert button (with progress)
5. Download button (ZIP, shown after conversion)

## Conversion Logic

### Process
```
For each HEIC file:
  1. Convert with heic2any({ blob, toType, quality })
  2. If resize needed:
     - Load into Image
     - Draw to Canvas with new dimensions
     - Export as Blob
  3. Add to convertedFiles array
  4. Update progress

After all files:
  1. Create JSZip instance
  2. Add each file with "converted_" prefix
  3. Generate ZIP blob
  4. Download via FileSaver
```

### Resize Logic
- Both null → keep original size
- Only width → maintain aspect ratio
- Only height → maintain aspect ratio
- Both set → fit within bounds, maintain aspect ratio

### File Naming
- Input: `photo.heic`
- Output: `converted_photo.jpg` or `converted_photo.png`
- ZIP: `heic-converted-YYYYMMDD-HHMMSS.zip`

### Error Handling
- Skip failed files, continue with rest
- Display error message with filename
- Allow download if at least one file succeeds

### Metadata Preservation
- Preserve `lastModified` timestamp from original file
- EXIF data handled automatically by `heic2any`

## Settings Persistence

### localStorage Key
`heic-converter-settings`

### Stored Data
```json
{
  "format": "jpg",
  "quality": 95,
  "maxWidth": null,
  "maxHeight": null
}
```

### Behavior
- Load settings on app mount
- Save settings on change
- Use defaults if no saved settings exist

## Deployment

### GitHub Pages Setup

**vite.config.ts:**
```typescript
export default defineConfig({
  base: '/converter/', // Repository name
  // ...
})
```

**Manual Deployment:**
1. `npm run build` → generates `dist/`
2. Push `dist/` contents to `gh-pages` branch
3. Configure GitHub Pages to serve from `gh-pages` branch

### Dependencies to Install
```bash
npm install jszip file-saver
npm install -D @types/file-saver
```

## UI/UX Principles

- Sane defaults (95% quality, original size, JPG format)
- Minimal configuration required
- Clear progress feedback
- Single-click download after conversion
- No clutter, focus on core conversion task

## Success Criteria

- Convert HEIC to JPG/PNG in browser
- Handle multiple files efficiently
- Download as ZIP
- Settings persist across sessions
- Deploy successfully to GitHub Pages
- Zero server costs, completely client-side
