const fs = require('fs');

const content = fs.readFileSync('src/components/FormattingPanel.tsx', 'utf8');

// I will fix `const downloadHTML = () => { Text Presets inspired by Canva's Styles de texte`
// Let's just fix it with sed
