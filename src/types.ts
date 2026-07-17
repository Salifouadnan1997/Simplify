export interface DocumentStyleSettings {
  font: "Inter" | "Playfair Display" | "Space Grotesk" | "JetBrains Mono" | "Montserrat" | "Lora" | "Caveat" | "Cinzel" | "Impact";
  fontSize: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  lineSpacing: "tight" | "normal" | "relaxed";
  margins: "narrow" | "standard" | "wide";
  themeId: string;
  // Canva extended text personalization properties
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  alignment?: "left" | "center" | "right" | "justify";
  textColor?: string;
  textOpacity?: number; // 0 to 100
  letterSpacing?: "tight" | "normal" | "wide";
  textStyle?: "normal" | "h1" | "h2" | "h3" | "quote";
  animation?: "none" | "fade" | "slide-up" | "typewriter" | "bounce";
  layerPosition?: "front" | "back";
  xOffset?: number; // in px
  yOffset?: number; // in px
}

export interface DocumentSignature {
  id: string;
  image: string; // Base64 transparency image
  name: string;
  x: number; // Percent position or px relative to canvas
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  rotation?: number; // Rotation in degrees
  ownerName?: string;
  ownerNameFontSize?: number;
  ownerNameFontWeight?: string | number;
}

export interface SmartDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type: string; // e.g. Contrat, Lettre, Rapport, Note
  styleSettings: DocumentStyleSettings;
  signatures: DocumentSignature[];
  syncStatus?: 'synced' | 'draft';
  templateVersion?: number;
  coverImage?: string;
  coverSubtitle?: string;
  coverCompanyName?: string;
  coverDate?: string;
}

export interface DetectedField {
  name: string;
  value: string;
  confidence?: number;
}

export interface PlaceholderVariable {
  key: string;
  currentValue: string;
  category: "Identité" | "Entreprise" | "Date" | "Financier" | "Autre";
  newValue?: string;
}

export interface DocumentTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  previewBg: string;
  previewText: string;
  previewBorder: string;
}

export type SaisieTab = "dictation" | "ocr" | "handwriting" | "variables" | "formatting" | "signature" | "history" | "moneroo" | "profile" | "drive" | "assistant" | "table" | "documents" | "templates" | "summary" | "importer" | "tts";

declare global {
  interface Window {
    google: any;
  }
}
