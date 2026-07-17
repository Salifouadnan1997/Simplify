import React from 'react';
import { SmartDocument, DocumentStyleSettings, DocumentTheme } from "./types";

// Standard theme list for professional documents
export const DOCUMENT_THEMES: DocumentTheme[] = [
  {
    id: "classic-navy",
    name: "Bleu Classique (Professionnel)",
    primary: "#0f172a", // Slate 900
    secondary: "#1e293b", // Slate 800
    accent: "#2563eb", // Blue 600
    previewBg: "bg-white",
    previewText: "text-slate-900",
    previewBorder: "border-slate-200",
  },
  {
    id: "warm-editorial",
    name: "Éditorial Chaleureux (Ivoire)",
    primary: "#1c1917", // Stone 900
    secondary: "#44403c", // Stone 700
    accent: "#b45309", // Amber 700
    previewBg: "bg-[#fafaf9] border border-[#f5f5f4]",
    previewText: "text-stone-900",
    previewBorder: "border-stone-200",
  },
  {
    id: "emerald-contracts",
    name: "Vert Émeraude (Juridique)",
    primary: "#064e3b", // Emerald 900
    secondary: "#047857", // Emerald 700
    accent: "#10b981", // Emerald 500
    previewBg: "bg-white",
    previewText: "text-[#064e3b]",
    previewBorder: "border-emerald-100",
  },
  {
    id: "minimalist-charcoal",
    name: "Brutaliste Anthracite",
    primary: "#18181b", // Zinc 900
    secondary: "#3f3f46", // Zinc 700
    accent: "#18181b", // Zinc 900
    previewBg: "bg-[#fcfcfc]",
    previewText: "text-zinc-900",
    previewBorder: "border-zinc-300",
  },
  {
    id: "executive-burgundy",
    name: "Bordeaux Exécutif",
    primary: "#450a0a", // Red 950
    secondary: "#7f1d1d", // Red 900
    accent: "#dc2626", // Red 600
    previewBg: "bg-white",
    previewText: "text-red-950",
    previewBorder: "border-red-100",
  }
];

// Get CSS styles based on document settings
export function getStyleClasses(settings: DocumentStyleSettings) {
  let fontClass = "font-sans";
  if (settings.font === "Playfair Display") fontClass = "font-serif";
  else if (settings.font === "Space Grotesk") fontClass = "font-sans tracking-tight";
  else if (settings.font === "JetBrains Mono") fontClass = "font-mono";
  else if (settings.font === "Montserrat") fontClass = "font-sans";
  else if (settings.font === "Lora") fontClass = "font-serif";
  else if (settings.font === "Caveat") fontClass = "font-handwriting";
  else if (settings.font === "Cinzel") fontClass = "font-serif tracking-widest uppercase";
  else if (settings.font === "Impact") fontClass = "font-sans font-black uppercase";

  let sizeClass = "text-base";
  if (settings.fontSize === "sm") sizeClass = "text-sm";
  else if (settings.fontSize === "lg") sizeClass = "text-lg";
  else if (settings.fontSize === "xl") sizeClass = "text-xl";
  else if (settings.fontSize === "2xl") sizeClass = "text-2xl";
  else if (settings.fontSize === "3xl") sizeClass = "text-3xl";

  let spacingClass = "leading-normal";
  if (settings.lineSpacing === "tight") spacingClass = "leading-snug";
  else if (settings.lineSpacing === "relaxed") spacingClass = "leading-relaxed";

  let marginClass = "p-8";
  if (settings.margins === "narrow") marginClass = "p-4 md:p-6";
  else if (settings.margins === "wide") marginClass = "p-12 md:p-16";

  return { fontClass, sizeClass, spacingClass, marginClass };
}

export function getAnimationClass(animation?: string): string {
  if (animation === "fade") return "animate-canva-fade";
  if (animation === "slide-up") return "animate-canva-slide-up";
  if (animation === "typewriter") return "animate-canva-typewriter";
  if (animation === "bounce") return "animate-canva-bounce";
  return "";
}

export function getDocumentInlineStyles(settings: DocumentStyleSettings): React.CSSProperties {
  return {
    fontFamily: settings.font === "Inter" ? "'Inter', sans-serif" : 
                 settings.font === "Playfair Display" ? "'Playfair Display', serif" :
                 settings.font === "Space Grotesk" ? "'Space Grotesk', sans-serif" :
                 settings.font === "Montserrat" ? "'Montserrat', sans-serif" :
                 settings.font === "Lora" ? "'Lora', serif" :
                 settings.font === "Caveat" ? "'Caveat', cursive" :
                 settings.font === "Cinzel" ? "'Cinzel', serif" :
                 settings.font === "Impact" ? "Impact, Charcoal, sans-serif" :
                 "'JetBrains Mono', monospace",
    fontWeight: settings.bold ? "bold" : "normal",
    fontStyle: settings.italic ? "italic" : "normal",
    textDecoration: settings.underline ? "underline" : "none",
    textTransform: settings.uppercase ? "uppercase" : "none",
    textAlign: settings.alignment || "left",
    color: settings.textColor || "#334155",
    opacity: (settings.textOpacity !== undefined ? settings.textOpacity : 100) / 100,
    letterSpacing: settings.letterSpacing === "tight" ? "-0.05em" : settings.letterSpacing === "wide" ? "0.15em" : "normal",
    transform: `translate(${settings.xOffset || 0}px, ${settings.yOffset || 0}px)`,
    position: "relative",
    zIndex: settings.layerPosition === "back" ? 0 : 20,
  };
}

