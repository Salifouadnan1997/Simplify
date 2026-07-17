import React, { useRef, useState, useEffect } from "react";
import ContentEditable from "react-contenteditable";
import html2pdf from "html2pdf.js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { renderToStaticMarkup } from "react-dom/server";
import { SmartDocument, DocumentSignature } from "../types";
import { DOCUMENT_THEMES, getAnimationClass, getDocumentInlineStyles } from "../utils";
import { Trash2, Loader2, FileDown, Printer, X, Eye, PlusCircle, Sparkles, FileText, Move, Copy, Minus, Plus, Undo, Redo, Upload, RotateCw } from "lucide-react";
import CanvaProPanel from "./CanvaProPanel";
import CoverRenderer from "./CoverRenderer";
import { NEW_COVER_PRESETS } from "./coverThemes";


const COVER_PRESETS = [
  {
    id: "template-riche",
    name: "Devenez Riche (Livre Or)",
    class: "bg-[#0a1128] text-amber-400",
    previewGradient: "from-[#0a1128] to-blue-950",
    imageUrl: "template-riche",
  },
  {
    id: "template-foi",
    name: "Le Monde de la Foi",
    class: "bg-black text-white",
    previewGradient: "from-slate-900 to-black",
    imageUrl: "template-foi",
  },
  {
    id: "template-law",
    name: "Esprit & Lumière",
    class: "bg-orange-950 text-white",
    previewGradient: "from-orange-900 to-amber-900",
    imageUrl: "template-law",
  },
  {
    id: "template-effective",
    name: "L'Investisseur",
    class: "bg-slate-50 text-slate-900 light-cover",
    previewGradient: "from-slate-100 to-slate-200",
    imageUrl: "template-effective",
  },
  {
    id: "template-beginner",
    name: "Guide Débutant",
    class: "bg-white text-teal-800 light-cover",
    previewGradient: "from-white to-teal-50",
    imageUrl: "template-beginner",
  },
  {
    id: "template-designing",
    name: "Design Premium",
    class: "bg-zinc-900 text-amber-500",
    previewGradient: "from-zinc-800 to-black",
    imageUrl: "template-designing",
  },
];

const ALL_COVER_PRESETS = [...COVER_PRESETS, ...NEW_COVER_PRESETS];


interface DocumentEditorProps {
  document: SmartDocument;
  onChangeContent: (content: string) => void;
  onChangeTitle: (title: string) => void;
  onChangeCoverImage?: (coverImage: string) => void;
  onChangeDocument?: (document: SmartDocument) => void;
  onUpdateSignatures: (signatures: DocumentSignature[]) => void;
  onUpdateContentAndSignatures?: (content: string, signatures: DocumentSignature[]) => void;
  activeSignatureId: string | null;
  onActivePageChange?: (index: number) => void;
  interimDictationText?: string;
  onClearActiveSignature?: () => void;
}

