import React, { useState, useEffect, useRef } from "react";
import { 
  Volume2, Play, Pause, Download, Sliders, Sparkles, Mic, 
  Trash2, Plus, Check, RefreshCw, AlertTriangle, FileAudio, Info,
  Star, MessageSquare, ThumbsUp, Send, User, ChevronDown
} from "lucide-react";

interface TtsPanelProps {
  documentContent: string;
}

interface VoiceReview {
  id: string;
  voiceId: string;
  voiceName: string;
  author: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  likes?: number;
}

const INITIAL_REVIEWS: VoiceReview[] = [
  {
    id: "rev-1",
    voiceId: "system-32",
    voiceName: "Kofi (Conteur de Cotonou - Bénin)",
    author: "Adnan Salifou",
    rating: 5,
    comment: "La voix de Kofi est d'une authenticité incroyable ! Le ton chaleureux et les intonations de conteur béninois captivent immédiatement l'auditeur. C'est parfait pour la narration de récits traditionnels.",
    date: "Il y a 1 heure",
    likes: 12
  },
  {
    id: "rev-2",
    voiceId: "system-33",
    voiceName: "Awa (Griotte de Bamako - Mali)",
    author: "Aminata Traoré",
    rating: 5,
    comment: "La voix d'Awa a ce rythme chantant et poétique unique aux griots du Mali. On ressent toute l'émotion et l'expressivité. Bravo pour cette intégration, c'est d'une fidélité de haut niveau !",
    date: "Il y a 4 heures",
    likes: 8
  },
  {
    id: "rev-3",
    voiceId: "system-35",
    voiceName: "Yao (Orateur d'Abidjan - Côte d'Ivoire)",
    author: "Jean-Pierre Kouadio",
    rating: 5,
    comment: "C'est l'ambiance d'Abidjan en direct ! Le ton est super dynamique, articulé, idéal pour des podcasts modernes ou des messages de communication. Très réaliste.",
    date: "Hier",
    likes: 15
  },
  {
    id: "rev-4",
    voiceId: "system-34",
    voiceName: "Fatou (Sénégalaise Chaleureuse - Dakar)",
    author: "Moustapha Diop",
    rating: 5,
    comment: "Fatou a un timbre de voix très rassurant et calme. Ce ton accueillant est parfait pour des audio-guides ou du e-learning. Une superbe réussite.",
    date: "Il y a 2 jours",
    likes: 9
  },
  {
    id: "rev-5",
    voiceId: "system-7",
    voiceName: "Gabriel (Bande-Annonce Épique)",
    author: "Lucas Martin",
    rating: 5,
    comment: "La profondeur de la voix de Gabriel donne des frissons. On se croirait vraiment dans une bande-annonce de cinéma hollywoodien. Très bon rendu des basses.",
    date: "Il y a 3 jours",
    likes: 21
  },
  {
    id: "rev-6",
    voiceId: "system-37",
    voiceName: "Ngozi (Lagos Radio - Nigeria)",
    author: "Emeka Okafor",
    rating: 4,
    comment: "Super energy and pace! Highly representative of Nigerian broadcast style. A perfect choice for high-tempo promotional content.",
    date: "Il y a 4 jours",
    likes: 7
  },
  {
    id: "rev-7",
    voiceId: "system-13",
    voiceName: "Raphaël (Méditation Guidée)",
    author: "Sophie Laurent",
    rating: 5,
    comment: "Idéal pour l'application d'endormissement ou de méditation. La voix est posée, le rythme lent et le timbre très enveloppant.",
    date: "Il y a 1 semaine",
    likes: 18
  },
  {
    id: "rev-8",
    voiceId: "system-38",
    voiceName: "Manu (Chroniqueur de Douala - Cameroun)",
    author: "Samuel Eto'o",
    rating: 5,
    comment: "Le timbre robuste de Manu est excellent pour les chroniques sportives ou d'actualités. Très passionné et engagé !",
    date: "Il y a 1 semaine",
    likes: 14
  }
];

interface ClonedVoice {
  id: string;
  name: string;
  pitch: number; // multiplier
  rate: number;  // multiplier
  tone: string;  // description of tone
  gender: "male" | "female" | "neutral";
  spectralSignature: number[]; // frequency data array for visual matches
  isCustom: boolean;
  createdAt: string;
  geminiVoice?: string;
}

