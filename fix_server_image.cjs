const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const newRouteStr = `    const imageInteraction = await ai.interactions.create({
      model: 'gemini-3.1-flash-lite-image',
      input: \`\${prompt}, beautiful composition, elegant typography, highly legible text, clean UI background\`,
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
    
    throw new Error("No image generated");`;

code = code.replace(
  /const response = await ai.models.generateImages\(\{[\s\S]*?throw new Error\("No image generated"\);/m,
  newRouteStr
);

fs.writeFileSync('server.ts', code);
