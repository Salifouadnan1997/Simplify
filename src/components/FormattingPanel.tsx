import React, { useState } from "react";
import html2pdf from "html2pdf.js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { SmartDocument, DocumentStyleSettings } from "../types";
import { DOCUMENT_THEMES } from "../utils";
import { 
  Sliders, Type, Download, Printer, Save, FileText, Check, AlertCircle,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Palette, Sparkles, Layers, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw
} from "lucide-react";

interface FormattingPanelProps {
  document: SmartDocument;
  onUpdateStyle: (settings: DocumentStyleSettings) => void;
  onTriggerSave: () => void;
}

export default function FormattingPanel({
  document: doc,
  onUpdateStyle,
  onTriggerSave,
}: FormattingPanelProps) {
  const [success, setSuccess] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"police" | "format" | "position">("police");

  const style = doc.styleSettings;

  const updateSetting = <K extends keyof DocumentStyleSettings>(key: K, value: DocumentStyleSettings[K]) => {
    onUpdateStyle({
      ...style,
      [key]: value,
    });
  };

  const handleLocalSave = () => {
    onTriggerSave();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  // Text Presets inspired by Canva's Styles de texte
  const applyTextPreset = (preset: "h1" | "h2" | "h3" | "quote" | "normal") => {
    if (preset === "h1") {
      onUpdateStyle({
        ...style,
        textStyle: "h1",
        fontSize: "3xl",
        bold: true,
        font: "Montserrat",
        lineSpacing: "tight",
        textColor: "#0f172a",
        alignment: "center"
      });
    } else if (preset === "h2") {
      onUpdateStyle({
        ...style,
        textStyle: "h2",
        fontSize: "2xl",
        bold: true,
        font: "Playfair Display",
        italic: true,
        textColor: "#1e3a8a",
        alignment: "left"
      });
    } else if (preset === "h3") {
      onUpdateStyle({
        ...style,
        textStyle: "h3",
        fontSize: "xl",
        bold: true,
        font: "Space Grotesk",
        textColor: "#0369a1",
        alignment: "left"
      });
    } else if (preset === "quote") {
      onUpdateStyle({
        ...style,
        textStyle: "quote",
        font: "Lora",
        fontSize: "lg",
        italic: true,
        lineSpacing: "relaxed",
        textColor: "#475569",
        alignment: "center"
      });
    } else {
      onUpdateStyle({
        ...style,
        textStyle: "normal",
        fontSize: "md",
        font: "Inter",
        bold: false,
        italic: false,
        underline: false,
        uppercase: false,
        textColor: "#334155",
        alignment: "left",
        letterSpacing: "normal",
        lineSpacing: "normal"
      });
    }
  };

  // Presets of classic professional colors
  const CANVA_PALETTE = [
    { color: "#0f172a", name: "Anthracite" },
    { color: "#1e3a8a", name: "Bleu nuit" },
    { color: "#065f46", name: "Émeraude" },
    { color: "#991b1b", name: "Crimson" },
    { color: "#b45309", name: "Ambre" },
    { color: "#4d7c0f", name: "Sauge" },
    { color: "#6d28d9", name: "Améthyste" },
    { color: "#334155", name: "Ardoise" },
    { color: "#000000", name: "Noir pur" }
  ];

  // Fonts including the new options
  const FONTS_LIST = [
    { id: "Inter", name: "Inter (Moderne)", family: "font-sans" },
    { id: "Playfair Display", name: "Playfair Display", family: "font-serif font-semibold" },
    { id: "Space Grotesk", name: "Space Grotesk (Tech)", family: "font-sans tracking-tight" },
    { id: "JetBrains Mono", name: "JetBrains Mono (Code)", family: "font-mono" },
    { id: "Montserrat", name: "Montserrat (Display)", family: "font-sans font-bold" },
    { id: "Lora", name: "Lora (Élégant)", family: "font-serif italic" },
    { id: "Caveat", name: "Caveat (Signature)", family: "font-handwriting text-lg font-bold" },
    { id: "Cinzel", name: "Cinzel (Classique)", family: "font-serif tracking-widest" },
    { id: "Impact", name: "Impact (Bold)", family: "font-sans font-extrabold uppercase" }
  ] as const;

  const execCommandWithReactUpdate = (command: string, value: string = '') => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && sel.toString().length > 0) {
      document.execCommand(command, false, value);
      
      // Find which page was edited
      let node = sel.anchorNode;
      while (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentNode;
      const editorNode = (node as Element)?.closest('.editor-content-editable');
      if (editorNode) {
         editorNode.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }
    return false;
  };

  // Download plain text (.txt)
  const downloadTXT = () => {
    const element = window.document.createElement("a");
    const file = new Blob([`${doc.title}\n\n${doc.content}`], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
    triggerDownloadFeedback("TXT");
  };

    // Helper to generate the full styled HTML for export and print
    const generateFullHTML = () => {
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

    let pagesBodyHtml = "";
    pagesList.forEach((pageContent, idx) => {
      // Filter signatures belonging strictly to this page
      const pageSigs = doc.signatures.filter((s) => s.pageIndex === idx);
      const sigsHtml = pageSigs
        .map((sig) => {
          return `<div class="signature-stamp" style="left: ${sig.x}%; top: ${sig.y}%; width: ${sig.width}px; height: ${sig.height}px;">
            <img src="${sig.image}" style="width:100%; height:100%; object-fit: contain;" />
          </div>`;
        })
        .join("");

      pagesBodyHtml += `
        <div class="paper" style="page-break-after: ${idx === pagesList.length - 1 ? "avoid" : "always"}; position: relative; min-height: 1020px; box-sizing: border-box; margin-bottom: 30px;">
          ${
            idx === 0
              ? `
            <div class="accent-bar"></div>
            <h1>${doc.title}</h1>
          `
              : ""
          }
          ${sigsHtml}
          <div class="content">${pageContent}</div>
        </div>
      `;
    });

    return `<!DOCTYPE html>
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
    .paper {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: ${style.margins === "narrow" ? "30px" : style.margins === "wide" ? "80px" : "50px"};
      font-size: ${style.fontSize === "sm" ? "13px" : style.fontSize === "lg" ? "18px" : style.fontSize === "xl" ? "20px" : style.fontSize === "2xl" ? "24px" : style.fontSize === "3xl" ? "32px" : "15px"};
      line-height: ${style.lineSpacing === "tight" ? "1.3" : style.lineSpacing === "relaxed" ? "1.8" : "1.5"};
      font-family: ${
        style.font === "Playfair Display" ? "'Playfair Display', serif" : 
        style.font === "Space Grotesk" ? "'Space Grotesk', sans-serif" : 
        style.font === "JetBrains Mono" ? "'JetBrains Mono', monospace" : 
        style.font === "Montserrat" ? "'Montserrat', sans-serif" :
        style.font === "Lora" ? "'Lora', serif" :
        style.font === "Caveat" ? "'Caveat', cursive" :
        style.font === "Cinzel" ? "'Cinzel', serif" :
        style.font === "Impact" ? "Impact, Charcoal, sans-serif" :
        "'Inter', sans-serif"
      };
      font-weight: ${style.bold ? "bold" : "normal"};
      font-style: ${style.italic ? "italic" : "normal"};
      text-decoration: ${style.underline ? "underline" : "none"};
      text-transform: ${style.uppercase ? "uppercase" : "none"};
      text-align: ${style.alignment || "left"};
      color: ${style.textColor || "#334155"};
      opacity: ${(style.textOpacity !== undefined ? style.textOpacity : 100) / 100};
      letter-spacing: ${style.letterSpacing === "tight" ? "-0.05em" : style.letterSpacing === "wide" ? "0.15em" : "normal"};
      position: relative;
    }
    .accent-bar {
      height: 4px;
      background-color: ${theme.primary};
      margin-bottom: 30px;
    }
    h1 {
      color: ${theme.primary};
      font-size: 26px;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 15px;
      margin-top: 0;
      text-align: left;
      font-family: 'Inter', sans-serif;
    }
    .content {
      white-space: pre-wrap;
    }
    .signature-stamp {
      position: absolute;
      pointer-events: none;
    }
    @media print {
      body { padding: 0; }
      .paper { box-shadow: none; padding: 30px; transform: none; }
    }
  </style>
</head>
<body>
  ${pagesBodyHtml}
</body>
</html>`;
  };

    const downloadHTML = () => {
    const element = window.document.createElement("a");
    const htmlContent = generateFullHTML();

    const file = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${doc.title.replace(/\s+/g, "_")}.html`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
    triggerDownloadFeedback("HTML");
  };

  const triggerDownloadFeedback = (format: string) => {
    setDownloadMsg(`Document téléchargé au format ${format} !`);
    setTimeout(() => setDownloadMsg(null), 3000);
  };

  const downloadWord = async () => {
    try {
      setDownloadMsg("Génération du DOCX en cours...");
      const res = await fetch("/api/format/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `# ${doc.title}\n\n${doc.content}`,
          format: "docx",
          size: style.fontSize,
          style: style.themeId
        })
      });
      if (!res.ok) throw new Error("Erreur de génération DOCX");
      const data = await res.json();
      
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.fileData}`;
      link.download = data.fileName || `${doc.title.replace(/\s+/g, "_")}.docx`;
      link.click();
      
      triggerDownloadFeedback("DOCX");
    } catch(err) {
      console.error(err);
      setDownloadMsg("Erreur lors de la génération DOCX.");
    }
  };

  const downloadPDFBackend = async () => {
    try {
      setDownloadMsg("Génération du PDF en cours...");
      const res = await fetch("/api/format/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `# ${doc.title}\n\n${doc.content}`,
          format: "pdf",
          size: style.fontSize,
          style: style.themeId
        })
      });
      if (!res.ok) throw new Error("Erreur de génération PDF");
      const data = await res.json();
      
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.fileData}`;
      link.download = data.fileName || `${doc.title.replace(/\s+/g, "_")}.pdf`;
      link.click();
      
      triggerDownloadFeedback("PDF");
    } catch(err) {
      console.error(err);
      setDownloadMsg("Erreur lors de la génération PDF.");
    }
  };

  // Professional Print to PDF (Client-side)
  const handlePrintPDF = () => {
    setDownloadMsg("Génération du PDF en cours...");
    const baseHtml = generateFullHTML();
    
    const parser = new DOMParser();
    const docParsed = parser.parseFromString(baseHtml, 'text/html');
    const container = document.createElement("div");
    container.innerHTML = docParsed.body.innerHTML;

    // Render page by page sequentially using jsPDF and html2canvas
    const pages = container.querySelectorAll(".paper");
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
          setDownloadMsg(`Génération du PDF (page ${index + 1}/${totalPages})...`);
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
        setDownloadMsg("PDF téléchargé avec succès.");
        setTimeout(() => setDownloadMsg(null), 3000);
      } catch (err) {
        console.error("Error during PDF rendering:", err);
        setDownloadMsg("Erreur lors de la génération PDF.");
        setTimeout(() => setDownloadMsg(null), 3000);
      } finally {
        // Safe cleanup
        if (document.body.contains(tempWrapper)) {
          document.body.removeChild(tempWrapper);
        }
      }
    };

    generatePDF().catch((err) => {
      console.error("Sequential PDF generation failed:", err);
      setDownloadMsg("Erreur lors de la génération PDF.");
      setTimeout(() => setDownloadMsg(null), 3000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro info */}
      <div>
        <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center">
          <Sliders className="mr-2 text-blue-600 animate-pulse" size={16} />
          Personnalisation Canva Pro
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
          Personnalisez la typographie, le format, la transparence, l'animation et l'alignement précis de votre document.
        </p>
      </div>

      {/* Segmented Canva Tab Selector */}
      <div className="flex border-b border-slate-200 bg-slate-50 rounded-lg p-1">
        <button
          onClick={() => setActiveSubTab("police")}
          className={`flex-1 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all rounded-md flex flex-col items-center justify-center ${
            activeSubTab === "police"
              ? "bg-white text-blue-600 shadow-sm border border-slate-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Type size={14} className="mb-0.5" />
          Police & Style
        </button>
        <button
          onClick={() => setActiveSubTab("format")}
          className={`flex-1 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all rounded-md flex flex-col items-center justify-center ${
            activeSubTab === "format"
              ? "bg-white text-blue-600 shadow-sm border border-slate-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Bold size={14} className="mb-0.5" />
          Format & Effets
        </button>
        <button
          onClick={() => setActiveSubTab("position")}
          className={`flex-1 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wider text-center transition-all rounded-md flex flex-col items-center justify-center ${
            activeSubTab === "position"
              ? "bg-white text-blue-600 shadow-sm border border-slate-100"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Layers size={14} className="mb-0.5" />
          Position & Calques
        </button>
      </div>

      {/* TAB CONTENT: POLICE & STYLE */}
      {activeSubTab === "police" && (
        <div className="space-y-4 fade-in">
          {/* Font typography selector */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center tracking-wider">
              Police de caractère
            </label>
            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1 border border-slate-100 p-1.5 rounded-lg bg-slate-50/50 scrollbar-thin">
              {FONTS_LIST.map((fontItem) => (
                <button
                  key={fontItem.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!execCommandWithReactUpdate('fontName', fontItem.id)) {
                      updateSetting("font", fontItem.id as any);
                    }
                  }}
                  className={`py-1.5 px-2 text-[11px] border rounded-md text-left transition-all ${
                    style.font === fontItem.id
                      ? "border-blue-500 bg-blue-50/60 text-blue-800 font-bold shadow-sm"
                      : "border-slate-200/60 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  <span className={fontItem.family}>
                    {fontItem.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Presets (Styles de texte) */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Styles de texte
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => applyTextPreset("h1")}
                className={`py-1 px-2 border rounded-md text-left transition-all text-[11px] ${
                  style.textStyle === "h1" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white"
                }`}
              >
                <span className="font-extrabold text-slate-900">Titre Principal</span>
              </button>
              <button
                onClick={() => applyTextPreset("h2")}
                className={`py-1 px-2 border rounded-md text-left transition-all text-[11px] ${
                  style.textStyle === "h2" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white"
                }`}
              >
                <span className="font-serif italic text-slate-800">Sous-titre</span>
              </button>
              <button
                onClick={() => applyTextPreset("h3")}
                className={`py-1 px-2 border rounded-md text-left transition-all text-[11px] ${
                  style.textStyle === "h3" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white"
                }`}
              >
                <span className="font-semibold text-slate-900">Section</span>
              </button>
              <button
                onClick={() => applyTextPreset("quote")}
                className={`py-1 px-2 border rounded-md text-left transition-all text-[11px] ${
                  style.textStyle === "quote" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white"
                }`}
              >
                <span className="font-serif italic text-slate-600 text-center">Citation</span>
              </button>
            </div>
            <button
              onClick={() => applyTextPreset("normal")}
              className="w-full py-1 border border-dashed border-slate-300 hover:border-slate-400 rounded-md text-[9px] uppercase font-bold text-slate-600 text-center transition-colors bg-white mt-1"
            >
              Réinitialiser
            </button>
          </div>

          {/* Sizing Controls */}
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Taille de la police
              </label>
              <span className="text-xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                {style.fontSize === "sm" ? "13px" : style.fontSize === "md" ? "15px" : style.fontSize === "lg" ? "18px" : style.fontSize === "xl" ? "20px" : style.fontSize === "2xl" ? "24px" : "32px"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  const sizes: DocumentStyleSettings["fontSize"][] = ["sm", "md", "lg", "xl", "2xl", "3xl"];
                  const idx = sizes.indexOf(style.fontSize);
                  const currentHtmlSize = Math.max(1, idx);
                  if (!execCommandWithReactUpdate('fontSize', currentHtmlSize.toString())) {
                    if (idx > 0) updateSetting("fontSize", sizes[idx - 1]);
                  }
                }}
                className="p-1 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold bg-white text-sm"
              >
                -
              </button>
              <select
                value={style.fontSize}
                onChange={(e) => {
                  const val = e.target.value as any;
                  updateSetting("fontSize", val);
                  const sizes: DocumentStyleSettings["fontSize"][] = ["sm", "md", "lg", "xl", "2xl", "3xl"];
                  const idx = sizes.indexOf(val);
                  execCommandWithReactUpdate('fontSize', Math.max(1, idx + 1).toString());
                }}
                className="flex-1 p-1.5 bg-white border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="sm">Petit (13px)</option>
                <option value="md">Standard (15px)</option>
                <option value="lg">Grand (18px)</option>
                <option value="xl">Très grand (20px)</option>
                <option value="2xl">Titre H2 (24px)</option>
                <option value="3xl">Grand Titre H1 (32px)</option>
              </select>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  const sizes: DocumentStyleSettings["fontSize"][] = ["sm", "md", "lg", "xl", "2xl", "3xl"];
                  const idx = sizes.indexOf(style.fontSize);
                  const currentHtmlSize = Math.min(7, idx + 2);
                  if (!execCommandWithReactUpdate('fontSize', currentHtmlSize.toString())) {
                    if (idx < sizes.length - 1) updateSetting("fontSize", sizes[idx + 1]);
                  }
                }}
                className="p-1 px-3 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold bg-white text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Color Palette (Couleur) */}
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Palette size={12} className="mr-1 text-slate-500" /> Couleur
              </label>
              <input
                type="color"
                value={style.textColor || "#334155"}
                onChange={(e) => updateSetting("textColor", e.target.value)}
                className="w-5 h-5 p-0 border border-slate-200 rounded-sm cursor-pointer outline-none bg-transparent"
                title="Couleur personnalisée"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              {CANVA_PALETTE.map((item) => (
                <button
                  key={item.color}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!execCommandWithReactUpdate('foreColor', item.color)) {
                      updateSetting("textColor", item.color);
                    }
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform relative hover:scale-110 flex items-center justify-center`}
                  style={{ 
                    backgroundColor: item.color,
                    borderColor: style.textColor === item.color ? "#2563eb" : "#e2e8f0"
                  }}
                  title={item.name}
                >
                  {style.textColor === item.color && (
                     <span className="w-1 h-1 bg-white rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: FORMAT & EFFETS */}
      {activeSubTab === "format" && (
        <div className="space-y-4 fade-in">
          {/* Format options (B / I / U / aA) */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Formatage typographique
            </label>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!execCommandWithReactUpdate('bold')) {
                    updateSetting("bold", !style.bold);
                  }
                }}
                className={`p-1.5 flex-1 rounded-md flex justify-center items-center transition-colors ${
                  style.bold ? "bg-blue-50 text-blue-700 font-extrabold border border-blue-200" : "text-slate-600 hover:bg-slate-50"
                }`}
                title="Gras"
              >
                <Bold size={15} />
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!execCommandWithReactUpdate('italic')) {
                    updateSetting("italic", !style.italic);
                  }
                }}
                className={`p-1.5 flex-1 rounded-md flex justify-center items-center transition-colors ${
                  style.italic ? "bg-blue-50 text-blue-700 italic border border-blue-200" : "text-slate-600 hover:bg-slate-50"
                }`}
                title="Italique"
              >
                <Italic size={15} />
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!execCommandWithReactUpdate('underline')) {
                    updateSetting("underline", !style.underline);
                  }
                }}
                className={`p-1.5 flex-1 rounded-md flex justify-center items-center transition-colors ${
                  style.underline ? "bg-blue-50 text-blue-700 underline border border-blue-200" : "text-slate-600 hover:bg-slate-50"
                }`}
                title="Souligné"
              >
                <Underline size={15} />
              </button>
              <button
                onClick={() => updateSetting("uppercase", !style.uppercase)}
                className={`p-1.5 flex-1 rounded-md flex justify-center items-center text-xs font-mono font-bold transition-colors ${
                  style.uppercase ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50"
                }`}
                title="Majuscule"
              >
                aA
              </button>
            </div>
          </div>

          {/* Alignment selector */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Alignement du paragraphe
            </label>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
              {(["left", "center", "right", "justify"] as const).map((align) => {
                const isSelected = (style.alignment || "left") === align;
                return (
                  <button
                    key={align}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const command = align === 'left' ? 'justifyLeft' : align === 'center' ? 'justifyCenter' : align === 'right' ? 'justifyRight' : 'justifyFull';
                      if (!execCommandWithReactUpdate(command)) {
                        updateSetting("alignment", align);
                      }
                    }}
                    className={`p-1.5 flex-1 rounded-md flex justify-center items-center transition-colors ${
                      isSelected ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {align === "left" && <AlignLeft size={15} />}
                    {align === "center" && <AlignCenter size={15} />}
                    {align === "right" && <AlignRight size={15} />}
                    {align === "justify" && <AlignJustify size={15} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spacing / Letter Spacing & Line Height */}
          <div className="space-y-3 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Espacement (Avancé)
            </label>
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {/* Line height */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Hauteur de ligne</span>
                  <span className="font-mono">{style.lineSpacing === "tight" ? "Serré" : style.lineSpacing === "relaxed" ? "Aéré" : "Normal"}</span>
                </div>
                <select
                  value={style.lineSpacing}
                  onChange={(e) => updateSetting("lineSpacing", e.target.value as any)}
                  className="w-full p-1 bg-white border border-slate-200 rounded-md text-[11px] outline-none"
                >
                  <option value="tight">Serré (Simple)</option>
                  <option value="normal">Standard (1.5)</option>
                  <option value="relaxed">Aéré (Double)</option>
                </select>
              </div>

              {/* Letter spacing */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Espacement des lettres (Approche)</span>
                  <span className="font-mono">{style.letterSpacing === "tight" ? "Serré" : style.letterSpacing === "wide" ? "Large" : "Normal"}</span>
                </div>
                <select
                  value={style.letterSpacing || "normal"}
                  onChange={(e) => updateSetting("letterSpacing", e.target.value as any)}
                  className="w-full p-1 bg-white border border-slate-200 rounded-md text-[11px] outline-none"
                >
                  <option value="tight">Serré (-0.05em)</option>
                  <option value="normal">Normal (0)</option>
                  <option value="wide">Espacé (+0.15em)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transparence (Opacity) */}
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Opacité / Transparence</span>
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{style.textOpacity !== undefined ? style.textOpacity : 100}%</span>
            </div>
            <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={style.textOpacity !== undefined ? style.textOpacity : 100}
                onChange={(e) => updateSetting("textOpacity", parseInt(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Animer (Text Animations) */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Sparkles size={12} className="mr-1 text-blue-500 animate-pulse" /> Animation d'entrée
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
              {([
                { id: "none", name: "Aucun" },
                { id: "fade", name: "Fondu" },
                { id: "slide-up", name: "Émerger" },
                { id: "typewriter", name: "Écriture" },
                { id: "bounce", name: "Rebond" }
              ] as const).map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => updateSetting("animation", anim.id)}
                  className={`py-1.5 px-2 text-[11px] border rounded-md transition-all text-center ${
                    (style.animation || "none") === anim.id
                      ? "border-blue-500 bg-blue-50/60 text-blue-800 font-bold"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  {anim.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: POSITION & CALQUES */}
      {activeSubTab === "position" && (
        <div className="space-y-4 fade-in">
          {/* Calques (Z-Index / Layers position) */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Ordre de superposition (Calques)
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <button
                onClick={() => updateSetting("layerPosition", "front")}
                className={`py-2 px-3 border rounded-lg text-center text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
                  style.layerPosition === "front"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-bold"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <ArrowUp size={15} className="text-blue-500" />
                <span className="font-bold">Premier Plan</span>
                <span className="text-[8px] text-slate-400">Par-dessus les tampons</span>
              </button>
              <button
                onClick={() => updateSetting("layerPosition", "back")}
                className={`py-2 px-3 border rounded-lg text-center text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
                  style.layerPosition === "back"
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-bold"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                }`}
              >
                <ArrowDown size={15} className="text-slate-500" />
                <span className="font-bold">Arrière-Plan</span>
                <span className="text-[8px] text-slate-400">En dessous des tampons</span>
              </button>
            </div>
          </div>

          {/* Ajuster la Position / Arrow pad to nudge content */}
          <div className="space-y-3 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Ajustement micrométrique (Position)
            </label>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center space-y-3">
              <div className="text-[9px] text-slate-400 uppercase font-mono">
                Décalage : X: {style.xOffset || 0}px | Y: {style.yOffset || 0}px
              </div>
              
              {/* Arrow pad */}
              <div className="relative w-28 h-28 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-inner">
                {/* UP */}
                <button
                  onClick={() => updateSetting("yOffset", (style.yOffset || 0) - 5)}
                  className="absolute top-1 p-1 rounded-md hover:bg-slate-100 border border-slate-200/50 bg-white shadow-sm text-slate-600"
                  title="Déplacer vers le haut (-5px)"
                >
                  <ArrowUp size={14} />
                </button>
                {/* LEFT */}
                <button
                  onClick={() => updateSetting("xOffset", (style.xOffset || 0) - 5)}
                  className="absolute left-1 p-1 rounded-md hover:bg-slate-100 border border-slate-200/50 bg-white shadow-sm text-slate-600"
                  title="Déplacer vers la gauche (-5px)"
                >
                  <ArrowLeft size={14} />
                </button>
                {/* RESET */}
                <button
                  onClick={() => {
                    onUpdateStyle({
                      ...style,
                      xOffset: 0,
                      yOffset: 0
                    });
                  }}
                  className="p-1 rounded-md hover:bg-slate-100 border border-slate-200/50 bg-white shadow-sm text-slate-500 hover:text-slate-800"
                  title="Réinitialiser"
                >
                  <RotateCcw size={14} />
                </button>
                {/* RIGHT */}
                <button
                  onClick={() => updateSetting("xOffset", (style.xOffset || 0) + 5)}
                  className="absolute right-1 p-1 rounded-md hover:bg-slate-100 border border-slate-200/50 bg-white shadow-sm text-slate-600"
                  title="Déplacer vers la droite (+5px)"
                >
                  <ArrowRight size={14} />
                </button>
                {/* DOWN */}
                <button
                  onClick={() => updateSetting("yOffset", (style.yOffset || 0) + 5)}
                  className="absolute bottom-1 p-1 rounded-md hover:bg-slate-100 border border-slate-200/50 bg-white shadow-sm text-slate-600"
                  title="Déplacer vers le bas (+5px)"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Sliders for direct control */}
              <div className="w-full space-y-1.5">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Axe X (Horizontal)</span>
                    <span className="font-mono">{style.xOffset || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={style.xOffset || 0}
                    onChange={(e) => updateSetting("xOffset", parseInt(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Axe Y (Vertical)</span>
                    <span className="font-mono">{style.yOffset || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={style.yOffset || 0}
                    onChange={(e) => updateSetting("yOffset", parseInt(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Margins & Accent Theme config (Always visible below tabs) */}
      <div className="border-t border-slate-100 pt-4 text-left space-y-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Marges & Gabarit de document
        </span>
        <div className="grid grid-cols-2 gap-2">
          {/* Margins */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase">Marges de page</label>
            <select
              value={style.margins}
              onChange={(e) => updateSetting("margins", e.target.value as any)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
            >
              <option value="narrow">Étroites (Dense)</option>
              <option value="standard">Standard (A4)</option>
              <option value="wide">Larges (Élégant)</option>
            </select>
          </div>

          {/* Accent Themes */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase">Charte graphique</label>
            <select
              value={style.themeId}
              onChange={(e) => updateSetting("themeId", e.target.value)}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
            >
              {DOCUMENT_THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Local Save Controls */}
      <button
        onClick={handleLocalSave}
        className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm transition-all border-b border-black"
      >
        {success ? <Check size={14} className="text-green-400" /> : <Save size={14} />}
        <span>{success ? "Sauvegardé !" : "Sauvegarder le brouillon"}</span>
      </button>

      {/* Download Alert Info */}
      {downloadMsg && (
        <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-800 text-[10px] font-mono uppercase flex items-center space-x-1">
          <Check size={12} />
          <span>{downloadMsg}</span>
        </div>
      )}

      {/* Export / Download sections */}
      <div className="border-t border-slate-200 pt-4 text-left space-y-3">
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
          Actions d'exportation
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={downloadWord}
            className="py-2 px-3 border border-slate-200 rounded-sm hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-center space-x-1.5"
          >
            <FileText size={13} className="text-blue-600" />
            <span>Format Word</span>
          </button>
          <button
            onClick={downloadPDFBackend}
            className="py-2 px-3 border border-slate-200 rounded-sm hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-center space-x-1.5"
          >
            <FileText size={13} className="text-red-500" />
            <span>Format PDF</span>
          </button>
          <button
            onClick={downloadTXT}
            className="py-2 px-3 border border-slate-200 rounded-sm hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-center space-x-1.5"
          >
            <FileText size={13} className="text-slate-500" />
            <span>Format TXT</span>
          </button>
          <button
            onClick={downloadHTML}
            className="py-2 px-3 border border-slate-200 rounded-sm hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-center space-x-1.5"
          >
            <FileText size={13} className="text-blue-500" />
            <span>Format HTML</span>
          </button>
        </div>

        <button
          onClick={handlePrintPDF}
          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all border border-blue-200"
        >
          <Printer size={14} />
          <span>Imprimer ou Exporter en PDF</span>
        </button>
      </div>
    </div>
  );
}
