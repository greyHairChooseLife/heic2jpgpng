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