export default function DocumentEditor({
  document: doc,
  onChangeContent,
  onChangeTitle,
  onChangeCoverImage,
  onChangeDocument,
  onUpdateSignatures,
  onUpdateContentAndSignatures,
  activeSignatureId,
  onActivePageChange,
  interimDictationText = "",
  onClearActiveSignature,
}: DocumentEditorProps) {
  const [selectedSigId, setSelectedSigId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [activePageIndexLocal, setActivePageIndexLocal] = useState<number>(0);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);
  const [showMinPageWarning, setShowMinPageWarning] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showBillingHelp, setShowBillingHelp] = useState(false);

  const [selectedPageToSign, setSelectedPageToSign] = useState<number>(0);
  const [selectedPlacement, setSelectedPlacement] = useState<string>("bottom-right");

  useEffect(() => {
    setSelectedPageToSign(activePageIndexLocal);
  }, [activePageIndexLocal]);

  // Local state for cover page text to prevent rapid database writes and lost focus
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [coverCompanyName, setCoverCompanyName] = useState("");
  const [coverDate, setCoverDate] = useState("");
  const [coverDocType, setCoverDocType] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const openCoverModal = () => {
    setCoverSubtitle(doc.coverSubtitle || "PROJET / DOCUMENT");
    setCoverCompanyName(doc.coverCompanyName || "SIMPLIFY CREATIVE");
    setCoverDate(doc.coverDate || new Date(doc.createdAt || Date.now()).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    setCoverDocType(doc.type || "Document Professionnel");
    setCoverImage(doc.coverImage || "");
    setShowCoverModal(true);
  };

  // Text element dragging states for Move Mode
  const [editorMode, setEditorMode] = useState<"edit" | "move">("edit");
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [textDragOffset, setTextDragOffset] = useState({ x: 0, y: 0 });
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  // Undo/Redo history tracking
  interface HistoryState {
    pages: string[];
    signatures: DocumentSignature[];
  }
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const prevDocIdRef = useRef<string | null>(null);

  const lastKnownContentRef = useRef<string>("");
  const lastKnownSignaturesRef = useRef<string>("");
  const restoringStateRef = useRef<{ content: string; signatures: string } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeSignatureId && onClearActiveSignature) {
        onClearActiveSignature();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSignatureId, onClearActiveSignature]);

  // Drag-to-resize states for Canva Pro Blocks
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0, fontSize: 14 });
  const [resizeStartMouse, setResizeStartMouse] = useState({ x: 0, y: 0 });

  const handleUndo = () => {
    if (historyPointer > 0) {
      const prevPointer = historyPointer - 1;
      const prevState = history[prevPointer];
      if (!prevState) return;

      const contentStr = JSON.stringify(prevState.pages);
      const sigsStr = JSON.stringify(prevState.signatures);
      restoringStateRef.current = { content: contentStr, signatures: sigsStr };
      setHistoryPointer(prevPointer);
      
      if (onUpdateContentAndSignatures) {
        onUpdateContentAndSignatures(contentStr, prevState.signatures);
      } else {
        onChangeContent(contentStr);
        onUpdateSignatures(prevState.signatures);
      }
    }
  };

  const handleRedo = () => {
    if (historyPointer < history.length - 1) {
      const nextPointer = historyPointer + 1;
      const nextState = history[nextPointer];
      if (!nextState) return;

      const contentStr = JSON.stringify(nextState.pages);
      const sigsStr = JSON.stringify(nextState.signatures);
      restoringStateRef.current = { content: contentStr, signatures: sigsStr };
      setHistoryPointer(nextPointer);
      
      if (onUpdateContentAndSignatures) {
        onUpdateContentAndSignatures(contentStr, nextState.signatures);
      } else {
        onChangeContent(contentStr);
        onUpdateSignatures(nextState.signatures);
      }
    }
  };

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when editing title or another focusable input
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.id === "doc-title-input")) {
        // Allow default input behavior
        if (activeEl.id === "doc-title-input") return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyPointer, history]);

  // Sync parent doc adjustments to the Undo/Redo history stack (debounced for text editing, fast for drag/discrete actions)
  useEffect(() => {
    if (!doc) return;
    
    const currentContent = doc.content || "[]";
    const currentSignaturesStr = JSON.stringify(doc.signatures || []);

    // 1. If document ID changed, reset the history stack
    if (prevDocIdRef.current !== doc.id) {
      prevDocIdRef.current = doc.id;
      let initialPages: string[] = [];
      try {
        const parsed = JSON.parse(currentContent);
        if (Array.isArray(parsed)) {
          initialPages = parsed;
        } else {
          initialPages = [currentContent || "<p><br/></p>"];
        }
      } catch (e) {
        initialPages = [currentContent || "<p><br/></p>"];
      }
      if (initialPages.length === 0) {
        initialPages = ["<p><br/></p>"];
      }
      const initialSigs = doc.signatures || [];

      setHistory([{ pages: initialPages, signatures: initialSigs }]);
      setHistoryPointer(0);

      lastKnownContentRef.current = currentContent;
      lastKnownSignaturesRef.current = currentSignaturesStr;
      restoringStateRef.current = null;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    // 2. If we are currently restoring a history state (Undo/Redo)
    if (restoringStateRef.current) {
      const matchesRestoring = restoringStateRef.current.content === currentContent &&
                               restoringStateRef.current.signatures === currentSignaturesStr;
      if (matchesRestoring) {
        lastKnownContentRef.current = currentContent;
        lastKnownSignaturesRef.current = currentSignaturesStr;
        restoringStateRef.current = null;
      }
      return;
    }

    // 3. Detect if content or signatures actually changed
    const contentChanged = lastKnownContentRef.current !== currentContent;
    const signaturesChanged = lastKnownSignaturesRef.current !== currentSignaturesStr;

    if (contentChanged || signaturesChanged) {
      let currentPages: string[] = [];
      try {
        const parsed = JSON.parse(currentContent);
        if (Array.isArray(parsed)) {
          currentPages = parsed;
        } else {
          currentPages = [currentContent || "<p><br/></p>"];
        }
      } catch (e) {
        currentPages = [currentContent || "<p><br/></p>"];
      }
      if (currentPages.length === 0) {
        currentPages = ["<p><br/></p>"];
      }
      const currentSigs = doc.signatures || [];

      // Clear any pending debounced history push
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // If it's a typing change, debounce the push to history (e.g. 1000ms delay)
      // If it's signatures changing, or pages array length changing, it's a discrete action, so push immediately!
      const isDiscreteAction = signaturesChanged || 
                               (contentChanged && currentPages.length !== (history[historyPointer]?.pages.length ?? 0)) ||
                               editorMode === "move"; // move mode changes like drag/styles are discrete actions

      const delay = isDiscreteAction ? 0 : 1000;

      debounceTimerRef.current = setTimeout(() => {
        setHistory(prev => {
          const cleanedHistory = prev.slice(0, historyPointer + 1);
          
          // Avoid duplicate states
          const lastState = cleanedHistory[cleanedHistory.length - 1];
          if (lastState && 
              JSON.stringify(lastState.pages) === JSON.stringify(currentPages) && 
              JSON.stringify(lastState.signatures) === JSON.stringify(currentSigs)) {
            return cleanedHistory;
          }

          const nextHistory = [...cleanedHistory, { pages: currentPages, signatures: currentSigs }];
          setHistoryPointer(nextHistory.length - 1);
          return nextHistory;
        });
      }, delay);

      // Keep track of latest values
      lastKnownContentRef.current = currentContent;
      lastKnownSignaturesRef.current = currentSignaturesStr;
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [doc.id, doc.content, doc.signatures, historyPointer, editorMode]);

  // Canva Pro design additions
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockElement, setSelectedBlockElement] = useState<HTMLElement | null>(null);
  const [showVGuide, setShowVGuide] = useState(false);
  const [showHGuide, setShowHGuide] = useState(false);

  // Auto-scale zoom to fit screen width on mobile devices
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 850) {
        setZoom(w / 880);
      } else {
        setZoom(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Parse pages from doc.content JSON string array
  let pages: string[] = [];
  try {
    const parsed = JSON.parse(doc.content);
    if (Array.isArray(parsed)) {
      pages = parsed;
    } else {
      pages = [doc.content || "<p><br/></p>"];
    }
  } catch (e) {
    pages = [doc.content || "<p><br/></p>"];
  }

  // Fallback to avoid empty page array
  if (pages.length === 0) {
    pages = ["<p><br/></p>"];
  }

  const executePrint = async () => {
    setIsExporting(true);
    
    const style = doc.styleSettings;
    const theme = DOCUMENT_THEMES.find((t) => t.id === style.themeId) || DOCUMENT_THEMES[0];
    
    // Process content into pages
    let pagesList: string[] = [];
    try {
      const parsed = JSON.parse(doc.content);
      if (Array.isArray(parsed)) {
        pagesList = parsed;
      } else {
        pagesList = [doc.content || ""];
      }
    } catch (e) {
      pagesList = [doc.content || ""];
    }

    if (pagesList.length === 0) {
      pagesList = [""];
    }

    const fontFamily =
      style.font === "Playfair Display" ? "'Playfair Display', serif" : 
      style.font === "Space Grotesk" ? "'Space Grotesk', sans-serif" : 
      style.font === "JetBrains Mono" ? "'JetBrains Mono', monospace" : 
      style.font === "Montserrat" ? "'Montserrat', sans-serif" :
      style.font === "Lora" ? "'Lora', serif" :
      style.font === "Caveat" ? "'Caveat', cursive" :
      style.font === "Cinzel" ? "'Cinzel', serif" :
      style.font === "Impact" ? "Impact, Charcoal, sans-serif" :
      "'Inter', sans-serif";

    const fontSize =
      style.fontSize === "sm" ? "13px" :
      style.fontSize === "lg" ? "18px" :
      style.fontSize === "xl" ? "20px" :
      style.fontSize === "2xl" ? "24px" :
      style.fontSize === "3xl" ? "32px" :
      "15px";

    const lineSpacing =
      style.lineSpacing === "tight" ? "1.3" :
      style.lineSpacing === "relaxed" ? "1.8" :
      "1.5";

    const letterSpacing =
      style.letterSpacing === "tight" ? "-0.05em" :
      style.letterSpacing === "wide" ? "0.15em" :
      "normal";

    let pagesBodyHtml = "";
    if (doc.coverImage) {
      const coverMarkup = renderToStaticMarkup(<CoverRenderer doc={doc} />);
      pagesBodyHtml += `
        <div class="print-page pdf-page" style="position: relative; width: 210mm; height: 297mm; box-sizing: border-box; background: white; page-break-after: always; overflow: hidden; margin: 0 auto; padding: 0;">
          <div style="width: 800px; height: 1122px; transform: scale(0.992); transform-origin: top left; position: absolute; top: 0; left: 0;">
            ${coverMarkup}
          </div>
        </div>
      `;
    }
    pagesList.forEach((pageContent, idx) => {
      // Filter signatures belonging strictly to this page
      const pageSigs = doc.signatures.filter((s) => s.pageIndex === idx);
      const sigsHtml = pageSigs
        .map((sig) => {
          const rotation = sig.rotation || 0;
          return `<div class="signature-stamp" style="position: absolute; left: ${sig.x}%; top: ${sig.y}%; width: ${sig.width}px; height: ${sig.height}px; z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <img src="${sig.image}" style="max-width:100%; max-height:100%; width: auto; height: auto; object-fit: contain; transform: rotate(${rotation}deg);" />
            ${sig.ownerName ? `<div style="margin-top: -2px; font-family: 'Caveat', cursive; font-size: ${sig.ownerNameFontSize || 24}px; font-weight: ${sig.ownerNameFontWeight || 700}; color: #1e3a8a; text-align: center; line-height: 1;">${sig.ownerName}</div>` : ''}
          </div>`;
        })
        .join("");

      pagesBodyHtml += `
        <div class="print-page" style="position: relative; width: 210mm; height: 297mm; box-sizing: border-box; background: white; padding: 20mm; page-break-after: ${idx === pagesList.length - 1 ? "avoid" : "always"}; overflow: hidden; margin: 0 auto;">
          
          ${sigsHtml}
          <div class="content-container" style="position: relative; width: 100%; height: 100%; box-sizing: border-box; font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineSpacing}; text-align: ${style.alignment || 'left'}; color: ${style.textColor || '#334155'}; font-weight: ${style.bold ? 'bold' : 'normal'}; font-style: ${style.italic ? 'italic' : 'normal'}; text-decoration: ${style.underline ? 'underline' : 'none'}; text-transform: ${style.uppercase ? 'uppercase' : 'none'}; opacity: ${(style.textOpacity !== undefined ? style.textOpacity : 100) / 100}; letter-spacing: ${letterSpacing};">
            ${
              idx === 0
                ? `<h1 style="color: ${theme.primary}; font-size: 26px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-top: 0; margin-bottom: 24px; text-align: left; font-family: 'Inter', sans-serif;">${doc.title}</h1>`
                : ""
            }
            <div style="width: 100%; height: 100%; display: block; position: relative;">${pageContent}</div>
          </div>
        </div>
      `;
    });

    const baseHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&family=Montserrat:wght@400;700&family=Lora:ital,wght@0,400&family=Caveat:wght@400;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      body, html {
        background: white !important;
        color: #1e293b !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
      }
      .print-page {
        page-break-after: always !important;
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 20mm !important;
        width: 210mm !important;
        height: 297mm !important;
        box-sizing: border-box !important;
      }
    }
    body {
      background: white;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  ${pagesBodyHtml}
</body>
</html>`;

    // 1. Try printing in a new top-level tab/popup (highly compatible, bypasses sandboxing if opened via click)
    try {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(baseHtml);
        printWindow.document.close();
        
        // Wait slightly for resources
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (err) {
            console.error("Popup print blocked:", err);
          } finally {
            setIsExporting(false);
          }
        }, 500);
        return;
      }
    } catch (err) {
      console.warn("Could not window.open for print:", err);
    }

    // 2. Fallback: Dynamic hidden iframe (may be blocked or print blank in some environments)
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (iframeDoc && iframeWindow) {
      iframeDoc.open();
      iframeDoc.write(baseHtml);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframeWindow.focus();
          iframeWindow.print();
        } catch (err) {
          console.error("Erreur d'impression iframe :", err);
          // 3. Last fallback: Direct browser window print
          window.print();
        } finally {
          setIsExporting(false);
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }
      }, 800);
    } else {
      setIsExporting(false);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      window.print();
    }
  };

  const exportToPDF = async () => {
    // Check if we are inside a sandboxed iframe (like Google AI Studio preview)
    const isInsideIframe = window.self !== window.top;
    if (isInsideIframe) {
      handleDownloadPDF();
    } else {
      executePrint();
    }
  };

  const handleDownloadPDF = () => {
    setIsExporting(true);
    
    const style = doc.styleSettings;
    const theme = DOCUMENT_THEMES.find((t) => t.id === style.themeId) || DOCUMENT_THEMES[0];
    
    // Process content into pages
    let pagesList: string[] = [];
    try {
      const parsed = JSON.parse(doc.content);
      if (Array.isArray(parsed)) {
        pagesList = parsed;
      } else {
        pagesList = [doc.content || ""];
      }
    } catch (e) {
      pagesList = [doc.content || ""];
    }

    if (pagesList.length === 0) {
      pagesList = [""];
    }

    const fontFamily =
      style.font === "Playfair Display" ? "'Playfair Display', serif" : 
      style.font === "Space Grotesk" ? "'Space Grotesk', sans-serif" : 
      style.font === "JetBrains Mono" ? "'JetBrains Mono', monospace" : 
      style.font === "Montserrat" ? "'Montserrat', sans-serif" :
      style.font === "Lora" ? "'Lora', serif" :
      style.font === "Caveat" ? "'Caveat', cursive" :
      style.font === "Cinzel" ? "'Cinzel', serif" :
      style.font === "Impact" ? "Impact, Charcoal, sans-serif" :
      "'Inter', sans-serif";

    const fontSize =
      style.fontSize === "sm" ? "13px" :
      style.fontSize === "lg" ? "18px" :
      style.fontSize === "xl" ? "20px" :
      style.fontSize === "2xl" ? "24px" :
      style.fontSize === "3xl" ? "32px" :
      "15px";

    const lineSpacing =
      style.lineSpacing === "tight" ? "1.3" :
      style.lineSpacing === "relaxed" ? "1.8" :
      "1.5";

    const letterSpacing =
      style.letterSpacing === "tight" ? "-0.05em" :
      style.letterSpacing === "wide" ? "0.15em" :
      "normal";

    let pagesBodyHtml = "";
    if (doc.coverImage) {
      const coverMarkup = renderToStaticMarkup(<CoverRenderer doc={doc} />);
      pagesBodyHtml += `
        <div class="print-page pdf-page" style="position: relative; width: 210mm; height: 297mm; box-sizing: border-box; background: white; page-break-after: always; overflow: hidden; margin: 0 auto; padding: 0;">
          <div style="width: 800px; height: 1122px; transform: scale(0.992); transform-origin: top left; position: absolute; top: 0; left: 0;">
            ${coverMarkup}
          </div>
        </div>
      `;
    }
    pagesList.forEach((pageContent, idx) => {
      // Filter signatures belonging strictly to this page
      const pageSigs = doc.signatures.filter((s) => s.pageIndex === idx);
      const sigsHtml = pageSigs
        .map((sig) => {
          const rotation = sig.rotation || 0;
          return `<div class="signature-stamp" style="position: absolute; left: ${sig.x}%; top: ${sig.y}%; width: ${sig.width}px; height: ${sig.height}px; z-index: 20; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <img src="${sig.image}" style="max-width:100%; max-height:100%; width: auto; height: auto; object-fit: contain; transform: rotate(${rotation}deg);" />
            ${sig.ownerName ? `<div style="margin-top: -2px; font-family: 'Caveat', cursive; font-size: ${sig.ownerNameFontSize || 24}px; font-weight: ${sig.ownerNameFontWeight || 700}; color: #1e3a8a; text-align: center; line-height: 1;">${sig.ownerName}</div>` : ''}
          </div>`;
        })
        .join("");

      pagesBodyHtml += `
        <div class="pdf-page" style="position: relative; width: 800px; height: 1122px; box-sizing: border-box; background: white; padding: 64px; page-break-after: ${idx === pagesList.length - 1 ? "avoid" : "always"}; overflow: hidden;">
          
          ${sigsHtml}
          <div class="content-container" style="position: relative; width: 100%; height: 100%; box-sizing: border-box; font-family: ${fontFamily}; font-size: ${fontSize}; line-height: ${lineSpacing}; text-align: ${style.alignment || 'left'}; color: ${style.textColor || '#334155'}; font-weight: ${style.bold ? 'bold' : 'normal'}; font-style: ${style.italic ? 'italic' : 'normal'}; text-decoration: ${style.underline ? 'underline' : 'none'}; text-transform: ${style.uppercase ? 'uppercase' : 'none'}; opacity: ${(style.textOpacity !== undefined ? style.textOpacity : 100) / 100}; letter-spacing: ${letterSpacing};">
            ${
              idx === 0
                ? `<h1 style="color: ${theme.primary}; font-size: 26px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-top: 0; margin-bottom: 24px; text-align: left; font-family: 'Inter', sans-serif;">${doc.title}</h1>`
                : ""
            }
            <div style="width: 100%; height: 100%; display: block; position: relative;">${pageContent}</div>
          </div>
        </div>
      `;
    });

    const baseHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&family=Montserrat:wght@400;700&family=Lora:ital,wght@0,400&family=Caveat:wght@400;700&family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: white;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  ${pagesBodyHtml}
</body>
</html>`;

    const parser = new DOMParser();
    const docParsed = parser.parseFromString(baseHtml, 'text/html');
    const container = document.createElement("div");
    container.innerHTML = docParsed.body.innerHTML;

    // Render page by page sequentially using jsPDF and html2canvas
    const pages = container.querySelectorAll(".pdf-page");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const totalPages = pages.length;
    // High-resolution scale & quality to ensure text is perfectly crisp and sharp when zoomed in!
    // Reusing the wrapper and destroying canvas memory page-by-page makes this fully stable.
    const scale = 2.0;
    const quality = 0.98;
    
    // Create a single temporary wrapper to hold cloned pages. Reusing this wrapper
    // prevents parsing stylesheets and fonts repeatedly, which is highly CPU/Memory intensive!
    const tempWrapper = document.createElement("div");
    tempWrapper.style.position = "fixed";
    tempWrapper.style.top = "0";
    tempWrapper.style.left = "0";
    tempWrapper.style.width = "800px";
    tempWrapper.style.height = "1122px";
    tempWrapper.style.zIndex = "-99999";
    tempWrapper.style.backgroundColor = "white";
    tempWrapper.style.overflow = "hidden";
    tempWrapper.style.pointerEvents = "none";

    // Clone styles and custom fonts ONCE
    const styleTag = document.createElement("style");
    styleTag.innerHTML = docParsed.querySelector("style")?.innerHTML || "";
    tempWrapper.appendChild(styleTag);

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@400;500&family=Montserrat:wght@400;700&family=Lora:ital,wght@0,400&family=Caveat:wght@400;700&family=Cinzel:wght@400;700&display=swap";
    tempWrapper.appendChild(fontLink);

    const pageContainer = document.createElement("div");
    pageContainer.style.width = "800px";
    pageContainer.style.height = "1122px";
    tempWrapper.appendChild(pageContainer);

    document.body.appendChild(tempWrapper);

    const generatePDF = async () => {
      try {
        for (let index = 0; index < totalPages; index++) {
          setExportProgress(`${index + 1}/${totalPages}`);
          const pageEl = pages[index] as HTMLElement;

          // Clear previous page content
          pageContainer.innerHTML = "";

          // Clone the actual page element
          const clonedPage = pageEl.cloneNode(true) as HTMLElement;
          clonedPage.style.position = "relative";
          clonedPage.style.left = "0";
          clonedPage.style.top = "0";
          clonedPage.style.margin = "0";
          clonedPage.style.boxSizing = "border-box";
          clonedPage.style.width = "800px";
          clonedPage.style.height = "1122px";

          pageContainer.appendChild(clonedPage);

          // Give layout engine and styling brief time to adjust, longer on first page
          await new Promise((resolve) => setTimeout(resolve, index === 0 ? 300 : 80));

          const canvas = await html2canvas(clonedPage, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 800,
            height: 1122
          });

          const imgData = canvas.toDataURL("image/jpeg", quality);
          
          const imgWidth = 210; // A4 width in mm
          const imgHeight = 297; // A4 height in mm
          
          if (index > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");

          // Clean up canvas pixel buffer immediately to free graphics hardware memory!
          canvas.width = 0;
          canvas.height = 0;

          // Allow the main thread and browser GC to run to avoid freezing or crashing
          await new Promise((resolve) => setTimeout(resolve, 40));
        }

        // Save and finish
        pdf.save(`${doc.title || "document"}.pdf`);
      } catch (err) {
        console.error("Error during PDF rendering:", err);
      } finally {
        // Safe cleanup
        if (document.body.contains(tempWrapper)) {
          document.body.removeChild(tempWrapper);
        }
        setIsExporting(false);
        setExportProgress(null);
      }
    };

    generatePDF().catch((err) => {
      console.error("Sequential PDF generation failed:", err);
      setIsExporting(false);
      setExportProgress(null);
    });
  };

  const handleContentChange = (newPages: string[]) => {
    onChangeContent(JSON.stringify(newPages));
  };

  const handleAddPage = () => {
    const newPages = [...pages, "<p>Nouvelle page... Écrivez ou dictez votre texte ici.</p>"];
    handleContentChange(newPages);
    
    const newIndex = newPages.length - 1;
    setActivePageIndexLocal(newIndex);
    if (onActivePageChange) {
      onActivePageChange(newIndex);
    }

    // Scroll to the new page nicely
    setTimeout(() => {
      const wrapper = document.getElementById("document-wrapper");
      if (wrapper) {
        wrapper.scrollTo({
          left: wrapper.scrollWidth,
          behavior: "smooth"
        });
      }
    }, 150);
  };

  const initiateDeletePage = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) {
      setShowMinPageWarning(true);
      return;
    }
    setPageToDelete(indexToDelete);
  };

  const confirmDeletePage = () => {
    if (pageToDelete === null) return;
    
    const indexToDelete = pageToDelete;
    const newPages = pages.filter((_, idx) => idx !== indexToDelete);
    
    // Clean up signatures belonging to this page, and shift pageIndexes for later pages
    const updatedSignatures = doc.signatures
      .filter(sig => sig.pageIndex !== indexToDelete)
      .map(sig => {
        if (sig.pageIndex > indexToDelete) {
          return { ...sig, pageIndex: sig.pageIndex - 1 };
        }
        return sig;
      });

    if (onUpdateContentAndSignatures) {
      onUpdateContentAndSignatures(JSON.stringify(newPages), updatedSignatures);
    } else {
      handleContentChange(newPages);
      onUpdateSignatures(updatedSignatures);
    }

    const targetIndex = Math.max(0, indexToDelete - 1);
    setActivePageIndexLocal(targetIndex);
    if (onActivePageChange) {
      onActivePageChange(targetIndex);
    }
    
    setPageToDelete(null);
  };

  
  const handleGenerateCover = async () => {
    setIsGeneratingCover(true);
    try {
      const response = await fetch('/api/gemini/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentContent: doc.content, title: doc.title })
      });
      const data = await response.json();
      if (response.ok && data.imageUrl) {
        setCoverImage(data.imageUrl);
      } else {
        alert("Impossible de générer la couverture : " + (data.error || "Erreur inconnue"));
      }
    } catch (err) {
      console.error("Erreur lors de la génération de la couverture:", err);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleDuplicatePage = (indexToDuplicate: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const newPages = [...pages];
    newPages.splice(indexToDuplicate + 1, 0, pages[indexToDuplicate]);
    
    const updatedSignatures = doc.signatures.map(sig => {
      if (sig.pageIndex === indexToDuplicate) {
        return [
          sig,
          {
            ...sig,
            id: "sig-" + Math.random().toString(36).substr(2, 9),
            x: Math.min(90, sig.x + 3),
            y: Math.min(90, sig.y + 3),
            pageIndex: indexToDuplicate + 1
          }
        ];
      } else if (sig.pageIndex > indexToDuplicate) {
        return [{ ...sig, pageIndex: sig.pageIndex + 1 }];
      }
      return [sig];
    }).flat();

    if (onUpdateContentAndSignatures) {
      onUpdateContentAndSignatures(JSON.stringify(newPages), updatedSignatures);
    } else {
      handleContentChange(newPages);
      onUpdateSignatures(updatedSignatures);
    }

    const newIndex = indexToDuplicate + 1;
    setActivePageIndexLocal(newIndex);
    if (onActivePageChange) {
      onActivePageChange(newIndex);
    }

    setTimeout(() => {
      const wrapper = document.getElementById("document-wrapper");
      if (wrapper) {
        const pagesEls = wrapper.querySelectorAll("[id^='document-page-container-']");
        if (pagesEls && pagesEls[newIndex]) {
          pagesEls[newIndex].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    }, 150);
  };

  const handleAddNewTextBox = (type: "h1" | "p" | "subtitle") => {
    const pageIdx = activePageIndexLocal;
    const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
    if (!viewer) return;
    
    let tag = "p";
    let contentText = "Double-cliquez pour modifier le texte";
    let fontSz = "14px";
    let fontWeight = "normal";
    
    if (type === "h1") {
      tag = "h2";
      contentText = "Nouveau Titre Canva";
      fontSz = "24px";
      fontWeight = "bold";
    } else if (type === "subtitle") {
      tag = "h3";
      contentText = "Nouveau Sous-titre Canva";
      fontSz = "18px";
      fontWeight = "bold";
    }
    
    const newId = `block-${Math.random().toString(36).substr(2, 9)}`;
    const styleStr = `position: absolute; left: 180px; top: 180px; width: 300px; font-size: ${fontSz}; font-weight: ${fontWeight}; font-family: Inter; color: #1e293b; line-height: 1.5; padding: 4px; border: 1px dashed transparent; z-index: 20;`;
    
    const element = document.createElement(tag);
    element.setAttribute("data-block-id", newId);
    element.setAttribute("style", styleStr);
    element.innerHTML = contentText;
    
    viewer.appendChild(element);
    
    // Save state
    const newHtml = viewer.innerHTML;
    const updatedPages = [...pages];
    updatedPages[pageIdx] = newHtml;
    handleContentChange(updatedPages);

    // Auto select
    setSelectedBlockId(newId);
    setSelectedBlockElement(element);
  };

  const handleAddNewShape = (shapeType: string, svgMarkup: string) => {
    const pageIdx = activePageIndexLocal;
    const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
    if (!viewer) return;

    const newId = `block-${Math.random().toString(36).substr(2, 9)}`;
    
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-block-id", newId);
    
    let width = "120px";
    let height = "120px";
    if (shapeType.startsWith("line-")) {
      width = "200px";
      height = "30px";
    }
    
    const styleStr = `position: absolute; left: 180px; top: 180px; width: ${width}; height: ${height}; padding: 4px; z-index: 10; display: flex; align-items: center; justify-content: center;`;
    wrapper.setAttribute("style", styleStr);
    wrapper.innerHTML = svgMarkup;

    viewer.appendChild(wrapper);

    // Save state
    const newHtml = viewer.innerHTML;
    const updatedPages = [...pages];
    updatedPages[pageIdx] = newHtml;
    handleContentChange(updatedPages);

    // Auto select
    setSelectedBlockId(newId);
    setSelectedBlockElement(wrapper);
  };

  const handleAddNewImage = (base64Data: string) => {
    const pageIdx = activePageIndexLocal;
    const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
    if (!viewer) return;

    const newId = `block-${Math.random().toString(36).substr(2, 9)}`;
    
    const img = document.createElement("img");
    img.setAttribute("data-block-id", newId);
    img.src = base64Data;
    img.draggable = false;
    
    const styleStr = `position: absolute; left: 150px; top: 150px; width: 220px; height: auto; max-width: 100%; border: 1px dashed transparent; z-index: 10; cursor: move; border-radius: 4px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);`;
    img.setAttribute("style", styleStr);
    img.alt = "Image importée";

    viewer.appendChild(img);

    // Save state
    const newHtml = viewer.innerHTML;
    const updatedPages = [...pages];
    updatedPages[pageIdx] = newHtml;
    handleContentChange(updatedPages);

    // Auto select
    setSelectedBlockId(newId);
    setSelectedBlockElement(img);
  };

  const duplicateSelectedBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedBlockElement) return;
    
    const clone = selectedBlockElement.cloneNode(true) as HTMLElement;
    const newId = `block-${Math.random().toString(36).substr(2, 9)}`;
    clone.setAttribute("data-block-id", newId);
    
    const curLeft = parseFloat(clone.style.left) || 50;
    const curTop = parseFloat(clone.style.top) || 100;
    clone.style.left = `${curLeft + 25}px`;
    clone.style.top = `${curTop + 25}px`;
    clone.style.position = "absolute";
    
    selectedBlockElement.parentNode?.appendChild(clone);
    
    const pageIdx = activePageIndexLocal;
    const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
    if (viewer) {
      const newHtml = viewer.innerHTML;
      const updatedPages = [...pages];
      updatedPages[pageIdx] = newHtml;
      handleContentChange(updatedPages);
    }

    // Select the newly duplicated block!
    setSelectedBlockId(newId);
    setSelectedBlockElement(clone);
  };

  const deleteSelectedBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedBlockElement) return;
    
    selectedBlockElement.remove();
    setSelectedBlockElement(null);
    setSelectedBlockId(null);
    
    const pageIdx = activePageIndexLocal;
    const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
    if (viewer) {
      const newHtml = viewer.innerHTML;
      const updatedPages = [...pages];
      updatedPages[pageIdx] = newHtml;
      handleContentChange(updatedPages);
    }
  };

  const updateSelectedBlockStyle = (styleKey: string, styleValue: string) => {
    if (!selectedBlockElement) return;
    
    if (styleKey === "font-family") {
      selectedBlockElement.style.fontFamily = styleValue;
    } else if (styleKey === "font-size") {
      selectedBlockElement.style.fontSize = styleValue;
    } else if (styleKey === "color") {
      // Check if it has an SVG (Canva Pro Shape)
      const svg = selectedBlockElement.querySelector("svg");
      if (svg) {
        const fillables = svg.querySelectorAll("path, polygon, rect, circle, ellipse");
        if (fillables.length > 0) {
          fillables.forEach(f => {
            const tagName = f.tagName.toLowerCase();
            // Don't fill lines or strokes with solid if we don't want to
            f.setAttribute("fill", styleValue);
          });
        } else {
          svg.setAttribute("fill", styleValue);
        }
        
        // Sometime lines use stroke
        const lines = svg.querySelectorAll("line");
        if (lines.length > 0) {
          lines.forEach(l => l.setAttribute("stroke", styleValue));
        }
      } else {
        selectedBlockElement.style.color = styleValue;
      }
    } else if (styleKey === "border-color") {
      const svg = selectedBlockElement.querySelector("svg");
      if (svg) {
        const strokeables = svg.querySelectorAll("path, polygon, rect, circle, ellipse, line");
        if (strokeables.length > 0) {
          strokeables.forEach(s => s.setAttribute("stroke", styleValue));
        } else {
          svg.setAttribute("stroke", styleValue);
        }
      } else {
        selectedBlockElement.style.borderColor = styleValue;
        selectedBlockElement.style.borderStyle = styleValue === "transparent" ? "none" : "solid";
        selectedBlockElement.style.borderWidth = styleValue === "transparent" ? "0px" : "2px";
      }
    } else if (styleKey === "bold") {
      selectedBlockElement.style.fontWeight = selectedBlockElement.style.fontWeight === "bold" ? "normal" : "bold";
    } else if (styleKey === "italic") {
      selectedBlockElement.style.fontStyle = selectedBlockElement.style.fontStyle === "italic" ? "normal" : "italic";
    } else if (styleKey === "underline") {
      selectedBlockElement.style.textDecoration = selectedBlockElement.style.textDecoration === "underline" ? "none" : "underline";
    } else if (styleKey === "align-left") {
      selectedBlockElement.style.textAlign = "left";
    } else if (styleKey === "align-center") {
      selectedBlockElement.style.textAlign = "center";
    } else if (styleKey === "align-right") {
      selectedBlockElement.style.textAlign = "right";
    } else if (styleKey === "z-index-front") {
      selectedBlockElement.style.zIndex = "100";
    } else if (styleKey === "z-index-back") {
      selectedBlockElement.style.zIndex = "1";
    } else if (styleKey === "width") {
      selectedBlockElement.style.width = styleValue;
    } else if (styleKey === "height") {
      selectedBlockElement.style.height = styleValue;
    }
    
    const pageIdx = activePageIndexLocal;
    const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
    if (viewer) {
      const newHtml = viewer.innerHTML;
      const updatedPages = [...pages];
      updatedPages[pageIdx] = newHtml;
      handleContentChange(updatedPages);
    }
  };

  const handleBlockDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (editorMode !== "move") return;
    const element = e.target as HTMLElement;
    
    // Find the closest page viewer
    const viewer = element.closest('[id^="document-page-viewer-"]');
    if (!viewer) return;

    // Find the exact element that is a direct child of the page viewer
    let draggableElement: HTMLElement | null = element;
    while (draggableElement && draggableElement.parentNode !== viewer) {
      draggableElement = draggableElement.parentNode as HTMLElement;
    }
    
    if (!draggableElement || draggableElement === viewer) return;
    
    draggableElement.contentEditable = "true";
    draggableElement.focus();
    draggableElement.classList.add("ring-2", "ring-emerald-500", "p-1", "outline-none");
    
    const handleBlur = () => {
      draggableElement.contentEditable = "false";
      draggableElement.classList.remove("ring-2", "ring-emerald-500", "p-1", "outline-none");
      
      const pageIdx = activePageIndexLocal;
      const curViewer = document.getElementById(`document-page-viewer-${pageIdx}`);
      if (curViewer) {
        const newHtml = curViewer.innerHTML;
        const updatedPages = [...pages];
        updatedPages[pageIdx] = newHtml;
        handleContentChange(updatedPages);
      }
    };
    
    draggableElement.addEventListener("blur", handleBlur, { once: true });
  };

  const handlePageClickForStamping = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    // If we have an active stamp image selected, click to stamp it
    if (!activeSignatureId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    // Convert to percentage coordinates of standard 800x1122 page
    const xPercent = (clickX / 800) * 100;
    const yPercent = (clickY / 1122) * 100;

    const xVal = Math.min(Math.max(0, xPercent - 8), 85); // center slightly
    const yVal = Math.min(Math.max(0, yPercent - 4), 92);

    // To prevent duplication, check if there's already a signature on the document with the SAME activeSignatureId image
    const existingSigIdx = doc.signatures.findIndex(s => s.image === activeSignatureId);

    if (existingSigIdx !== -1) {
      const updated = [...doc.signatures];
      const targetSig = updated[existingSigIdx];
      updated[existingSigIdx] = {
        ...targetSig,
        pageIndex: pageIndex,
        x: xVal,
        y: yVal
      };
      
      setSelectedSigId(targetSig.id);
      onUpdateSignatures(updated);
      return;
    }

    const sigId = `sig_${Date.now()}`;
    const newSig: DocumentSignature = {
      id: sigId,
      name: "Cachet/Signature",
      image: activeSignatureId,
      pageIndex: pageIndex,
      x: xVal,
      y: yVal,
      width: 160,
      height: 80,
      rotation: 0
    };

    setSelectedSigId(sigId);
    onUpdateSignatures([...doc.signatures, newSig]);
  };

  const handleAutoPlaceSignature = (pageIdx: number, placement: string) => {
    if (!activeSignatureId) return;

    let xPercent = 70;
    let yPercent = 82;

    if (placement === "bottom-left") {
      xPercent = 10;
      yPercent = 82;
    } else if (placement === "bottom-center-left") {
      xPercent = 30;
      yPercent = 82;
    } else if (placement === "bottom-center-right") {
      xPercent = 50;
      yPercent = 82;
    } else if (placement === "center") {
      xPercent = 40;
      yPercent = 45;
    } else if (placement === "center-left") {
      xPercent = 10;
      yPercent = 45;
    } else if (placement === "center-right") {
      xPercent = 70;
      yPercent = 45;
    } else if (placement === "lower-left") {
      xPercent = 10;
      yPercent = 65;
    } else if (placement === "lower-center-left") {
      xPercent = 30;
      yPercent = 65;
    } else if (placement === "lower-center-right") {
      xPercent = 50;
      yPercent = 65;
    } else if (placement === "lower-right") {
      xPercent = 70;
      yPercent = 65;
    } else if (placement === "top-right") {
      xPercent = 70;
      yPercent = 10;
    } else if (placement === "top-left") {
      xPercent = 10;
      yPercent = 10;
    }

    const existingSigIdx = doc.signatures.findIndex(s => s.image === activeSignatureId);
    if (existingSigIdx !== -1) {
      const updated = [...doc.signatures];
      updated[existingSigIdx] = {
        ...updated[existingSigIdx],
        pageIndex: pageIdx,
        x: xPercent,
        y: yPercent
      };
      onUpdateSignatures(updated);
    } else {
      const newSig: DocumentSignature = {
        id: `sig_${Date.now()}`,
        name: "Cachet/Signature",
        image: activeSignatureId,
        pageIndex: pageIdx,
        x: xPercent,
        y: yPercent,
        width: 160,
        height: 80,
        rotation: 0
      };
      onUpdateSignatures([...doc.signatures, newSig]);
    }

    // Scroll to the page
    setTimeout(() => {
      const wrapper = document.getElementById("document-wrapper");
      if (wrapper) {
        const pagesEls = wrapper.querySelectorAll("[id^='document-page-container-']");
        if (pagesEls && pagesEls[pageIdx]) {
          pagesEls[pageIdx].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    }, 150);

    // Clear stamping mode
    if (onClearActiveSignature) {
      onClearActiveSignature();
    }
  };

  // Signatures Dragging Handlers
  const startDrag = (e: React.MouseEvent<any> | React.TouchEvent<any> | any, sig: DocumentSignature) => {
    // Prevent default scrolling on touch devices to make dragging perfectly smooth
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    
    setSelectedSigId(sig.id);
    setIsDragging(true);
    
    const pageElement = document.getElementById(`document-page-container-${sig.pageIndex}`);
    if (!pageElement) return;
    
    const rect = pageElement.getBoundingClientRect();
    
    // Support all mobile touch event schemes safely
    const touches = e.touches || (e.nativeEvent && e.nativeEvent.touches) || e.targetTouches || (e.nativeEvent && e.nativeEvent.targetTouches) || e.changedTouches;
    const clientX = (touches && touches[0]) ? touches[0].clientX : e.clientX;
    const clientY = (touches && touches[0]) ? touches[0].clientY : e.clientY;

    // Mouse/touch coords relative to the unscaled page element
    const mouseX = (clientX - rect.left) / zoom;
    const mouseY = (clientY - rect.top) / zoom;
    
    const sigXPx = (sig.x / 100) * 800;
    const sigYPx = (sig.y / 100) * 1122;
    
    // Store coordinates synchronously in the ref
    dragOffsetRef.current = {
      x: mouseX - sigXPx,
      y: mouseY - sigYPx,
    };
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !selectedSigId) return;
      
      const sig = doc.signatures.find(s => s.id === selectedSigId);
      if (!sig) return;
      
      const pageElement = document.getElementById(`document-page-container-${sig.pageIndex}`);
      if (!pageElement) return;
      
      const rect = pageElement.getBoundingClientRect();
      
      const mouseX = (clientX - rect.left) / zoom;
      const mouseY = (clientY - rect.top) / zoom;
      
      // Read synchronously from ref
      const newXPx = mouseX - dragOffsetRef.current.x;
      const newYPx = mouseY - dragOffsetRef.current.y;
      
      // Convert back to percentages and clamp within sheet bounds nicely
      const maxValX = 100 - (sig.width / 800) * 100;
      const maxValY = 100 - (sig.height / 1122) * 100;
      const newXPercent = Math.min(Math.max(0, (newXPx / 800) * 100), maxValX > 0 ? maxValX : 92);
      const newYPercent = Math.min(Math.max(0, (newYPx / 1122) * 100), maxValY > 0 ? maxValY : 95);
      
      const updated = doc.signatures.map(s => {
        if (s.id === selectedSigId) {
          return { ...s, x: newXPercent, y: newYPercent };
        }
        return s;
      });
      onUpdateSignatures(updated);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touches = e.touches || e.targetTouches || e.changedTouches;
      if (touches && touches.length > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        handleMove(touches[0].clientX, touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
      window.addEventListener("touchcancel", handleEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, selectedSigId, doc.signatures, onUpdateSignatures, zoom]);

  // Drag-and-drop text elements in Move Mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingText && draggedElement && draggedPageIndex !== null) {
        const viewer = document.getElementById(`document-page-viewer-${draggedPageIndex}`);
        if (!viewer) return;
        
        const viewerRect = viewer.getBoundingClientRect();
        const mouseX = (e.clientX - viewerRect.left) / zoom;
        const mouseY = (e.clientY - viewerRect.top) / zoom;
        
        let newLeft = mouseX - textDragOffset.x;
        let newTop = mouseY - textDragOffset.y;
        
        const width = draggedElement.offsetWidth;
        const height = draggedElement.offsetHeight;
        
        // Snapping centers (Page dimensions are 800x1122, but we are relative to the viewer)
        // Let's use the viewer's width and height or standard page center (400px, 561px minus margins)
        const elementCenterX = newLeft + width / 2;
        const elementCenterY = newTop + height / 2;
        
        const pageCenterX = 400 - 64; // Relative to viewer (800 / 2 - 64 margin)
        const pageCenterY = 561 - 64; // Approximate
        
        let vSnapped = false;
        let hSnapped = false;
        
        if (Math.abs(elementCenterX - 336) < 10) { // 336px is (800/2) - 64px padding
          newLeft = 336 - width / 2;
          vSnapped = true;
        }
        
        if (Math.abs(elementCenterY - 497) < 10) { // 1122/2 - 64px padding
          newTop = 497 - height / 2;
          hSnapped = true;
        }
        
        setShowVGuide(vSnapped);
        setShowHGuide(hSnapped);

        draggedElement.style.left = `${newLeft}px`;
        draggedElement.style.top = `${newTop}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingText && draggedElement && draggedPageIndex !== null) {
        draggedElement.classList.remove("editor-move-mode-dragging");
        setShowVGuide(false);
        setShowHGuide(false);
        
        const viewer = document.getElementById(`document-page-viewer-${draggedPageIndex}`);
        if (viewer) {
          const newHtml = viewer.innerHTML;
          const updatedPages = [...pages];
          updatedPages[draggedPageIndex] = newHtml;
          handleContentChange(updatedPages);
        }
        
        setIsDraggingText(false);
        setDraggedElement(null);
        setDraggedPageIndex(null);
      }
    };

    if (isDraggingText) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingText, draggedElement, draggedPageIndex, textDragOffset, zoom, pages]);

  // Drag-to-resize elements in Move Mode
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !selectedBlockElement) return;

      const isImage = selectedBlockElement.tagName === "IMG";
      const isShape = selectedBlockElement.querySelector("svg") !== null;
      const isText = !isImage && !isShape;

      const deltaX = (e.clientX - resizeStartMouse.x) / zoom;
      const deltaY = (e.clientY - resizeStartMouse.y) / zoom;

      const newWidth = Math.max(20, resizeStartSize.width + deltaX);
      selectedBlockElement.style.width = `${newWidth}px`;

      if (isShape) {
        const newHeight = Math.max(20, resizeStartSize.height + deltaY);
        selectedBlockElement.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      if (isResizing && selectedBlockElement) {
        setIsResizing(false);
        
        const pageIdx = activePageIndexLocal;
        const viewer = document.getElementById(`document-page-viewer-${pageIdx}`);
        if (viewer) {
          const newHtml = viewer.innerHTML;
          const updatedPages = [...pages];
          updatedPages[pageIdx] = newHtml;
          handleContentChange(updatedPages);
        }
      }
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, selectedBlockElement, resizeStartSize, resizeStartMouse, zoom, pages, activePageIndexLocal]);

  const handleTextElementDragStart = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    const element = e.target as HTMLElement;
    const viewer = document.getElementById(`document-page-viewer-${pageIndex}`);
    if (!viewer || element === viewer) return;

    // Find the exact element that is a direct child of the page viewer to keep block structure intact
    let draggableElement: HTMLElement | null = element;
    while (draggableElement && draggableElement.parentNode !== viewer) {
      draggableElement = draggableElement.parentNode as HTMLElement;
    }
    
    if (!draggableElement || draggableElement === viewer) return;

    e.preventDefault();
    e.stopPropagation();

    // Assign data-block-id if none exists to track it
    let blockId = draggableElement.getAttribute("data-block-id");
    if (!blockId) {
      blockId = `block-${Math.random().toString(36).substr(2, 9)}`;
      draggableElement.setAttribute("data-block-id", blockId);
    }

    setSelectedBlockId(blockId);
    setSelectedBlockElement(draggableElement);

    const rect = draggableElement.getBoundingClientRect();
    const viewerRect = viewer.getBoundingClientRect();

    // Calculate current positions relative to the scaled viewer container to eliminate offset jump
    const currentLeft = (rect.left - viewerRect.left) / zoom;
    const currentTop = (rect.top - viewerRect.top) / zoom;
    const currentWidth = rect.width / zoom;

    // Initialize absolute positioning styles directly on the element
    draggableElement.style.position = "absolute";
    draggableElement.style.left = `${currentLeft}px`;
    draggableElement.style.top = `${currentTop}px`;
    draggableElement.style.width = `${currentWidth}px`;
    draggableElement.style.margin = "0";
    draggableElement.classList.add("editor-move-mode-dragging");

    setDraggedElement(draggableElement);
    setDraggedPageIndex(pageIndex);
    setIsDraggingText(true);

    const mouseX = (e.clientX - viewerRect.left) / zoom;
    const mouseY = (e.clientY - viewerRect.top) / zoom;
    setTextDragOffset({
      x: mouseX - currentLeft,
      y: mouseY - currentTop
    });
  };

  // Synchronize CSS class selection highlight for selected block inside the raw viewer DOM
  useEffect(() => {
    // Clear all existing selections first
    document.querySelectorAll(".canva-block-selected").forEach(el => {
      el.classList.remove("canva-block-selected");
    });
    
    if (selectedBlockId) {
      const selectedEl = document.querySelector(`[data-block-id="${selectedBlockId}"]`);
      if (selectedEl) {
        selectedEl.classList.add("canva-block-selected");
        setSelectedBlockElement(selectedEl as HTMLElement);
      }
    } else {
      setSelectedBlockElement(null);
    }
  }, [selectedBlockId, pages, editorMode]);

  const removeSignature = (id: string, e: any) => {
    e.stopPropagation();
    onUpdateSignatures(doc.signatures.filter(s => s.id !== id));
    if (selectedSigId === id) {
      setSelectedSigId(null);
    }
  };

  const resizeSignature = (id: string, widthChange: number, heightChange: number, e: any) => {
    e.stopPropagation();
    const updated = doc.signatures.map(s => {
      if (s.id === id) {
        return {
          ...s,
          width: Math.max(50, s.width + widthChange),
          height: Math.max(25, s.height + heightChange)
        };
      }
      return s;
    });
    onUpdateSignatures(updated);
  };

  const rotateSignature = (id: string, e: any) => {
    e.stopPropagation();
    const updated = doc.signatures.map(s => {
      if (s.id === id) {
        const currentRotation = s.rotation || 0;
        return {
          ...s,
          rotation: (currentRotation + 90) % 360
        };
      }
      return s;
    });
    onUpdateSignatures(updated);
  };

  const theme = DOCUMENT_THEMES.find((t) => t.id === doc.styleSettings.themeId) || DOCUMENT_THEMES[0];
  
  const spacingClass =
    doc.styleSettings.lineSpacing === "tight"
      ? "leading-tight"
      : doc.styleSettings.lineSpacing === "relaxed"
      ? "leading-relaxed"
      : "leading-normal";
      
  const sizeClass =
    doc.styleSettings.fontSize === "sm"
      ? "text-sm"
      : doc.styleSettings.fontSize === "lg"
      ? "text-lg"
      : doc.styleSettings.fontSize === "xl"
      ? "text-xl"
      : doc.styleSettings.fontSize === "2xl"
      ? "text-2xl"
      : doc.styleSettings.fontSize === "3xl"
      ? "text-3xl"
      : "text-base";

  const renderFloatingCanvaToolbar = (pageIndex: number) => {
    if (editorMode !== "move" || !selectedBlockElement || activePageIndexLocal !== pageIndex) return null;
    
    const isImage = selectedBlockElement.tagName === "IMG";
    const isShape = selectedBlockElement.querySelector("svg") !== null;
    const isText = !isImage && !isShape;

    const elLeft = parseFloat(selectedBlockElement.style.left) || 0;
    const elTop = parseFloat(selectedBlockElement.style.top) || 0;
    const elWidth = parseFloat(selectedBlockElement.style.width) || 300;
    
    // Position toolbar above the block
    const toolbarLeft = Math.max(0, elLeft + (elWidth / 2) - 180);
    const toolbarTop = Math.max(-50, elTop - 52);
    
    return (
      <div 
        className="absolute bg-slate-900 text-white rounded-lg shadow-xl px-3 py-1.5 flex items-center gap-1.5 z-50 select-none animate-fade-in border border-slate-800"
        style={{
          left: `${toolbarLeft}px`,
          top: `${toolbarTop}px`,
          transform: "scale(0.9)",
          transformOrigin: "bottom center"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <select
          onChange={(e) => updateSelectedBlockStyle("font-family", e.target.value)}
          className="bg-slate-800 text-white text-[10px] font-semibold rounded px-1.5 py-1 border border-slate-700 outline-none cursor-pointer max-w-[85px]"
          value={selectedBlockElement.style.fontFamily || "Inter"}
        >
          <option value="Inter">Inter</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Space Grotesk">Space G.</option>
          <option value="Playfair Display">Playfair</option>
          <option value="Lora">Lora</option>
          <option value="Caveat">Caveat</option>
          <option value="Impact">Impact</option>
        </select>
        
        <div className="h-4 w-px bg-slate-700" />
        <button
          type="button"
          onClick={() => {
            if (isText) {
              const currentSize = parseInt(selectedBlockElement.style.fontSize) || 14;
              updateSelectedBlockStyle("font-size", `${Math.max(8, currentSize - 2)}px`);
            } else {
              const currentWidth = parseFloat(selectedBlockElement.style.width) || selectedBlockElement.offsetWidth || 120;
              const nextWidth = Math.max(20, currentWidth - 20);
              selectedBlockElement.style.width = `${nextWidth}px`;
              if (isShape) {
                const currentHeight = parseFloat(selectedBlockElement.style.height) || selectedBlockElement.offsetHeight || 120;
                const nextHeight = Math.max(20, currentHeight - 20);
                selectedBlockElement.style.height = `${nextHeight}px`;
              }
              updateSelectedBlockStyle("width", `${nextWidth}px`);
            }
          }}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
          title={isText ? "Diminuer la taille du texte" : "Rétrécir l'élément"}
        >
          <Minus size={11} />
        </button>
        <span className="text-[10px] font-mono min-w-8 text-center font-bold px-1">
          {isText ? (
            parseInt(selectedBlockElement.style.fontSize) || 14
          ) : (
            `${Math.round(parseFloat(selectedBlockElement.style.width) || selectedBlockElement.offsetWidth || 120)}px`
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            if (isText) {
              const currentSize = parseInt(selectedBlockElement.style.fontSize) || 14;
              updateSelectedBlockStyle("font-size", `${Math.min(72, currentSize + 2)}px`);
            } else {
              const currentWidth = parseFloat(selectedBlockElement.style.width) || selectedBlockElement.offsetWidth || 120;
              const nextWidth = Math.min(800, currentWidth + 20);
              selectedBlockElement.style.width = `${nextWidth}px`;
              if (isShape) {
                const currentHeight = parseFloat(selectedBlockElement.style.height) || selectedBlockElement.offsetHeight || 120;
                const nextHeight = Math.min(1122, currentHeight + 20);
                selectedBlockElement.style.height = `${nextHeight}px`;
              }
              updateSelectedBlockStyle("width", `${nextWidth}px`);
            }
          }}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
          title={isText ? "Augmenter la taille du texte" : "Agrandir l'élément"}
        >
          <Plus size={11} />
        </button>
        
        <div className="h-4 w-px bg-slate-700" />
        
        <button
          type="button"
          onClick={() => updateSelectedBlockStyle("bold", "")}
          className={`p-1 hover:bg-slate-800 rounded font-bold text-xs w-5 h-5 flex items-center justify-center ${selectedBlockElement.style.fontWeight === "bold" ? "bg-blue-600 text-white" : "text-slate-300"}`}
          title="Gras"
        >
          G
        </button>
        <button
          type="button"
          onClick={() => updateSelectedBlockStyle("italic", "")}
          className={`p-1 hover:bg-slate-800 rounded italic text-xs w-5 h-5 flex items-center justify-center ${selectedBlockElement.style.fontStyle === "italic" ? "bg-blue-600 text-white" : "text-slate-300"}`}
          title="Italique"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => updateSelectedBlockStyle("underline", "")}
          className={`p-1 hover:bg-slate-800 rounded underline text-xs w-5 h-5 flex items-center justify-center ${selectedBlockElement.style.textDecoration === "underline" ? "bg-blue-600 text-white" : "text-slate-300"}`}
          title="Souligné"
        >
          S
        </button>
        
        <div className="h-4 w-px bg-slate-700" />
        
        <div className="flex items-center gap-1">
          {["#1e293b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#eab308"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => updateSelectedBlockStyle("color", c)}
              className="w-3.5 h-3.5 rounded-full border border-slate-700 hover:scale-125 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        
        <div className="h-4 w-px bg-slate-700" />
        
        <button
          type="button"
          onClick={duplicateSelectedBlock}
          className="p-1 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300"
          title="Dupliquer le bloc (Canva Pro)"
        >
          <Copy size={11} />
        </button>
        <button
          type="button"
          onClick={deleteSelectedBlock}
          className="p-1 hover:bg-red-950 rounded text-red-400 hover:text-red-300"
          title="Supprimer le bloc"
        >
          <Trash2 size={11} />
        </button>
      </div>
    );
  };

  const renderFloatingCanvaResizeHandle = (pageIndex: number) => {
    if (editorMode !== "move" || !selectedBlockElement || activePageIndexLocal !== pageIndex) return null;

    const elLeft = parseFloat(selectedBlockElement.style.left) || 0;
    const elTop = parseFloat(selectedBlockElement.style.top) || 0;
    const elWidth = parseFloat(selectedBlockElement.style.width) || selectedBlockElement.offsetWidth || 120;
    const elHeight = parseFloat(selectedBlockElement.style.height) || selectedBlockElement.offsetHeight || 40;

    const handleLeft = elLeft + elWidth;
    const handleTop = elTop + elHeight;

    return (
      <div
        className="absolute w-4.5 h-4.5 bg-blue-600 rounded-full border-2 border-white shadow-md z-50 cursor-se-resize flex items-center justify-center hover:scale-125 active:scale-110 transition-all"
        style={{
          left: `${handleLeft - 9}px`,
          top: `${handleTop - 9}px`,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const isShape = selectedBlockElement.querySelector("svg") !== null;
          const isText = !selectedBlockElement.querySelector("svg") && selectedBlockElement.tagName !== "IMG";

          setIsResizing(true);
          setResizeStartSize({
            width: elWidth,
            height: elHeight,
            fontSize: isText ? parseFloat(selectedBlockElement.style.fontSize) || 14 : 14
          });
          setResizeStartMouse({
            x: e.clientX,
            y: e.clientY
          });
        }}
        title="Faites glisser pour redimensionner (Canva Pro)"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      <style>{`
        .editor-move-mode > * {
          cursor: move !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        .editor-move-mode > *:hover {
          outline: 2px dashed #10b981 !important;
          outline-offset: 2px;
        }
        .editor-move-mode-dragging {
          outline: 2px solid #10b981 !important;
          opacity: 0.75;
          z-index: 50;
          cursor: grabbing !important;
        }
        .canva-block-selected {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px;
          z-index: 45;
        }
      `}</style>

      {/* Document Topbar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 bg-white border-b border-slate-200 shrink-0 overflow-x-auto scrollbar-none w-full">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-[150px] md:w-full md:max-w-lg mr-2 shrink-0">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm border border-slate-200 uppercase hidden sm:inline-block">
            {doc.type || "Document"}
          </span>
          <input
            id="doc-title-input"
            type="text"
            value={doc.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="text-sm font-bold uppercase tracking-tight text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:ring-1 focus:ring-blue-500 rounded-sm px-2 py-1 transition-all w-full outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Titre du document"
            disabled={isPreviewMode}
          />
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
          {/* Mode Toggle Group */}
          {!isPreviewMode && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 mr-1">
              <button
                onClick={() => setEditorMode("edit")}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all text-xs font-bold uppercase tracking-wider ${
                  editorMode === "edit"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                title="Modifier le texte normalement"
              >
                <FileText size={13} />
                <span className="hidden md:inline">Édition</span>
              </button>
              <button
                onClick={() => setEditorMode("move")}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all text-xs font-bold uppercase tracking-wider ${
                  editorMode === "move"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                title="Déplacer les blocs de texte n'importe où"
              >
                <Move size={13} />
                <span className="hidden md:inline">Déplacement</span>
              </button>
            </div>
          )}

          {/* Undo / Redo Actions Group */}
          {!isPreviewMode && (
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 mr-1">
              <button
                onClick={handleUndo}
                disabled={historyPointer <= 0}
                className={`flex items-center justify-center p-1.5 rounded-md transition-all text-xs font-bold ${
                  historyPointer > 0
                    ? "text-slate-700 hover:bg-white hover:text-blue-600 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed"
                }`}
                title="Annuler (Ctrl+Z)"
              >
                <Undo size={14} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyPointer >= history.length - 1}
                className={`flex items-center justify-center p-1.5 rounded-md transition-all text-xs font-bold ${
                  historyPointer < history.length - 1
                    ? "text-slate-700 hover:bg-white hover:text-blue-600 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed"
                }`}
                title="Rétablir (Ctrl+Y)"
              >
                <Redo size={14} />
              </button>
            </div>
          )}

          {/* Canva Pro Text Quick Add Buttons */}
          {!isPreviewMode && editorMode === "move" && (
            <div className="flex items-center space-x-1.5 mr-1 bg-emerald-50/50 p-1 rounded-lg border border-emerald-200 animate-fade-in">
              <button
                onClick={() => handleAddNewTextBox("h1")}
                className="flex items-center space-x-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all text-xs font-bold"
                title="Ajouter un titre flottant Canva Pro"
              >
                <PlusCircle size={12} />
                <span className="hidden sm:inline">Titre Canva</span>
                <span className="inline sm:hidden">Titre</span>
              </button>
              <button
                onClick={() => handleAddNewTextBox("p")}
                className="flex items-center space-x-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all text-xs font-bold"
                title="Ajouter un texte flottant Canva Pro"
              >
                <PlusCircle size={12} />
                <span className="hidden sm:inline">Texte Canva</span>
                <span className="inline sm:hidden">Texte</span>
              </button>
            </div>
          )}

          {!isPreviewMode && (
            <button
              onClick={handleAddPage}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-xs font-bold shadow-sm"
              title="Ajouter une page"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">Ajouter Page</span>
              <span className="inline sm:hidden">+ Page</span>
            </button>
          )}

          
          {/* Cover Generation Button */}
          {!isPreviewMode && (
            <button
              onClick={openCoverModal}
              disabled={isGeneratingCover}
              className={`flex items-center space-x-1.5 px-3 py-1.5 ${isGeneratingCover ? 'bg-amber-100 text-amber-600' : 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800'} rounded-md transition-colors border border-amber-200 text-xs font-bold cursor-pointer shadow-sm mr-1`}
              title="Générer ou choisir une page de couverture"
            >
              {isGeneratingCover ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span className="hidden sm:inline">{doc.coverImage ? "Changer Couverture" : "Couverture IA"}</span>
              <span className="inline sm:hidden">{doc.coverImage ? "Change." : "Couv. IA"}</span>
            </button>
          )}

          {isPreviewMode ? (
            <button
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-300 text-xs font-bold"
            >
              <X size={14} />
              <span className="hidden sm:inline">Fermer l'aperçu</span>
              <span className="inline sm:hidden">Fermer</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-colors border border-slate-200 text-xs font-bold"
            >
              <Eye size={14} />
              <span>Aperçu</span>
            </button>
          )}

          <button
            onClick={exportToPDF}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-colors border border-slate-200 text-xs font-bold cursor-pointer"
            title="Imprimer le document ou enregistrer en PDF via le navigateur"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Imprimer</span>
            <span className="inline sm:hidden">Imprimer</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className={`flex items-center space-x-1.5 px-3 py-1.5 ${isExporting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'} rounded-md transition-colors text-xs font-bold shadow-sm`}
            title="Télécharger le document finalisé au format PDF haute fidélité"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span className="hidden sm:inline">
              {isExporting ? (exportProgress ? `PDF (${exportProgress})` : "Génération...") : "Télécharger PDF"}
            </span>
            <span className="inline sm:hidden">
              {isExporting ? (exportProgress ? exportProgress : "PDF...") : "PDF"}
            </span>
          </button>
        </div>
      </div>

      {/* Helper notice if stamp active */}
      {activeSignatureId && (
        <div className="bg-slate-900 text-white py-3.5 px-6 border-b border-blue-500 shrink-0 z-10 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg animate-pulse">
              <Sparkles size={18} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold tracking-tight">Apposer la Signature / Cachet</p>
              <p className="text-[10px] text-slate-400 font-mono uppercase">
                Cliquez directement sur le document OU utilisez les commandes rapides ci-dessous :
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Page :</span>
              <select
                value={selectedPageToSign}
                onChange={(e) => setSelectedPageToSign(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {pages.map((_, pIdx) => (
                  <option key={pIdx} value={pIdx}>
                    Page {pIdx + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Emplacement :</span>
              <select
                value={selectedPlacement}
                onChange={(e) => setSelectedPlacement(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="bottom-right">Bas droite (Conseillé)</option>
                <option value="bottom-center-right">Bas milieu droite</option>
                <option value="bottom-center-left">Bas milieu gauche</option>
                <option value="bottom-left">Bas gauche</option>
                <option value="lower-right">Milieu-bas droite</option>
                <option value="lower-center-right">Milieu-bas centre droite</option>
                <option value="lower-center-left">Milieu-bas centre gauche</option>
                <option value="lower-left">Milieu-bas gauche</option>
                <option value="center-right">Milieu droite</option>
                <option value="center">Au milieu</option>
                <option value="center-left">Milieu gauche</option>
                <option value="top-right">Haut droite</option>
                <option value="top-left">Haut gauche</option>
              </select>
            </div>

            <button
              onClick={() => handleAutoPlaceSignature(selectedPageToSign, selectedPlacement)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow border-b border-blue-800 uppercase tracking-wider"
            >
              Poser ici
            </button>

            <button
              onClick={() => {
                if (onClearActiveSignature) onClearActiveSignature();
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow border-b border-emerald-800 uppercase tracking-wider flex items-center space-x-1"
            >
              <span>✓ Valider & Fixer</span>
            </button>
          </div>
        </div>
      )}

      {/* Helper notice if move mode active */}
      {editorMode === "move" && !activeSignatureId && (
        <div className="bg-emerald-600 text-white py-2 px-6 text-center text-xs font-bold uppercase tracking-wider animate-pulse flex items-center justify-center space-x-2 shrink-0">
          <Sparkles size={14} />
          <span>Mode Déplacement Activé : Survolez et glissez-déposez n'importe quel texte pour le positionner librement sur la page</span>
        </div>
      )}

      {/* Editor Main Canvas Wrapper */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Canva Pro sidebar on the left side */}
        {!isPreviewMode && editorMode === "move" && (
          <div className="w-[320px] h-full border-r border-slate-200 bg-white shrink-0 shadow-lg flex flex-col z-30 animate-fade-in">
            <CanvaProPanel
              activePageIndex={activePageIndexLocal}
              selectedBlockId={selectedBlockId}
              onAddTextBox={handleAddNewTextBox}
              onAddShape={handleAddNewShape}
              onAddImage={handleAddNewImage}
              onUpdateBlockStyle={updateSelectedBlockStyle}
              selectedBlockType={selectedBlockElement ? (selectedBlockElement.tagName === "IMG" ? "image" : (selectedBlockElement.querySelector("svg") ? "shape" : "text")) : null}
            />
          </div>
        )}

        {/* Workspace area on the right side */}
        <div 
          id="document-wrapper"
          className="flex-1 overflow-auto bg-slate-200/50 flex flex-row items-center justify-start p-8 gap-8 select-text"
          onClick={(e) => {
            // If we click away from any block, deselect
            const target = e.target as HTMLElement;
            if (!target.closest("[data-block-id]")) {
              setSelectedBlockId(null);
              setSelectedBlockElement(null);
              document.querySelectorAll(".canva-block-selected").forEach(el => el.classList.remove("canva-block-selected"));
            }
          }}
        >
                      {/* FULL PAGE COVER IMAGE */}
              {doc.coverImage && (
                <div 
                  id="document-page-viewer-cover"
                  className="relative shrink-0 shadow-lg mx-auto"
                  style={{
                    width: `${800 * zoom}px`,
                    height: `${1122 * zoom}px`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 origin-top-left bg-white overflow-hidden transition-all duration-300"
                    style={{
                      transform: `scale(${zoom})`,
                      width: "800px",
                      height: "1122px",
                      padding: 0
                    }}
                  >
                    <CoverRenderer doc={doc} />

                    {!(isExporting || isPreviewMode) && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-50 pointer-events-auto">
                        <button
                          onClick={openCoverModal}
                          disabled={isGeneratingCover}
                          className="bg-white text-slate-800 px-6 py-3 rounded-lg text-base font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-2 cursor-pointer shadow-xl"
                        >
                          {isGeneratingCover ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="text-amber-500" />}
                          <span>Changer la couverture</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pages.map((pageHtml, index) => {
          const isPageActive = index === activePageIndexLocal;
          const pageSigs = doc.signatures.filter(sig => sig.pageIndex === index);

          return (
            <div
              key={index}
              id={`document-page-wrapper-${index}`}
              style={{
                width: `${800 * zoom}px`,
                height: `${1122 * zoom}px`,
              }}
              className="relative shrink-0"
              onClick={() => {
                setActivePageIndexLocal(index);
                if (onActivePageChange) {
                  onActivePageChange(index);
                }
              }}
            >
              {/* Page container scaled by zoom */}
              <div
                id={`document-page-container-${index}`}
                className={`absolute top-0 left-0 origin-top-left bg-white flex flex-col border transition-all ${
                  isPageActive 
                    ? "border-blue-500 shadow-2xl ring-2 ring-blue-500/20" 
                    : "border-slate-300 shadow-lg"
                }`}
                style={{
                  transform: `scale(${zoom})`,
                  width: "800px",
                  height: "1122px",
                  boxSizing: "border-box",
                  paddingLeft: "64px",
                  paddingRight: "64px",
                  paddingTop: "64px",
                  paddingBottom: "64px",
                  cursor: activeSignatureId ? "crosshair" : "text"
                }}
                onClick={(e) => {
                  if (activeSignatureId) {
                    e.stopPropagation();
                    handlePageClickForStamping(e, index);
                  }
                }}
              >
                {/* Stamping overlay for mobile/desktop to move and place instantly without keyboard focus conflicts */}
                {activeSignatureId && (
                  <div
                    className="absolute inset-0 z-10 cursor-crosshair bg-transparent"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = (e.clientX - rect.left) / zoom;
                      const clickY = (e.clientY - rect.top) / zoom;
                      
                      const xPercent = (clickX / 800) * 100;
                      const yPercent = (clickY / 1122) * 100;
                      
                      const xVal = Math.min(Math.max(0, xPercent - 10), 80); 
                      const yVal = Math.min(Math.max(0, yPercent - 3.5), 92);
                      
                      const existingSigIdx = doc.signatures.findIndex(s => s.image === activeSignatureId);
                      
                      if (existingSigIdx !== -1) {
                        const updated = [...doc.signatures];
                        const targetSig = updated[existingSigIdx];
                        updated[existingSigIdx] = {
                          ...targetSig,
                          pageIndex: index,
                          x: xVal,
                          y: yVal
                        };
                        
                        setSelectedSigId(targetSig.id);
                        onUpdateSignatures(updated);
                        return;
                      }
                      
                      const sigId = `sig_${Date.now()}`;
                      const newSig: DocumentSignature = {
                        id: sigId,
                        name: "Cachet/Signature",
                        image: activeSignatureId,
                        pageIndex: index,
                        x: xVal,
                        y: yVal,
                        width: 160,
                        height: 80,
                        rotation: 0
                      };
                      
                      setSelectedSigId(sigId);
                      onUpdateSignatures([...doc.signatures, newSig]);
                    }}
                  />
                )}

                {/* Canva Alignment Snapping Guides */}
                {showVGuide && draggedPageIndex === index && (
                  <div 
                    className="absolute top-0 bottom-0 border-l border-dashed border-emerald-500 z-50 pointer-events-none"
                    style={{ left: "50%" }}
                  />
                )}
                {showHGuide && draggedPageIndex === index && (
                  <div 
                    className="absolute left-0 right-0 border-t border-dashed border-emerald-500 z-50 pointer-events-none"
                    style={{ top: "50%" }}
                  />
                )}

                {/* Floating Canva Pro Context Toolbar */}
                {renderFloatingCanvaToolbar(index)}

                {/* Floating Canva Pro Resize Handle */}
                {renderFloatingCanvaResizeHandle(index)}

                {/* Header decorative accent from active theme */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: theme.primary }}
                />

                {/* Signatures overlay specifically for this page */}
                {pageSigs.map((sig) => {
                  const isSelected = selectedSigId === sig.id;
                  return (
                    <div
                      key={sig.id}
                      className={`absolute group select-none transition-shadow duration-200 ${
                        (isExporting || isPreviewMode) ? "" : `cursor-move border-2 rounded-lg ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/15 z-30"
                            : "border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50/5 z-20"
                        }`
                      }`}
                      style={{
                        left: `${sig.x}%`,
                        top: `${sig.y}%`,
                        width: `${sig.width}px`,
                        height: `${sig.height}px`,
                        touchAction: "none", // Prevent scroll/swipe hijacking by mobile browsers
                      }}
                      onMouseDown={(e) => !(isExporting || isPreviewMode) && startDrag(e, sig)}
                      onTouchStart={(e) => !(isExporting || isPreviewMode) && startDrag(e, sig)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSigId(sig.id);
                      }}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none">
                        <img
                          src={sig.image}
                          alt={sig.name}
                          className="max-w-full max-h-full w-auto h-auto object-contain pointer-events-none"
                          style={{ transform: `rotate(${sig.rotation || 0}deg)` }}
                        />
                        {sig.ownerName && (
                          <div 
                            className="mt-0 text-center pointer-events-none font-bold"
                            style={{ fontFamily: "'Caveat', cursive", fontSize: `${sig.ownerNameFontSize || 24}px`, fontWeight: sig.ownerNameFontWeight || 700, color: "#1e3a8a", lineHeight: "1" }}
                          >
                            {sig.ownerName}
                          </div>
                        )}
                      </div>
                      
                      {/* Controls Toolbar - Horizontal, centered above the signature/stamp, highly optimized for mobile/tablet & desktop */}
                      {!(isExporting || isPreviewMode) && (
                        <>
                          <div 
                            className={`absolute -top-14 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl px-3 py-2 flex items-center space-x-2.5 pointer-events-auto z-50 transition-all duration-200 whitespace-nowrap ${
                              isSelected
                                ? "opacity-100 scale-100 visible"
                                : "opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible"
                            }`}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Minus Button */}
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                resizeSignature(sig.id, -40, -20, e);
                              }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-slate-800 active:bg-slate-700 rounded-lg text-slate-200 hover:text-white text-xl font-bold transition-colors cursor-pointer border border-slate-800"
                              title="Rétrécir (-)"
                            >
                              -
                            </button>
                            {/* Plus Button */}
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                resizeSignature(sig.id, 40, 20, e);
                              }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-slate-800 active:bg-slate-700 rounded-lg text-slate-200 hover:text-white text-xl font-bold transition-colors cursor-pointer border border-slate-800"
                              title="Agrandir (+)"
                            >
                              +
                            </button>

                            <div className="w-px h-6 bg-slate-800 self-center" />

                            {/* Rotate Button */}
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                rotateSignature(sig.id, e);
                              }}
                              className="w-9 h-9 flex items-center justify-center hover:bg-slate-800 active:bg-slate-700 rounded-lg text-blue-400 hover:text-blue-300 transition-colors cursor-pointer border border-slate-800"
                              title="Pivoter (90°)"
                            >
                              <RotateCw size={15} />
                            </button>

                            <div className="w-px h-6 bg-slate-800 self-center" />

                            {/* Delete Button */}
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSignature(sig.id, e);
                              }}
                              className="px-3 h-9 flex items-center space-x-1.5 hover:bg-red-950 active:bg-red-900 rounded-lg text-red-400 hover:text-red-300 transition-colors cursor-pointer border border-red-950"
                              title="Supprimer (🗑️)"
                            >
                              <Trash2 size={14} />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Supprimer</span>
                            </button>
                          </div>

                        </>
                      )}
                    </div>
                  );
                })}

                {/* Editor page content */}
                <div className="flex-1 flex flex-col h-full w-full overflow-hidden">

                  {/* Page Title (Only on the very first page) */}

                  {index === 0 && (
                    <textarea
                      className={`text-2xl font-bold mb-6 w-full bg-transparent border-b pb-4 outline-none placeholder:text-slate-300 transition-colors resize-none overflow-hidden ${!(isExporting || isPreviewMode) ? 'focus:border-b-blue-500 hover:border-b-slate-300' : 'border-b-transparent'}`}
                      style={{ color: theme.primary }}
                      value={doc.title || ""}
                      placeholder="Document sans titre"
                      onChange={(e) => {
                        onChangeTitle(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      readOnly={isExporting || isPreviewMode}
                      rows={1}
                    />
                  )}

                  <div className="flex-1 w-full overflow-hidden relative">
                    {(isExporting || isPreviewMode || editorMode === "move") ? (
                      <div
                        key={`viewer-${doc.id}-p${index}`}
                        id={`document-page-viewer-page-${index}`}
                        className={`h-full w-full whitespace-pre-wrap break-words ${editorMode === "move" ? "editor-move-mode" : ""} ${sizeClass} ${spacingClass} ${getAnimationClass(doc.styleSettings.animation)}`}
                        style={{...getDocumentInlineStyles(doc.styleSettings), display: "block", position: "relative"}}
                        dangerouslySetInnerHTML={{ __html: pageHtml }}
                        onMouseDown={(e) => {
                          if (editorMode === "move") {
                            handleTextElementDragStart(e, index);
                          }
                        }}
                        onDoubleClick={(e) => {
                          if (editorMode === "move") {
                            handleBlockDoubleClick(e);
                          }
                        }}
                      />
                    ) : (
                      <ContentEditable
                        key={`${doc.id}-p${index}`}
                        id={`document-page-editor-${index}`}
                        html={index === activePageIndexLocal && interimDictationText ? `${pageHtml} <span class="text-blue-500 font-bold italic animate-pulse opacity-70 cursor-default select-none">${interimDictationText}</span>` : pageHtml}
                        onChange={(e) => {
                          const updatedPages = [...pages];
                          updatedPages[index] = e.target.value;
                          handleContentChange(updatedPages);
                        }}
                        onFocus={() => {
                          setActivePageIndexLocal(index);
                          if (onActivePageChange) {
                            onActivePageChange(index);
                          }
                        }}
                        className={`h-full w-full whitespace-pre-wrap break-words bg-transparent outline-none border-none focus:ring-0 editor-content-editable ${sizeClass} ${spacingClass} ${getAnimationClass(doc.styleSettings.animation)}`}
                        style={{...getDocumentInlineStyles(doc.styleSettings), display: "block"}}
                      />
                    )}
                  </div>

                  {/* Page Footer */}
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-auto pt-4 border-t border-slate-100 select-none">
                    <span>Saisie Intelligente v2</span>
                    <span className="font-bold">Page {index + 1} sur {pages.length}</span>
                    {!isPreviewMode ? (
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicatePage(index, e)}
                          className="text-blue-500 hover:text-blue-700 flex items-center space-x-1 font-semibold"
                          title="Dupliquer cette page"
                        >
                          <Copy size={11} />
                          <span>Dupliquer</span>
                        </button>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => initiateDeletePage(index, e)}
                            className="text-red-500 hover:text-red-700 flex items-center space-x-1 font-semibold"
                            title="Supprimer cette page"
                          >
                            <Trash2 size={11} />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-12" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* Custom Confirmation Modal for Deletion */}
      {pageToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-100 transform scale-100 transition-all">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirmer la suppression</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer la <strong>Page {pageToDelete + 1}</strong> ? Cette action est irréversible et supprimera tout le texte ainsi que les signatures associées à cette page.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeletePage}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                Supprimer la page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal for Minimum Page Limit */}
      {showMinPageWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-100 transform scale-100 transition-all">
            <div className="flex items-center space-x-3 text-amber-500 mb-4">
              <div className="p-2 bg-amber-50 rounded-full">
                <X size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Action impossible</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Un document doit contenir au moins une page. Vous ne pouvez pas supprimer l'unique page de ce document.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMinPageWarning(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                D'accord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Print Assistance Modal for Iframe Environments */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-slate-100 transform scale-100 transition-all mx-4">
            <div className="flex items-start space-x-4 text-blue-600 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl shrink-0">
                <Printer size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assistant d'impression</h3>
                <p className="text-xs text-slate-500 mt-1">Options d'impression sécurisées</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs leading-relaxed flex items-start space-x-2.5">
                <span className="text-sm mt-0.5 shrink-0">⚠️</span>
                <span>
                  <strong>Restriction de l'aperçu :</strong> L'intégration de l'application dans le panneau d'aperçu de Google AI Studio restreint la fonction d'impression directe de votre navigateur pour des raisons de sécurité.
                </span>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 space-y-3.5">
                <div className="flex items-start space-x-3">
                  <span className="flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Télécharger au format PDF (Recommandé)</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Génère un fichier PDF officiel et haute fidélité avec vos styles et signatures. Vous pourrez l'imprimer directement depuis n'importe quel lecteur PDF ou navigateur.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-2"></div>

                <div className="flex items-start space-x-3">
                  <span className="flex items-center justify-center w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Ouvrir dans un nouvel onglet</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Ouvrez l'application en mode plein écran autonome (icône ↗ en haut à droite d'AI Studio). Le bouton d'impression directe de votre navigateur y fonctionnera de manière fluide !
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  handleDownloadPDF();
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <FileDown size={14} />
                <span>Télécharger PDF (Recommandé)</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  executePrint();
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                <Printer size={14} />
                <span>Essayer d'imprimer ici</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="sm:col-span-2 flex items-center justify-center px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mt-2"
              >
                Fermer l'assistant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Selection Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-slate-100 transform scale-100 transition-all mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Personnaliser la couverture</h3>
                  <p className="text-xs text-slate-500 mt-1">Personnalisez le texte et choisissez un modèle de page de garde.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCoverModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customization Fields */}
            {coverImage?.startsWith("data:") || coverImage?.startsWith("http") ? (
              <div className="mb-8 p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-start space-x-3 text-amber-800 animate-fade-in">
                <div className="shrink-0 text-amber-500 mt-0.5">
                  <Sparkles size={18} className="animate-pulse" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">Image de couverture personnalisée importée</p>
                  <p className="text-amber-700 mt-1 leading-relaxed">
                    Les champs de modification de texte (sous-titre, nom de l'entreprise, date, type de document) ne s'appliquent pas aux couvertures importées afin de préserver l'intégrité visuelle de votre propre image.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Textes de la couverture</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sous-titre (En haut)</label>
                    <input
                      type="text"
                      value={coverSubtitle}
                      onChange={(e) => setCoverSubtitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="PROJET / DOCUMENT"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de l'entreprise</label>
                    <input
                      type="text"
                      value={coverCompanyName}
                      onChange={(e) => setCoverCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="SIMPLIFY CREATIVE"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="text"
                      value={coverDate}
                      onChange={(e) => setCoverDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Type de document</label>
                    <input
                      type="text"
                      value={coverDocType}
                      onChange={(e) => setCoverDocType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Presets Grid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modèles Premium (Prêts à l'emploi)</h4>
                
                <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-blue-100 shadow-sm">
                  <Upload size={14} />
                  <span>Importer image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setCoverImage(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </label>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Remove Cover Option */}
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage("");
                  }}
                  className={`border border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 flex flex-col items-center justify-center min-h-[120px] bg-slate-50/50 hover:bg-slate-50 transition-all group cursor-pointer ${!coverImage ? "ring-2 ring-blue-500" : ""}`}
                >
                  <Trash2 size={24} className="text-slate-400 group-hover:text-red-500 transition-colors mb-2" />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-red-600 transition-colors">Pas de couverture</span>
                </button>

                {ALL_COVER_PRESETS.map((preset) => {
                  const isSelected = coverImage === preset.imageUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setCoverImage(preset.imageUrl);
                      }}
                      className={`relative border rounded-xl overflow-hidden text-left p-3 min-h-[120px] transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected ? "border-blue-600 ring-2 ring-blue-500 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      {/* Miniature Preview Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${preset.previewGradient} opacity-90 z-0`}></div>
                      
                      {/* Geometric decorations in mini card */}
                      <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-slate-300"></div>
                      </div>

                      {/* Content Overlay */}
                      <div className="relative z-10 flex flex-col justify-between h-full w-full">
                        <span className={`text-[8px] tracking-[0.2em] font-bold ${(preset.class || "").includes("text-white") ? "text-white/60" : "text-slate-600/60"}`}>PROJET</span>
                        <div className="my-2">
                          <p className={`text-[10px] font-bold truncate leading-tight ${(preset.class || "").includes("text-white") ? "text-white" : "text-slate-800"}`}>
                            {doc.title || "Titre"}
                          </p>
                        </div>
                        <span className={`text-[8px] font-medium block truncate ${(preset.class || "").includes("text-white") ? "text-white/70" : "text-slate-700"}`}>
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Generation Section */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Création Artistique Unique (IA)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">L'IA analyse le contenu pour composer un fond abstrait et moderne adapté.</p>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-100 uppercase self-start sm:self-center tracking-wider shrink-0">Bêta</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0 text-slate-500">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800">Générer une couverture sur-mesure</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Met à contribution l'algorithme d'art génératif de Simplify.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleGenerateCover();
                    setShowCoverModal(false);
                  }}
                  disabled={isGeneratingCover}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  {isGeneratingCover ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Lancer l'IA</span>
                    </>
                  )}
                </button>
              </div>

              {/* Advanced billing info help trigger */}
              <div className="border border-amber-100 bg-amber-50/50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-sm mt-0.5">💡</span>
                    <div>
                      <h5 className="text-xs font-bold text-amber-900">Blocage avec l'IA ou erreur [OR_BACR2_44] ?</h5>
                      <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                        Si la génération d'images échoue en mentionnant vos quotas, cela est dû à la différence entre l'abonnement grand public et la facturation développeur.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBillingHelp(!showBillingHelp)}
                    className="text-xs font-bold text-amber-700 hover:text-amber-900 underline shrink-0 ml-2"
                  >
                    {showBillingHelp ? "Masquer" : "En savoir plus"}
                  </button>
                </div>

                {showBillingHelp && (
                  <div className="mt-4 pt-3 border-t border-amber-200/50 text-[11px] text-amber-800/95 space-y-3 leading-relaxed animate-fade-in">
                    <div>
                      <strong className="text-amber-900">1. Pourquoi cet écart ?</strong>
                      <p className="mt-0.5">
                        Votre abonnement de 5,36 $US/mois sur Google Play est une souscription utilisateur (ex: Gemini Advanced). Elle ne s'applique pas aux clés API de développement de Google AI Studio, qui requièrent une facturation de type Pay-as-you-go.
                      </p>
                    </div>
                    <div>
                      <strong className="text-amber-900">2. Résoudre l'erreur [OR_BACR2_44] :</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li><strong>Éviter les cartes virtuelles :</strong> Google Cloud Billing rejette fréquemment les cartes prépayées ou virtuelles (Revolut, cartes de test temporaires) pour limiter la fraude. Utilisez une carte de débit/crédit physique d'une banque classique.</li>
                        <li><strong>Profil de paiement :</strong> Vérifiez sur <a href="https://pay.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">pay.google.com</a> que vos coordonnées (nom, adresse, pays) correspondent exactement à votre moyen de paiement et qu'aucun blocage temporaire n'est actif.</li>
                        <li><strong>Aide Google Pay :</strong> Si le problème persiste, écrivez au support Google Pay en spécifiant le code d'erreur <code className="bg-amber-100 px-1">OR_BACR2_44</code> pour qu'ils lèvent manuellement la sécurité de votre compte.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center space-x-3 mt-8">
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onChangeDocument) {
                    onChangeDocument({
                      ...doc,
                      coverSubtitle,
                      coverCompanyName,
                      coverDate,
                      type: coverDocType,
                      coverImage
                    });
                  }
                  setShowCoverModal(false);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Appliquer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
