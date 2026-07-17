import React, { useState } from "react";
import { Sparkles, Edit3, Trash, AlertTriangle, Play, Check, RefreshCw, Layers } from "lucide-react";
import { PlaceholderVariable } from "../types";

interface VariablesPanelProps {
  documentContent: string;
  onUpdateContent: (newContent: string) => void;
}

export default function VariablesPanel({ documentContent, onUpdateContent }: VariablesPanelProps) {
  const [variables, setVariables] = useState<PlaceholderVariable[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Scan document for variable placeholders
  const handleScanVariables = async () => {
    setIsScanning(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentText: documentContent }),
      });

      if (!response.ok) {
        throw new Error("Impossible d'analyser le document. Vérifiez le service.");
      }

      const result = await response.json();
      setVariables(result.variables || []);

      if (result.variables?.length === 0) {
        setError("Aucune variable ou placeholder évident n'a été détecté dans le document. Essayez d'insérer des crochets comme [Nom d'auteur] ou d'ajouter des termes clairs.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur réseau d'analyse.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.key === key ? { ...v, newValue: value } : v))
    );
  };

  // Submit replacements to personalize document
  const handleApplyPersonalization = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccessMsg(null);

    // Build replacement mapping
    const replacements: { [key: string]: string } = {};
    variables.forEach((v) => {
      if (v.newValue) {
        replacements[v.key] = v.newValue;
      }
    });

    try {
      const response = await fetch("/api/gemini/personalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentText: documentContent,
          replacements,
          customStyleInstruction: customStyle || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la personnalisation automatique.");
      }

      const result = await response.json();
      onUpdateContent(result.personalizedText);
      setSuccessMsg("Le document a été mis à jour et personnalisé avec succès !");
      
      // Update our variable inputs to reflect their new state
      setVariables((prev) =>
        prev.map((v) => ({
          ...v,
          currentValue: v.newValue || v.currentValue,
          newValue: "",
        }))
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur de traitement.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction text */}
      <div>
        <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center">
          <Layers className="mr-2 text-blue-600" size={16} />
          Personnalisation Automatique
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
          Remplacez automatiquement les noms d'auteur, les dates de contrat, ou les coordonnées. Simplify rédigera le document en intégrant vos corrections harmonieusement.
        </p>
      </div>

      {/* Primary Scan Button */}
      {variables.length === 0 && (
        <button
          onClick={handleScanVariables}
          disabled={isScanning}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm disabled:bg-blue-400 transition-all border-b border-blue-800"
        >
          {isScanning ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          <span>{isScanning ? "Analyse du document..." : "Détecter les variables"}</span>
        </button>
      )}

      {/* Loading & Error display */}
      {error && (
        <div className="flex items-start p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-sm text-xs space-x-2">
          <AlertTriangle className="shrink-0 mt-0.5" size={14} />
          <span>{error}</span>
          {variables.length === 0 && (
            <button onClick={handleScanVariables} className="underline font-bold text-amber-900 ml-auto">Recommencer</button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="flex items-start p-3 bg-green-50 border border-green-200 text-green-800 rounded-sm text-xs space-x-2">
          <Check className="shrink-0 mt-0.5" size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Variables Form Drawer */}
      {variables.length > 0 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {variables.length} Variable(s) Détectée(s)
            </span>
            <button
              onClick={handleScanVariables}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center space-x-1 uppercase tracking-wider"
            >
              <RefreshCw size={10} />
              <span>Ré-analyser</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[250px] overflow-y-auto p-1">
            {variables.map((variable) => (
              <div
                key={variable.key}
                className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{variable.key}</span>
                  <span className="text-[8px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase">
                    {variable.category}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-500 truncate py-1 text-[10px] font-medium uppercase">
                    Actuel : <span className="font-bold text-slate-700">{variable.currentValue || "[vide]"}</span>
                  </div>
                  <input
                    type="text"
                    value={variable.newValue || ""}
                    onChange={(e) => handleValueChange(variable.key, e.target.value)}
                    placeholder="Nouvelle valeur..."
                    className="px-2 py-1 bg-white border border-slate-300 focus:border-blue-500 rounded-sm text-xs outline-none w-full shadow-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Prompt Style instruction field */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Consignes d'écriture & format supplémentaires (Optionnel)
            </label>
            <textarea
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              placeholder="Ex: Rends le ton plus formel, traduis en anglais, ou reformule les clauses juridiques de manière simplifiée..."
              className="w-full h-16 px-3 py-2 bg-white border border-slate-200 rounded-sm text-xs outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleApplyPersonalization}
              disabled={isProcessing}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm border-b border-blue-800"
            >
              {isProcessing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Play size={12} />
              )}
              <span>{isProcessing ? "Récriture..." : "Lancer la fusion"}</span>
            </button>
            <button
              onClick={() => setVariables([])}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm text-xs font-bold uppercase tracking-wider border border-slate-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
