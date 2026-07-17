const fs = require('fs');
let code = fs.readFileSync('src/lib/authService.ts', 'utf-8');

// Add sendPasswordResetEmail to imports
if (!code.includes('sendPasswordResetEmail')) {
  code = code.replace(/import \{.*?\} from "firebase\/auth";/, (match) => {
    return match.replace('}', ', sendPasswordResetEmail }');
  });
}

const resetMethod = `
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },
`;

if (!code.includes('resetPassword(')) {
  code = code.replace(/export const authService = \{/, 'export const authService = {\n' + resetMethod);
}

fs.writeFileSync('src/lib/authService.ts', code);
