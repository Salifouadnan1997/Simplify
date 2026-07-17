import React, { useState, useEffect } from "react";
import { 
  createNewBlankDocument, 
  isSupabaseConfigured 
} from "./utils";
import {
  getSavedDocuments,
  saveDocument,
  deleteDocument,
} from "./lib/syncService";
import { checkQuota, updatePlan, incrementQuota } from "./lib/quotaService";
import { SmartDocument, DocumentSignature, DocumentStyleSettings, SaisieTab } from "./types";
import DocumentEditor from "./components/DocumentEditor";
import DictationPanel from "./components/DictationPanel";
import OcrPanel from "./components/OcrPanel";
import HandwritingPanel from "./components/HandwritingPanel";
import VariablesPanel from "./components/VariablesPanel";
import SignaturePanel from "./components/SignaturePanel";
import FormattingPanel from "./components/FormattingPanel";
import MonerooPanel from "./components/MonerooPanel";
import DrivePanel from "./components/DrivePanel";
import AIAssistantPanel from "./components/AIAssistantPanel";
import TableExtractorPanel from "./components/TableExtractorPanel";
import DocumentsList, { SupabaseDocument } from "./components/DocumentsList";
import DocumentDetail from "./components/DocumentDetail";
import TemplatesPanel from "./components/TemplatesPanel";
import SummaryPanel from "./components/SummaryPanel";
import ImportPanel from "./components/ImportPanel";
import TtsPanel from "./components/TtsPanel";
import { AuthPage } from "./components/AuthPage";
import { UserProfile } from "./components/UserProfile";
import { authService } from "./lib/authService";
import { 
  Mic, 
  Sparkles, 
  Layers, 
  Sliders, 
  PenTool, 
  CreditCard, 
  Plus, 
  Trash2, 
  FolderOpen, 
  Zap, 
  Check, 
  AlertCircle,
  HardDrive,
  Bot,
  Table,
  BookOpen,
  LayoutTemplate,
  FileText,
  FolderPlus,
  Volume2
} from "lucide-react";