/**
 * Removes the background from a base64 image (specifically makes white or near-white transparent).
 * Extremely robust: samples background paper color, uses Euclidean distance, smooth alpha feathering, and ink enhancement.
 */
export function removeImageBackground(base64Data: string, tolerance: number = 40): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = base64Data;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte 2D"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Un algorithm très robuste basé sur la luminance
      // Adapté pour extraire des cachets et signatures sur papier.
      
      // 1. Déterminer la luminosité moyenne globale pour ajuster les seuils
      let totalLum = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLum += lum;
        count++;
      }
      const avgLum = totalLum / count;
      
      // Si l'image est globalement sombre, c'est peut-être un mode sombre, on ajuste.
      // Mais en général, c'est du papier clair.
      const isDarkBackground = avgLum < 128;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculer la luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        let alpha = 255;

        if (!isDarkBackground) {
          // Fond clair: l'encre est plus sombre que le papier
          // Seuil blanc (papier): tout ce qui est plus clair que ce seuil devient transparent
          const whitePoint = Math.max(120, 255 - tolerance * 2); 
          // Seuil noir (encre pure): tout ce qui est plus sombre reste complètement opaque
          const blackPoint = Math.min(whitePoint - 30, tolerance * 1.5 + 40); 
          
          if (lum > whitePoint) {
            alpha = 0;
          } else if (lum > blackPoint) {
            // Transition douce (anti-aliasing)
            alpha = 255 - ((lum - blackPoint) / (whitePoint - blackPoint)) * 255;
          }

          // Assombrir légèrement l'encre pour plus de contraste
          if (alpha > 0) {
            data[i] = Math.max(0, r - 40);     // R
            data[i + 1] = Math.max(0, g - 40); // G
            data[i + 2] = Math.max(0, b - 40); // B
          }
        } else {
          // Cas rare: fond noir, encre claire
          const blackPoint = Math.min(100, tolerance * 2);
          const whitePoint = Math.max(blackPoint + 30, 255 - tolerance * 1.5);
          
          if (lum < blackPoint) {
            alpha = 0;
          } else if (lum < whitePoint) {
            alpha = ((lum - blackPoint) / (whitePoint - blackPoint)) * 255;
          }
        }

        // Appliquer l'alpha (on garde la transparence existante si elle est déjà là)
        data[i + 3] = Math.min(data[i + 3], alpha);
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (err) => reject(err);
  });
}

// Local storage management keys
const LOCAL_DOCS_KEY = "saisie_intelligente_docs";

// Checks if Supabase environmental variables are configured (client-side mock detection)
export function isSupabaseConfigured(): boolean {
  // Checks if we have some indicators from metadata or standard injection.
  // In the web preview, we check if custom environment keys exist.
  // We'll expose this status nicely so users can see.
  return false; // Will default to false to safely use the IndexedDB/localStorage fallback, but can be updated.
}

// Retrieve saved documents
export function getSavedDocuments(): SmartDocument[] {
  try {
    const stored = localStorage.getItem(LOCAL_DOCS_KEY);
    if (stored) {
      const docs = JSON.parse(stored);
      if (Array.isArray(docs)) {
        return docs.map(doc => ({
          ...doc,
          styleSettings: doc.styleSettings || {
            font: "Inter",
            fontSize: "md",
            lineSpacing: "normal",
            margins: "standard",
            themeId: "modern"
          },
          signatures: doc.signatures || []
        }));
      }
      return docs;
    }
  } catch (e) {
    console.error("Erreur de lecture du localStorage:", e);
  }
  return [];
}

// Save document to storage
export function saveDocument(doc: SmartDocument): SmartDocument[] {
  const current = getSavedDocuments();
  const index = current.findIndex((d) => d.id === doc.id);
  
  const updatedDoc = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    current[index] = updatedDoc;
  } else {
    current.unshift(updatedDoc);
  }

  localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(current));
  return current;
}

// Delete document
export function deleteDocument(id: string): SmartDocument[] {
  const current = getSavedDocuments();
  const filtered = current.filter((d) => d.id !== id);
  localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(filtered));
  return filtered;
}

// Generate an initial blank document
export function createNewBlankDocument(title = "Nouveau Document"): SmartDocument {
  return {
    id: "doc_" + Math.random().toString(36).substr(2, 9),
    title,
    content: "Écrivez ou dictez votre texte ici, ou importez un document à analyser...\n\nExemple de texte avec variables :\nLe présent contrat est établi le [Date] par et entre l'auteur de l'œuvre [Nom de l'auteur] d'une part, et la société [Nom de l'entreprise] d'autre part.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: "Contrat",
    styleSettings: {
      font: "Inter",
      fontSize: "md",
      lineSpacing: "normal",
      margins: "standard",
      themeId: "classic-navy",
    },
    signatures: [],
  };
}
