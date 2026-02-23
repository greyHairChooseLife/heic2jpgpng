import { useState, useRef, useEffect } from 'react';
import { loadSettings, saveSettings } from './utils/settings';
import { convertFile } from './utils/converter';
import { downloadAsZip } from './utils/download';
import type { SavedSettings, ConversionResult } from './types';
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

      <footer className="footer">
        <p>All conversion happens in your browser. No files are uploaded.</p>
      </footer>
    </div>
  );
}

export default App;
