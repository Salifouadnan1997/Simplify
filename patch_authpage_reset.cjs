const fs = require('fs');
let code = fs.readFileSync('src/components/AuthPage.tsx', 'utf-8');

const oldCode = `      } else {
        setSuccessMessage("Un email de réinitialisation a été envoyé à l'adresse indiquée.");
        setTimeout(() => {
          setMode("login");
        }, 3000);
      }`;

const newCode = `      } else {
        if (!email) throw new Error("Veuillez entrer votre adresse email");
        await authService.resetPassword(email);
        setSuccessMessage("Un email de réinitialisation a été envoyé à l'adresse indiquée.");
        setTimeout(() => {
          setMode("login");
        }, 3000);
      }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/AuthPage.tsx', code);
