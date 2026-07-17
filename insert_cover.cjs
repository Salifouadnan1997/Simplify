const fs = require('fs');
let code = fs.readFileSync('src/components/DocumentEditor.tsx', 'utf-8');

const generateCoverFn = `
  const handleGenerateCover = async () => {
    if (!onChangeCoverImage) return;
    setIsGeneratingCover(true);
    try {
      const response = await fetch('/api/gemini/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentContent: doc.content, title: doc.title })
      });
      const data = await response.json();
      if (data.imageUrl) {
        onChangeCoverImage(data.imageUrl);
      }
    } catch (err) {
      console.error("Erreur lors de la génération de la couverture:", err);
    } finally {
      setIsGeneratingCover(false);
    }
  };
`;

code = code.replace('const handleDuplicatePage =', generateCoverFn + '\n  const handleDuplicatePage =');
fs.writeFileSync('src/components/DocumentEditor.tsx', code);
