const fs = require('fs');

let code = fs.readFileSync('src/lib/authService.ts', 'utf-8');

const setupRecaptcha = `
  setupRecaptcha(elementId: string) {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {}
      (window as any).recaptchaVerifier = undefined;
    }
    
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      'size': 'invisible',
    });
    
    return (window as any).recaptchaVerifier;
  },
`;

code = code.replace(/setupRecaptcha\(elementId: string\) \{[\s\S]*?return \(window as any\).recaptchaVerifier;\n  \},/, setupRecaptcha.trim() + ',');

fs.writeFileSync('src/lib/authService.ts', code);
