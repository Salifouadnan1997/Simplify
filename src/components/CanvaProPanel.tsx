import React, { useState } from "react";
import { PlusCircle, Image as ImageIcon, Search, Type, Palette, Move, Layers, Grid, Sliders, Settings } from "lucide-react";

interface CanvaProPanelProps {
  activePageIndex: number;
  selectedBlockId: string | null;
  onAddTextBox: (type: "h1" | "p" | "subtitle") => void;
  onAddShape: (shapeType: string, svgMarkup: string) => void;
  onAddImage: (base64Data: string) => void;
  onUpdateBlockStyle: (styleKey: string, styleValue: string) => void;
  selectedBlockType: "text" | "shape" | "image" | null;
}

export default function CanvaProPanel({
  activePageIndex,
  selectedBlockId,
  onAddTextBox,
  onAddShape,
  onAddImage,
  onUpdateBlockStyle,
  selectedBlockType,
}: CanvaProPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"elements" | "text" | "upload" | "style">("elements");

  // Flowchart SVG Templates
  const flowchartShapes = [
    {
      name: "Hexagone Logigramme",
      type: "hexagon-flow",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="25,10 75,10 95,50 75,90 25,90 5,50" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" /></svg>`
    },
    {
      name: "Capsule Arrondie",
      type: "capsule-flow",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><rect x="5" y="20" width="90" height="60" rx="30" ry="30" fill="#10b981" stroke="#047857" stroke-width="2" /></svg>`
    },
    {
      name: "Rectangle",
      type: "rectangle-flow",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><rect x="5" y="10" width="90" height="80" rx="6" fill="#f59e0b" stroke="#d97706" stroke-width="2" /></svg>`
    },
    {
      name: "Losange (Décision)",
      type: "diamond-flow",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="50,5 95,50 50,95 5,50" fill="#ef4444" stroke="#b91c1c" stroke-width="2" /></svg>`
    },
    {
      name: "Document Vague",
      type: "wave-card-flow",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 5,10 L 95,10 L 95,75 Q 72.5,90 50,75 Q 27.5,60 5,75 Z" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2" /></svg>`
    },
    {
      name: "Parallélogramme",
      type: "parallelogram-flow",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="25,15 95,15 75,85 5,85" fill="#ec4899" stroke="#be185d" stroke-width="2" /></svg>`
    }
  ];

  // Speech Bubbles SVG Templates
  const textBubbles = [
    {
      name: "Bulle Rectangulaire",
      type: "bubble-rect",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 10,10 L 90,10 A 8,8 0 0,1 98,18 L 98,68 A 8,8 0 0,1 90,76 L 45,76 L 25,95 L 30,76 L 10,76 A 8,8 0 0,1 2,68 L 2,18 A 8,8 0 0,1 10,10 Z" fill="#1e293b" stroke="#0f172a" stroke-width="2" /></svg>`
    },
    {
      name: "Bulle Ovale",
      type: "bubble-oval",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 50,10 C 78,10 98,25 98,45 C 98,65 78,80 50,80 C 40,80 30,92 18,97 C 22,88 22,83 18,78 C 8,72 2,60 2,45 C 2,25 22,10 50,10 Z" fill="#334155" stroke="#1e293b" stroke-width="2" /></svg>`
    },
    {
      name: "Nuage Rêve",
      type: "bubble-cloud",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 22,65 C 12,65 7,55 12,45 C 7,35 17,25 25,30 C 30,15 45,12 55,20 C 65,12 80,15 83,25 C 93,25 98,35 93,45 C 98,55 88,65 78,65 C 80,73 73,78 68,73 C 63,82 50,82 45,73 C 38,78 30,78 25,73 C 15,78 7,75 12,65 Z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" /></svg>`
    },
    {
      name: "Bulle Carrée",
      type: "bubble-square",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 5,5 L 95,5 L 95,75 L 40,75 L 20,95 L 20,75 L 5,75 Z" fill="#0284c7" stroke="#0369a1" stroke-width="2" /></svg>`
    }
  ];

  // Lines
  const lineShapes = [
    {
      name: "Ligne Continue",
      type: "line-solid",
      svg: `<svg viewBox="0 0 100 20" width="100%" height="100%" style="overflow: visible;"><line x1="2" y1="10" x2="98" y2="10" stroke="#1e293b" stroke-width="6" stroke-linecap="round" /></svg>`
    },
    {
      name: "Ligne Pointillée",
      type: "line-dashed",
      svg: `<svg viewBox="0 0 100 20" width="100%" height="100%" style="overflow: visible;"><line x1="2" y1="10" x2="98" y2="10" stroke="#1e293b" stroke-width="6" stroke-dasharray="10,10" stroke-linecap="round" /></svg>`
    },
    {
      name: "Ligne Fine Pointillée",
      type: "line-dotted",
      svg: `<svg viewBox="0 0 100 20" width="100%" height="100%" style="overflow: visible;"><line x1="2" y1="10" x2="98" y2="10" stroke="#1e293b" stroke-width="6" stroke-dasharray="2,8" stroke-linecap="round" /></svg>`
    },
    {
      name: "Flèche Directionnelle",
      type: "line-arrow",
      svg: `<svg viewBox="0 0 100 20" width="100%" height="100%" style="overflow: visible;"><line x1="2" y1="10" x2="88" y2="10" stroke="#1e293b" stroke-width="5" stroke-linecap="round" /><polygon points="84,2 98,10 84,18" fill="#1e293b" /></svg>`
    },
    {
      name: "Double Flèche",
      type: "line-double-arrow",
      svg: `<svg viewBox="0 0 100 20" width="100%" height="100%" style="overflow: visible;"><polygon points="16,2 2,10 16,18" fill="#1e293b" /><line x1="12" y1="10" x2="88" y2="10" stroke="#1e293b" stroke-width="5" /><polygon points="84,2 98,10 84,18" fill="#1e293b" /></svg>`
    }
  ];

  // Base Shapes
  const baseShapes = [
    {
      name: "Trapèze",
      type: "trapezoid",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="20,10 80,10 98,90 2,90" fill="#f43f5e" stroke="#be185d" stroke-width="2" /></svg>`
    },
    {
      name: "Bouclier",
      type: "shield",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 10,10 L 90,10 L 90,50 C 90,75 50,95 50,95 C 50,95 10,75 10,50 Z" fill="#84cc16" stroke="#4d7c0f" stroke-width="2" /></svg>`
    },
    {
      name: "Arche Ronde",
      type: "arch",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 10,90 L 10,40 A 40,40 0 0,1 90,40 L 90,90 Z" fill="#a855f7" stroke="#7e22ce" stroke-width="2" /></svg>`
    },
    {
      name: "Triangle Angle",
      type: "triangle",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="10,10 90,90 10,90" fill="#06b6d4" stroke="#0891b2" stroke-width="2" /></svg>`
    }
  ];

  // Polygons
  const polygons = [
    {
      name: "Pentagone",
      type: "pentagon",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="50,5 98,40 80,95 20,95 2,40" fill="#6366f1" stroke="#4338ca" stroke-width="2" /></svg>`
    },
    {
      name: "Hexagone Régulier",
      type: "hexagon-reg",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="50,2 93,27 93,77 50,98 7,77 7,27" fill="#14b8a6" stroke="#0f766e" stroke-width="2" /></svg>`
    },
    {
      name: "Octogone",
      type: "octagon",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="29,2 71,2 98,29 98,71 71,98 29,98 2,71 2,29" fill="#e11d48" stroke="#9f1239" stroke-width="2" /></svg>`
    }
  ];

  // Stars
  const stars = [
    {
      name: "Étoile 4 Points",
      type: "star-4",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 50,2 Q 50,50 98,50 Q 50,50 50,98 Q 50,50 2,50 Q 50,50 50,2 Z" fill="#fbbf24" stroke="#d97706" stroke-width="2" /></svg>`
    },
    {
      name: "Étoile Classique",
      type: "star-5",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><polygon points="50,2 63,37 100,37 70,59 82,97 50,74 18,97 30,59 0,37 37,37" fill="#f59e0b" stroke="#b45309" stroke-width="2" /></svg>`
    },
    {
      name: "Étoile 8 Points",
      type: "star-8",
      svg: `<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow: visible;"><path d="M 50,2 L 60,37 L 95,27 L 70,50 L 95,73 L 60,63 L 50,98 L 40,63 L 5,73 L 30,50 L 5,27 L 40,37 Z" fill="#ea580c" stroke="#c2410c" stroke-width="2" /></svg>`
    }
  ];

  // Handle local image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (base64) {
        onAddImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filter lists based on search
  const filterShapes = (list: any[]) => {
    if (!searchQuery) return list;
    return list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Décrivez votre élément idéal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner placeholder-slate-400 font-medium"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50 shrink-0">
        {[
          { id: "elements", label: "Éléments", icon: Grid },
          { id: "text", label: "Texte", icon: Type },
          { id: "upload", label: "Galerie", icon: ImageIcon },
          { id: "style", label: "Style", icon: Palette },
        ].map((sub) => {
          const Icon = sub.icon;
          const isSelected = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 flex flex-col items-center gap-1 transition-all ${
                isSelected
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              <Icon size={14} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeSubTab === "elements" && (
          <div className="space-y-6">
            {/* Flowchart Shapes */}
            {filterShapes(flowchartShapes).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Formes de logigramme</h3>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Afficher tout</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {filterShapes(flowchartShapes).map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddShape(shape.type, shape.svg)}
                      className="aspect-square bg-slate-50 hover:bg-emerald-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100 hover:border-emerald-300 transition-all group cursor-pointer"
                      title={shape.name}
                    >
                      <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center mt-1.5">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Speech Bubbles */}
            {filterShapes(textBubbles).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Bulles de texte</h3>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Afficher tout</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {filterShapes(textBubbles).map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddShape(shape.type, shape.svg)}
                      className="aspect-square bg-slate-50 hover:bg-emerald-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100 hover:border-emerald-300 transition-all group cursor-pointer"
                      title={shape.name}
                    >
                      <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center mt-1.5">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lines */}
            {filterShapes(lineShapes).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Lignes</h3>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Afficher tout</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filterShapes(lineShapes).map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddShape(shape.type, shape.svg)}
                      className="h-14 bg-slate-50 hover:bg-emerald-50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-100 hover:border-emerald-300 transition-all group cursor-pointer"
                      title={shape.name}
                    >
                      <div className="w-full h-6 flex items-center justify-center group-hover:scale-x-105 transition-transform px-2" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center mt-1">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Base Shapes */}
            {filterShapes(baseShapes).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Formes de base</h3>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Afficher tout</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {filterShapes(baseShapes).map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddShape(shape.type, shape.svg)}
                      className="aspect-square bg-slate-50 hover:bg-emerald-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100 hover:border-emerald-300 transition-all group cursor-pointer"
                      title={shape.name}
                    >
                      <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center mt-1.5">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Polygons */}
            {filterShapes(polygons).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Polygones</h3>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Afficher tout</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {filterShapes(polygons).map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddShape(shape.type, shape.svg)}
                      className="aspect-square bg-slate-50 hover:bg-emerald-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100 hover:border-emerald-300 transition-all group cursor-pointer"
                      title={shape.name}
                    >
                      <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center mt-1.5">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stars */}
            {filterShapes(stars).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Étoiles</h3>
                  <span className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer">Afficher tout</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {filterShapes(stars).map((shape, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAddShape(shape.type, shape.svg)}
                      className="aspect-square bg-slate-50 hover:bg-emerald-50 rounded-lg p-2.5 flex flex-col items-center justify-center border border-slate-100 hover:border-emerald-300 transition-all group cursor-pointer"
                      title={shape.name}
                    >
                      <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform" dangerouslySetInnerHTML={{ __html: shape.svg }} />
                      <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center mt-1.5">{shape.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "text" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Ajouter du texte libre</h3>
            
            <button
              onClick={() => onAddTextBox("h1")}
              className="w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg p-3 text-left transition-all cursor-pointer"
            >
              <h1 className="text-xl font-black text-slate-900">Ajouter un grand titre</h1>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Titre principal Canva Pro</span>
            </button>

            <button
              onClick={() => onAddTextBox("subtitle")}
              className="w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg p-3 text-left transition-all cursor-pointer"
            >
              <h2 className="text-sm font-bold text-slate-800">Ajouter un sous-titre</h2>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Sous-titre ou emphase</span>
            </button>

            <button
              onClick={() => onAddTextBox("p")}
              className="w-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg p-3 text-left transition-all cursor-pointer"
            >
              <p className="text-xs text-slate-600">Ajouter un paragraphe ou corps de texte</p>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Texte explicatif standard</span>
            </button>
          </div>
        )}

        {activeSubTab === "upload" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Importer des images</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Glissez et déposez vos images ici ou importez un fichier local pour le positionner et le fixer librement sur vos pages Canva Pro.
            </p>

            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/20 rounded-xl cursor-pointer transition-all p-4 text-center">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 text-slate-400 mb-2 group-hover:text-emerald-500" />
                <p className="text-xs text-slate-600 font-bold">Sélectionner un fichier image</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG ou SVG (Max. 5Mo)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {activeSubTab === "style" && (
          <div className="space-y-4">
            {selectedBlockId ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <Move size={14} />
                  <span className="text-xs font-bold">Élément sélectionné : Prêt à personnaliser !</span>
                </div>

                {/* Quick Styling buttons */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Palette de Couleurs directes</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Bleu Canva", color: "#3b82f6" },
                      { name: "Vert Menthe", color: "#10b981" },
                      { name: "Orange vif", color: "#f97316" },
                      { name: "Rouge Rubis", color: "#ef4444" },
                      { name: "Violet Royal", color: "#8b5cf6" },
                      { name: "Jaune Soleil", color: "#eab308" },
                      { name: "Ardoise Foncé", color: "#1e293b" },
                      { name: "Blanc pur", color: "#ffffff" },
                      { name: "Gris Clair", color: "#f1f5f9" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => onUpdateBlockStyle("color", c.color)}
                        className="w-7 h-7 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-110 relative group flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      >
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Border Color */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Couleur de Bordure</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Bleu foncé", color: "#1d4ed8" },
                      { name: "Vert foncé", color: "#047857" },
                      { name: "Rouge foncé", color: "#b91c1c" },
                      { name: "Orange foncé", color: "#c2410c" },
                      { name: "Ardoise", color: "#0f172a" },
                      { name: "Transparente", color: "transparent" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => onUpdateBlockStyle("border-color", c.color)}
                        className="w-7 h-7 rounded border shadow-sm transition-transform hover:scale-110 flex items-center justify-center relative group cursor-pointer"
                        style={{ border: `3px solid ${c.color === "transparent" ? "#cbd5e1" : c.color}`, backgroundColor: "white" }}
                        title={c.name}
                      >
                        {c.color === "transparent" && <span className="text-[8px] text-slate-400 font-bold">Sans</span>}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography controls */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Format de Texte</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => onUpdateBlockStyle("bold", "")} className="flex-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded transition-colors cursor-pointer">Gras</button>
                    <button onClick={() => onUpdateBlockStyle("italic", "")} className="flex-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 italic text-xs rounded transition-colors cursor-pointer">Italique</button>
                    <button onClick={() => onUpdateBlockStyle("underline", "")} className="flex-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 underline text-xs rounded transition-colors cursor-pointer">Souligné</button>
                  </div>
                </div>

                {/* Element Layer placement */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Position de l'élément (Calques)</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateBlockStyle("z-index-back", "")}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 rotate-180" />
                      Mettre à l'arrière
                    </button>
                    <button
                      onClick={() => onUpdateBlockStyle("z-index-front", "")}
                      className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Mettre au premier plan
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Palette className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-700">Aucun élément sélectionné</p>
                <p className="text-[10px] text-slate-400 mt-1 px-4 leading-relaxed">
                  Cliquez sur n'importe quel texte, forme ou image de votre page en mode Déplacement pour débloquer sa palette de styles Canva Pro !
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0 text-[10px] text-slate-400 font-mono text-center select-none">
        Page active: <span className="font-bold text-slate-600">#{activePageIndex + 1}</span>
      </div>
    </div>
  );
}
