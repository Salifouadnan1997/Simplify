import React, { useState, useRef } from "react";
import { Upload, FileImage, ShieldAlert, CheckCircle2, Sparkles, Plus, Copy, ListFilter, RefreshCw } from "lucide-react";
import { DetectedField } from "../types";
import { checkQuota, incrementQuota } from "../lib/quotaService";

interface OcrPanelProps {
  onInsertText: (text: string) => void;
  onSetTitle: (title: string) => void;
}

export default function OcrPanel({ onInsertText, onSetTitle }: OcrPanelProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [docType, setDocType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop event handlers
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Convert uploaded image to base64 and set preview
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Seuls les formats d'image (PNG, JPG, JPEG, WEBP) sont autorisés pour la numérisation OCR.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture de l'image.");
    };
    reader.readAsDataURL(file);
  };

  // Trigger OCR API via Express server
  const handleScanImage = async () => {
    if (!imagePreview) return;

    const quota = await checkQuota('ocrUsed');
    if (!quota.allowed) {
      alert(quota.message || "Limite atteinte pour l'OCR. Veuillez souscrire à un forfait.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imagePreview,
          mimeType: "image/png", // Server parses clean base64 format itself
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue pendant l'analyse OCR.");
      }

      const result = await response.json();
      await incrementQuota('ocrUsed');
      setExtractedText(result.text);
      setDocType(result.documentType);
      setDetectedFields(result.detectedFields || []);

      // Auto propose setting the document title to the first field or docType
      if (result.documentType) {
        const titleField = result.detectedFields.find((f: any) => f.name.toLowerCase().includes("titre") || f.name.toLowerCase().includes("sujet"));
        if (titleField && titleField.value) {
          onSetTitle(`${result.documentType} - ${titleField.value}`);
        } else {
          onSetTitle(`${result.documentType} Numérisé`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de numériser le document. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertAllText = () => {
    if (extractedText) {
      onInsertText(extractedText);
    }
  };

  const handleInsertField = (field: DetectedField) => {
    onInsertText(`\n**${field.name}** : ${field.value}\n`);
  };

  const handleReset = () => {
    setImagePreview(null);
    setExtractedText(null);
    setDetectedFields([]);
    setDocType(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro info */}
      <div>
        <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center">
          <Sparkles className="mr-2 text-blue-600" size={16} />
          Numérisation et OCR Intelligent
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
          Importez une capture d'écran, une photo de contrat ou une facture. Simplify transcrira le texte et extraira automatiquement les métadonnées.
        </p>
      </div>

      {!imagePreview ? (
        // File upload drag & drop area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
              : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="p-3 bg-blue-50 text-blue-600 rounded-sm mb-4 group-hover:scale-105 transition-transform">
            <Upload size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Déposez votre capture ou image ici
          </span>
          <span className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
            Formats PNG, JPG ou JPEG. Cliquez pour parcourir vos dossiers locaux.
          </span>
        </div>
      ) : (
        // Image preview and actions
        <div className="space-y-4">
          <div className="relative border border-slate-250 bg-slate-50 rounded-sm overflow-hidden group">
            <img
              src={imagePreview}
              alt="Aperçu document importé"
              className="max-h-[220px] w-full object-contain mx-auto"
            />
            {!extractedText && !isLoading && (
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all border-b border-blue-800"
            >
              <Sparkles size={14} />
              <span>Lancer l'analyse OCR</span>
            </button>
          )}
        </div>
      )}

      {/* Loading Overlay State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 border border-slate-200 bg-slate-50/80 rounded-sm">
          <RefreshCw className="text-blue-600 animate-spin" size={28} />
          <div className="text-center px-4">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transcription intelligente...</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">Simplify extrait la structure, le texte et identifie les métadonnées professionnelles.</p>
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
          {/* Document Type badge */}
          {docType && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Type détecté :</span>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-sm border border-blue-200 uppercase tracking-wider">
                {docType}
              </span>
            </div>
          )}

          {/* Extracted Fields */}
          {detectedFields.length > 0 && (
            <div className="space-y-2 border border-slate-200 rounded-sm p-4 bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center">
                <ListFilter className="mr-1.5" size={12} /> Données de formulaire extraites
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {detectedFields.map((field, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleInsertField(field)}
                    className="flex flex-col p-2 bg-white border border-slate-150 rounded-sm text-left cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
                  >
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">{field.name}</span>
                    <span className="text-[11px] font-bold text-slate-700 mt-0.5 truncate">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full transcribed text block */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Texte Brut Transcrit</span>
            <div className="max-h-[200px] overflow-y-auto bg-slate-950 text-slate-200 p-4 rounded-sm text-xs font-mono leading-relaxed shadow-inner border border-slate-800">
              {extractedText}
            </div>
          </div>

          {/* Integration controls */}
          <div className="flex gap-2">
            <button
              onClick={handleInsertAllText}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm border-b border-blue-800"
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
    </div>
  );
}
