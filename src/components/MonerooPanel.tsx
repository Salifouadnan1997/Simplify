import React, { useState } from "react";
import { CreditCard, Check, ShieldCheck, Zap, AlertCircle, ShoppingBag, RefreshCw } from "lucide-react";

interface MonerooPanelProps {
  currentPlan: string;
  onUpgradeSuccess: (planName: string) => void;
}

export default function MonerooPanel({ currentPlan, onUpgradeSuccess }: MonerooPanelProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgradeClick = async (planName: string, amount: number) => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout/moneroo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "XOF",
          planName,
          customerEmail: "contact@simplify.app",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Impossible d'initialiser le paiement.");
      }
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("L'URL de paiement n'a pas été renvoyée par le serveur.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur lors de l'initialisation du paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Intro info */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-xl font-bold text-slate-950 uppercase tracking-tight flex items-center justify-center">
          <CreditCard className="mr-2 text-blue-600" size={24} />
          Forfaits & Facturation
        </h2>
        <p className="text-xs text-slate-500 uppercase tracking-wide max-w-lg mx-auto">
          Gérez votre forfait. Les transactions sont sécurisées de bout en bout par la passerelle de paiement **Moneroo.io**.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Pro Plan */}
        <div className="border-2 border-blue-600 bg-blue-50/20 rounded-sm p-6 flex flex-col relative shadow-sm">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full">
            Le plus populaire
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Pro</h3>
            <div className="flex items-end mt-2">
              <span className="text-3xl font-bold text-slate-900">2 500</span>
              <span className="text-sm text-slate-500 mb-1 ml-1 font-bold">FCFA / mois</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-2">
              Pour les professionnels indépendants.
            </p>
          </div>
          <div className="flex-1 space-y-3 mb-6">
            <div className="flex items-start space-x-2 text-xs text-slate-700">
              <Check className="text-blue-600 shrink-0 mt-0.5" size={14} />
              <span>Saisie vocale et OCR illimités</span>
            </div>
            <div className="flex items-start space-x-2 text-xs text-slate-700">
              <Check className="text-blue-600 shrink-0 mt-0.5" size={14} />
              <span>Création de documents illimitée</span>
            </div>
            <div className="flex items-start space-x-2 text-xs text-slate-700">
              <Check className="text-blue-600 shrink-0 mt-0.5" size={14} />
              <span>Génération PDF et Word</span>
            </div>
          </div>
          {currentPlan === "Pro" ? (
             <div className="py-2 bg-slate-200 text-slate-600 font-bold uppercase tracking-wider rounded-sm text-xs text-center border-b border-slate-300">
               Forfait Actuel
             </div>
          ) : (
            <button
              onClick={() => handleUpgradeClick("Pro", 2500)}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider rounded-sm text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all border-b border-blue-800"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <ShoppingBag size={12} />}
              <span>S'abonner à Simplify</span>
            </button>
          )}
        </div>

        {/* Business Plan */}
        <div className="border border-slate-200 bg-white rounded-sm p-6 flex flex-col shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Business</h3>
            <div className="flex items-end mt-2">
              <span className="text-3xl font-bold text-slate-900">15 000</span>
              <span className="text-sm text-slate-500 mb-1 ml-1 font-bold">FCFA / mois</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-2">
              Pour les équipes et la productivité.
            </p>
          </div>
          <div className="flex-1 space-y-3 mb-6">
            <div className="flex items-start space-x-2 text-xs text-slate-700">
              <Check className="text-slate-600 shrink-0 mt-0.5" size={14} />
              <span>Tout du plan Pro</span>
            </div>
            <div className="flex items-start space-x-2 text-xs text-slate-700">
              <Check className="text-slate-600 shrink-0 mt-0.5" size={14} />
              <span>Personnalisation avancée par IA</span>
            </div>
            <div className="flex items-start space-x-2 text-xs text-slate-700">
              <Check className="text-slate-600 shrink-0 mt-0.5" size={14} />
              <span>Support prioritaire</span>
            </div>
          </div>
          {currentPlan === "Business" ? (
             <div className="py-2 bg-slate-200 text-slate-600 font-bold uppercase tracking-wider rounded-sm text-xs text-center border-b border-slate-300">
               Forfait Actuel
             </div>
          ) : (
            <button
              onClick={() => handleUpgradeClick("Business", 15000)}
              disabled={loading}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase tracking-wider rounded-sm text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all border-b border-slate-950"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <ShoppingBag size={12} />}
              <span>S'abonner à Simplify</span>
            </button>
          )}
        </div>
      </div>

      {/* Trust factors logos */}
      <div className="max-w-4xl mx-auto mt-8 bg-slate-50 border border-slate-200 rounded-sm p-3 text-[9px] font-mono uppercase text-slate-500 flex items-center justify-between">
        <span className="font-bold text-slate-700 flex items-center space-x-1">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Sécurisé par Moneroo :</span>
        </span>
        <div className="flex items-center space-x-2 font-bold text-slate-600">
          <span>Wave</span>
          <span>•</span>
          <span>Orange Money</span>
          <span>•</span>
          <span>MTN MoMo</span>
        </div>
      </div>
    </div>
  );
}
