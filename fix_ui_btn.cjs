const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

const toolbarBtn = `
          {/* Cover Generation Button */}
          {!isPreviewMode && (
            <button
              onClick={handleGenerateCover}
              disabled={isGeneratingCover}
              className={\`flex items-center space-x-1.5 px-3 py-1.5 \${isGeneratingCover ? 'bg-amber-100 text-amber-600' : 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800'} rounded-md transition-colors border border-amber-200 text-xs font-bold cursor-pointer shadow-sm mr-1\`}
              title="Générer une page de couverture avec l'IA"
            >
              {isGeneratingCover ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span className="hidden sm:inline">{doc.coverImage ? "Changer Couverture" : "Couverture IA"}</span>
              <span className="inline sm:hidden">{doc.coverImage ? "Change." : "Couv. IA"}</span>
            </button>
          )}

          {isPreviewMode ? (`;

code = code.replace(/\{\s*isPreviewMode \? \(/, toolbarBtn);
fs.writeFileSync('src/components/DocumentEditor.tsx', code);
