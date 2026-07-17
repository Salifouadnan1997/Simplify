const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

code = code.replace(
  /const imageInteraction = await ai.interactions.create\(\{[\s\S]*?throw new Error\("No image generated"\);/m,
  `const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: \`\${prompt}, beautiful composition, elegant typography, highly legible text, clean UI background\`,
      config: {
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg",
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imageBytes = response.generatedImages[0].image.imageBytes;
      const imageUrl = \`data:image/jpeg;base64,\${imageBytes}\`;
      return res.json({ imageUrl, prompt });
    }
    
    throw new Error("No image generated");`
);

fs.writeFileSync('server.ts', code);
