import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { authService, UserProfile as UserProfileType } from "../lib/authService";
import { User, Building, Shield, LogOut, Check, Save, Loader2, Info, ListFilter, FileText } from "lucide-react";

interface UserProfileProps {
  user: UserProfileType;
  onUpdateSuccess: (updatedUser: UserProfileType) => void;
  onLogout: () => void;
}

export function UserProfile({ user, onUpdateSuccess, onLogout }: UserProfileProps) {
  const [email, setEmail] = useState(user.email);
  const [organization, setOrganization] = useState(user.organization || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if user prop changes
  useEffect(() => {
    setEmail(user.email);
    setOrganization(user.organization || "");
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const updated = await authService.updateProfile({
        email,
        organization
      });
      setSuccess(true);
      onUpdateSuccess(updated);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Impossible de mettre à jour le profil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="user_profile_panel" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <User size={22} />
          </div>
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-900">Mon Profil Utilisateur</h3>
            <p className="text-xs text-slate-500">Gérez vos informations de compte et vos paramètres d'organisation</p>
          </div>
        </div>
        
        <button
          id="logout_btn"
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-semibold transition-colors"
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Role Status and security Policies */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center text-center">
            <div className={`p-3 rounded-full mb-3 ${user.role === "admin" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
              <Shield size={24} />
            </div>
            <span className="font-sans font-semibold text-sm text-slate-900">{user.email}</span>
            
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                user.role === "admin" 
                  ? "bg-amber-100 text-amber-800" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {user.role === "admin" ? "Administrateur" : "Utilisateur Standard"}
              </span>
            </div>
            
            <span className="text-[10px] text-slate-400 mt-2 block">
              ID: {String(user.id || "").substring(0, 15)}...
            </span>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Shield size={12} /> Habilitations
            </h4>
            <ul className="space-y-1.5 text-[10px] text-slate-600 leading-relaxed">
              <li className="flex items-start gap-1">
                <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Création & édition de documents</span>
              </li>
              <li className="flex items-start gap-1">
                <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Signatures et cachets professionnels</span>
              </li>
              {user.role === "admin" ? (
                <>
                  <li className="flex items-start gap-1">
                    <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold text-amber-800">Accès d'audit global (Admin)</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <Check size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold text-amber-800">Supervision des buckets de documents</span>
                  </li>
                </>
              ) : (
                <li className="flex items-start gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 flex-shrink-0" />
                  <span>Données isolées par politique RLS</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Right column: Edit Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-center gap-1.5">
                <Check size={14} />
                Profil mis à jour avec succès !
              </div>
            )}

            <div>
              <label htmlFor="profile_email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Adresse Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={14} />
                </div>
                <input
                  id="profile_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile_org" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Organisation / Entreprise
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building size={14} />
                </div>
                <input
                  id="profile_org"
                  type="text"
                  placeholder="ex. Simplify HQ"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="save_profile_btn"
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Enregistrer les modifications
              </button>
            </div>
          </form>

          {/* Special Administrative View Section */}
          {user.role === "admin" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 border-t border-slate-100 pt-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-amber-50 text-amber-600 rounded">
                  <Shield size={14} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Console d'Audit Admin</h4>
              </div>

              <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 border-b border-slate-200">
                  <span>Audit des activités de l'organisation :</span>
                  <span className="font-semibold text-amber-700">Accès Autorisé (Overriding RLS)</span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  <div className="flex items-start justify-between text-[10px] bg-white p-2 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-800">Génération Contrat_Achat.pdf</span>
                        <span className="block text-[9px] text-slate-400">Par salifouadnan1997@gmail.com</span>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-medium">Succès (OCR)</span>
                  </div>

                  <div className="flex items-start justify-between text-[10px] bg-white p-2 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-800">Modèle Lettre_Simulation.docx</span>
                        <span className="block text-[9px] text-slate-400">Par test@simplify.app</span>
                      </div>
                    </div>
                    <span className="text-emerald-600 font-medium">Succès (Sandbox)</span>
                  </div>

                  <div className="flex items-start justify-between text-[10px] bg-white p-2 border border-slate-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-slate-400" />
                      <div>
                        <span className="font-semibold text-slate-800">Signature Cachet_Direction.png</span>
                        <span className="block text-[9px] text-slate-400">Mise à jour bucket 'signatures'</span>
                      </div>
                    </div>
                    <span className="text-blue-600 font-medium">Importé</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  <Info size={12} className="flex-shrink-0" />
                  <span>En tant qu'administrateur, vos requêtes outrepassent l'isolement standard pour auditer les indicateurs de signature et d'usage de l'organisation.</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
