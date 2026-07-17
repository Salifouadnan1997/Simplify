import React, { useRef, useState, useEffect } from "react";
import { PenTool, Upload, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, Trash2, Layers } from "lucide-react";
import { removeImageBackground } from "../utils";
import { UserProfile, SavedSignature, authService } from "../lib/authService";
import { SmartDocument, DocumentSignature } from "../types";

interface SignaturePanelProps {
  onSelectSignatureForStamping: (signatureBase64: string | null) => void;
  activeSignatureId: string | null;
  currentUser?: UserProfile | null;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  activeDocument?: SmartDocument;
  onUpdateSignatures?: (signatures: DocumentSignature[]) => void;
}

export default function SignaturePanel({
  onSelectSignatureForStamping,
  activeSignatureId,
  currentUser,
  onUpdateUser,
  activeDocument,
  onUpdateSignatures
}: SignaturePanelProps) {
  const [sigMode, setSigMode] = useState<"draw" | "upload">("draw");
  const [lineWidth, setLineWidth] = useState(3);
  const [inkColor, setInkColor] = useState("#000000"); // Black or blue ink
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [variantName, setVariantName] = useState("Principale");

  const [sidebarPageIdx, setSidebarPageIdx] = useState<number>(0);
  const [sidebarPlacement, setSidebarPlacement] = useState<string>("bottom-right");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Parse document content pages to get total pages
  let sidebarPages: string[] = [];
  if (activeDocument) {
    try {
      const parsed = JSON.parse(activeDocument.content);
      if (Array.isArray(parsed)) {
        sidebarPages = parsed;
      } else {
        sidebarPages = [activeDocument.content || "<p><br/></p>"];
      }
    } catch (e) {
      sidebarPages = [activeDocument.content || "<p><br/></p>"];
    }
  }

  const handleApplySignatureFromSidebar = (signatureImage: string, pageIdx: number, placement: string) => {
    if (!activeDocument || !onUpdateSignatures) return;

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

    const newSig: DocumentSignature = {
      id: `sig_${Date.now()}`,
      name: "Cachet/Signature",
      image: signatureImage,
      pageIndex: pageIdx,
      x: xPercent,
      y: yPercent,
      width: 160,
      height: 80
    };

    const currentSigs = activeDocument.signatures || [];
    onUpdateSignatures([...currentSigs, newSig]);

    // Let's also select it for stamping if they want to click again
    onSelectSignatureForStamping(signatureImage);

    // Smooth scroll to the newly signed page if not already in view
    setTimeout(() => {
      const wrapper = document.getElementById("document-wrapper");
      if (wrapper) {
        const pagesEls = wrapper.querySelectorAll("[id^='document-page-container-']");
        if (pagesEls && pagesEls[pageIdx]) {
          pagesEls[pageIdx].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }
    }, 150);
  };

  // Load sample saved signatures if any on mount
  useEffect(() => {
    if (currentUser?.savedSignatures && currentUser.savedSignatures.length > 0) {
      setSavedSignatures(currentUser.savedSignatures);
    } else {
      const defaultSignatures = localStorage.getItem("saisie_intelligente_signatures");
      if (defaultSignatures) {
        try {
          const parsed = JSON.parse(defaultSignatures);
          if (parsed.length > 0 && typeof parsed[0] === "string") {
            // Convert old format to new format
            const migrated = parsed.map((img: string, idx: number) => ({
              id: `sig_${Date.now()}_${idx}`,
              name: `Signature ${idx + 1}`,
              image: img
            }));
            setSavedSignatures(migrated);
          } else {
            setSavedSignatures(parsed);
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }, [currentUser]);

  // Initialize Canvas Drawing Handlers
  useEffect(() => {
    if (sigMode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Line qualities
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = lineWidth;
  }, [sigMode, inkColor, lineWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    e.preventDefault();
    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventCoords = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Map screen coordinates strictly back to internal canvas resolution
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Convert handwritten drawn canvas to base64 and add to palette
  const handleSaveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if canvas is completely empty first
    const base64 = canvas.toDataURL("image/png");
    saveToPalette(base64);
    clearCanvas();
  };

  // Handle uploaded signature image and automatically remove white background
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const srcBase64 = reader.result as string;
      setUploadedImage(srcBase64);
      
      // Auto-trigger background removal!
      handleRemoveBackground(srcBase64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async (base64Img: string) => {
    setIsProcessingBg(true);
    setError(null);
    try {
      // Runs our image background removal utility
      const processed = await removeImageBackground(base64Img, 45);
      
      // Automatically save it to the palette so it's fully automatic
      saveToPalette(processed);
      setUploadedImage(null); // Clear preview since it's already saved
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression de l'arrière-plan de l'image. Assurez-vous que l'image est bien éclairée sur fond clair.");
    } finally {
      setIsProcessingBg(false);
    }
  };

  const handleSaveUploadedSignature = () => {
    if (uploadedImage) {
      saveToPalette(uploadedImage);
      setUploadedImage(null);
    }
  };

  const saveToPalette = async (signatureBase64: string) => {
    const newSignature: SavedSignature = {
      id: `sig_${Date.now()}`,
      name: variantName.trim() || `Signature ${savedSignatures.length + 1}`,
      image: signatureBase64
    };
    
    const updated = [newSignature, ...savedSignatures];
    setSavedSignatures(updated);
    localStorage.setItem("saisie_intelligente_signatures", JSON.stringify(updated));
    setVariantName("Principale"); // reset name

    if (currentUser && onUpdateUser) {
      try {
        const updatedUser = await authService.updateProfile({ savedSignatures: updated });
        onUpdateUser(updatedUser);
      } catch (err) {
        console.error("Failed to save signature to profile:", err);
      }
    }
  };

  const deleteSavedSignature = async (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If active being stamped is deleted, disable stamping mode
    if (activeSignatureId === savedSignatures[indexToDelete].id) {
      onSelectSignatureForStamping(null);
    }
    
    const updated = savedSignatures.filter((_, idx) => idx !== indexToDelete);
    setSavedSignatures(updated);
    localStorage.setItem("saisie_intelligente_signatures", JSON.stringify(updated));

    if (currentUser && onUpdateUser) {
      try {
        const updatedUser = await authService.updateProfile({ savedSignatures: updated });
        onUpdateUser(updatedUser);
      } catch (err) {
        console.error("Failed to update profile after deletion:", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info */}
      <div>
        <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center">
          <PenTool className="mr-2 text-blue-600" size={16} />
          Signature Numérique & Cachet
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
          Générez une signature manuscrite à l'écran, ou importez l'image de votre cachet d'entreprise. L'arrière-plan blanc est supprimé automatiquement.
        </p>
      </div>

      {/* Signature Tab options */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-sm">
        <button
          onClick={() => setSigMode("draw")}
          className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center space-x-1.5 ${
            sigMode === "draw"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <PenTool size={13} />
          <span>Dessiner</span>
        </button>
        <button
          onClick={() => setSigMode("upload")}
          className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center space-x-1.5 ${
            sigMode === "upload"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Upload size={13} />
          <span>Importer</span>
        </button>
      </div>

      {/* Signature drawing canvas board */}
      {sigMode === "draw" && (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-sm overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              width={500}
              height={220}
              className="w-full h-[220px] block cursor-crosshair touch-none bg-slate-50/50"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Color & Ink Thickness controls */}
          <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encre:</span>
              <button
                onClick={() => setInkColor("#000000")}
                className={`w-5 h-5 rounded-full bg-black ring-2 ring-offset-2 ${
                  inkColor === "#000000" ? "ring-blue-500" : "ring-transparent"
                }`}
              />
              <button
                onClick={() => setInkColor("#0f172a")}
                className={`w-5 h-5 rounded-full bg-slate-900 ring-2 ring-offset-2 ${
                  inkColor === "#0f172a" ? "ring-blue-500" : "ring-transparent"
                }`}
              />
              <button
                onClick={() => setInkColor("#1d4ed8")}
                className={`w-5 h-5 rounded-full bg-blue-700 ring-2 ring-offset-2 ${
                  inkColor === "#1d4ed8" ? "ring-blue-500" : "ring-transparent"
                }`}
              />
            </div>

            <div className="flex items-center space-x-2 flex-1 max-w-[160px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Taille:</span>
              <input
                type="range"
                min="1"
                max="8"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="Nom de la variante (ex: Formelle, Initiale)"
              className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveDrawnSignature}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider border-b border-blue-800"
              >
                Enregistrer au catalogue
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm text-xs font-bold uppercase tracking-wider border border-slate-200"
              >
                Effacer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature / stamp image upload */}
      {sigMode === "upload" && (
        <div className="space-y-4">
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-slate-300 rounded-sm p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 hover:bg-slate-50/50 transition-all relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="p-3 bg-blue-50 text-blue-600 rounded-sm mb-3">
                <Upload size={22} />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Importer signature ou cachet</span>
              <span className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                Prenez une photo sur feuille blanche. PNG, JPG supportés.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-sm flex items-center justify-center min-h-[140px] relative">
                {isProcessingBg ? (
                  <div className="flex flex-col items-center space-y-2">
                    <RefreshCw className="animate-spin text-blue-600" size={24} />
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Détourage transparent en cours...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Signature traitée"
                      className="max-h-[120px] object-contain select-none"
                    />
                    <div className="absolute -top-3.5 -right-3.5 bg-blue-600 text-white p-1 rounded-full text-xs shadow" title="Arrière-plan supprimé">
                      <Sparkles size={11} />
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start p-3 bg-red-50 border border-red-200 text-red-800 rounded-sm text-xs space-x-2">
                  <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Nom de la variante (ex: Cachet Entreprise)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveUploadedSignature}
                    disabled={isProcessingBg}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider disabled:bg-blue-400 border-b border-blue-800"
                  >
                    Enregistrer ce cachet
                  </button>
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm text-xs font-bold uppercase tracking-wider border border-slate-200"
                  >
                    Remplacer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature Palette (Cliquer pour tamponner) */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block text-left">
          Catalogue de Signatures ({savedSignatures.length})
        </span>

        {savedSignatures.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto p-1">
            {savedSignatures.map((sig, idx) => (
              <div
                key={sig.id || idx}
                onClick={() => onSelectSignatureForStamping(activeSignatureId === sig.image ? null : sig.image)}
                className={`relative group border-2 p-3 rounded-sm flex flex-col items-center justify-center bg-white min-h-[90px] cursor-pointer transition-all ${
                  activeSignatureId === sig.image
                    ? "border-blue-500 bg-blue-50/10 shadow-sm scale-[0.99]"
                    : "border-slate-200 hover:border-slate-400 hover:shadow-sm"
                }`}
              >
                {/* Active indicator badge */}
                {activeSignatureId === sig.image && (
                  <span className="absolute top-1.5 right-1.5 text-blue-600 bg-blue-50 p-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                  </span>
                )}

                <img src={sig.image} alt={sig.name} className="max-h-[60px] object-contain mb-2" />
                <span className="text-[10px] font-semibold text-slate-600">{sig.name}</span>

                {/* Delete button on hover */}
                <button
                  onClick={(e) => deleteSavedSignature(idx, e)}
                  className="absolute bottom-1.5 right-1.5 p-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Supprimer la signature"
                >
                  <Trash2 size={11} />
                </button>

                {/* Stamping utility helper badge */}
                <span className="absolute top-1 left-1.5 text-[8px] text-slate-400 font-mono uppercase font-bold">
                  {activeSignatureId === sig.image ? "Actif" : "Choisir"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 p-6 rounded-sm bg-slate-50/30 text-center">
            <p className="text-[10px] text-slate-400 italic uppercase tracking-wider">Aucune signature enregistrée.</p>
          </div>
        )}
      </div>

      {/* Auto Positioning Option inside Sidebar */}
      {activeSignatureId && activeDocument && onUpdateSignatures && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-fade-in">
          <div className="flex items-center space-x-1.5 text-blue-600">
            <Layers size={14} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Positionner automatiquement</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Page :</label>
              <select
                value={sidebarPageIdx}
                onChange={(e) => setSidebarPageIdx(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {sidebarPages.map((_, pIdx) => (
                  <option key={pIdx} value={pIdx}>
                    Page {pIdx + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Endroit :</label>
              <select
                value={sidebarPlacement}
                onChange={(e) => setSidebarPlacement(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg p-1.5 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          </div>

          <button
            onClick={() => handleApplySignatureFromSidebar(activeSignatureId, sidebarPageIdx, sidebarPlacement)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider border-b-2 border-emerald-800 transition-colors shadow-sm hover:shadow"
          >
            Poser sur le document
          </button>
        </div>
      )}

      {/* Cachets actifs sur le document */}
      {activeDocument && activeDocument.signatures && activeDocument.signatures.length > 0 && onUpdateSignatures && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-fade-in">
          <div className="flex items-center space-x-1.5 text-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Ajuster les cachets sur le document ({activeDocument.signatures.length})</span>
          </div>
          
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {activeDocument.signatures.map((sig, idx) => (
              <div key={sig.id} className="flex flex-col p-2 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded border border-slate-100 overflow-hidden shrink-0">
                      <img src={sig.image} alt={sig.name || "Cachet"} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-700 uppercase truncate max-w-[60px]">{sig.name || `Sig ${idx + 1}`}</span>
                      <span className="text-[8px] font-semibold text-slate-400 uppercase">Page {sig.pageIndex + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => {
                        const updated = activeDocument.signatures.map(s => {
                          if (s.id === sig.id) {
                            return {
                              ...s,
                              width: Math.max(50, s.width - 24),
                              height: Math.max(25, s.height - 12)
                            };
                          }
                          return s;
                        });
                        onUpdateSignatures(updated);
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-bold"
                      title="Diminuer"
                    >
                      -
                    </button>
                    <button
                      onClick={() => {
                        const updated = activeDocument.signatures.map(s => {
                          if (s.id === sig.id) {
                            return {
                              ...s,
                              width: Math.max(50, s.width + 24),
                              height: Math.max(25, s.height + 12)
                            };
                          }
                          return s;
                        });
                        onUpdateSignatures(updated);
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-bold"
                      title="Agrandir"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        const updated = activeDocument.signatures.filter(s => s.id !== sig.id);
                        onUpdateSignatures(updated);
                      }}
                      className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-red-100 text-red-600 rounded transition-colors font-bold ml-1"
                      title="Supprimer"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-100 flex flex-col space-y-1.5">
                  <input
                    type="text"
                    value={sig.ownerName || ""}
                    onChange={(e) => {
                      const updated = activeDocument.signatures.map(s => {
                        if (s.id === sig.id) {
                          return { ...s, ownerName: e.target.value };
                        }
                        return s;
                      });
                      onUpdateSignatures(updated);
                    }}
                    placeholder="Nom du signataire (ex: M. Dupont)"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded p-1.5 text-[9px] font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                  />
                  {sig.ownerName && (
                    <div className="flex items-center space-x-1 justify-between">
                      <div className="flex items-center space-x-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase mr-0.5">Taille:</span>
                        <button
                          onClick={() => {
                            const updated = activeDocument.signatures.map(s => {
                              if (s.id === sig.id) {
                                return { ...s, ownerNameFontSize: Math.max(10, (s.ownerNameFontSize || 24) - 2) };
                              }
                              return s;
                            });
                            onUpdateSignatures(updated);
                          }}
                          className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-bold text-[10px]"
                          title="Diminuer texte"
                        >
                          -
                        </button>
                        <button
                          onClick={() => {
                            const updated = activeDocument.signatures.map(s => {
                              if (s.id === sig.id) {
                                return { ...s, ownerNameFontSize: Math.min(64, (s.ownerNameFontSize || 24) + 2) };
                              }
                              return s;
                            });
                            onUpdateSignatures(updated);
                          }}
                          className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-bold text-[10px]"
                          title="Agrandir texte"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase mr-0.5">Style:</span>
                        <button
                          onClick={() => {
                            const updated = activeDocument.signatures.map(s => {
                              if (s.id === sig.id) {
                                return { ...s, ownerNameFontWeight: 400 };
                              }
                              return s;
                            });
                            onUpdateSignatures(updated);
                          }}
                          className={`w-auto px-1.5 h-5 flex items-center justify-center rounded transition-colors font-bold text-[9px] ${
                            (sig.ownerNameFontWeight || 700) === 400 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Plus fine"
                        >
                          Fin
                        </button>
                        <button
                          onClick={() => {
                            const updated = activeDocument.signatures.map(s => {
                              if (s.id === sig.id) {
                                return { ...s, ownerNameFontWeight: 700 };
                              }
                              return s;
                            });
                            onUpdateSignatures(updated);
                          }}
                          className={`w-auto px-1.5 h-5 flex items-center justify-center rounded transition-colors font-bold text-[9px] ${
                            (sig.ownerNameFontWeight || 700) === 700
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Plus épais"
                        >
                          Gras
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guide details */}
      <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-sm p-3 text-[10px] font-mono uppercase leading-relaxed">
        <span className="font-bold block mb-0.5">Comment signer le document ?</span>
        Sélectionnez une signature ci-dessus, puis cliquez à l'endroit désiré sur la page de l'éditeur pour l'apposer. Déplacez et redimensionnez librement.
      </div>
    </div>
  );
}
