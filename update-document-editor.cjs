const fs = require('fs');

const content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

// Find the start of the rendering logic
const startIdx = content.indexOf('let pages: string[] = [];');
const endIdx = content.indexOf('return (', startIdx);

// Find the end of the return statement
const lastClosingBrace = content.lastIndexOf('}');
const endOfReturn = content.lastIndexOf(');', lastClosingBrace) + 2;

const newCode = `  // Backward compatibility: parse JSON array if it exists
  let fullContent = doc.content;
  try {
    const parsed = JSON.parse(doc.content);
    if (Array.isArray(parsed)) {
      fullContent = parsed.join("<br/><br/>");
      // Could trigger onChangeContent to upgrade here, but avoiding side effects in render
    }
  } catch (e) {
    // Already a string
  }

  const handleContentChange = (content: string) => {
    onChangeContent(content);
  };

  const handlePaperClick = () => {
    // Focus the content editable when clicking the paper background
    const editor = document.getElementById("document-content-editor");
    if (editor) editor.focus();
  };

  const theme = DOCUMENT_THEMES.find((t) => t.id === doc.styleSettings.themeId) || DOCUMENT_THEMES[0];
  const marginClass =
    doc.styleSettings.margins === "narrow"
      ? "p-4 sm:p-8"
      : doc.styleSettings.margins === "wide"
      ? "p-8 sm:p-20"
      : "p-6 sm:p-12";
  const spacingClass =
    doc.styleSettings.lineSpacing === "tight"
      ? "leading-tight"
      : doc.styleSettings.lineSpacing === "relaxed"
      ? "leading-relaxed"
      : "leading-normal";
  const sizeClass =
    doc.styleSettings.fontSize === "sm"
      ? "text-sm"
      : doc.styleSettings.fontSize === "lg"
      ? "text-lg"
      : doc.styleSettings.fontSize === "xl"
      ? "text-xl"
      : doc.styleSettings.fontSize === "2xl"
      ? "text-2xl"
      : doc.styleSettings.fontSize === "3xl"
      ? "text-3xl"
      : "text-base";

  // Signatures
  const startDrag = (e: React.MouseEvent, sig: DocumentSignature) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wrapperElement = document.getElementById("document-wrapper");
    if (!wrapperElement) return;
    
    const rect = wrapperElement.getBoundingClientRect();
    
    // Calculate the absolute position in the wrapper
    const pageOffset = sig.pageIndex * 832;
    const xInPx = (sig.x / 100) * 800;
    const yInPx = (sig.y / 100) * 1122;
    
    const absoluteLeft = xInPx + pageOffset;
    
    // e.clientX - rect.left gives the mouse position relative to the visible part of the wrapper
    // We add wrapperElement.scrollLeft to get the absolute mouse position in the scrollable wrapper
    const mouseAbsoluteX = e.clientX - rect.left + wrapperElement.scrollLeft;
    const mouseAbsoluteY = e.clientY - rect.top + wrapperElement.scrollTop;
    
    setDragOffset({
      x: mouseAbsoluteX - absoluteLeft,
      y: mouseAbsoluteY - yInPx,
    });
    
    setSelectedSigId(sig.id);
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedSigId) return;
      
      const wrapperElement = document.getElementById("document-wrapper");
      if (!wrapperElement) return;

      const rect = wrapperElement.getBoundingClientRect();
      
      const mouseAbsoluteX = e.clientX - rect.left + wrapperElement.scrollLeft;
      const mouseAbsoluteY = e.clientY - rect.top + wrapperElement.scrollTop;
      
      const newAbsoluteLeft = mouseAbsoluteX - dragOffset.x;
      const newAbsoluteTop = mouseAbsoluteY - dragOffset.y;
      
      let newPageIndex = Math.floor(newAbsoluteLeft / 832);
      if (newPageIndex < 0) newPageIndex = 0;
      
      const newXInPage = newAbsoluteLeft - (newPageIndex * 832);
      const newXPercent = (newXInPage / 800) * 100;
      const newYPercent = (newAbsoluteTop / 1122) * 100;

      const updated = doc.signatures.map(s => {
        if (s.id === selectedSigId) {
          return { ...s, x: newXPercent, y: newYPercent, pageIndex: newPageIndex };
        }
        return s;
      });
      onUpdateSignatures(updated);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, selectedSigId, dragOffset, doc.signatures, onUpdateSignatures]);

  const removeSignature = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateSignatures(doc.signatures.filter(s => s.id !== id));
    if (selectedSigId === id) {
      setSelectedSigId(null);
    }
  };

  const resizeSignature = (id: string, widthChange: number, heightChange: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = doc.signatures.map(s => {
      if (s.id === id) {
        return {
          ...s,
          width: Math.max(50, s.width + widthChange),
          height: Math.max(25, s.height + heightChange)
        };
      }
      return s;
    });
    onUpdateSignatures(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Document Topbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center space-x-3 w-full max-w-lg">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm border border-slate-200 uppercase">
            {doc.type || "Document"}
          </span>
          <input
            id="doc-title-input"
            type="text"
            value={doc.title}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="text-sm font-bold uppercase tracking-tight text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:ring-1 focus:ring-blue-500 rounded-sm px-2 py-1 transition-all w-full outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Titre du document"
            disabled={isPreviewMode}
          />
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono hidden md:flex uppercase tracking-wider">
          {!isPreviewMode && <span>Sauvegarde instantanée</span>}
          
          {isPreviewMode ? (
            <button
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-300"
            >
              <X size={14} />
              <span className="font-bold">Fermer l'aperçu</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPreviewMode(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md transition-colors border border-slate-200"
            >
              <Eye size={14} />
              <span className="font-bold">Aperçu</span>
            </button>
          )}

          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className={\`flex items-center space-x-1.5 px-3 py-1.5 \${isExporting ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-md transition-colors ml-2\`}
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span className="font-bold">{isExporting ? "Exportation..." : "Exporter PDF"}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div 
        id="document-wrapper"
        className="flex-1 overflow-x-auto overflow-y-auto bg-slate-200/50 flex items-start justify-start p-8 hide-scrollbar"
        style={{ minHeight: "calc(100vh - 120px)" }}
        onScroll={(e) => {
          if (onActivePageChange) {
            const scrollLeft = e.currentTarget.scrollLeft;
            const activeIndex = Math.round(scrollLeft / 832);
            onActivePageChange(activeIndex);
          }
        }}
      >
        <div 
          ref={paperRef}
          className="relative transition-all"
          onClick={handlePaperClick}
          style={{
            height: "1122px",
            minWidth: "800px",
            background: "repeating-linear-gradient(to right, white 0, white 800px, transparent 800px, transparent 832px)",
            filter: (isExporting || isPreviewMode) ? "none" : "drop-shadow(0 10px 15px rgba(0,0,0,0.1))",
            boxSizing: "border-box",
            paddingLeft: "48px",
            paddingRight: "48px",
            paddingTop: "48px",
            paddingBottom: "48px"
          }}
        >
          {/* Header decorative accent from active theme (repeats for every page using background gradient) */}
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ 
              background: \`repeating-linear-gradient(to right, \${theme.primary} 0, \${theme.primary} 800px, transparent 800px, transparent 832px)\` 
            }}
          />

          {/* Absolute Positioned Signatures Overlay */}
          {doc.signatures.map((sig) => {
            const pageOffset = sig.pageIndex * 832;
            const xPx = (sig.x / 100) * 800 + pageOffset;
            const yPx = (sig.y / 100) * 1122;

            return (
              <div
                key={sig.id}
                className={\`absolute group select-none transition-all \${
                  (isExporting || isPreviewMode) ? "" : \`cursor-move border-2 p-1 rounded-sm \${
                    selectedSigId === sig.id
                      ? "border-blue-500 bg-blue-50/10 z-20"
                      : "border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50/10 z-10"
                  }\`
                }\`}
                style={{
                  left: \`\${xPx}px\`,
                  top: \`\${yPx}px\`,
                  width: \`\${sig.width}px\`,
                  height: \`\${sig.height}px\`,
                }}
                onMouseDown={(e) => !(isExporting || isPreviewMode) && startDrag(e, sig)}
              >
                <img
                  src={sig.image}
                  alt={sig.name}
                  className="w-full h-full object-contain pointer-events-none"
                />
                
                {/* Signature Action buttons on hover */}
                {!(isExporting || isPreviewMode) && (
                  <>
                    <div className="absolute -top-9 right-0 bg-slate-900 text-white rounded-sm shadow-md px-1.5 py-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-30">
                      <button
                        type="button"
                        onClick={(e) => resizeSignature(sig.id, -20, -10, e)}
                        title="Rétrécir"
                        className="p-1 hover:bg-slate-800 rounded-sm text-slate-300 hover:text-white"
                      >
                        <span className="text-xs font-bold">-</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => resizeSignature(sig.id, 20, 10, e)}
                        title="Agrandir"
                        className="p-1 hover:bg-slate-800 rounded-sm text-slate-300 hover:text-white"
                      >
                        <span className="text-xs font-bold">+</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => removeSignature(sig.id, e)}
                        title="Supprimer"
                        className="p-1 hover:bg-red-900 rounded-sm text-red-400 hover:text-red-200"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {/* Move Indicator badge */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[8px] font-mono uppercase px-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      Faire glisser
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Document Content Block */}
          <div 
            className="flex-1 flex flex-col h-full"
            style={{
              height: "1026px", // 1122 - 48*2 padding
              columnWidth: "704px", // 800 - 48*2 padding
              columnGap: "128px", // 48 right + 32 transparent + 48 left
              columnFill: "auto",
              margin: 0,
              outline: "none"
            }}
          >
            <h1 
              className={\`text-2xl font-bold mb-6 text-slate-900 border-b pb-4 \${(isExporting || isPreviewMode) ? "" : "outline-none"}\`}
              style={{ color: theme.primary }}
            >
              {doc.title || "Document sans titre"}
            </h1>

            {(isExporting || isPreviewMode) ? (
              <div
                className={\`w-full flex-1 whitespace-pre-wrap break-words \${sizeClass} \${spacingClass} \${getAnimationClass(doc.styleSettings.animation)}\`}
                style={getDocumentInlineStyles(doc.styleSettings)}
                dangerouslySetInnerHTML={{ __html: fullContent }}
              >
              </div>
            ) : (
              <ContentEditable
                id="document-content-editor"
                html={fullContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className={\`w-full flex-1 bg-transparent outline-none border-none focus:ring-0 editor-content-editable \${sizeClass} \${spacingClass} \${getAnimationClass(doc.styleSettings.animation)}\`}
                style={getDocumentInlineStyles(doc.styleSettings)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
`;

const updatedContent = content.substring(0, startIdx) + newCode + "\n}\n";
fs.writeFileSync('src/components/DocumentEditor.tsx', updatedContent);
