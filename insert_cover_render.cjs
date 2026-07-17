const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

const coverRender = `
                  {/* Cover Image (Only on the very first page) */}
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

                  {/* Page Title (Only on the very first page) */}
`;

code = code.replace('                  {/* Page Title (Only on the very first page) */}', coverRender);
fs.writeFileSync('src/components/DocumentEditor.tsx', code);
