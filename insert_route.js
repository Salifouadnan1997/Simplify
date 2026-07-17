const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newRoute = `
// 10. Generate Cover Image with AI
app.post("/api/gemini/generate-cover", async (req, res) => {
  try {
    const { documentContent, title } = req.body;
    if (!documentContent) {
      return res.status(400).json({ error: "Aucun contenu fourni pour la génération de couverture." });
    }
    const ai = getGeminiClient();
    
    // First, analyze the content to generate a good prompt
    const analysisInteraction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: \`Analyse ce texte de document (\${title || 'Sans titre'}) et crée un prompt en anglais détaillé (maximum 2 phrases) pour générer une image de couverture stylée, de très haute qualité et abstraite ou conceptuelle qui représente ce contenu. N'inclut aucun texte dans l'image. Texte: \${documentContent.substring(0, 2000)}\`,
    });
    
    let prompt = "A clean, modern, high-quality abstract background image representing business document, photorealistic, professional";
    
    for (const step of analysisInteraction.steps) {
      if (step.type === 'model_output') {
        const textContent = step.content?.find(c => c.type === 'text');
        if (textContent && textContent.text) {
          prompt = textContent.text.trim();
        }
      }
    }
    
    // Clean up prompt if needed
    if (prompt.startsWith('\`\`\`')) {
        prompt = prompt.replace(/\`\`\`(text|)?/g, '').trim();
    }

    const imageInteraction = await ai.interactions.create({
      model: 'gemini-3.1-flash-image',
      input: \`\${prompt}, beautiful composition, no text, clean UI background\`,
      response_modalities: ['image'],
      generation_config: {
        image_config: {
          aspect_ratio: "16:9",
          image_size: "1K"
        },
      },
    });

    for (const step of imageInteraction.steps) {
      if (step.type === 'model_output') {
        const imageContent = step.content?.find(c => c.type === 'image');
        if (imageContent && imageContent.data) {
          const base64EncodeString = imageContent.data;
          const mimeType = imageContent.mime_type || 'image/png';
          const imageUrl = \`data:\${mimeType};base64,\${base64EncodeString}\`;
          return res.json({ imageUrl, prompt });
        }
      }
    }
    
    throw new Error("No image generated");

  } catch (error: any) {
    console.error("Erreur Generate Cover Gemini:", error);
    res.status(500).json({ error: error.message || "Erreur lors de la génération de la couverture." });
  }
});
`;

code = code.replace('// --- Configuration Serveur de développement Vite / Production ---', newRoute + '\n// --- Configuration Serveur de développement Vite / Production ---');
fs.writeFileSync('server.ts', code);
