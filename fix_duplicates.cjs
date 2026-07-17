const fs = require('fs');

let code = fs.readFileSync('src/components/CoverRenderer.tsx', 'utf8');

// Find all occurrences of template-foi and template-law
let foiCount = (code.match(/if \(templateId === "template-foi"\)/g) || []).length;
let lawCount = (code.match(/if \(templateId === "template-law"\)/g) || []).length;

console.log("foiCount:", foiCount);
console.log("lawCount:", lawCount);

if (foiCount > 1 || lawCount > 1) {
    // Remove the duplicates at the bottom
    // We can regex replace the ones that I added... wait, the original ones were at the bottom?
    // Let me just replace the bottom ones with empty string.
}
