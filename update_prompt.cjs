const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /\`Analyse ce texte de document.*?\`/g,
  `\`Analyse ce texte de document (\${title || 'Sans titre'}) et crée un prompt en anglais détaillé (maximum 2 phrases) pour générer une image de couverture stylée, de très haute qualité et abstraite ou conceptuelle qui représente ce contenu. L'image DOIT inclure le texte typographique élégant "\${title || 'Document'}". Texte: \${documentContent.substring(0, 2000)}\``
);

code = code.replace(
  /\`\$\{prompt\}, beautiful composition, no text, clean UI background\`/g,
  `\`\$\{prompt\}, beautiful composition, elegant typography, highly legible text, clean UI background\``
);

fs.writeFileSync('server.ts', code);
