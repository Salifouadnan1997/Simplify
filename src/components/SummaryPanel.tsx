import React, { useState, useRef } from "react";
import { FileText, Loader2, Sparkles, BookOpen, PlusCircle, Upload, FilePlus } from "lucide-react";
import Markdown from "react-markdown";
import { marked } from "marked";

interface SummaryPanelProps {
  documentContent: string;
  onInsertContent: (content: string) => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ documentContent, onInsertContent }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"];
    if (!validTypes.includes(file.type)) {
      setError("Format de fichier non supporté. Veuillez utiliser un PDF, une image ou un fichier texte.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 5 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        name: file.name,
        data: event.target?.result as string,
        type: file.type
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSummarize = async () => {
    if (!selectedFile && (!documentContent || documentContent.trim() === "")) {
      setError("Le document est vide. Veuillez importer un fichier ou rédiger du texte avant de résumer.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {};

      if (selectedFile) {
        payload.fileData = selectedFile.data;
        payload.mimeType = selectedFile.type;
      } else {
        // Parse content if it's JSON (multiple pages)
        let rawText = documentContent;
        try {
          const pages = JSON.parse(documentContent);
          if (Array.isArray(pages)) {
            // Join all pages and strip HTML tags
            const combinedHtml = pages.join("\n");
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = combinedHtml;
            rawText = tempDiv.textContent || tempDiv.innerText || "";
          }
        } catch (e) {
          // If not JSON, it might just be HTML
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = documentContent;
          rawText = tempDiv.textContent || tempDiv.innerText || "";
        }

        if (!rawText || rawText.trim() === "") {
          throw new Error("Le document ne contient pas de texte lisible.");
        }
        payload.documentText = rawText;
      }

      const response = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de la génération du résumé");
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de générer le résumé. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 p-6 shadow-xl rounded-2xl border border-slate-100 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
        <div className="bg-indigo-100 p-2 rounded-xl">
          <BookOpen className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent">Résumé Intelligent</h2>
          <p className="text-sm text-slate-500">Synthétisez vos documents pour un apprentissage rapide</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-6">
        <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
          Transformez de longs documents (cours, contrats, rapports) en fiches de synthèse structurées. L'intelligence artificielle Simplify extrait les concepts clés pour vous faciliter l'apprentissage.
        </p>

        {!summary && !isLoading && (
          <div className="flex-1 flex flex-col space-y-4 py-4">
            
            <div className="flex flex-col space-y-3 mb-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf,image/jpeg,image/png,image/webp,text/plain" 
                className="hidden" 
              />
              {!selectedFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex justify-center items-center space-x-2 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-600 p-3 rounded-md font-medium transition-colors"
                >
                  <Upload size={18} />
                  <span>Importer un fichier (PDF, Image, Texte)</span>
                </button>
              ) : (
                <div className="w-full flex justify-between items-center bg-indigo-50 border border-indigo-200 text-indigo-700 p-3 rounded-md">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FilePlus size={18} className="shrink-0" />
                    <span className="truncate text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-indigo-100 rounded-full shrink-0"
                    title="Retirer le fichier"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                <FileText className="h-10 w-10 text-indigo-300" />
              </div>
              <p className="text-slate-500 text-center max-w-xs text-sm">
                {!selectedFile ? "Prêt à résumer le document actuellement ouvert dans l'éditeur ou un fichier importé." : "Prêt à résumer le fichier importé."}
              </p>
              <button
                onClick={handleSummarize}
                className="mt-4 w-full justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium flex items-center space-x-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Générer le résumé</span>
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-12">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin relative z-10" />
            </div>
            <p className="text-indigo-600 font-medium animate-pulse text-center">
              Analyse du document et génération de la synthèse en cours...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-3">
            <div className="bg-white rounded-full p-1 mt-0.5">
              <span className="text-red-500 text-xl leading-none">!</span>
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {summary && !isLoading && (
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                Fiche de Synthèse
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={async () => {
                    if (summary) {
                      const html = await marked.parse(summary);
                      onInsertContent(html);
                    }
                  }}
                  className="text-xs flex items-center space-x-1 text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>Ajouter au doc</span>
                </button>
                <button 
                  onClick={handleSummarize}
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                >
                  Régénérer
                </button>
              </div>
            </div>
            
            <div className="bg-white border border-indigo-100 p-5 rounded-2xl shadow-sm overflow-y-auto flex-1 text-sm text-slate-700">
              <div className="markdown-body prose prose-sm max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600 prose-strong:text-slate-800">
                <Markdown>{summary}</Markdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPanel;
