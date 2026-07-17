const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace('height: number;', 'height: number;\n  pageIndex: number;');
fs.writeFileSync('src/types.ts', content);
