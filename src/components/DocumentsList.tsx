import React, { useState } from "react";
import { Folder, FileText, Plus, Trash2, Loader2, ArrowRight, X } from "lucide-react";
import { SmartDocument } from "../types";

export interface SupabaseDocument {
  id: string;
  title: string;
  type: string;
  status: string;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentsListProps {
  documents: SmartDocument[];
  onSelectDocument: (id: string) => void;
  onCreateNewDocument: () => void;
  onDeleteDocument: (id: string) => void;
}

export default function DocumentsList({ documents, onSelectDocument, onCreateNewDocument, onDeleteDocument }: DocumentsListProps) {
  const [filterType, setFilterType] = useState("all");
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  const filteredDocs = documents.filter(doc => {
    if (filterType !== "all" && doc.type !== filterType) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
        <h2 className="font-bold text-slate-800 flex items-center space-x-2 text-lg">
          <Folder className="text-blue-600" size={24} />
          <span>Mes Projets</span>
        </h2>
        <button 
          onClick={onCreateNewDocument}
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau Projet</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
        {documents.length === 0 ? (
          <div className="text-center text-slate-500 py-16 flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <FileText size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Aucun projet</h3>
            <p className="text-sm max-w-sm mb-6">Vous n'avez pas encore créé de projet. Commencez dès maintenant en créant votre premier document.</p>
            <button 
              onClick={onCreateNewDocument}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              Créer un projet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map(doc => (
              <div 
                key={doc.id} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer flex flex-col"
                onClick={() => onSelectDocument(doc.id)}
              >
                <div className="h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden shrink-0">
                  {doc.coverImage ? (
                    <img src={doc.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={40} className="text-slate-200" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center">
                      Ouvrir <ArrowRight size={14} className="ml-1" />
                    </span>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base mb-1 truncate">{doc.title || "Projet sans titre"}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">{doc.type}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(doc.updatedAt || doc.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocToDelete(doc.id);
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1 z-10 relative"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => setDocToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Supprimer le projet</h3>
              <p className="text-slate-500 text-sm mb-6">
                Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible et toutes les données associées seront perdues.
              </p>
              
              <div className="flex items-center justify-center space-x-3 w-full">
                <button
                  onClick={() => setDocToDelete(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDeleteDocument(docToDelete);
                    setDocToDelete(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
