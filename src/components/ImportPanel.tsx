import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, FileText, Sparkles, RefreshCw, FilePlus, BookOpen, 
  Sliders, Bot, ArrowRight, Check, PlusCircle, AlertCircle, Edit3, Layers,
  ChevronLeft, ChevronRight, Plus, Trash2, Scissors, Combine, Save, Database, History, HelpCircle
} from "lucide-react";
import mammoth from "mammoth";
import localforage from "localforage";

// Create a dedicated storage space for imported drafts
const importsDb = localforage.createInstance({
  name: "SaisieIntelligente",
  storeName: "imported_drafts"
});

interface ImportPanelProps {
  onInsertText: (text: string) => void;
  onReplaceContent: (text: string) => void;
  onCreateNewDocument: (title: string, content: string) => void;
}

interface ImportedDraft {
  id: string;
  name: string;
  pages: string[];
  currentPageIndex: number;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

export default function ImportPanel({ 
  onInsertText, 
  onReplaceContent, 
  onCreateNewDocument 
}: ImportPanelProps) {
  const [step, setStep] = useState<"upload" | "preview" | "personalize">("upload");
  const [personalizeMode, setPersonalizeMode] = useState<"ai" | "manual">("ai");
  
  // Storage state
  const [savedDrafts, setSavedDrafts] = useState<ImportedDraft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Document state
  const [fileDetails, setFileDetails] = useState<{ name: string; type: string } | null>(null);
  const [pages, setPages] = useState<string[]>([""]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  
  // AI personalization state
  const [aiCustomInstruction, setAiCustomInstruction] = useState("");
  const [aiPreset, setAiPreset] = useState<string | null>(null);
  const [applyToWholeDoc, setApplyToWholeDoc] = useState(false);
  
  // Dynamic pagination variables
  const [charsPerPage, setCharsPerPage] = useState<number>(1400);

  // Manual replacements state
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved drafts on mount
  useEffect(() => {
    loadSavedDrafts();
  }, []);

  const loadSavedDrafts = async () => {
    try {
      const keys = await importsDb.keys();
      const drafts: ImportedDraft[] = [];
      for (const key of keys) {
        const draft = await importsDb.getItem<ImportedDraft>(key);
        if (draft) drafts.push(draft);
      }
      // Sort by updatedAt descending
      drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSavedDrafts(drafts);
    } catch (err) {
      console.error("Erreur lors du chargement des brouillons importés :", err);
    }
  };

  // Autosave when pages, currentPageIndex, or fileDetails change
  useEffect(() => {
    if (step === "upload" || !fileDetails || pages.length === 0) return;

    const timer = setTimeout(() => {
      triggerAutosave();
    }, 1000); // Debounce autosave

    return () => clearTimeout(timer);
  }, [pages, currentPageIndex, fileDetails, step]);

  const triggerAutosave = async () => {
    if (!fileDetails) return;
    setIsAutosaving(true);
    
    const draftId = currentDraftId || "draft_" + Math.random().toString(36).substr(2, 9);
    if (!currentDraftId) {
      setCurrentDraftId(draftId);
    }

    const newDraft: ImportedDraft = {
      id: draftId,
      name: fileDetails.name,
      pages,
      currentPageIndex,
      fileType: fileDetails.type,
      createdAt: new Date().toISOString(), // Keep original if exists
      updatedAt: new Date().toISOString()
    };

    try {
      // Fetch existing if we want to preserve original createdAt
      const existing = await importsDb.getItem<ImportedDraft>(draftId);
      if (existing) {
        newDraft.createdAt = existing.createdAt;
      }
      
      await importsDb.setItem(draftId, newDraft);
      await loadSavedDrafts();
      
      setSuccessMsg("Modifications enregistrées automatiquement");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Autosave failed:", err);
    } finally {
      setIsAutosaving(false);
    }
  };

  // Auto-scan for bracketed placeholders inside the active page
  useEffect(() => {
    const activeText = pages[currentPageIndex] || "";
    if (!activeText) {
      setPlaceholders([]);
      return;
    }
    
    // Regex matches [Something], [[Something]], {{Something}}
    const regex = /\[\[?([^\]]+)\]?\]|\{\{([^}]+)\}\}/g;
    const found: string[] = [];
    let match;
    
    while ((match = regex.exec(activeText)) !== null) {
      const placeholderName = (match[1] || match[2] || "").trim();
      if (placeholderName && !found.includes(placeholderName)) {
        found.push(placeholderName);
      }
    }
    
    setPlaceholders(found);
    
    // Initialize or keep existing replacements
    const initialReps: Record<string, string> = { ...replacements };
    found.forEach(p => {
      if (initialReps[p] === undefined) {
        initialReps[p] = "";
      }
    });
    setReplacements(initialReps);
  }, [pages, currentPageIndex]);

