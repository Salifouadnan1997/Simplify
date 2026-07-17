import React, { useState, useRef, useEffect } from "react";
import { PenTool, Upload, RefreshCw, ShieldAlert, Plus, BookOpen, Clock, Trash2, History } from "lucide-react";

interface HandwritingPanelProps {
  onInsertText: (text: string) => void;
}

interface ScanRecord {
  id: string;
  date: string;
  text: string;
  snippet: string;
}

export default function HandwritingPanel({ onInsertText }: HandwritingPanelProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("handwriting_scan_history");
    if (saved) {
      try {
        setScanHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur parsing historique OCR");
      }
    }
  }, []);

  const saveToHistory = (text: string) => {
    const newRecord: ScanRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      text,
      snippet: text.substring(0, 60) + (text.length > 60 ? "..." : "")
    };
    const updatedHistory = [newRecord, ...scanHistory].slice(0, 10); // keep last 10
    setScanHistory(updatedHistory);
    localStorage.setItem("handwriting_scan_history", JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem("handwriting_scan_history");
  };

  const loadFromHistory = (record: ScanRecord) => {
    setExtractedText(record.text);
    setImagePreview(null); // Clear image to focus on text
    setShowHistory(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 5 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setExtractedText(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleScanImage = async () => {
    if (!imagePreview) return;
    setIsLoading(true);
    setError(null);

    try {
      const mimeTypeMatch = imagePreview.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

      const response = await fetch("/api/gemini/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview,
          mimeType,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur du serveur lors de la numérisation du manuscrit.");
      }

      const result = await response.json();
      setExtractedText(result.text);
      if (result.text) {
        saveToHistory(result.text);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de numériser le manuscrit. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertAllText = () => {
    if (extractedText) {
      onInsertText(extractedText);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setExtractedText(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro info */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center">
            <BookOpen className="mr-2 text-indigo-600" size={16} />
            Numérisation Manuscrite
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
            Importez une photo d'un papier, carnet ou cahier. L'IA transcrira l'écriture manuscrite en texte numérique.
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded-sm transition-colors ${showHistory ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Historique"
        >
          <History size={16} />
        </button>
      </div>

      {showHistory ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historique Récent</span>
            {scanHistory.length > 0 && (
              <button onClick={clearHistory} className="text-[10px] text-red-600 hover:text-red-800 uppercase font-bold tracking-wider flex items-center">
                <Trash2 size={12} className="mr-1" /> Vider
              </button>
            )}
          </div>
          
          {scanHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs uppercase tracking-wider font-bold">Aucun historique</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {scanHistory.map((record) => (
                <div key={record.id} className="p-3 border border-slate-200 rounded-sm hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors" onClick={() => loadFromHistory(record)}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono text-slate-500">{new Date(record.date).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium line-clamp-2">{record.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {!imagePreview ? (
        // File upload drag & drop area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
              : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-sm mb-4 group-hover:scale-105 transition-transform">
            <PenTool size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Déposez votre photo de manuscrit ici
          </span>
          <span className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
            Formats PNG, JPG ou JPEG. Cliquez pour parcourir vos dossiers locaux.
          </span>
        </div>
      ) : (
        // Image preview and actions
        <div className="space-y-4">
          <div className="relative border border-slate-250 bg-slate-50 rounded-sm overflow-hidden group flex justify-center">
            <img
              src={imagePreview}
              alt="Aperçu document manuscrit"
              className="max-h-[220px] w-full object-contain relative z-0"
            />
            
            {/* Bounding box guide overlay */}
            {!extractedText && !isLoading && (
              <div className="absolute inset-4 sm:inset-8 border-2 border-indigo-400 border-dashed rounded-sm pointer-events-none z-10 flex items-center justify-center bg-indigo-400/10 transition-opacity opacity-70">
                <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider rounded-sm shadow-sm backdrop-blur-sm bg-opacity-90">
                  Zone de Cadrage
                </span>
              </div>
            )}

            {!extractedText && !isLoading && (
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-white text-slate-800 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-md hover:bg-slate-100"
                >
                  Remplacer l'image
                </button>
              </div>
            )}
          </div>

          {!extractedText && !isLoading && (
            <button
              onClick={handleScanImage}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all border-b border-indigo-800"
            >
              <PenTool size={14} />
              <span>Transcrire le manuscrit</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Overlay State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 border border-slate-200 bg-slate-50/80 rounded-sm">
          <RefreshCw className="text-indigo-600 animate-spin" size={28} />
          <div className="text-center px-4">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Déchiffrage en cours...</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">L'IA analyse l'écriture et retranscrit le texte.</p>
          </div>
        </div>
      )}

      {/* Error messaging */}
      {error && (
        <div className="flex items-start p-3 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs space-x-2">
          <ShieldAlert className="shrink-0 mt-0.5" size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* OCR Outputs & Fields Drawer */}
      {extractedText && (
        <div className="space-y-4 animate-fadeIn">
          {/* Full transcribed text block */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Texte Manuscrit Transcrit</span>
            <div className="max-h-[200px] overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-sm text-xs font-mono leading-relaxed shadow-inner border border-slate-800">
              {extractedText}
            </div>
          </div>

          {/* Integration controls */}
          <div className="flex gap-2">
            <button
              onClick={handleInsertAllText}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm border-b border-indigo-800"
            >
              <Plus size={14} />
              <span>Injecter dans l'éditeur</span>
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-xs font-bold uppercase tracking-wider border border-slate-200"
            >
              Nouveau Scan
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
