const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf-8');

code = code.replace(
  '6LcBJlItAAAAAKuj7-n6hecSr6NR_MemG2z5pCta',
  '6LdvOFItAAAA.....ALUn4pYVGGtW-yiAHNwCU'
);
fs.writeFileSync('index.html', code);
