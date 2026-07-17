const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

code = code.replace(
  'id={`document-page-viewer-${index}`}',
  'id={`document-page-viewer-page-${index}`}'
);

code = code.replace(
  /const pages = Array\.from\(document\.querySelectorAll\("\[id\^='document-page-viewer-'\]"\)\);/,
  `const pages = Array.from(document.querySelectorAll("[id^='document-page-viewer-']"));
      // Make sure they are sorted logically if needed, but querySelectorAll returns in document order, which is perfect since cover is first.`
);

code = code.replace(
  /\{doc\.coverImage && \(\n\s*<div \n\s*className=\{\`relative shrink-0 shadow-lg mx-auto transition-transform duration-300 \$\{sizeClass\}\`\}/m,
  `{doc.coverImage && (
                <div 
                  id="document-page-viewer-cover"
                  className={\`relative shrink-0 shadow-lg mx-auto transition-transform duration-300 \${sizeClass}\`}`
);

fs.writeFileSync('src/components/DocumentEditor.tsx', code);
