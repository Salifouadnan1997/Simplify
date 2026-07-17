const fs = require('fs');

let code = fs.readFileSync('src/lib/authService.ts', 'utf-8');
const loginAndRegister = `
  async register(email: string, password: string, organization = "", role = "standard"): Promise<AuthSession> {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken(true);
        
    const userProfile: UserProfile = {
      id: userCred.user.uid,
      email: userCred.user.email || email,
      role: role as any,
      organization: organization || "",
      savedSignatures: []
    };
        
    await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Authorization": \`Bearer \${token}\` }
    });
    
    await this.setSession(token, userProfile);
    return { token, user: userProfile };
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken(true);
        
    const userProfile: UserProfile = {
      id: userCred.user.uid,
      email: userCred.user.email || email,
      role: "standard",
      organization: "",
      savedSignatures: []
    };
        
    const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Authorization": \`Bearer \${token}\` }
    });

    if (response.ok) {
        const data = await response.json();
        if (data.user) {
            userProfile.role = data.user.role || "standard";
            userProfile.organization = data.user.organization || "";
            userProfile.savedSignatures = data.user.savedSignatures || [];
        }
    }
    
    await this.setSession(token, userProfile);
    return { token, user: userProfile };
  },
`;

code = code.replace(/async setSession/g, loginAndRegister + '\n  async setSession');
code = code.replace(/signInWithPhoneNumber, ConfirmationResult \} from "firebase\/auth";/, 
  'signInWithPhoneNumber, ConfirmationResult, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";');

fs.writeFileSync('src/lib/authService.ts', code);
