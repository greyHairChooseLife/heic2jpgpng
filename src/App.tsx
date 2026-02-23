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
  const [settingsOpen, setSettingsOpen] = useState(false);

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

    const successCount = convertedResults.filter((r) => r.success).length;
    const notify = () => {
      new Notification('HEIC Converter', {
        body: `Done! ${successCount} of ${convertedResults.length} file${convertedResults.length !== 1 ? 's' : ''} converted.`,
      });
    };

    if (Notification.permission === 'granted') {
      notify();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') notify();
      });
    }
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
        <button className="settings-toggle" onClick={() => setSettingsOpen((v) => !v)}>
          Settings {settingsOpen ? '▲' : '▼'}
        </button>

        {settingsOpen && (
          <div className="settings-body">
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
              <label>Max Width <span className="label-hint">(px, e.g. 1920)</span></label>
              <input
                type="number"
                placeholder="Leave empty to keep original"
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
              <label>Max Height <span className="label-hint">(px, e.g. 1080)</span></label>
              <input
                type="number"
                placeholder="Leave empty to keep original"
                value={settings.maxHeight ?? ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxHeight: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
              <p className="setting-hint">Aspect ratio is preserved. Both set = fit within bounds.</p>
            </div>
          </div>
        )}
      </div>

      <div className="file-list">
        <h3>Files ({files.length})</h3>
        {files.length === 0 ? (
          <p className="file-list-empty">No files added yet. Drop HEIC files above to get started.</p>
        ) : (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name}
                <button onClick={() => handleRemoveFile(index)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        className={`convert-btn${files.length === 0 || converting || results.length > 0 ? ' disabled' : ''}`}
        onClick={handleConvert}
        disabled={files.length === 0 || converting || results.length > 0}
      >
        {converting ? `Converting... ${progress}%` : `Convert ${files.length} file${files.length !== 1 ? 's' : ''}`}
      </button>

      {converting && (
        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p>Converting {currentFile}...</p>
        </div>
      )}

      {results.length > 0 && errors.length > 0 && (
        <div className="errors">
          <h4>Errors:</h4>
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        className={`download-btn${results.length === 0 || successCount === 0 ? ' disabled' : ''}`}
        onClick={handleDownload}
        disabled={results.length === 0 || successCount === 0}
      >
        {results.length > 0
          ? `Download ZIP (${successCount} file${successCount !== 1 ? 's' : ''})`
          : 'Download ZIP'}
      </button>

      {results.length > 0 && (
        <p className="results-summary">
          Conversion complete: {successCount} of {results.length} succeeded.
        </p>
      )}

      <footer className="footer">
        <p>All conversion happens in your browser. No files are uploaded.</p>
      </footer>
    </div>
  );
}

export default App;
