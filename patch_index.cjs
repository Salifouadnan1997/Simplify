const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf-8');

if (!code.includes('recaptcha/enterprise.js')) {
  code = code.replace(
    '<head>',
    '<head>\n    <script src="https://www.google.com/recaptcha/enterprise.js?render=6LcBJlItAAAAAKuj7-n6hecSr6NR_MemG2z5pCta"></script>'
  );
}
fs.writeFileSync('index.html', code);