export default function App() {
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<SaisieTab>("dictation");
  const [activeStampImage, setActiveStampImage] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("Gratuit");
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"editor" | "documentsList" | "documentDetail">("editor");
  const [selectedSupabaseDoc, setSelectedSupabaseDoc] = useState<SupabaseDocument | null>(null);
  const [mobileActiveView, setMobileActiveView] = useState<"tools" | "document">("document");
  const [interimDictationText, setInterimDictationText] = useState<string>("");

  // Load documents, authentication and configuration on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.warn("Authentication check failed on mount:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    initApp();

    const loadDocs = async () => {
      const saved = await getSavedDocuments();
      if (saved.length > 0) {
        setDocuments(saved);
        setActiveDocId(saved[0].id);
      } else {
        const blank = createNewBlankDocument("Nouveau Contrat de Prestation");
        const updated = await saveDocument(blank);
        setDocuments(updated);
        setActiveDocId(blank.id);
      }
    };
    loadDocs();

    // Load active subscription plan
    const savedPlan = localStorage.getItem("saisie_intelligente_plan");
    if (savedPlan) {
      setPlan(savedPlan);
    }

    // Handle Moneroo payment return
    const urlParams = new URLSearchParams(window.location.search);
    const monerooStatus = urlParams.get("monerooPaymentStatus");
    const newPlan = urlParams.get("plan");
    if (monerooStatus === "success" && newPlan) {
      updatePlan(newPlan).then(() => {
        setPlan(newPlan);
        alert(`Paiement réussi ! Vous avez souscrit au plan : ${newPlan}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }

    setSupabaseConnected(isSupabaseConfigured());
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeDoc = documents.find((doc) => doc.id === activeDocId) || documents[0];

  // Save the current document state and refresh the document collection
  const handleUpdateContent = async (content: string) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, content };
    const newList = await saveDocument(updated);
    setDocuments(newList);
  };

  const handleUpdateTitle = async (title: string) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, title };
    const newList = await saveDocument(updated);
    setDocuments(newList);
  };

  const handleUpdateCoverImage = async (coverImage: string) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, coverImage };
    const newList = await saveDocument(updated);
    setDocuments(newList);
  };

  const handleUpdateDocument = async (updatedDoc: SmartDocument) => {
    const newList = await saveDocument(updatedDoc);
    setDocuments(newList);
  };

  const handleUpdateStyle = async (styleSettings: DocumentStyleSettings) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, styleSettings };
    const newList = await saveDocument(updated);
    setDocuments(newList);
  };

  const handleUpdateSignatures = async (signatures: DocumentSignature[]) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, signatures };
    const newList = await saveDocument(updated);
    setDocuments(newList);
  };

  const handleUpdateContentAndSignatures = async (content: string, signatures: DocumentSignature[]) => {
    if (!activeDoc) return;
    const updated = { ...activeDoc, content, signatures };
    const newList = await saveDocument(updated);
    setDocuments(newList);
  };

  const handleCreateNewDocument = async () => {
    const quota = await checkQuota('documentsCreated', documents.length);
    if (!quota.allowed) {
      alert(quota.message || "Limite atteinte. Veuillez passer à un forfait supérieur.");
      setActiveTab("moneroo");
      return;
    }
    const newDoc = createNewBlankDocument();
    const newList = await saveDocument(newDoc);
    setDocuments(newList);
    setActiveDocId(newDoc.id);
    setActiveTab("dictation");
  };

  const handleDeleteDocument = async () => {
    if (!confirm("Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.")) return;
    if (!activeDoc) return;
    const newList = await deleteDocument(activeDoc.id);
    setDocuments(newList);
    if (newList.length > 0) {
      setActiveDocId(newList[0].id);
    } else {
      const blank = createNewBlankDocument();
      const resetList = await saveDocument(blank);
      setDocuments(resetList);
      setActiveDocId(blank.id);
    }
  };

  // Upgrades plan status
  const handleUpgradePlan = (planName: string) => {
    setPlan(planName);
    localStorage.setItem("saisie_intelligente_plan", planName);
  };

  // Utility to insert text at the active cursor position in the textarea
  const handleAppendText = (htmlText: string) => {
    setMobileActiveView("document");
    const targetDocId = activeDocId || (documents.length > 0 ? documents[0].id : null);
    if (!targetDocId) return;

    setDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(d => d.id === targetDocId);
      if (docIndex === -1) return prevDocs;
      
      const doc = prevDocs[docIndex];
      let pages: string[] = [];
      try {
        pages = JSON.parse(doc.content);
        if (!Array.isArray(pages)) {
          pages = [doc.content];
        }
      } catch (e) {
        pages = [doc.content];
      }

      const targetIndex = Math.min(Math.max(0, activePageIndex), Math.max(0, pages.length - 1));

      if (pages.length === 0) {
        pages.push(htmlText);
      } else {
        const targetPage = pages[targetIndex] || "";
        const isDefaultText = targetPage.includes("Écrivez ou dictez votre texte ici") || targetPage.includes("Le présent contrat est établi");
        
        if (isDefaultText) {
          pages[targetIndex] = htmlText;
        } else {
          pages[targetIndex] = targetPage + htmlText;
        }
      }
      
      const updatedDoc = { ...doc, content: JSON.stringify(pages) };
      
      // Fire and forget persistence so we don't block
      saveDocument(updatedDoc).catch(e => console.error("Error saving doc after append:", e));
      
      const newList = [...prevDocs];
      newList[docIndex] = updatedDoc;
      return newList;
    });
  };

  const handleReplaceContent = (htmlTemplate: string) => {
    setMobileActiveView("document");
    const targetDocId = activeDocId || (documents.length > 0 ? documents[0].id : null);
    if (!targetDocId) return;
    setDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(d => d.id === targetDocId);
      if (docIndex === -1) return prevDocs;
      
      const doc = prevDocs[docIndex];
      const updatedDoc = { 
        ...doc, 
        content: htmlTemplate, 
        signatures: [], // CLEAR ALL OLD SIGNATURES/STAMPS
        templateVersion: (doc.templateVersion || 0) + 1 
      };
      saveDocument(updatedDoc).catch(e => console.error(e));
      
      const newList = [...prevDocs];
      newList[docIndex] = updatedDoc;
      return newList;
    });
  };

  const handleCreateNewDocumentFromImport = async (title: string, content: string) => {
    setMobileActiveView("document");
    const newDoc = createNewBlankDocument(title);
    newDoc.content = content;
    const updatedDocs = await saveDocument(newDoc);
    setDocuments(updatedDocs);
    setActiveDocId(newDoc.id);
    setActivePageIndex(0);
    setActiveTab("dictation");
  };

  const handleInsertTextAtCursor = (htmlTemplate: string) => {
    setMobileActiveView("document");
    const targetDocId = activeDocId || (documents.length > 0 ? documents[0].id : null);
    if (!targetDocId) return;

    setDocuments(prevDocs => {
      const docIndex = prevDocs.findIndex(d => d.id === targetDocId);
      if (docIndex === -1) return prevDocs;
      
      const doc = prevDocs[docIndex];
      let pages: string[] = [];
      try {
        pages = JSON.parse(doc.content);
        if (!Array.isArray(pages)) {
          pages = [doc.content];
        }
      } catch (e) {
        pages = [doc.content];
      }

      const targetIndex = Math.min(Math.max(0, activePageIndex), Math.max(0, pages.length - 1));

      if (pages.length === 0) {
        pages.push(htmlTemplate);
      } else {
        const targetPage = pages[targetIndex] || "";
        
        // Check if target page is practically empty
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = targetPage;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        const isEmpty = textContent.trim() === "" && !targetPage.includes("<img") && !targetPage.includes("style=");
        const isDefaultText = targetPage.includes("Écrivez ou dictez votre texte ici") || targetPage.includes("Le présent contrat est établi");

        if (isEmpty || isDefaultText) {
          pages[targetIndex] = htmlTemplate;
        } else {
          // If the page is not empty, append it instead of adding a new page, 
          // because they are inserting a template into the active page.
          pages[targetIndex] = targetPage + htmlTemplate;
        }
      }
      
      const updatedDoc = { ...doc, content: JSON.stringify(pages) };
      
      // Fire and forget persistence so we don't block
      saveDocument(updatedDoc).catch(e => console.error("Error saving doc after insert:", e));
      
      const newList = [...prevDocs];
      newList[docIndex] = updatedDoc;
      return newList;
    });
    
    // Try to scroll to the newly added page if it was appended
    setTimeout(() => {
      const container = document.getElementById('document-editor-container');
      if (container) {
        // Find the active page element and scroll to it
        const pageElements = container.children;
        if (pageElements && pageElements[activePageIndex]) {
           pageElements[activePageIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }, 150);
  };

  if (authLoading) {
    return (
      <div id="auth_loading_screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="animate-spin text-blue-600 mb-4">
          <Layers size={36} />
        </div>
        <p className="text-sm font-bold text-slate-800 tracking-tight">Initialisation sécurisée...</p>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Connexion au serveur Simplify</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-100 text-slate-800 flex flex-col font-sans md:border-8 border-slate-200 relative">
      
      {/* Top Navbar Header */}
      <header className="bg-white border-b border-slate-200 h-16 px-6 py-0 flex items-center justify-between shrink-0 z-40">
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 text-left">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-sm flex items-center justify-center font-bold shadow-sm">
            Ω
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-950 uppercase tracking-tight leading-none">
              Simplify
            </h1>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">Assistant Pro de Saisie & Signature</p>
          </div>
        </div>

        {/* Database & Subscription Badges */}
        <div className="flex items-center gap-3">
          
          

          {/* Active subscription */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm border ${
            plan === "Formule Professionnelle" 
              ? "bg-blue-50 text-blue-700 border-blue-200" 
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            <Zap size={11} className={plan === "Formule Professionnelle" ? "text-blue-600" : "text-amber-500"} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
              {plan === "Formule Professionnelle" ? "PRO TIER ⚡" : "EVAL TIER"}
            </span>
          </div>

          {/* Cloud Docs Button */}
          <button
            onClick={() => setViewMode(viewMode === "editor" ? "documentsList" : "editor")}
            className={`px-3 h-8 rounded-sm shadow-sm transition-all flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider border ${
              viewMode !== "editor" 
                ? "bg-slate-800 text-white border-slate-900" 
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FolderOpen size={13} />
            <span className="hidden sm:inline text-[10px]">Cloud Docs</span>
          </button>

          {/* New Document Button */}
          <button
            onClick={handleCreateNewDocument}
            className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-sm shadow-sm hover:shadow transition-all flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider border-b border-blue-800"
          >
            <Plus size={13} />
            <span className="hidden sm:inline text-[10px]">Nouveau</span>
          </button>

          {/* User Profile / Admin Button */}
          <button
            id="profile_tab_trigger"
            onClick={() => {
              setActiveTab("profile");
              if (viewMode !== "editor") setViewMode("editor");
              if (mobileActiveView !== "tools") setMobileActiveView("tools");
            }}
            className={`flex items-center space-x-1.5 px-3 h-8 rounded-sm shadow-sm transition-all border text-xs font-semibold uppercase tracking-wider cursor-pointer ${
              activeTab === "profile"
                ? "bg-blue-50 border-blue-300 text-blue-700 font-bold"
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              {String(currentUser.email || "U").substring(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline text-[10px]">
              {currentUser.role === "admin" ? "Admin" : "Mon Compte"}
            </span>
          </button>
        </div>

      </header>

      {/* Main Fullscreen Workspace Area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-full">
        
        {viewMode === "editor" && (
          /* Mobile View Switcher - Geometric Segmented Control */
          <div className="lg:hidden flex border-b border-slate-200 bg-white p-2.5 shrink-0 justify-center w-full z-10 shadow-sm">
            <div className="bg-slate-100 p-1 rounded-xl flex w-full max-w-sm border border-slate-200/60">
              <button
                type="button"
                onClick={() => setMobileActiveView("tools")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  mobileActiveView === "tools"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Sparkles size={14} className={mobileActiveView === "tools" ? "text-blue-500 animate-pulse" : ""} />
                <span>Outils & Saisie</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileActiveView("document")}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  mobileActiveView === "document"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText size={14} className={mobileActiveView === "document" ? "text-blue-500" : ""} />
                <span>Document</span>
              </button>
            </div>
          </div>
        )}

        {viewMode === "documentsList" && (
          <div className="flex-1 w-full h-full">
            <DocumentsList 
              documents={documents}
              onSelectDocument={(id) => {
                setActiveDocId(id);
                setViewMode("editor");
              }}
              onCreateNewDocument={handleCreateNewDocument}
              onDeleteDocument={async (id) => {
                const newList = await deleteDocument(id);
                setDocuments(newList);
                if (activeDocId === id) {
                  setActiveDocId(newList.length > 0 ? newList[0].id : "");
                }
              }}
            />
          </div>
        )}

        {viewMode === "documentDetail" && selectedSupabaseDoc && (
          <div className="flex-1 w-full h-full">
            <DocumentDetail 
              document={selectedSupabaseDoc}
              onBack={() => setViewMode("documentsList")}
              onDocumentUpdated={(updated) => setSelectedSupabaseDoc(updated)}
              onDocumentDeleted={() => {
                setSelectedSupabaseDoc(null);
                setViewMode("documentsList");
              }}
            />
          </div>
        )}

        {viewMode === "editor" && (
          <>
            {/* Left Side control column panel (Draft Selector + Intelligent Tools) */}
            <div className={`w-full lg:w-[450px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex-col lg:flex-row shrink-0 h-[calc(100vh-10rem)] lg:h-full overflow-hidden ${
              mobileActiveView === "tools" ? "flex flex-1" : "hidden lg:flex"
            }`}>
              
              {/* Main Saisie Tool Navigation Bar (Tabs) - Styled to look like sleek sidebar navigation */}
              <div className="flex lg:flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900 overflow-x-auto lg:overflow-y-auto scrollbar-none shrink-0 w-full lg:w-[76px] lg:h-full py-0 lg:py-2">
                {[
                  { id: "dictation", label: "Vocale", icon: Mic },
                  { id: "tts", label: "Synthèse", icon: Volume2 },
                  { id: "importer", label: "Importer", icon: FolderPlus },
                  { id: "ocr", label: "OCR Scan", icon: Sparkles },
                  { id: "handwriting", label: "Manuscrit", icon: BookOpen },
                  { id: "assistant", label: "Assistant", icon: Bot },
                  { id: "summary", label: "Résumé", icon: FileText },
                  { id: "table", label: "Données", icon: Table },
                  { id: "templates", label: "Modèles", icon: LayoutTemplate },
                  { id: "variables", label: "Variables", icon: Layers },
                  { id: "formatting", label: "Format", icon: Sliders },
                  { id: "signature", label: "Signer", icon: PenTool },
                  { id: "drive", label: "Drive", icon: HardDrive },
                  { id: "moneroo", label: "Factures", icon: CreditCard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SaisieTab)}
                      className={`flex-1 lg:flex-none py-3 px-1 lg:py-4 text-xs font-bold uppercase tracking-wider border-b-2 lg:border-b-0 lg:border-l-4 transition-all flex flex-col items-center justify-center space-y-1 min-w-[76px] lg:min-w-0 ${
                        isSelected 
                          ? "border-blue-500 text-white bg-slate-800" 
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon size={14} className={isSelected ? "text-blue-400" : "text-slate-400"} />
                      <span className="text-[9px] tracking-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Panel Drawer Content */}
              <div className="flex-1 flex flex-col overflow-hidden h-full">
                {/* Document History Selector */}
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center space-x-2 shrink-0">
                  <FolderOpen size={14} className="text-slate-400" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Brouillon :</span>
                  <select
                    value={activeDocId}
                    onChange={(e) => setActiveDocId(e.target.value)}
                    className="flex-1 bg-transparent text-xs font-bold text-slate-700 outline-none border-none py-0.5 focus:ring-0 cursor-pointer"
                  >
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title || "Document sans titre"} ({doc.type})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleDeleteDocument}
                    title="Supprimer ce brouillon"
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Active Tool Panel Content Drawer */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                  {activeTab === "dictation" && (
                    <DictationPanel 
                      documentContent={activeDoc?.content || ""} 
                      onInsertText={handleAppendText} 
                      onInterimTranscriptChange={setInterimDictationText}
                    />
                  )}

                  {activeTab === "tts" && (
                    <TtsPanel 
                      documentContent={activeDoc?.content || ""} 
                    />
                  )}
                  
                  {activeTab === "importer" && (
                    <ImportPanel 
                      onInsertText={handleInsertTextAtCursor}
                      onReplaceContent={handleReplaceContent}
                      onCreateNewDocument={handleCreateNewDocumentFromImport}
                    />
                  )}
                  
                  {activeTab === "ocr" && (
                    <OcrPanel 
                      onInsertText={handleInsertTextAtCursor} 
                      onSetTitle={handleUpdateTitle}
                    />
                  )}

                  {activeTab === "handwriting" && (
                    <HandwritingPanel 
                      onInsertText={handleInsertTextAtCursor} 
                    />
                  )}

                  {activeTab === "assistant" && (
                    <AIAssistantPanel 
                      documentContent={activeDoc?.content || ""} 
                    />
                  )}

                  {activeTab === "summary" && (
                    <SummaryPanel 
                      documentContent={activeDoc?.content || ""} 
                      onInsertContent={handleInsertTextAtCursor}
                    />
                  )}

                  {activeTab === "table" && (
                    <TableExtractorPanel 
                      documentContent={activeDoc?.content || ""} 
                      onInsertContent={handleInsertTextAtCursor}
                    />
                  )}

                  {activeTab === "templates" && (
                    <TemplatesPanel 
                      onInsertTemplate={handleReplaceContent}
                    />
                  )}
                  
                  {activeTab === "variables" && (
                    <VariablesPanel 
                      documentContent={activeDoc?.content || ""} 
                      onUpdateContent={handleUpdateContent} 
                    />
                  )}
                  
                  {activeTab === "formatting" && (
                    <FormattingPanel 
                      document={activeDoc} 
                      onUpdateStyle={handleUpdateStyle}
                      onTriggerSave={async () => {
                        const newList = await saveDocument(activeDoc);
                        setDocuments(newList);
                      }}
                    />
                  )}
                  
                  {activeTab === "signature" && (
                    <SignaturePanel 
                      onSelectSignatureForStamping={(sigId) => {
                        if (activeStampImage === sigId) {
                          // Force a re-trigger so the editor knows this is a "new" stamping session
                          setActiveStampImage(null);
                          setTimeout(() => setActiveStampImage(sigId), 10);
                        } else {
                          setActiveStampImage(sigId);
                        }
                        setMobileActiveView("document");
                      }} 
                      activeSignatureId={activeStampImage}
                      currentUser={currentUser}
                      onUpdateUser={setCurrentUser}
                      activeDocument={activeDoc || undefined}
                      onUpdateSignatures={handleUpdateSignatures}
                    />
                  )}

                  {activeTab === "moneroo" && (
                    <MonerooPanel 
                      currentPlan={plan} 
                      onUpgradeSuccess={handleUpgradePlan}
                    />
                  )}

                  {activeTab === "drive" && (
                    <DrivePanel 
                      onInsertContent={handleInsertTextAtCursor} 
                      onSetTitle={handleUpdateTitle}
                    />
                  )}

                  {activeTab === "profile" && (
                    <UserProfile 
                      user={currentUser} 
                      onUpdateSuccess={(updated) => setCurrentUser(updated)} 
                      onLogout={async () => {
                        await authService.logout();
                        setCurrentUser(null);
                      }} 
                    />
                  )}
                </div>
              </div>

            </div>

        {/* Right Side Workspace paper column */}
        <div className={`flex-1 h-full min-h-[500px] bg-slate-50 flex-col overflow-hidden ${
          mobileActiveView === "document" ? "flex" : "hidden lg:flex"
        }`}>
          {activeDoc ? (
            <DocumentEditor 
              document={activeDoc} 
              onChangeContent={handleUpdateContent}
              onChangeTitle={handleUpdateTitle}
              onChangeCoverImage={handleUpdateCoverImage}
              onChangeDocument={handleUpdateDocument}
              onUpdateSignatures={handleUpdateSignatures}
              onUpdateContentAndSignatures={handleUpdateContentAndSignatures}
              activeSignatureId={activeStampImage}
              onActivePageChange={setActivePageIndex}
              interimDictationText={interimDictationText}
              onClearActiveSignature={() => setActiveStampImage(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-100 text-slate-400 text-xs uppercase tracking-wider font-mono">
              Sélectionnez ou créez d'abord un document.
            </div>
          )}
        </div>
        </>
        )}

      </main>

      {/* Global Footer Status bar - Geometric Balance Signature */}
      <footer className="h-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-blue-500"}`}></div>
            <span className="text-[9px] font-mono uppercase text-slate-500">
              {isOnline ? "Connecté (Synchro. Auto)" : "Hors-ligne (Stockage local avec IndexedDB)"}
            </span>
          </div>
          <div className="w-px h-3 bg-slate-200"></div>
          <span className="text-[9px] font-mono text-slate-400">BUILD 2026.07.11-STABLE</span>
        </div>
        <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider hidden sm:block">
          &copy; 2026 Simplify • Chiffrement de bout en bout
        </div>
      </footer>

    </div>
  );
}
