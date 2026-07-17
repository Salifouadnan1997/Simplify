const fs = require('fs');
let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace("syncStatus?: 'synced' | 'draft';", "syncStatus?: 'synced' | 'draft';\n  templateVersion?: number;");
fs.writeFileSync('src/types.ts', typesContent);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  "const updatedDoc = { ...doc, content: htmlTemplate };",
  "const updatedDoc = { ...doc, content: htmlTemplate, templateVersion: (doc.templateVersion || 0) + 1 };"
);
fs.writeFileSync('src/App.tsx', appContent);

let docEdContent = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf8');
docEdContent = docEdContent.replace("key={contentEditableKey.current}", "key={doc.templateVersion || 0}");
fs.writeFileSync('src/components/DocumentEditor.tsx', docEdContent);
