const fs = require('fs');
let content = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');

// Replace the Ajouter Page button click handler
const btnSearch = `handleContentChange(doc.content + "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>");`;
const btnReplace = `handleContentChange(fullContent + "<div style=\\"break-before: column; height: 100%;\\"><br/></div>");`;
content = content.replace(btnSearch, btnReplace);

// Wrap paper in a height-constrained div
const paperSearch = `<div 
          ref={paperRef}
          className="relative transition-all origin-top-left"
          onClick={handlePaperClick}
          style={{
            transform: \`scale(\${zoom})\`,`;
const paperReplace = `<div style={{ width: "max-content", height: \`\${1122 * zoom}px\` }}>
        <div 
          ref={paperRef}
          className="relative transition-all origin-top-left"
          onClick={handlePaperClick}
          style={{
            transform: \`scale(\${zoom})\`,`;
content = content.replace(paperSearch, paperReplace);

const paperEndSearch = `style={getDocumentInlineStyles(doc.styleSettings)}
              />
            )}
          </div>
        </div>`;
const paperEndReplace = `style={getDocumentInlineStyles(doc.styleSettings)}
              />
            )}
          </div>
        </div>
        </div>`;
content = content.replace(paperEndSearch, paperEndReplace);

fs.writeFileSync('src/components/DocumentEditor.tsx', content);
