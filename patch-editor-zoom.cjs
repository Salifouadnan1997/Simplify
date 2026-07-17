const fs = require('fs');

let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

// Add zoom state
const stateHook = `  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });`;
const zoomState = `  const [zoom, setZoom] = useState(1);`;
content = content.replace(stateHook, stateHook + '\n' + zoomState);

// Add icons to import
const importLucide = `import { Move, Trash2, Maximize2, RotateCcw, Download, Loader2, FileDown, Eye, X } from "lucide-react";`;
const importLucideNew = `import { Move, Trash2, Maximize2, RotateCcw, Download, Loader2, FileDown, Eye, X, ZoomIn, ZoomOut, PlusCircle } from "lucide-react";`;
content = content.replace(importLucide, importLucideNew);

// Add zoom buttons and "Add Page" button to top bar
const topBarSearch = `<div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono hidden md:flex uppercase tracking-wider">`;
const topBarReplace = `<div className="flex items-center space-x-4">
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
content = content.replace(topBarSearch, topBarReplace + '\n          </div>');

// Apply zoom to the document canvas wrapper or the paper
const paperSearch = `className="relative transition-all"
          onClick={handlePaperClick}
          style={{
            height: "1122px",
            minWidth: "800px",
            width: "max-content",`;
const paperReplace = `className="relative transition-all origin-top-left"
          onClick={handlePaperClick}
          style={{
            transform: \`scale(\${zoom})\`,
            height: "1122px",
            minWidth: "800px",
            width: "max-content",`;
content = content.replace(paperSearch, paperReplace);

// Fix drag scaling
// In handleMouseMove:
// const mouseAbsoluteX = e.clientX - rect.left + wrapperElement.scrollLeft;
// We need to divide by zoom
const mouseMoveXSearch = `const mouseAbsoluteX = e.clientX - rect.left + wrapperElement.scrollLeft;`;
const mouseMoveXReplace = `const mouseAbsoluteX = (e.clientX - rect.left + wrapperElement.scrollLeft) / zoom;`;
content = content.replace(mouseMoveXSearch, mouseMoveXReplace);

const mouseMoveYSearch = `const mouseAbsoluteY = e.clientY - rect.top + wrapperElement.scrollTop;`;
const mouseMoveYReplace = `const mouseAbsoluteY = (e.clientY - rect.top + wrapperElement.scrollTop) / zoom;`;
content = content.replace(mouseMoveYSearch, mouseMoveYReplace);

// In startDrag:
const startDragXSearch = `const mouseAbsoluteX = e.clientX - rect.left + wrapperElement.scrollLeft;`;
const startDragXReplace = `const mouseAbsoluteX = (e.clientX - rect.left + wrapperElement.scrollLeft) / zoom;`;
content = content.replace(startDragXSearch, startDragXReplace);

const startDragYSearch = `const mouseAbsoluteY = e.clientY - rect.top + wrapperElement.scrollTop;`;
const startDragYReplace = `const mouseAbsoluteY = (e.clientY - rect.top + wrapperElement.scrollTop) / zoom;`;
content = content.replace(startDragYSearch, startDragYReplace);

// Swipe event handler on document-wrapper to allow swiping to add pages (or just scrolling right)
const scrollEventSearch = `onScroll={(e) => {`;
const scrollEventReplace = `onTouchEnd={(e) => {
          // Detect swipe right to left (very simple detection, usually you need touchstart as well)
          // Actually, if we are at the right edge, we might just want to add a page.
          const target = e.currentTarget;
          if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 10) {
             // We are at the end, maybe show a hint or add page
          }
        }}
        onScroll={(e) => {`;
content = content.replace(scrollEventSearch, scrollEventReplace);

fs.writeFileSync('src/components/DocumentEditor.tsx', content);

