import React, { useState, useRef } from "react";
import { FileText, ArrowLeft, Download, Upload, Trash2, Edit, Save, Loader2, File } from "lucide-react";
import { SupabaseDocument } from "./DocumentsList";

interface DocumentDetailProps {
  document: SupabaseDocument;
  onBack: () => void;
  onDocumentUpdated: (doc: SupabaseDocument) => void;
  onDocumentDeleted: (id: string) => void;
}

export default function DocumentDetail({ document: initialDoc, onBack, onDocumentUpdated, onDocumentDeleted }: DocumentDetailProps) {
  const [doc, setDoc] = useState<SupabaseDocument>(initialDoc);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialDoc.title);
  const [status, setStatus] = useState(initialDoc.status);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveChanges = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("saisie_intelligente_token");
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title, status })
      });
      if (res.ok) {
        const data = await res.json();
        setDoc(data.document);
        onDocumentUpdated(data.document);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem("saisie_intelligente_token");
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        onDocumentDeleted(doc.id);
        onBack();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const token = localStorage.getItem("saisie_intelligente_token");
        const res = await fetch(`/api/documents/${doc.id}/upload`, {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ 
            fileData: base64,
            mimeType: file.type,
            fileName: file.name
          })
        });

        if (res.ok) {
          const data = await res.json();
          setDoc(data.document);
          onDocumentUpdated(data.document);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!doc.file_url) return;
    window.open(doc.file_url, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Retour</span>
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={handleDelete}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Supprimer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)}
                      className="font-bold text-xl text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                    />
                  ) : (
                    <h2 className="font-bold text-xl text-slate-800">{doc.title}</h2>
                  )}
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">
                    ID: {String(doc.id).substring(0, 8)}
                  </p>
                </div>
              </div>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-500 hover:bg-slate-200 rounded transition-colors"
                >
                  <Edit size={16} />
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { setIsEditing(false); setTitle(doc.title); setStatus(doc.status); }}
                    className="px-3 py-1 text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 rounded transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={saveChanges}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Enregistrer</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-200">
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</span>
                <span className="text-sm font-medium text-slate-800 uppercase">{doc.type}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Statut</span>
                {isEditing ? (
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                    className="text-sm border border-slate-300 bg-white rounded p-1 outline-none"
                  >
                    <option value="raw">Brut</option>
                    <option value="processed">Traité</option>
                    <option value="signed">Signé</option>
                  </select>
                ) : (
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    doc.status === 'signed' ? 'bg-green-100 text-green-700' :
                    doc.status === 'processed' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {doc.status}
                  </span>
                )}
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Créé le</span>
                <span className="text-sm text-slate-700">{new Date(doc.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Mis à jour le</span>
                <span className="text-sm text-slate-700">{new Date(doc.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* File Management */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <File size={18} className="text-blue-600" />
              <span>Fichier attaché</span>
            </h3>

            {doc.file_url ? (
              <div className="flex flex-col space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <FileText className="text-green-600" size={24} />
                    <div>
                      <p className="text-sm font-medium text-green-800">Document disponible</p>
                      <p className="text-xs text-green-600">Stocké dans le cloud sécurisé</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleDownload}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-green-300 text-green-700 hover:bg-green-100 rounded text-sm font-medium transition-colors"
                    >
                      <Download size={16} />
                      <span>Ouvrir</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1 border-t border-slate-200"></div>
                  <span className="text-xs text-slate-400 font-medium uppercase">Ou remplacer</span>
                  <div className="flex-1 border-t border-slate-200"></div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 rounded-md flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Upload size={18} />}
                  <span className="text-sm font-medium">{isUploading ? "Envoi en cours..." : "Remplacer le fichier"}</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-8 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-md flex flex-col items-center justify-center space-y-2 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                  ) : (
                    <Upload size={32} className="text-blue-500 mb-2" />
                  )}
                  <span className="text-sm font-bold uppercase tracking-wider">{isUploading ? "Envoi en cours..." : "Importer un fichier"}</span>
                  <span className="text-xs font-medium text-blue-500/70">Formats acceptés : PDF, DOCX, Images</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
