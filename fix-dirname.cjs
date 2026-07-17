const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf-8');

serverTs = serverTs.replace('const __filename = fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);', '');
serverTs = serverTs.replace('import { fileURLToPath } from "url";', '');

fs.writeFileSync('server.ts', serverTs);