  // Clean raw HTML to plain text for parsing
  const cleanHtmlToPlainText = (html: string): string => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  // Split long text into paragraphs, then pack them into pages
  const paginateText = (text: string, charsCount: number): string[] => {
    const paragraphs = text.split(/\n+/);
    const paginated: string[] = [];
    let currentPageContent = "";

    paragraphs.forEach(para => {
      const cleanedPara = para.trim();
      if (!cleanedPara) return;

      if ((currentPageContent + "\n\n" + cleanedPara).length > charsCount && currentPageContent.trim().length > 0) {
        paginated.push(currentPageContent.trim());
        currentPageContent = cleanedPara;
      } else {
        if (currentPageContent.trim().length === 0) {
          currentPageContent = cleanedPara;
        } else {
          currentPageContent += "\n\n" + cleanedPara;
        }
      }
    });

    if (currentPageContent.trim().length > 0) {
      paginated.push(currentPageContent.trim());
    }

    return paginated.length > 0 ? paginated : [""];
  };

  // Re-paginate the entire document dynamically
  const handleRePaginate = () => {
    const fullText = pages.join("\n\n");
    const newPages = paginateText(fullText, charsPerPage);
    setPages(newPages);
    setCurrentPageIndex(0);
    setSuccessMsg(`Document re-paginé en ${newPages.length} page(s)`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // File drop/selection handler
  const handleFileSelection = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setFileDetails({ name: file.name, type: file.type });
    setCurrentDraftId(null); // New import gets a new ID

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const audioExtensions = ["mp3", "wav", "m4a", "ogg", "webm", "flac", "aac", "wma"];
      const isAudio = file.type.startsWith("audio/") || audioExtensions.includes(extension || "");

      // Limites de taille de fichier pour éviter les dépassements de mémoire du serveur ou du navigateur
      const maxAudioSize = 10 * 1024 * 1024; // 10 Mo
      const maxPdfSize = 10 * 1024 * 1024;   // 10 Mo
      const maxDocxSize = 15 * 1024 * 1024;  // 15 Mo

      if (isAudio && file.size > maxAudioSize) {
        throw new Error(`Le fichier audio est trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Pour garantir une transcription rapide par l'IA sans déconnexion, veuillez utiliser un fichier de moins de 10 Mo.`);
      }
      if (extension === "pdf" && file.size > maxPdfSize) {
        throw new Error(`Le fichier PDF est trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). La taille maximale autorisée pour l'extraction de structure par l'IA est de 10 Mo.`);
      }
      if (extension === "docx" && file.size > maxDocxSize) {
        throw new Error(`Le fichier Word est trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). La taille maximale autorisée est de 15 Mo.`);
      }

      if (extension === "txt" || extension === "md") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const paginated = paginateText(text, charsPerPage);
          setPages(paginated);
          setCurrentPageIndex(0);
          setStep("preview");
          setIsLoading(false);
        };
        reader.onerror = () => {
          setError("Erreur de lecture du fichier texte.");
          setIsLoading(false);
        };
        reader.readAsText(file);
      } 
      else if (extension === "docx") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });
            const textContent = cleanHtmlToPlainText(result.value);
            const paginated = paginateText(textContent || result.value, charsPerPage);
            setPages(paginated);
            setCurrentPageIndex(0);
            setStep("preview");
          } catch (err: any) {
            console.error("Mammoth error:", err);
            setError("Impossible de parser ce document Word (.docx). Le fichier est peut-être protégé.");
          } finally {
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setError("Erreur de lecture du fichier Word.");
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } 
      else if (extension === "pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64Data = e.target?.result as string;
            
            const response = await fetch("/api/gemini/parse-pdf", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pdfData: base64Data })
            });

            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Erreur de traitement par l'IA");
            }

            const data = await response.json();
            const paginated = paginateText(data.text || "", charsPerPage);
            setPages(paginated);
            setCurrentPageIndex(0);
            setStep("preview");
          } catch (err: any) {
            console.error("PDF Parsing error:", err);
            setError(err.message || "La lecture asynchrone du PDF par l'IA Simplify a échoué.");
          } finally {
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setError("Erreur de lecture du fichier PDF.");
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } 
      else if (isAudio) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64Data = e.target?.result as string;
            
            const response = await fetch("/api/gemini/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                audioData: base64Data,
                mimeType: file.type || `audio/${extension === "mp3" ? "mpeg" : (extension || "webm")}`
              })
            });

            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || "Erreur de transcription de l'audio");
            }

            const data = await response.json();
            const paginated = paginateText(data.text || "", charsPerPage);
            setPages(paginated);
            setCurrentPageIndex(0);
            setStep("preview");
          } catch (err: any) {
            console.error("Audio Transcription error:", err);
            setError(err.message || "La transcription de l'audio par l'IA Simplify a échoué.");
          } finally {
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          setError("Erreur de lecture du fichier audio.");
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      }
      else {
        throw new Error("Format non pris en charge. PDF, DOCX, TXT, MD ou fichiers Audio (MP3, WAV, M4A, etc.) uniquement.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de l'importation.");
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  };

  // Resume editing a saved draft from user storage space
  const resumeDraft = (draft: ImportedDraft) => {
    setFileDetails({ name: draft.name, type: draft.fileType });
    setPages(draft.pages.length > 0 ? draft.pages : [""]);
    setCurrentPageIndex(draft.currentPageIndex < draft.pages.length ? draft.currentPageIndex : 0);
    setCurrentDraftId(draft.id);
    setStep("preview");
    setError(null);
  };

  // Delete draft from user storage
  const deleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce document du stockage ?")) return;
    try {
      await importsDb.removeItem(id);
      if (currentDraftId === id) {
        handleReset();
      } else {
        await loadSavedDrafts();
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  // Page manipulation helpers
  const handlePageTextChange = (text: string) => {
    const updated = [...pages];
    updated[currentPageIndex] = text;
    setPages(updated);
  };

  const addEmptyPage = () => {
    const updated = [...pages];
    updated.splice(currentPageIndex + 1, 0, "");
    setPages(updated);
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const deleteCurrentPage = () => {
    if (pages.length <= 1) {
      setError("Un document doit posséder au moins une page.");
      return;
    }
    const updated = [...pages];
    updated.splice(currentPageIndex, 0);
    const newPages = pages.filter((_, idx) => idx !== currentPageIndex);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  const splitPage = () => {
    const text = pages[currentPageIndex] || "";
    const halfIndex = Math.floor(text.length / 2);
    const part1 = text.substring(0, halfIndex);
    const part2 = text.substring(halfIndex);

    const updated = [...pages];
    updated[currentPageIndex] = part1;
    updated.splice(currentPageIndex + 1, 0, part2);
    setPages(updated);
    setCurrentPageIndex(currentPageIndex + 1);
    setSuccessMsg("Page scindée en deux parties");
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const mergeWithNext = () => {
    if (currentPageIndex >= pages.length - 1) {
      setError("Il n'y a pas de page suivante à fusionner.");
      return;
    }
    const updated = [...pages];
    updated[currentPageIndex] = updated[currentPageIndex] + "\n\n" + updated[currentPageIndex + 1];
    updated.splice(currentPageIndex + 1, 1);
    setPages(updated);
    setSuccessMsg("Page fusionnée avec la suivante");
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // AI-powered personalization (active page or whole document)
  const handleAIPersonalization = async (presetText?: string) => {
    setIsLoading(true);
    setError(null);
    
    const instruction = presetText || aiCustomInstruction;
    if (!instruction.trim()) {
      setError("Veuillez saisir une consigne de personnalisation pour l'IA.");
      setIsLoading(false);
      return;
    }

    const textToProcess = applyToWholeDoc ? pages.join("\n\n") : pages[currentPageIndex];

    try {
      const response = await fetch("/api/gemini/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: textToProcess,
          customStyleInstruction: instruction
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "La personnalisation IA a échoué.");
      }

      const data = await response.json();
      
      if (applyToWholeDoc) {
        // Re-paginate the returned bulk personalized text
        const processedPages = paginateText(data.personalizedText, charsPerPage);
        setPages(processedPages);
        setCurrentPageIndex(0);
        setSuccessMsg("Document complet personnalisé par l'IA");
      } else {
        // Update only active page
        const updated = [...pages];
        updated[currentPageIndex] = data.personalizedText;
        setPages(updated);
        setSuccessMsg("Page active personnalisée par l'IA");
      }
      setTimeout(() => setSuccessMsg(null), 3000);
      setStep("preview");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de communication avec l'IA. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual placeholder replacements application
  const applyManualReplacements = () => {
    const updated = [...pages];

    const replaceInText = (text: string): string => {
      let result = text;
      Object.entries(replacements).forEach(([key, value]) => {
        if (!value.trim()) return;
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\[\\[?${escapedKey}\\]?\\]|\\{\\{${escapedKey}\\}\\}`, 'g');
        result = result.replace(regex, value);
      });
      return result;
    };

    if (applyToWholeDoc) {
      const processed = updated.map(p => replaceInText(p));
      setPages(processed);
      setSuccessMsg("Variables remplacées dans tout le document !");
    } else {
      updated[currentPageIndex] = replaceInText(updated[currentPageIndex]);
      setPages(updated);
      setSuccessMsg("Variables remplacées dans la page active !");
    }

    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Export actions to main canvas
  const formatTextForInsert = (text: string): string => {
    if (text.includes("<p>") || text.includes("<div>")) {
      return text;
    }
    return text
      .split("\n\n")
      .map(p => `<p class="mb-4 leading-relaxed">${p.replace(/\n/g, "<br />")}</p>`)
      .join("");
  };

  const handleInsertActivePage = () => {
    onInsertText(formatTextForInsert(pages[currentPageIndex]));
  };

  const handleReplaceActiveDoc = () => {
    const formatted = pages.map(p => formatTextForInsert(p));
    onReplaceContent(JSON.stringify(formatted));
  };

  const handleCreateNewDraft = () => {
    const formatted = pages.map(p => formatTextForInsert(p));
    const docTitle = fileDetails ? `Import - ${fileDetails.name.split('.')[0]}` : "Document Importé";
    onCreateNewDocument(docTitle, JSON.stringify(formatted));
  };

  const handleReset = () => {
    setStep("upload");
    setPages([""]);
    setCurrentPageIndex(0);
    setFileDetails(null);
    setCurrentDraftId(null);
    setError(null);
    setSuccessMsg(null);
    setAiCustomInstruction("");
    setAiPreset(null);
    setPlaceholders([]);
    setReplacements({});
  };

  const aiPresets = [
    { label: "Style Juridique Contractuel", desc: "Formel, précis et structuré", prompt: "Réécris ce document dans un style hautement juridique, formel, précis et élégant. Renforce la rigueur des clauses et expressions sans omettre de détails." },
    { label: "Vulgarisation Simple", desc: "Clair pour les non-initiés", prompt: "Reformule ce texte de manière fluide et simple, accessible à tous, tout en préservant le sens professionnel original." },
    { label: "Proposition Commerciale", desc: "Persuasif et engageant", prompt: "Améliore ce texte pour lui donner une touche persuasive, valorisante et dynamique, idéale pour une présentation commerciale." },
    { label: "Correction d'Orthographe", desc: "Syntaxe et grammaire soignées", prompt: "Corrige parfaitement l'orthographe, la ponctuation, la grammaire et le niveau de vocabulaire de ce document." }
  ];

  return (
    <div className="space-y-4 flex flex-col h-full bg-white text-slate-800">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Importateur & Stockage</h2>
            <p className="text-[10px] text-slate-400">Parcours page par page & sauvegarde auto</p>
          </div>
        </div>

        {isAutosaving && (
          <div className="flex items-center space-x-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
            <Save size={10} />
            <span>Sauvegarde auto...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-sm p-3 text-xs flex items-start space-x-2 shrink-0">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm p-2.5 text-[11px] font-medium flex items-center space-x-1.5 shrink-0 animate-fade-in">
          <Check size={13} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD & USER STORAGE SPACE */}
      {step === "upload" && (
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-1">
          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-sm border border-slate-200">
            <strong>Espace de Stockage Intégré :</strong> Glissez un fichier Word (.docx), PDF, Texte ou un <strong>fichier Audio</strong> (MP3, WAV, M4A, etc.) pour le transcrire. Les modifications apportées page par page sont sauvegardées automatiquement pour ne jamais perdre votre travail.
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".pdf,.docx,.txt,.md,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac,.wma,audio/*" 
            className="hidden" 
          />

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[140px] border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-slate-50/50 rounded-lg flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all space-y-2.5"
          >
            {isLoading ? (
              <div className="flex flex-col items-center space-y-2">
                <RefreshCw size={24} className="text-indigo-600 animate-spin" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Lecture en cours...</span>
                  <span className="text-[9px] text-slate-400 block max-w-xs animate-pulse">
                    {fileDetails?.type === "application/pdf" 
                      ? "Extraction de la structure par Simplify..." 
                      : (fileDetails?.type?.startsWith("audio/") || ["mp3", "wav", "m4a", "ogg", "webm", "flac", "aac", "wma"].includes(fileDetails?.name?.split(".")?.pop()?.toLowerCase() || ""))
                        ? "Transcription de l'audio par Simplify..."
                        : "Génération de l'aperçu paginé..."}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Upload size={26} className="text-slate-400 animate-bounce" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 block">Glissez-déposez un document ou audio ici</span>
                  <span className="text-[10px] text-slate-400 block">ou cliquez pour choisir un fichier</span>
                </div>
                <div className="flex justify-center space-x-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-sm">PDF</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-sm">DOCX</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-sm">TXT</span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-sm">AUDIO</span>
                </div>
              </>
            )}
          </div>

          {/* USER STORAGE SPACE / BRUILLONS IMPORTÉS */}
          <div className="space-y-2 pt-2 border-t border-slate-100 flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Database size={11} className="text-indigo-500" />
                <span>Espace de Stockage Utilisateur ({savedDrafts.length})</span>
              </span>
            </div>

            {savedDrafts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 space-y-2 bg-slate-50/30">
                <History size={20} className="opacity-50" />
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold">Aucun document importé</p>
                  <p className="text-[9px] max-w-[200px] leading-normal">Les documents que vous importez et modifiez apparaîtront ici automatiquement.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1 flex-1">
                {savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => resumeDraft(draft)}
                    className="p-3 border border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1 min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <FileText size={13} className="text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-700 truncate block">
                          {draft.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[9px] font-semibold text-slate-400">
                        <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                          {draft.pages.length} page(s)
                        </span>
                        <span>•</span>
                        <span>Mise à jour : {new Date(draft.updatedAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => deleteDraft(draft.id, e)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all cursor-pointer"
                      title="Supprimer du stockage"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: MULTI-PAGE VIEW & EDIT OPTIONS */}
      {step !== "upload" && (
        <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto pr-1">
          
          {/* Top Info Banner */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs shrink-0">
            <div className="flex items-center space-x-2 truncate">
              <FileText size={14} className="text-indigo-600" />
              <span className="font-bold text-slate-700 truncate">{fileDetails?.name}</span>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider pl-2 shrink-0 border-l border-slate-200 cursor-pointer"
            >
              Fermer l'import
            </button>
          </div>

          {/* PAGE NAVIGATION SYSTEM */}
          <div className="bg-slate-900 text-white rounded-lg p-3 shrink-0 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                Navigation du Document
              </span>
              <span className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-200 font-mono">
                Page {currentPageIndex + 1} / {pages.length}
              </span>
            </div>

            {/* Left/Right Buttons */}
            <div className="flex items-center justify-between space-x-2">
              <button
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 p-2 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                <ChevronLeft size={16} className="mr-0.5" />
                <span>Précédent</span>
              </button>

              <button
                disabled={currentPageIndex === pages.length - 1}
                onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 p-2 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
              >
                <span>Suivant</span>
                <ChevronRight size={16} className="ml-0.5" />
              </button>
            </div>

            {/* Pagination settings & actions row */}
            <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-800 text-[10px] font-bold uppercase text-slate-300">
              <button
                onClick={addEmptyPage}
                className="bg-slate-800 hover:bg-indigo-900 p-1.5 rounded flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
                title="Ajouter une page vide"
              >
                <Plus size={12} />
                <span className="text-[8px]">Ajouter</span>
              </button>

              <button
                onClick={deleteCurrentPage}
                disabled={pages.length <= 1}
                className="bg-slate-800 hover:bg-red-950 disabled:opacity-30 p-1.5 rounded flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
                title="Supprimer la page active"
              >
                <Trash2 size={12} />
                <span className="text-[8px]">Supprimer</span>
              </button>

              <button
                onClick={splitPage}
                className="bg-slate-800 hover:bg-indigo-900 p-1.5 rounded flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
                title="Diviser cette page en deux parties égales"
              >
                <Scissors size={12} />
                <span className="text-[8px]">Scinder</span>
              </button>

              <button
                onClick={mergeWithNext}
                disabled={currentPageIndex >= pages.length - 1}
                className="bg-slate-800 hover:bg-indigo-900 disabled:opacity-30 p-1.5 rounded flex flex-col items-center justify-center space-y-0.5 cursor-pointer"
                title="Fusionner avec la page suivante"
              >
                <Combine size={12} />
                <span className="text-[8px]">Fusionner</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC RE-PAGINATION SETTINGS (SLIDER) */}
          <div className="p-2.5 border border-slate-200 bg-slate-50/60 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Densité par Page :</span>
              <span className="font-mono text-indigo-600">{charsPerPage} caractères</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={charsPerPage}
                onChange={(e) => setCharsPerPage(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
              />
              <button
                onClick={handleRePaginate}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-indigo-200 cursor-pointer"
                title="Re- découper le document entier avec ce seuil"
              >
                Re-paginer
              </button>
            </div>
          </div>

          {/* MODE SELECTOR */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button
              onClick={() => {
                setStep("personalize");
                setPersonalizeMode("ai");
              }}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                step === "personalize" && personalizeMode === "ai"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Bot size={13} />
              <span>Personnaliser IA</span>
            </button>
            <button
              onClick={() => {
                setStep("personalize");
                setPersonalizeMode("manual");
              }}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                step === "personalize" && personalizeMode === "manual"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Sliders size={13} />
              <span>Saisie Manuelle</span>
            </button>
            <button
              onClick={() => setStep("preview")}
              className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                step === "preview"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Edit3 size={13} />
              <span>Éditer Texte</span>
            </button>
          </div>

          {/* ACTIVE STEP CONTAINER */}
          <div className="flex-1 min-h-[160px] overflow-y-auto pr-0.5">
            
            {/* AI Personalization tab */}
            {step === "personalize" && personalizeMode === "ai" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Sélectionnez un ajustement IA :</span>
                </div>
                
                <div className="grid grid-cols-1 gap-1.5">
                  {aiPresets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiPreset(p.prompt);
                        setAiCustomInstruction(p.prompt);
                      }}
                      className={`text-left p-2.5 border rounded-lg transition-all flex flex-col space-y-0.5 cursor-pointer ${
                        aiPreset === p.prompt 
                          ? "border-indigo-600 bg-indigo-50/50" 
                          : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>{p.label}</span>
                        {aiPreset === p.prompt && <Check size={11} className="text-indigo-600" />}
                      </span>
                      <span className="text-[9px] text-slate-400 leading-normal">{p.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Consigne personnalisée pour l'IA :
                  </label>
                  <textarea
                    value={aiCustomInstruction}
                    onChange={(e) => {
                      setAiCustomInstruction(e.target.value);
                      setAiPreset(null);
                    }}
                    placeholder="Ex: Traduis en anglais, ajoute une clause d'accord de confidentialité, remplace le nom du prestataire..."
                    className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[70px] resize-none"
                  />
                </div>

                {/* Scope selector */}
                <div className="flex items-center space-x-3 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Portée :</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ai-scope"
                      checked={!applyToWholeDoc}
                      onChange={() => setApplyToWholeDoc(false)}
                      className="accent-indigo-600"
                    />
                    <span>Page active</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ai-scope"
                      checked={applyToWholeDoc}
                      onChange={() => setApplyToWholeDoc(true)}
                      className="accent-indigo-600"
                    />
                    <span>Document entier</span>
                  </label>
                </div>

                <button
                  onClick={() => handleAIPersonalization()}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white p-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Génération en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Personnaliser par IA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Manual Saisie Tab */}
            {step === "personalize" && personalizeMode === "manual" && (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                  <Layers size={13} className="inline mr-1 text-slate-400" />
                  Remplissez les variables trouvées pour les intégrer instantanément.
                </p>

                {/* Scope selector */}
                <div className="flex items-center space-x-3 p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Appliquer à :</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="manual-scope"
                      checked={!applyToWholeDoc}
                      onChange={() => setApplyToWholeDoc(false)}
                      className="accent-indigo-600"
                    />
                    <span>Page active</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="manual-scope"
                      checked={applyToWholeDoc}
                      onChange={() => setApplyToWholeDoc(true)}
                      className="accent-indigo-600"
                    />
                    <span>Document entier</span>
                  </label>
                </div>

                {placeholders.length === 0 ? (
                  <div className="text-center py-5 text-xs text-slate-400 italic">
                    Aucune variable générique (ex: [Nom]) détectée sur cette page.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Variables de la page active :
                    </span>
                    {placeholders.map((p, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 font-mono block">
                          {p} :
                        </label>
                        <input
                          type="text"
                          value={replacements[p] || ""}
                          onChange={(e) => {
                            const updated = { ...replacements, [p]: e.target.value };
                            setReplacements(updated);
                          }}
                          placeholder={`Remplacer ${p}...`}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {placeholders.length > 0 && (
                  <button
                    onClick={applyManualReplacements}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Check size={13} />
                    <span>Remplacer les variables</span>
                  </button>
                )}
              </div>
            )}

            {/* Manual Page Textarea Editing */}
            {step === "preview" && (
              <div className="space-y-2 flex flex-col h-full">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Contenu de la page active :
                </span>
                <textarea
                  value={pages[currentPageIndex] || ""}
                  onChange={(e) => handlePageTextChange(e.target.value)}
                  placeholder="Écrivez le texte de cette page ici..."
                  className="w-full flex-1 text-xs font-mono p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 h-[170px] resize-none overflow-y-auto bg-slate-50/50"
                />
              </div>
            )}

          </div>

          {/* EXPORT OPTIONS TO MAIN APP CONTAINER */}
          <div className="border-t border-slate-100 pt-3 space-y-2 shrink-0">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">
              Exporter vers votre Editeur :
            </span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleInsertActivePage}
                className="bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer"
                title="Insère le texte de la page courante au niveau du curseur"
              >
                <PlusCircle size={12} />
                <span>Page Courante</span>
              </button>

              <button
                onClick={handleReplaceActiveDoc}
                className="bg-white border border-slate-300 hover:border-indigo-500 text-slate-700 hover:text-indigo-600 p-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer"
                title="Écrase toutes les pages du brouillon actif avec ces pages importées"
              >
                <RefreshCw size={12} />
                <span>Remplacer Doc</span>
              </button>
            </div>

            <button
              onClick={handleCreateNewDraft}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              title="Crée un tout nouveau document avec toutes les pages importées"
            >
              <FilePlus size={13} />
              <span>Créer un Nouveau Document</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