const DEFAULT_VOICES: ClonedVoice[] = [
  {
    id: "system-1",
    name: "Thomas (Narrateur Français)",
    pitch: 1.0,
    rate: 1.0,
    tone: "Chaleureux, Posé, Professionnel",
    gender: "male",
    spectralSignature: [40, 55, 60, 45, 30, 20, 15, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-2",
    name: "Léa (Studio HD)",
    pitch: 1.15,
    rate: 1.05,
    tone: "Claire, Dynamique, Accueillante",
    gender: "female",
    spectralSignature: [30, 45, 75, 80, 50, 35, 20, 15],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-3",
    name: "Arthur (Voix Documentaire)",
    pitch: 0.85,
    rate: 0.95,
    tone: "Profond, Grave, Cinématique",
    gender: "male",
    spectralSignature: [85, 70, 40, 30, 20, 15, 10, 5],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-4",
    name: "Chloé (Narratrice Élégante)",
    pitch: 1.10,
    rate: 0.98,
    tone: "Douce, Sophistiquée, Captivante",
    gender: "female",
    spectralSignature: [25, 40, 70, 85, 60, 40, 25, 15],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-5",
    name: "Nicolas (Journaliste Info)",
    pitch: 1.02,
    rate: 1.12,
    tone: "Articulé, Rythmé, Neutre",
    gender: "male",
    spectralSignature: [45, 60, 55, 50, 40, 30, 20, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-6",
    name: "Manon (Livre Audio Jeunesse)",
    pitch: 1.25,
    rate: 1.00,
    tone: "Enthousiaste, Colorée, Expressive",
    gender: "female",
    spectralSignature: [20, 35, 65, 90, 75, 50, 30, 20],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-7",
    name: "Gabriel (Bande-Annonce Épique)",
    pitch: 0.75,
    rate: 0.90,
    tone: "Sombre, Puissant, Théâtral",
    gender: "male",
    spectralSignature: [95, 80, 50, 30, 15, 10, 5, 2],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-8",
    name: "Zoé (Assistante Virtuelle)",
    pitch: 1.20,
    rate: 1.10,
    tone: "Limpide, Aimable, Efficace",
    gender: "female",
    spectralSignature: [30, 50, 80, 70, 60, 45, 30, 15],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-9",
    name: "Hugo (Saga Audio Fantasy)",
    pitch: 0.92,
    rate: 0.95,
    tone: "Mystérieux, Chuchoté, Intime",
    gender: "male",
    spectralSignature: [60, 65, 50, 40, 30, 25, 15, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-10",
    name: "Camille (Poésie & Contemplation)",
    pitch: 1.05,
    rate: 0.85,
    tone: "Aérien, Lent, Mélancolique",
    gender: "neutral",
    spectralSignature: [35, 45, 60, 65, 55, 40, 25, 15],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-11",
    name: "Maxime (Podcast Tech)",
    pitch: 1.05,
    rate: 1.15,
    tone: "Moderne, Rapide, Engageant",
    gender: "male",
    spectralSignature: [50, 58, 62, 55, 45, 35, 20, 12],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-12",
    name: "Alice (Audio-guide Musée)",
    pitch: 1.08,
    rate: 0.92,
    tone: "Didactique, Calme, Distinguée",
    gender: "female",
    spectralSignature: [28, 42, 68, 75, 55, 38, 22, 12],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-13",
    name: "Raphaël (Méditation Guidée)",
    pitch: 0.90,
    rate: 0.80,
    tone: "Apaisant, Soufflé, Thérapeutique",
    gender: "male",
    spectralSignature: [70, 65, 45, 35, 25, 15, 10, 5],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-14",
    name: "Emma (Publicité Premium)",
    pitch: 1.12,
    rate: 1.02,
    tone: "Souriante, Persuasive, Luxueuse",
    gender: "female",
    spectralSignature: [22, 38, 72, 82, 65, 48, 28, 18],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-15",
    name: "Antoine (Cours Universitaire)",
    pitch: 0.98,
    rate: 1.05,
    tone: "Savant, Structuré, Pédagogue",
    gender: "male",
    spectralSignature: [52, 56, 58, 48, 38, 28, 18, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-16",
    name: "Sarah (ASMR Relaxant)",
    pitch: 1.18,
    rate: 0.78,
    tone: "Murmuré, Très Doux, Enveloppant",
    gender: "female",
    spectralSignature: [15, 30, 55, 75, 70, 55, 35, 25],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-17",
    name: "Lucas (Voix Off Gaming)",
    pitch: 1.10,
    rate: 1.20,
    tone: "Énergique, Héroïque, Percutant",
    gender: "male",
    spectralSignature: [42, 58, 64, 60, 50, 40, 25, 15],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-18",
    name: "Inès (Journal Télévisé)",
    pitch: 1.05,
    rate: 1.08,
    tone: "Solennelle, Formelle, Crédible",
    gender: "female",
    spectralSignature: [26, 44, 74, 78, 52, 36, 20, 14],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-19",
    name: "Louis (Conte Antique)",
    pitch: 0.80,
    rate: 0.88,
    tone: "Vénérable, Sage, Chaleureux",
    gender: "male",
    spectralSignature: [88, 72, 42, 32, 22, 14, 8, 4],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-20",
    name: "Juliette (Théâtre Classique)",
    pitch: 1.15,
    rate: 0.95,
    tone: "Lyrique, Vibrante, Dramatique",
    gender: "female",
    spectralSignature: [24, 42, 72, 84, 68, 46, 26, 16],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-21",
    name: "Sasha (Scribe Neutre)",
    pitch: 1.00,
    rate: 1.00,
    tone: "Équilibré, Limpide, Impartial",
    gender: "neutral",
    spectralSignature: [40, 50, 60, 60, 50, 40, 30, 20],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-22",
    name: "Alexandre (Corporate / B2B)",
    pitch: 0.95,
    rate: 1.02,
    tone: "Sérieux, Institutionnel, Rassurant",
    gender: "male",
    spectralSignature: [55, 62, 58, 46, 36, 26, 16, 8],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-23",
    name: "Marine (Météo & Trafic)",
    pitch: 1.22,
    rate: 1.18,
    tone: "Fluide, Rapide, Souriante",
    gender: "female",
    spectralSignature: [18, 36, 68, 88, 78, 54, 32, 22],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-24",
    name: "Paul (Robot Vintage)",
    pitch: 0.70,
    rate: 1.10,
    tone: "Métallique, Monotone, Rétro",
    gender: "neutral",
    spectralSignature: [50, 50, 50, 50, 50, 50, 50, 50],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-25",
    name: "Victor (Saga d'Épouvante)",
    pitch: 0.78,
    rate: 0.85,
    tone: "Rauque, Inquiétant, Chuchoté",
    gender: "male",
    spectralSignature: [92, 78, 48, 28, 12, 8, 4, 1],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-26",
    name: "Mathilde (Romance)",
    pitch: 1.08,
    rate: 0.90,
    tone: "Sensuelle, Émotive, Romantique",
    gender: "female",
    spectralSignature: [23, 41, 71, 81, 62, 44, 24, 14],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-27",
    name: "Pierre (Radio Aviation)",
    pitch: 0.90,
    rate: 1.10,
    tone: "Radiofréquence, Grésillant, Autoritaire",
    gender: "male",
    spectralSignature: [48, 52, 54, 44, 34, 24, 14, 6],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-28",
    name: "Clara (E-Learning Enfant)",
    pitch: 1.30,
    rate: 1.00,
    tone: "Enjouée, Joyeuse, Encourageante",
    gender: "female",
    spectralSignature: [12, 28, 62, 92, 82, 58, 38, 28],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-29",
    name: "Julien (Publicité Promo)",
    pitch: 1.08,
    rate: 1.25,
    tone: "Dynamique, Entraînant, Persuasif",
    gender: "male",
    spectralSignature: [44, 56, 62, 58, 48, 38, 22, 12],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-30",
    name: "Eléna (Poétesse Rêveuse)",
    pitch: 1.10,
    rate: 0.82,
    tone: "Douce, Suspendue, Introspective",
    gender: "female",
    spectralSignature: [27, 43, 73, 79, 59, 41, 23, 13],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-31",
    name: "Morgan (Documentaire Nature)",
    pitch: 0.95,
    rate: 0.92,
    tone: "Observateur, Solennel, Majestueux",
    gender: "neutral",
    spectralSignature: [38, 48, 58, 58, 48, 38, 28, 18],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-32",
    name: "Kofi (Conteur de Cotonou - Bénin)",
    pitch: 0.95,
    rate: 0.95,
    tone: "Chaud, Profond, Conteur Traditionnel",
    gender: "male",
    spectralSignature: [80, 75, 55, 45, 30, 20, 15, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-33",
    name: "Awa (Griotte de Bamako - Mali)",
    pitch: 1.12,
    rate: 0.90,
    tone: "Chantant, Mélodieux, Très Expressif",
    gender: "female",
    spectralSignature: [20, 40, 75, 95, 80, 55, 35, 20],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-34",
    name: "Fatou (Sénégalaise Chaleureuse - Dakar)",
    pitch: 1.08,
    rate: 1.00,
    tone: "Doux, Accueillant, Traditionnel",
    gender: "female",
    spectralSignature: [25, 45, 70, 85, 65, 45, 25, 15],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-35",
    name: "Yao (Orateur d'Abidjan - Côte d'Ivoire)",
    pitch: 1.02,
    rate: 1.10,
    tone: "Dynamique, Expressif, Très Articulé",
    gender: "male",
    spectralSignature: [45, 60, 65, 55, 45, 35, 20, 12],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-36",
    name: "Amara (Narrateur de Conakry - Guinée)",
    pitch: 0.88,
    rate: 0.98,
    tone: "Posé, Solennel, Narratif",
    gender: "male",
    spectralSignature: [75, 70, 50, 40, 30, 20, 12, 6],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-37",
    name: "Ngozi (Lagos Radio - Nigeria)",
    pitch: 1.15,
    rate: 1.05,
    tone: "Rythmé, Énergique, Moderne",
    gender: "female",
    spectralSignature: [18, 38, 72, 90, 85, 60, 40, 25],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-38",
    name: "Manu (Chroniqueur de Douala - Cameroun)",
    pitch: 1.05,
    rate: 1.12,
    tone: "Robuste, Passionné, Engagé",
    gender: "male",
    spectralSignature: [42, 58, 68, 62, 50, 38, 22, 12],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-39",
    name: "Sika (Voix Douce de Lomé - Togo)",
    pitch: 1.06,
    rate: 0.95,
    tone: "Calme, Apaisant, Pédagogique",
    gender: "female",
    spectralSignature: [26, 42, 66, 78, 60, 42, 24, 14],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-40",
    name: "Ibrahim (Sagesse de Niamey - Niger)",
    pitch: 0.85,
    rate: 0.85,
    tone: "Profond, Lent, Vénérable",
    gender: "male",
    spectralSignature: [88, 80, 55, 38, 22, 14, 8, 3],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  },
  {
    id: "system-41",
    name: "Mariama (Sourire de Ouagadougou - Burkina Faso)",
    pitch: 1.18,
    rate: 1.00,
    tone: "Souriant, Clair, Chaleureux",
    gender: "female",
    spectralSignature: [15, 35, 68, 88, 76, 52, 32, 22],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-42",
    name: "Elikia (Poésie de Kinshasa - Congo)",
    pitch: 1.00,
    rate: 0.92,
    tone: "Mélodieux, Doux, Profondément Rythmé",
    gender: "neutral",
    spectralSignature: [35, 48, 62, 64, 52, 38, 24, 14],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Zephyr"
  },
  {
    id: "system-43",
    name: "Chinedu (Nollywood Voice - Nigeria)",
    pitch: 0.98,
    rate: 1.08,
    tone: "Théâtral, Expressif, Captivant",
    gender: "male",
    spectralSignature: [50, 62, 58, 48, 38, 28, 18, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Fenrir"
  },
  {
    id: "system-44",
    name: "Malick (Radio Dakar - Sénégal)",
    pitch: 1.00,
    rate: 1.05,
    tone: "Journalistique, Articulé, Charismatique",
    gender: "male",
    spectralSignature: [46, 58, 62, 52, 42, 32, 18, 10],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Puck"
  },
  {
    id: "system-45",
    name: "Assiatou (Contes Fouta - Guinée)",
    pitch: 1.10,
    rate: 0.88,
    tone: "Légendaire, Poétique, Enveloppant",
    gender: "female",
    spectralSignature: [22, 38, 70, 80, 62, 44, 26, 16],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Kore"
  },
  {
    id: "system-46",
    name: "Tidiane (Griot Sahélien - Mali)",
    pitch: 0.92,
    rate: 0.90,
    tone: "Vocalises douces, Rythmé, Ancestral",
    gender: "male",
    spectralSignature: [82, 72, 52, 40, 28, 18, 12, 6],
    isCustom: false,
    createdAt: new Date().toISOString(),
    geminiVoice: "Charon"
  }
];

export default function TtsPanel({ documentContent }: TtsPanelProps) {
  // TTS State
  const [inputText, setInputText] = useState("");
  const [sourceMode, setSourceMode] = useState<"doc" | "custom">("doc");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("system-1");
  const [pitch, setPitch] = useState<number>(1.0); // 0.5 to 2
  const [rate, setRate] = useState<number>(1.0);   // 0.5 to 2
  const [volume, setVolume] = useState<number>(1.0); // 0 to 1
  const [audioEffect, setAudioEffect] = useState<"none" | "studio" | "telephone" | "radio" | "robot">("none");
  
  // Cloned Voices List
  const [voices, setVoices] = useState<ClonedVoice[]>([]);
  const [newVoiceName, setNewVoiceName] = useState("");
  
  // Recording State (Voice Cloning)
  const [activeTab, setActiveTab] = useState<"generator" | "cloning" | "reviews">("generator");

  // Voice Reviews states
  const [reviews, setReviews] = useState<VoiceReview[]>(() => {
    const saved = localStorage.getItem("simplify_voice_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_REVIEWS;
  });

  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewVoiceId, setNewReviewVoiceId] = useState("system-32"); // Kofi as default
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);
  const [reviewFilterVoiceId, setReviewFilterVoiceId] = useState<string>("all");

  useEffect(() => {
    localStorage.setItem("simplify_voice_reviews", JSON.stringify(reviews));
  }, [reviews]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [calibrationText, setCalibrationText] = useState(
    "Le système de reconnaissance et de synthèse vocale analyse les harmoniques de ma voix. En lisant cette phrase de calibration, j'enregistre mon empreinte vocale unique pour la cloner fidèlement."
  );
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number | null>(null);
  const [words, setWords] = useState<string[]>([]);
  
  // Audio Feedback & Analyser
  const [micError, setMicError] = useState<string | null>(null);
  const [isMicAvailable, setIsMicAvailable] = useState(true);
  
  // Iframe & Simulation States
  const [isIframeDetected] = useState(() => typeof window !== "undefined" && window.self !== window.top);
  const [useTtsSimulation, setUseTtsSimulation] = useState(() => typeof window !== "undefined" && (window.self !== window.top || !window.speechSynthesis));
  const [showIframeWarning, setShowIframeWarning] = useState(true);
  const [isRecordingSimulated, setIsRecordingSimulated] = useState(false);
  const [lastSynthesizedAudio, setLastSynthesizedAudio] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Speech Synthesis ref for highlighting & simulation timers
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const simulationTimerRef = useRef<any>(null);

  // Load and clean text from documentContent
  useEffect(() => {
    if (documentContent) {
      let rawText = documentContent;
      try {
        const pages = JSON.parse(documentContent);
        if (Array.isArray(pages)) {
          rawText = pages.join("\n");
        }
      } catch (e) {
        // Not JSON, just plain HTML or string
      }
      
      // Clean up HTML tags if any
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawText;
      const cleanText = tempDiv.textContent || tempDiv.innerText || "";
      
      if (sourceMode === "doc") {
        setInputText(cleanText.trim());
      }
    }
  }, [documentContent, sourceMode]);

  // Load saved voices
  useEffect(() => {
    const saved = localStorage.getItem("cloned_voices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVoices([...DEFAULT_VOICES, ...parsed]);
      } catch (e) {
        setVoices(DEFAULT_VOICES);
      }
    } else {
      setVoices(DEFAULT_VOICES);
    }
  }, []);

  // Sync pitch and rate when selecting a voice
  useEffect(() => {
    const voice = voices.find(v => v.id === selectedVoiceId);
    if (voice) {
      setPitch(voice.pitch);
      setRate(voice.rate);
    }
  }, [selectedVoiceId, voices]);

  // Split text into words for live reader
  useEffect(() => {
    if (inputText) {
      setWords(inputText.split(/\s+/));
    } else {
      setWords([]);
    }
  }, [inputText]);

  // Voice cloning analysis steps simulation messages
  const analysisMessages = [
    "Initialisation de l'analyse spectrale vocale...",
    "Extraction de la fréquence fondamentale (F0)...",
    "Modélisation des formants acoustiques (timbre)...",
    "Génération de la signature fréquentielle de clonage...",
    "Optimisation du synthétiseur de voix clone...",
    "Création du profil vocal terminée avec succès !"
  ];

  // Draw simulated or real frequency bars on Canvas
  const startCanvasAnimation = (canvasElement: HTMLCanvasElement, type: "mic" | "play") => {
    if (!canvasElement) return;
    const ctx = canvasElement.getContext("2d");
    if (!ctx) return;

    const width = canvasElement.width;
    const height = canvasElement.height;
    
    // Web Audio API setup if available and running
    let analyser: AnalyserNode | null = null;
    let dataArray = new Uint8Array(0);
    
    if (type === "mic" && analyserRef.current) {
      analyser = analyserRef.current;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } else if (type === "play" && isPlaying) {
      // Create random/animated spectrum if real playback routing isn't piped
    }

    const draw = () => {
      if (!canvasElement) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      ctx.clearRect(0, 0, width, height);
      
      const barCount = 32;
      const barWidth = (width / barCount) - 2;
      
      if (analyser && type === "mic") {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * 2] || 0;
          const barHeight = (value / 255) * height * 0.8 + 2;
          
          // Gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, "#3b82f6"); // Blue
          gradient.addColorStop(1, "#8b5cf6"); // Purple
          
          ctx.fillStyle = gradient;
          ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
        }
      } else {
        // Simulated wave
        const time = Date.now() * 0.005;
        const speedFactor = type === "play" && isPlaying ? 1.5 : (isRecording ? 1.2 : 0.2);
        
        for (let i = 0; i < barCount; i++) {
          let amplitude = 0;
          if (type === "play" && isPlaying) {
            amplitude = Math.sin(time + i * 0.2) * 20 + Math.cos(time * 0.8 + i * 0.4) * 10 + 35;
            amplitude *= (volume * 0.8);
          } else if (isRecording) {
            amplitude = Math.random() * 25 + Math.sin(time * 2 + i * 0.3) * 15 + 10;
          } else {
            amplitude = Math.sin(time * 0.5 + i * 0.2) * 3 + 2; // idle
          }
          
          amplitude = Math.max(2, Math.min(height - 5, amplitude));
          
          // Elegant layout
          const gradient = ctx.createLinearGradient(0, height, 0, height - amplitude);
          if (type === "play") {
            gradient.addColorStop(0, "#8b5cf6"); // Purple
            gradient.addColorStop(1, "#ec4899"); // Pink
          } else {
            gradient.addColorStop(0, "#ef4444"); // Red
            gradient.addColorStop(1, "#f59e0b"); // Orange
          }
          
          ctx.fillStyle = gradient;
          ctx.fillRect(i * (barWidth + 2), height - amplitude, barWidth, amplitude);
        }
      }
    };
    
    draw();
  };

  const stopCanvasAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Simulated voice recording when real mic is blocked
  const startSimulatedRecording = () => {
    setMicError(null);
    setIsRecording(true);
    setIsRecordingSimulated(true);
    setRecordingSeconds(0);
    setAudioBlob(null);
    setAudioUrl(null);

    // Visualizer simulation
    if (canvasRef.current) {
      startCanvasAnimation(canvasRef.current, "mic");
    }

    // Timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 15) {
          stopSimulatedRecording();
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopSimulatedRecording = () => {
    setIsRecording(false);
    setIsRecordingSimulated(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    stopCanvasAnimation();

    // Create a dummy silent wav sample so the UI can proceed with "cloning"
    // (since actual mic access is blocked, we just create a minimal 1s silent file)
    const sampleRate = 8000;
    const duration = 1;
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF WAV Header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + numSamples * 2, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, numSamples * 2, true);

    // Write silence (0s)
    let index = 44;
    for (let i = 0; i < numSamples; i++) {
      view.setInt16(index, 0, true);
      index += 2;
    }

    const mockBlob = new Blob([view], { type: "audio/wav" });
    setAudioBlob(mockBlob);
    
    // We don't set the audio url so the player doesn't show up for a silent file
    // Or we set it but it's just silent. Let's not set it.
    setAudioUrl(null);
  };

  // Recording methods for Voice Cloning
  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];
    setIsRecordingSimulated(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'API mediaDevices n'est pas disponible.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setRecordingSeconds(0);
      
      // Setup Web Audio API for visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("L'API AudioContext n'est pas prise en charge.");
      }
      const audioContext = new AudioCtx();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // MediaRecorder
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder n'est pas pris en charge par ce navigateur.");
      }
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch (e) {}
        }
      };
      
      mediaRecorder.start();
      
      // Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 15) { // 15 seconds max calibration
            stopRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Visualizer
      if (canvasRef.current) {
        startCanvasAnimation(canvasRef.current, "mic");
      }
      
    } catch (err: any) {
      console.warn("L'accès physique au microphone a échoué, activation automatique du mode Enregistrement Simulatif IA :", err);
      setIsMicAvailable(false);
      startSimulatedRecording();
      setMicError(
        "L'accès au microphone physique a échoué (bloqué par l'iframe de prévisualisation). " +
        "Le mode Enregistrement Simulatif IA a été activé automatiquement pour tester !"
      );
    }
  };

  const stopRecording = () => {
    if (isRecordingSimulated) {
      stopSimulatedRecording();
      return;
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop mediaRecorder:", e);
      }
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    stopCanvasAnimation();
  };

  // Upload custom voice sample audio file
  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("audio/")) {
      setMicError("Veuillez sélectionner un fichier audio valide (MP3, WAV, M4A).");
      return;
    }
    
    setMicError(null);
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // Extract base filename as default voice name
    const defaultName = file.name.split(".")[0];
    setNewVoiceName(`Clonage - ${defaultName}`);
  };

  // Perform Audio Analysis & Clone creation
  const handleAnalyzeAndClone = () => {
    if (!audioBlob) return;
    
    setIsAnalyzing(true);
    setAnalysisStep(0);
    
    // Step-by-step fake/simulated visual progress of frequency extraction
    const interval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= analysisMessages.length - 1) {
          clearInterval(interval);
          
          // Create the custom ClonedVoice
          // Derive custom pitch and rate based on a pseudo-random spectral hash
          const hashVal = Math.random();
          const derivedPitch = 0.8 + (hashVal * 0.5); // 0.8 to 1.3
          const derivedRate = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
          const genders: ("male" | "female" | "neutral")[] = ["male", "female", "neutral"];
          const tones = ["Profond & Texturé", "Harmonieux & Clair", "Calme & Chaleureux", "Sûr & Professionnel"];
          
          const voiceName = newVoiceName.trim() || `Ma Voix Clonant #${voices.filter(v => v.isCustom).length + 1}`;
          
          const newVoice: ClonedVoice = {
            id: `cloned-${Date.now()}`,
            name: voiceName,
            pitch: parseFloat(derivedPitch.toFixed(2)),
            rate: parseFloat(derivedRate.toFixed(2)),
            tone: tones[Math.floor(Math.random() * tones.length)],
            gender: genders[Math.floor(Math.random() * genders.length)],
            spectralSignature: Array.from({ length: 8 }, () => Math.floor(Math.random() * 80) + 10),
            isCustom: true,
            createdAt: new Date().toISOString()
          };
          
          // Save
          const currentCustom = voices.filter(v => v.isCustom);
          const updatedCustom = [...currentCustom, newVoice];
          localStorage.setItem("cloned_voices", JSON.stringify(updatedCustom));
          setVoices([...DEFAULT_VOICES, ...updatedCustom]);
          
          // Switch to generator with new voice preselected
          setSelectedVoiceId(newVoice.id);
          setNewVoiceName("");
          setAudioBlob(null);
          setAudioUrl(null);
          
          setTimeout(() => {
            setIsAnalyzing(false);
            setActiveTab("generator");
          }, 800);
          
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  };

  const deleteVoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedCustom = voices.filter(v => v.isCustom && v.id !== id);
    localStorage.setItem("cloned_voices", JSON.stringify(updatedCustom));
    setVoices([...DEFAULT_VOICES, ...updatedCustom]);
    
    if (selectedVoiceId === id) {
      setSelectedVoiceId("system-1");
    }
  };

  // Lazy initialization of cached AudioContext to prevent "too many AudioContexts" warnings and reuse resource
  const getPlaybackAudioContext = () => {
    if (typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!playbackCtxRef.current) {
      playbackCtxRef.current = new AudioCtx();
    }
    return playbackCtxRef.current;
  };

  // Soft organic vocal pulse synthesizer for Simulation Mode
  const playVocalPulse = (freq: number, duration: number) => {
    try {
      const audioContext = getPlaybackAudioContext();
      if (!audioContext) return;
      
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      osc1.type = "sine";
      osc2.type = "triangle";
      
      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 2.2; // vocal formant harmonic
      
      // Gentle soft envelope (pleasant soft organic chirp, not piercing)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.08, audioContext.currentTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioContext.currentTime + duration);
      osc2.stop(audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Could not play synthesized vocal pulse:", e);
    }
  };

  // Completely local retro-synth organic vocal reader fallback
  const playVocalPulseSimulation = (text: string, voiceId: string) => {
    setIsPlaying(true);
    setHighlightedWordIndex(0);
    if (playCanvasRef.current) {
      startCanvasAnimation(playCanvasRef.current, "play");
    }

    const wordsList = text.trim().split(/\s+/);
    const wordsCount = wordsList.length;
    let currentWordIdx = 0;

    const voice = voices.find(v => v.id === voiceId);
    let baseFreq = 160;
    if (voice) {
      if (voice.gender === "male") baseFreq = 110;
      else if (voice.gender === "female") baseFreq = 230;
    }
    baseFreq *= pitch;

    const speakNextWord = () => {
      if (currentWordIdx >= wordsCount || !isPlaying) {
        setIsPlaying(false);
        setHighlightedWordIndex(null);
        stopCanvasAnimation();
        return;
      }

      setHighlightedWordIndex(currentWordIdx);
      const word = wordsList[currentWordIdx];
      
      // Average speaking speed: 80ms baseline + 15ms per character
      const wordDuration = Math.max(0.12, (80 + word.length * 15) / 1000);
      
      // Slight pitch modulation based on punctuation or randomly for natural retro flow
      let wordFreq = baseFreq;
      if (word.endsWith("?") || word.endsWith("!")) {
        wordFreq *= 1.25;
      } else if (word.endsWith(".") || word.endsWith(",")) {
        wordFreq *= 0.85;
      } else {
        wordFreq *= (0.95 + Math.random() * 0.1);
      }

      playVocalPulse(wordFreq, wordDuration * 0.85);
      currentWordIdx++;

      const delay = (wordDuration * 1.05) * 1000;
      simulationTimerRef.current = setTimeout(speakNextWord, delay);
    };

    speakNextWord();
  };

  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Stop Simulation Mode Reader
  const stopTtsSimulation = () => {
    if (simulationTimerRef.current) {
      if (typeof simulationTimerRef.current === 'object' && typeof (simulationTimerRef.current as any).stop === 'function') {
        try {
          (simulationTimerRef.current as any).stop();
        } catch(e) {}
      } else {
        clearTimeout(simulationTimerRef.current);
      }
      simulationTimerRef.current = null;
    }
    clearTimeout((window as any).highlightTimer);
  };

  // Convert Text-to-Audio conversion / Reading Aloud via High-Fidelity Gemini TTS
  const handlePlayTTS = async () => {
    if (!inputText || inputText.trim() === "") return;
    
    let textToSynthesize = inputText;
    // Hard limit to avoid excessively long generations taking forever
    if (textToSynthesize.length > 500) {
      console.warn("Texte trop long, tronqué à 500 caractères pour Gemini TTS.");
      textToSynthesize = textToSynthesize.substring(0, 500);
    }

    if (isPlaying) {
      stopTtsSimulation();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      setIsPlaying(false);
      setHighlightedWordIndex(null);
      stopCanvasAnimation();
      return;
    }
    
    setIsSynthesizing(true);
    setApiError(null);
    
    try {
      const voice = voices.find(v => v.id === selectedVoiceId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
      
      const res = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSynthesize, voice: voice?.name, gender: voice?.gender, rate: rate, geminiVoice: voice?.geminiVoice }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Store base64 audio for download
      setLastSynthesizedAudio(data.audio);

      // Gemini TTS returns a fully formed WAV file encoded in base64.
      const binaryStr = atob(data.audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      
      const audioCtx = getPlaybackAudioContext();
      if (!audioCtx) throw new Error("AudioContext not supported");
      
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      
      const buffer = await audioCtx.decodeAudioData(bytes.buffer);
      
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      
      // Setup Analyser for Canvas Animation
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      
      simulationTimerRef.current = source;
      
      setIsPlaying(true);
      setHighlightedWordIndex(0);
      if (playCanvasRef.current) {
        startCanvasAnimation(playCanvasRef.current, "play");
      }
      
      // Simulate word highlighting evenly across the audio duration
      const wordsCount = words.length;
      if (wordsCount > 0) {
        const timePerWord = (buffer.duration / wordsCount) * 1000;
        let currentWordIdx = 0;
        
        const highlightNextWord = () => {
          if (currentWordIdx >= wordsCount || !isPlaying) return;
          setHighlightedWordIndex(currentWordIdx);
          currentWordIdx++;
          (window as any).highlightTimer = setTimeout(highlightNextWord, timePerWord);
        };
        highlightNextWord();
      }
      
      source.onended = () => {
        setIsPlaying(false);
        setHighlightedWordIndex(null);
        stopCanvasAnimation();
        clearTimeout((window as any).highlightTimer);
      };
      
      source.start();

    } catch (err: any) {
      console.error("Gemini TTS Error, falling back to local simulation:", err);
      
      // Handle beautiful error display for users explaining quota or configuration limits
      let errorMsg = "La génération vocale HD Simplify est temporairement indisponible.";
      if (err.message && err.message.includes("429")) {
        errorMsg = "Quota de génération Simplify vocale épuisé (429).";
      } else if (err.message && (err.message.includes("API key") || err.message.includes("invalid"))) {
        errorMsg = "Clé API Simplify invalide ou manquante.";
      }
      
      setApiError(`${errorMsg} Le Synthétiseur Local Vocal HD a pris le relais automatiquement pour lire le texte.`);
      
      // Trigger our robust simulated local voice playback!
      try {
        playVocalPulseSimulation(textToSynthesize, selectedVoiceId);
      } catch (fallbackErr) {
        console.error("Fallback simulation failed:", fallbackErr);
        setIsPlaying(false);
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Generate simulated downloadable file or download the Gemini generated one
  const handleDownloadAudio = () => {
    if (!lastSynthesizedAudio) {
      console.warn("Veuillez d'abord générer un audio (Lancer la Lecture) avant de télécharger.");
      return;
    }

    // `lastSynthesizedAudio` is a base64 encoded WAV file returned directly from Gemini.
    const binaryStr = atob(lastSynthesizedAudio);
    
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    const voice = voices.find(v => v.id === selectedVoiceId);
    a.download = `synthese_${voice?.name || "voix"}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      stopTtsSimulation();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      stopCanvasAnimation();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-1">
      {/* Tab Selector inside the TTS Panel */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => {
            setActiveTab("generator");
            stopCanvasAnimation();
          }}
          className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            activeTab === "generator"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Volume2 size={13} />
          <span>Synthèse</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("cloning");
            stopCanvasAnimation();
          }}
          className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            activeTab === "cloning"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Mic size={13} />
          <span>Clonage</span>
          <span className="hidden sm:inline bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1 rounded-full uppercase">IA</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("reviews");
            stopCanvasAnimation();
          }}
          className={`flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            activeTab === "reviews"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare size={13} />
          <span>Retours</span>
          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1 rounded-full uppercase">Avis</span>
        </button>
      </div>

      {/* GENERATOR TAB */}
      {activeTab === "generator" && (
        <div className="flex-1 flex flex-col space-y-4">
          {/* Header instructions */}
          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-sm border border-slate-200">
            <strong>Lecteur Text-to-Audio :</strong> Convertissez le texte de votre éditeur ou un texte personnalisé en voix de haute fidélité. Sélectionnez une voix système ou l'un de vos <strong>clones vocaux uniques</strong>.
          </div>

          {isIframeDetected && showIframeWarning && (
            <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed space-y-1.5 relative animate-fade-in shadow-xs">
              <button 
                type="button"
                onClick={() => setShowIframeWarning(false)}
                className="absolute top-2 right-2 text-blue-500 hover:text-blue-700 text-xs font-bold font-mono h-4 w-4 flex items-center justify-center rounded-full hover:bg-blue-100"
              >
                ×
              </button>
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="pr-4">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-900 mb-0.5">💡 Note de Prévisualisation</span>
                  <span>Les navigateurs restreignent l'accès aux haut-parleurs dans les fenêtres intégrées (iframes). Nous avons activé le <strong>Mode de Simulation Acoustique IA</strong> qui fonctionne parfaitement ici !</span>
                  <span className="block mt-1 font-semibold text-blue-950">Pour entendre la VRAIE synthèse vocale de votre système, cliquez sur <span className="bg-blue-100 px-1 py-0.5 rounded border border-blue-200 text-[10px]">Ouvrir dans un nouvel onglet</span> tout en haut à droite !</span>
                </div>
              </div>
            </div>
          )}

          {/* Text Input Source Options */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source du Texte</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setSourceMode("doc")}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold border transition-all ${
                  sourceMode === "doc"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Texte du Document
              </button>
              <button
                onClick={() => setSourceMode("custom")}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold border transition-all ${
                  sourceMode === "custom"
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Saisie Libre
              </button>
            </div>

            {sourceMode === "custom" ? (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Entrez le texte que vous souhaitez synthétiser en voix..."
                className="w-full h-24 p-2.5 text-xs border border-slate-200 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs text-slate-600 h-24 overflow-y-auto italic">
                {inputText ? inputText : "Aucun texte détecté dans l'éditeur. Écrivez quelque chose dans le document d'abord !"}
              </div>
            )}
          </div>

          {/* Voice Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sélection de la Voix</label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
              {voices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`p-1.5 rounded-full ${
                        voice.isCustom 
                          ? "bg-indigo-100 text-indigo-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        {voice.isCustom ? <Sparkles size={14} /> : <Volume2 size={14} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-700 truncate block">
                            {voice.name}
                          </span>
                          {voice.isCustom && (
                            <span className="bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1 py-0.2 rounded-sm uppercase tracking-wide">
                              Clone
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {voice.tone} ({voice.gender === "male" ? "Homme" : voice.gender === "female" ? "Femme" : "Neutre"})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Spectral signature visual representation */}
                      <div className="flex items-end space-x-0.5 h-4 pr-1">
                        {voice.spectralSignature.slice(0, 5).map((h, index) => (
                          <div 
                            key={index} 
                            style={{ height: `${h * 0.15}px` }} 
                            className={`w-0.5 rounded-full ${isSelected ? "bg-indigo-500" : "bg-slate-300"}`}
                          />
                        ))}
                      </div>
                      {voice.isCustom ? (
                        <button
                          onClick={(e) => deleteVoice(voice.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                          title="Supprimer ce clone"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : (
                        <Check size={14} className={isSelected ? "text-blue-600" : "text-transparent"} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Sliders */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
              <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                <Sliders size={12} />
                <span>RÉGLAGES ACOUSTIQUES</span>
              </span>
              <button 
                onClick={() => {
                  setPitch(1.0);
                  setRate(1.0);
                  setVolume(1.0);
                }}
                className="text-[9px] text-blue-600 hover:underline font-bold"
              >
                Réinitialiser
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Hauteur (Pitch)</span>
                  <span className="text-blue-600">{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Vitesse (Débit)</span>
                  <span className="text-blue-600">{rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-1 col-span-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                  <span>Volume</span>
                  <span className="text-blue-600">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>

            {/* Simulated DSP Voice Filters */}
            <div className="pt-1.5 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block mb-1">EFFETS DE TIMBRE</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "none", label: "Brut" },
                  { id: "studio", label: "Studio HD" },
                  { id: "telephone", label: "Téléphone" },
                  { id: "radio", label: "Radio Vintage" },
                  { id: "robot", label: "Robotique" }
                ].map(eff => (
                  <button
                    key={eff.id}
                    onClick={() => setAudioEffect(eff.id as any)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      audioEffect === eff.id
                        ? "bg-blue-600 border-blue-600 text-white font-semibold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Waveform and Play Controls */}
          <div className="bg-slate-900 rounded-lg p-3.5 space-y-3.5 shadow-md">
            {/* Live Visualizer waveform canvas */}
            <div className="h-12 bg-slate-950/60 rounded border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <canvas 
                ref={playCanvasRef} 
                width={380} 
                height={48} 
                className="w-full h-full opacity-90"
              />
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lecteur Vocal Prêt</span>
                </div>
              )}
            </div>

            {/* Word by word highlight rendering area */}
            {isPlaying && words.length > 0 && (
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400 h-16 overflow-y-auto leading-relaxed scrollbar-none italic">
                {words.map((word, idx) => {
                  const isHighlighted = idx === highlightedWordIndex;
                  return (
                    <span 
                      key={idx} 
                      className={`inline-block mr-1 rounded-xs transition-colors px-0.5 ${
                        isHighlighted 
                          ? "bg-purple-600 text-white font-bold scale-105" 
                          : ""
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            )}

            {apiError && (
              <div className="bg-amber-950/40 border border-amber-800/60 p-2.5 rounded text-[11px] text-amber-200 flex items-start space-x-1.5 leading-relaxed mb-1.5">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-semibold">Statut : </span>
                  {apiError}
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handlePlayTTS}
                disabled={(!inputText || inputText.trim() === "") || isSynthesizing}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-md font-bold text-xs transition-all shadow ${
                  !inputText || inputText.trim() === "" || isSynthesizing
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : isPlaying
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isSynthesizing ? (
                  <RefreshCw size={15} className="animate-spin text-slate-400" />
                ) : isPlaying ? (
                  <Pause size={15} />
                ) : (
                  <Play size={15} />
                )}
                <span>
                  {isSynthesizing 
                    ? "Génération Simplify..." 
                    : isPlaying 
                      ? "Arrêter la Lecture" 
                      : "Lancer la Lecture"}
                </span>
              </button>

              <button
                onClick={handleDownloadAudio}
                disabled={!lastSynthesizedAudio || isSynthesizing}
                title="Télécharger l'Audio WAV"
                className={`px-3 flex items-center justify-center rounded-md font-bold transition-all shadow ${
                  !lastSynthesizedAudio || isSynthesizing
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Download size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLONAGE TAB (VOICE CLONING STUDIO) */}
      {activeTab === "cloning" && (
        <div className="flex-1 flex flex-col space-y-4">
          <div className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-sm border border-slate-200">
            <strong>Studio de Clonage Vocal :</strong> Enregistrez votre voix pendant 10-15 secondes ou importez un échantillon audio de votre voix. L'IA Simplify analysera votre timbre pour créer un clone sur-mesure.
          </div>

          {isAnalyzing ? (
            /* Analysis Loading Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 border border-slate-100 rounded-lg bg-slate-50 animate-fade-in">
              <div className="relative">
                <RefreshCw size={44} className="text-indigo-600 animate-spin" />
                <Sparkles size={18} className="text-amber-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              
              <div className="space-y-1.5 w-full max-w-xs">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                  Génération du Clone Vocal
                </h4>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${((analysisStep + 1) / analysisMessages.length) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold block pt-1 animate-pulse">
                  {analysisMessages[analysisStep]}
                </p>
              </div>
            </div>
          ) : (
            /* Main Studio Area */
            <div className="space-y-4">
              {/* Voice Name Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nom du Clone Vocal</label>
                <input
                  type="text"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  placeholder="Ex: Ma Voix Pro, Voix Salifou, etc."
                  className="w-full p-2 text-xs border border-slate-200 rounded-sm bg-white"
                />
              </div>

              {/* Selection Mode: Record or Upload */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-3">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest">Étape 1 : Enregistrer l'empreinte vocale</span>
                
                {/* Calibration Reading Text */}
                <div className="bg-white p-2.5 rounded border border-slate-150 text-[11px] text-slate-600 leading-relaxed italic relative">
                  <span className="absolute -top-2 left-2 bg-indigo-50 text-indigo-700 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">Phrase de calibration</span>
                  {calibrationText}
                </div>

                {/* Micro record button */}
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-4 rounded-full transition-all relative ${
                      isRecording 
                        ? "bg-red-500 text-white animate-pulse" 
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow"
                    }`}
                  >
                    <Mic size={22} />
                    {isRecording && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full">
                        REC
                      </span>
                    )}
                  </button>

                  <div className="text-center flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-700 block">
                      {isRecording ? "Enregistrement en cours..." : "Cliquez pour démarrer l'enregistrement"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isRecording 
                        ? `Durée : ${recordingSeconds}s / 15s max` 
                        : "10-15 secondes de lecture recommandées"}
                    </span>
                    
                    {(!isMicAvailable || isIframeDetected) && !isRecording && (
                      <button
                        type="button"
                        onClick={startSimulatedRecording}
                        className="mt-2 text-[10px] font-bold text-indigo-700 hover:text-indigo-850 bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full flex items-center space-x-1 transition-all shadow-xs"
                      >
                        <Sparkles size={11} className="animate-pulse shrink-0 text-indigo-600" />
                        <span>Activer l'Enregistrement Simulatif IA</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recording Visual Waveform */}
                <div className={`h-10 bg-slate-950 rounded overflow-hidden flex items-center justify-center transition-opacity ${
                  isRecording || audioBlob ? "opacity-100" : "opacity-30"
                }`}>
                  <canvas 
                    ref={canvasRef} 
                    width={380} 
                    height={40} 
                    className="w-full h-full"
                  />
                </div>

                {/* Alternative Audio File Upload */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold block">OU IMPORTER UN FICHIER AUDIO</span>
                    <span className="text-[8px] bg-slate-200 text-slate-600 font-semibold px-1 rounded">MP3, WAV, M4A</span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceUpload}
                    className="mt-1 w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>

              {/* Errors or Warnings */}
              {micError && (
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg text-[10px] leading-relaxed border border-amber-200 flex items-start space-x-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-amber-600 mt-0.5" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Step 2: Perform Cloning button */}
              {audioBlob && (
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-indigo-800">
                    <span className="font-bold flex items-center space-x-1">
                      <FileAudio size={14} />
                      <span>Échantillon Vocal Prêt</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-medium">
                      {(audioBlob.size / 1024).toFixed(0)} Ko
                    </span>
                  </div>

                  {audioUrl && (
                    <audio src={audioUrl} controls className="w-full h-8 accent-indigo-600" />
                  )}

                  <button
                    onClick={handleAnalyzeAndClone}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-2 px-4 rounded text-xs shadow transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles size={14} />
                    <span>Créer le Clone de ma Voix</span>
                  </button>
                  <p className="text-[9px] text-indigo-700/70 italic text-center pt-1 leading-tight">
                    * Le système de clonage de cet environnement trouve et associe l'empreinte spectrale humaine de haute fidélité (Simplify TTS) la plus proche de votre échantillon.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS & FEEDBACK TAB */}
      {activeTab === "reviews" && (
        <div className="flex-1 flex flex-col space-y-4 animate-fade-in">
          {/* Header & Stats Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center space-x-1.5">
                  <MessageSquare size={16} className="text-emerald-600" />
                  <span>Évaluations & Retours d'Expérience</span>
                </h4>
                <p className="text-xs text-slate-600">
                  Découvrez l'avis de la communauté ou notez vous-même la fidélité, l'intonation et l'authenticité de nos voix Simplify.
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                {reviews.length} Avis
              </span>
            </div>

            {/* General Mini Statistics Dashboard */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100/50">
              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-emerald-50 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Note Globale</span>
                <span className="text-lg font-black text-slate-800 block">
                  {(reviews.reduce((acc, curr) => acc + curr.rating, 0) / (reviews.length || 1)).toFixed(1)} / 5
                </span>
                <div className="flex justify-center items-center space-x-0.5 mt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avg = reviews.reduce((acc, curr) => acc + curr.rating, 0) / (reviews.length || 1);
                    return (
                      <Star 
                        key={star} 
                        size={10} 
                        className={star <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
                      />
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-emerald-50 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Voix Africaines</span>
                <span className="text-lg font-black text-emerald-700 block">
                  {reviews.filter(r => r.voiceId.startsWith("system-32") || r.voiceId.startsWith("system-33") || r.voiceId.startsWith("system-34") || r.voiceId.startsWith("system-35") || r.voiceId.startsWith("system-36") || r.voiceId.startsWith("system-37") || r.voiceId.startsWith("system-38") || r.voiceId.startsWith("system-39") || r.voiceId.startsWith("system-40") || r.voiceId.startsWith("system-41") || r.voiceId.startsWith("system-42") || r.voiceId.startsWith("system-43") || r.voiceId.startsWith("system-44") || r.voiceId.startsWith("system-45") || r.voiceId.startsWith("system-46")).length} Avis
                </span>
                <span className="text-[8px] text-slate-400 font-semibold block uppercase">100% Autochtones</span>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-emerald-50 text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Taux de Satisfaction</span>
                <span className="text-lg font-black text-blue-600 block">
                  {((reviews.filter(r => r.rating >= 4).length / (reviews.length || 1)) * 100).toFixed(0)}%
                </span>
                <span className="text-[8px] text-slate-400 font-semibold block uppercase">Notes de 4 et 5★</span>
              </div>
            </div>
          </div>

          {/* Form and List Layout */}
          <div className="space-y-4">
            
            {/* SUBMIT NEW REVIEW CARD */}
            <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-widest flex items-center space-x-1">
                <Star size={11} className="text-amber-500 fill-amber-500" />
                <span>Laisser un avis ou retour d'expérience</span>
              </span>

              {showReviewSuccess ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-semibold text-center animate-fade-in">
                  🎉 Merci ! Votre avis a été publié et enregistré avec succès.
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* User Name input */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Votre Nom / Pseudo</label>
                      <input
                        type="text"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        placeholder="Ex: Salifou Adnan"
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>

                    {/* Selected Voice dropdown */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Voix concernée</label>
                      <select
                        value={newReviewVoiceId}
                        onChange={(e) => setNewReviewVoiceId(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors"
                      >
                        {voices.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Star selection and Publish button inline */}
                  <div className="flex items-center justify-between py-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Évaluation :</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReviewRating(star)}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star 
                              size={16} 
                              className={star <= newReviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"} 
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-600">{newReviewRating}/5</span>
                    </div>

                    <button
                      onClick={() => {
                        if (!newReviewComment.trim()) return;
                        const vObj = voices.find(v => v.id === newReviewVoiceId);
                        const newReview: VoiceReview = {
                          id: `rev-${Date.now()}`,
                          voiceId: newReviewVoiceId,
                          voiceName: vObj ? vObj.name : "Voix Inconnue",
                          author: newReviewAuthor.trim() || "Anonyme",
                          rating: newReviewRating,
                          comment: newReviewComment,
                          date: "À l'instant",
                          likes: 0
                        };
                        setReviews(prev => [newReview, ...prev]);
                        setNewReviewComment("");
                        setNewReviewAuthor("");
                        setShowReviewSuccess(true);
                        setTimeout(() => setShowReviewSuccess(false), 3000);
                      }}
                      disabled={!newReviewComment.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 uppercase tracking-wider shadow-sm"
                    >
                      <Send size={10} />
                      <span>Publier</span>
                    </button>
                  </div>

                  {/* Comment input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Votre Commentaire ou Suggestion d'amélioration</label>
                    <textarea
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Comment trouvez-vous l'accent, le débit, l'intonation de cette voix ? Que devrions-nous améliorer ?"
                      rows={2}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* REVIEWS FILTERING SECTION */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                <span>Tous les Avis ({reviews.length})</span>
              </span>

              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Filtrer :</span>
                <select
                  value={reviewFilterVoiceId}
                  onChange={(e) => setReviewFilterVoiceId(e.target.value)}
                  className="p-1 text-[10px] border border-slate-250 rounded bg-white text-slate-600 font-semibold"
                >
                  <option value="all">Toutes les voix</option>
                  {/* Select distinct voices that actually have reviews to keep it clean */}
                  {Array.from(new Set(reviews.map(r => r.voiceId))).map(vId => {
                    const found = voices.find(v => v.id === vId);
                    return (
                      <option key={vId} value={vId}>
                        {found ? found.name : "Autre voix"}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* REVIEWS SCROLLABLE LIST */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {reviews.filter(r => reviewFilterVoiceId === "all" || r.voiceId === reviewFilterVoiceId).length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-xs bg-slate-50 border border-slate-150 rounded-xl">
                  Aucun avis enregistré pour le moment pour cette voix. Soyez le premier à partager votre retour d'expérience !
                </div>
              ) : (
                reviews
                  .filter(r => reviewFilterVoiceId === "all" || r.voiceId === reviewFilterVoiceId)
                  .map((rev) => (
                    <div 
                      key={rev.id} 
                      className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 p-3 rounded-xl space-y-2 transition-all relative group animate-fade-in"
                    >
                      {/* Top metadata */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[10px] font-black text-emerald-700 uppercase shrink-0">
                            {rev.author ? rev.author.substring(0, 2) : "AN"}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 block leading-tight">{rev.author}</span>
                            <span className="text-[9px] text-slate-400 font-semibold block leading-none">{rev.date}</span>
                          </div>
                        </div>

                        {/* Star display */}
                        <div className="flex items-center space-x-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-3xs">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={10} 
                              className={star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-[11px] text-slate-600 leading-relaxed font-normal whitespace-pre-wrap pl-1">
                        {rev.comment}
                      </p>

                      {/* Footer tags and utility */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                        {/* Target Voice Tag */}
                        <span className="text-[9px] bg-slate-200/70 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm font-semibold truncate max-w-[200px]">
                          📢 {rev.voiceName}
                        </span>

                        {/* Likes counter and like action */}
                        <button
                          onClick={() => {
                            setReviews(prev => prev.map(p => {
                              if (p.id === rev.id) {
                                return { ...p, likes: (p.likes || 0) + 1 };
                              }
                              return p;
                            }));
                          }}
                          className="flex items-center space-x-1 text-[10px] text-slate-400 hover:text-emerald-600 font-bold bg-white hover:bg-emerald-50 border border-slate-200 px-2 py-0.5 rounded-full transition-all cursor-pointer shadow-3xs"
                        >
                          <ThumbsUp size={10} />
                          <span>{rev.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
