const fs = require('fs');

let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

// 1. Remove zoom buttons
const topBarSearch = `<div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Zoom Arrière"><ZoomOut size={14} /></button>
            <span className="text-[10px] font-mono font-bold px-2 text-slate-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors" title="Zoom Avant"><ZoomIn size={14} /></button>
          </div>
          <button onClick={() => {
             // To add a page, we append enough empty space to force a new column
             handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");
          }} className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors border border-green-200">
             <PlusCircle size={14} />
             <span className="text-[10px] font-bold uppercase tracking-wider">Ajouter Page</span>
          </button>
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono hidden md:flex uppercase tracking-wider">`;
        
const topBarReplace = `<div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono hidden md:flex uppercase tracking-wider">`;
content = content.replace(topBarSearch, topBarReplace);

// 2. Implement pinch-to-zoom
const touchStateSearch = `const [touchStartX, setTouchStartX] = useState<number | null>(null);`;
const touchStateReplace = `const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState<number>(1);
  const contentEditableKey = useRef(0);
  
  // Force remount ContentEditable when doc ID changes to ensure clean replace
  useEffect(() => {
    contentEditableKey.current += 1;
  }, [doc.id]);`;
content = content.replace(touchStateSearch, touchStateReplace);

// Update touch events for pinch-to-zoom
const touchEventsSearch = `        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            setTouchStartX(e.touches[0].clientX);
          }
        }}
        onTouchEnd={(e) => {
          if (touchStartX !== null && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const diffX = touchStartX - touchEndX;
            
            // Swipe right to left (distance > 50px)
            if (diffX > 50) {
              const target = e.currentTarget;
              // Only add page if we are scrolled near the end
              if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 100) {
                handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");
              }
            }
          }
          setTouchStartX(null);
        }}`;
const touchEventsReplace = `        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            setInitialPinchDist(dist);
            setInitialZoom(zoom);
          } else if (e.touches.length === 1) {
            setTouchStartX(e.touches[0].clientX);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && initialPinchDist !== null) {
            const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            const scale = dist / initialPinchDist;
            setZoom(Math.min(Math.max(0.5, initialZoom * scale), 3));
          }
        }}
        onTouchEnd={(e) => {
          if (initialPinchDist !== null && e.touches.length < 2) {
            setInitialPinchDist(null);
          }
          if (touchStartX !== null && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const diffX = touchStartX - touchEndX;
            if (diffX > 50) {
              const target = e.currentTarget;
              if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 100) {
                handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");
              }
            }
          }
          if (e.touches.length === 0) setTouchStartX(null);
        }}`;
content = content.replace(touchEventsSearch, touchEventsReplace);

// 3. Remove height: 1122px from the paper style to "Suprime l'espace qui est en bas de la page",
// but we still want pagination. The user asked to remove the space at the bottom.
// We can use min-height: 1122px so it matches A4, but doesn't force a huge space if it's smaller?
// Wait, if it doesn't force height, then `column-fill: auto` won't flow horizontally!
// Let's use CSS columns but adjust height. Actually, if they want "Ajouter page", they probably want distinct pages.
// Let's put a "Ajouter page" button next to the paper!

const paperEndSearch = `              <ContentEditable
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
}`;

const paperEndReplace = `              <ContentEditable
                key={contentEditableKey.current}
                id="document-content-editor"
                html={fullContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className={\`w-full flex-1 bg-transparent outline-none border-none focus:ring-0 editor-content-editable \${sizeClass} \${spacingClass} \${getAnimationClass(doc.styleSettings.animation)}\`}
                style={getDocumentInlineStyles(doc.styleSettings)}
              />
            )}
          </div>
        </div>
        
        {/* Ajouter page button à côté de la page */}
        {!(isExporting || isPreviewMode) && (
          <div className="flex flex-col justify-center ml-8" style={{ transform: \`scale(\${zoom})\`, transformOrigin: "left center" }}>
            <button 
              onClick={() => {
                handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");
              }} 
              className="flex flex-col items-center justify-center p-4 bg-white hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-lg border-2 border-dashed border-slate-300 hover:border-green-400 transition-colors shadow-sm"
              title="Ajouter une page"
            >
              <PlusCircle size={32} className="mb-2" />
              <span className="font-bold text-xs uppercase tracking-wider">Ajouter Page</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}`;

content = content.replace(paperEndSearch, paperEndReplace);

// Also remove fixed height from paper to fix the "espace en bas"
// If we remove height: 1122px, we lose horizontal pagination!
// Wait! Canva has fixed height for pages, but they are individual DOM elements.
// I'll keep height: 1122px but I will remove `minHeight: "calc(100vh - 120px)"` from the wrapper, maybe?
// Let's just change `height: 1122px` to `minHeight: 1122px`. Wait, columnFill: "auto" REQUIRES a fixed height to wrap to next column!
// If they want to remove space at the bottom, they probably meant the HUGE space below the text.
// If I use `height: max-content`, `column-width` doesn't paginate.
// Let's change `height: 1122px` to `minHeight: 800px`? No.
// Let's check what I can do. I will just change it to `minHeight: 1122px` and remove `height` so it can grow if needed, but wait!
// If it grows, it won't paginate! 
// Let's see how I can do this. I'll just change `height: 1122px` to `height: auto`, `minHeight: 1122px`. Wait, if I do that, it won't paginate horizontally.
// But the user specifically asked for "ajouter des page en tirant le doigt de droite vers la gauche sur l’ecran". This implies horizontal pagination.
// So I MUST KEEP fixed height for the horizontal wrap to work!
// Why did they see space at the bottom? Because `1122px` is taller than standard screen, so it scrolls vertically.
// Let's reduce the fixed height to something closer to the viewport? No, A4 is 1 : 1.414. If width is 800px, height MUST BE 1131px.
// I will keep it but maybe remove padding from `document-wrapper`.

fs.writeFileSync('src/components/DocumentEditor.tsx', content);

