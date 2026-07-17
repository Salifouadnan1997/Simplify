const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

code = code.replace(
  /<input \n                      type="text"\n                      className=\{`text-2xl font-bold mb-6 w-full bg-transparent border-b pb-4 outline-none placeholder:text-slate-300 transition-colors \$\{\!\(isExporting \|\| isPreviewMode\) \? 'focus:border-b-blue-500 hover:border-b-slate-300' : 'border-b-transparent'\}\`\}\n                      style=\{\{ color: theme.primary \}\}\n                      value=\{doc.title \|\| ""\}\n                      placeholder="Document sans titre"\n                      onChange=\{\(e\) => onChangeTitle\(e.target.value\)\}\n                      readOnly=\{isExporting \|\| isPreviewMode\}\n                    \/>/g,
  `<textarea
                      className={\`text-2xl font-bold mb-6 w-full bg-transparent border-b pb-4 outline-none placeholder:text-slate-300 transition-colors resize-none overflow-hidden \${!(isExporting || isPreviewMode) ? 'focus:border-b-blue-500 hover:border-b-slate-300' : 'border-b-transparent'}\`}
                      style={{ color: theme.primary }}
                      value={doc.title || ""}
                      placeholder="Document sans titre"
                      onChange={(e) => {
                        onChangeTitle(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      readOnly={isExporting || isPreviewMode}
                      rows={1}
                    />`
);

fs.writeFileSync('src/components/DocumentEditor.tsx', code);
