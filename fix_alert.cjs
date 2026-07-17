const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

code = code.replace(
  /const data = await response\.json\(\);\n\s*if \(data\.imageUrl\) \{\n\s*onChangeCoverImage\(data\.imageUrl\);\n\s*\}/m,
  `const data = await response.json();
      if (response.ok && data.imageUrl) {
        onChangeCoverImage(data.imageUrl);
      } else {
        alert("Impossible de générer la couverture : " + (data.error || "Erreur inconnue"));
      }`
);

fs.writeFileSync('src/components/DocumentEditor.tsx', code);
