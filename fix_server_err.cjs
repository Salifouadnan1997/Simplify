const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /console\.error\("Erreur Generate Cover Gemini:", error\);\n\s*res\.status\(500\)\.json\(\{ error: error\.message \|\| "Erreur lors de la génération de la couverture\." \}\);/,
  `console.error("Erreur Generate Cover Gemini:", error.message || error);
    let errorMsg = error.message || "Erreur lors de la génération de la couverture.";
    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("limit: 0")) {
      errorMsg = "Génération d'images non disponible sur le forfait gratuit (Quota Exceeded). Veuillez utiliser une clé API associée à un compte facturable dans les Paramètres.";
    }
    res.status(500).json({ error: errorMsg });`
);

fs.writeFileSync('server.ts', code);
