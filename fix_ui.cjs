const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

// 1. Remove the cover block from inside index === 0
const coverRenderStr = `                  {/* Cover Image (Only on the very first page) */}
                  {index === 0 && (
                    <div className="mb-6 group relative">
                      {doc.coverImage ? (
                        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                          <img 
                            src={doc.coverImage} 
                            alt="Couverture du document" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {!(isExporting || isPreviewMode) && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                              <button
                                onClick={handleGenerateCover}
                                disabled={isGeneratingCover}
                                className="bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-2"
                              >
                                {isGeneratingCover ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-500" />}
                                <span>Générer à nouveau</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        !(isExporting || isPreviewMode) && (
                          <button
                            onClick={handleGenerateCover}
                            disabled={isGeneratingCover}
                            className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-all"
                          >
                            {isGeneratingCover ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 size={18} className="animate-spin text-amber-500" />
                                <span className="text-sm font-medium">Création par l'IA en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Sparkles size={18} className="text-amber-500" />
                                <span className="text-sm font-medium">Générer une couverture avec l'IA</span>
                              </div>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  )}

`;

code = code.replace(coverRenderStr, '');

// 2. Add the cover page before pages.map
const actualCoverPage = `              {/* FULL PAGE COVER IMAGE */}
              {doc.coverImage && (
                <div 
                  className={\`relative shrink-0 shadow-lg mx-auto transition-transform duration-300 \${sizeClass}\`}
                  style={{ backgroundColor: '#ffffff', overflow: 'hidden', padding: 0 }}
                >
                  <img 
                    src={doc.coverImage} 
                    alt="Page de couverture" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {!(isExporting || isPreviewMode) && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center z-50">
                      <button
                        onClick={handleGenerateCover}
                        disabled={isGeneratingCover}
                        className="bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-2 cursor-pointer shadow-xl"
                      >
                        {isGeneratingCover ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-500" />}
                        <span>Régénérer la couverture IA</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
`;
code = code.replace('{pages.map((pageHtml, index) => {', actualCoverPage + '\n              {pages.map((pageHtml, index) => {');

// 3. Add button in toolbar
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
            </button>
          )}

          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}`;

code = code.replace(/<button\s+onClick=\{\(\) => setIsPreviewMode\(!isPreviewMode\)\}/, toolbarBtn);

fs.writeFileSync('src/components/DocumentEditor.tsx', code);
