import React, { useState, useEffect } from "react";
import { googleSignIn, getAccessToken, googleSignOut } from "../lib/googleAuth";
import { HardDrive, LogIn, LogOut, Check, Loader2, AlertCircle, FileText } from "lucide-react";

interface DrivePanelProps {
  onInsertContent: (content: string) => void;
  onSetTitle: (title: string) => void;
}

export default function DrivePanel({ onInsertContent, onSetTitle }: DrivePanelProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((t) => setToken(t));
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setToken(res.accessToken);
      }
    } catch (err: any) {
      setError("Impossible de se connecter à Google Drive.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await googleSignOut();
    setToken(null);
  };

  const openPicker = () => {
    if (!token || !window.google || !window.google.picker) {
      setError("Google Picker n'est pas prêt.");
      return;
    }

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setIncludeFolders(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey("") // not needed with token + origin
      .setCallback(pickerCallback)
      .setOrigin(pickerOrigin)
      .build();
      
    picker.setVisible(true);
  };

  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      
      try {
        const fileId = file.id;
        const mimeType = file.mimeType;
        const name = file.name;
        
        let url = "";
        let isExport = false;
        
        if (mimeType.includes("apps.document")) {
          // Google Doc: export as text
          url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
          isExport = true;
        } else if (mimeType.includes("text/plain") || mimeType.includes("application/rtf")) {
          // Plain text: download media
          url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        } else {
          // Fallback or unsupported: just insert a reference
          onInsertContent(`[Fichier importé : ${name}]`);
          onSetTitle(name);
          setSuccessMsg(`Référence au fichier "${name}" insérée.`);
          setLoading(false);
          return;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement : ${response.statusText}`);
        }

        const textContent = await response.text();
        onInsertContent(textContent);
        onSetTitle(name);
        setSuccessMsg(`Contenu du fichier "${name}" importé avec succès.`);
      } catch (err: any) {
        console.error(err);
        setError("Erreur lors de l'importation du contenu du fichier.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-1">
          <HardDrive size={16} className="text-blue-600" />
          Google Drive
        </h2>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Importez vos documents directement depuis Google Drive pour les éditer dans Simplify.
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        {!token ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <HardDrive size={32} className="text-slate-300" />
            <p className="text-xs text-slate-500 text-center max-w-xs">
              Connectez votre compte Google pour parcourir et importer vos documents.
            </p>
            
            {/* Google Sign In Button Styling */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-slate-400" />
              ) : (
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              )}
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <Check size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Connecté à Google Drive</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors uppercase font-bold"
              >
                <LogOut size={12} />
                Déconnexion
              </button>
            </div>

            <button
              onClick={openPicker}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              Ouvrir le Sélecteur Google Drive
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-2 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-start gap-2 text-xs">
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
