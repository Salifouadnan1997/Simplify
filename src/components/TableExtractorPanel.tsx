import React, { useState, useRef } from "react";
import { Table, Download, FilePlus, Loader2, Sparkles, AlertCircle, Upload, X } from "lucide-react";

interface TableExtractorPanelProps {
  documentContent: string;
  onInsertContent: (content: string) => void;
}

export default function TableExtractorPanel({ documentContent, onInsertContent }: TableExtractorPanelProps) {
  const [extractedData, setExtractedData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Format de fichier non supporté. Veuillez utiliser un PDF ou une image (JPEG, PNG).");
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
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExtract = async () => {
    if (!documentContent.trim() && !selectedFile) {
      setError("Veuillez fournir du texte dans le document ou importer un fichier à analyser.");
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
        payload.text = documentContent;
      }

      const response = await fetch("/api/gemini/extract-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'extraction des données.");
      }

      const { data } = await response.json();
      
      if (!data || data.length === 0) {
        setError("Aucune donnée structurée n'a pu être trouvée.");
        setExtractedData(null);
      } else {
        setExtractedData(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaders = () => {
    if (!extractedData || extractedData.length === 0) return [];
    const allKeys = new Set<string>();
    extractedData.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys);
  };

  const headers = getHeaders();

  const handleDownloadCSV = () => {
    if (!extractedData || extractedData.length === 0) return;
    
    // Create CSV
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    for (const row of extractedData) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "donnees_extraites.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInsertMarkdown = () => {
    if (!extractedData || extractedData.length === 0) return;
    
    let markdown = "\n\n| " + headers.join(" | ") + " |\n";
    markdown += "| " + headers.map(() => "---").join(" | ") + " |\n";
    
    for (const row of extractedData) {
      markdown += "| " + headers.map(header => (row[header] || '')).join(" | ") + " |\n";
    }
    
    onInsertContent(markdown + "\n");
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="p-4 bg-white border-b border-slate-200 flex items-center space-x-2 shrink-0">
        <Table className="text-blue-600" size={20} />
        <h2 className="font-bold text-slate-800">Extraction de Tableaux</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-4">
            Utilisez l'IA pour analyser le contenu de votre document ou importez un fichier (PDF, Image) pour en extraire automatiquement les listes, factures, ou données structurées sous forme de tableau.
          </p>
          
          <div className="flex flex-col space-y-3 mb-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,image/jpeg,image/png,image/webp" 
              className="hidden" 
            />
            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex justify-center items-center space-x-2 bg-white border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 p-3 rounded-md font-medium transition-colors"
              >
                <Upload size={18} />
                <span>Importer un document à analyser (PDF, Image)</span>
              </button>
            ) : (
              <div className="w-full flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-md">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <FilePlus size={18} className="shrink-0" />
                  <span className="truncate text-sm font-medium">{selectedFile.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-1 hover:bg-blue-100 rounded-full shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <button
              onClick={handleExtract}
              disabled={isLoading || (!documentContent.trim() && !selectedFile)}
              className="w-full flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Extraire les données en tableau</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start space-x-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {extractedData && extractedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mb-4">
              <button
                onClick={handleDownloadCSV}
                className="flex-1 flex justify-center items-center space-x-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-medium text-sm transition-colors"
              >
                <Download size={16} />
                <span>Exporter vers Excel (CSV)</span>
              </button>
              <button
                onClick={handleInsertMarkdown}
                className="flex-1 flex justify-center items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-md font-medium text-sm transition-colors"
              >
                <FilePlus size={16} />
                <span>Insérer dans le document</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {headers.map((header, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {extractedData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {headers.map((header, j) => (
                        <td key={j} className="px-4 py-2 whitespace-nowrap text-slate-700">
                          {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
