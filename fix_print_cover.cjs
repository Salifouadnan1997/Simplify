const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

code = code.replace(
  /let pagesBodyHtml = "";\n\s*pagesList\.forEach\(\(pageContent, idx\) => \{/g,
  `let pagesBodyHtml = "";
    if (doc.coverImage) {
      pagesBodyHtml += \`
        <div class="print-page pdf-page" style="position: relative; width: 210mm; height: 297mm; box-sizing: border-box; background: white; page-break-after: always; overflow: hidden; margin: 0 auto; padding: 0;">
          <img src="\${doc.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      \`;
    }
    pagesList.forEach((pageContent, idx) => {`
);

fs.writeFileSync('src/components/DocumentEditor.tsx', code);
