const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/\{\/\* Supabase Status Indicator \*\/\}\s*<div className="flex items-center space-x-1\.5 bg-slate-50 px-2\.5 py-1 rounded-sm border border-slate-200">\s*<span className=\{\`w-1\.5 h-1\.5 rounded-full \$\{supabaseConnected \? "bg-green-500 animate-pulse" : "bg-slate-400"\}\`\}><\/span>\s*<span className="text-\[9px\] font-mono font-bold text-slate-600 uppercase tracking-wider">\s*\{supabaseConnected \? "SUPABASE: ONLINE" : "STOCKAGE LOCAL"\}\s*<\/span>\s*<\/div>/g, '');
fs.writeFileSync('src/App.tsx', code);
