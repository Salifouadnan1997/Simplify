import { auth } from "./firebase";
import { signOut, signInWithPopup, GoogleAuthProvider, OAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInWithEmailAndPassword, createUserWithEmailAndPassword , sendPasswordResetEmail } from "firebase/auth";

export interface SavedSignature {
  id: string;
  name: string;
  image: string; // Base64
}

export interface UserProfile {
  id: string;
  email: string;
  phoneNumber?: string;
  role: "standard" | "admin";
  organization?: string;
  savedSignatures?: SavedSignature[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

const TOKEN_KEY = "saisie_pro_token";
const USER_KEY = "saisie_pro_user";

export const authService = {

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },

  
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
        headers: { "Authorization": `Bearer ${token}` }
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
        headers: { "Authorization": `Bearer ${token}` }
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

  async setSession(token: string, user: UserProfile) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async handleProviderLogin(providerType: "google" | "apple"): Promise<AuthSession> {
    const provider = providerType === "google" 
      ? new GoogleAuthProvider() 
      : new OAuthProvider('apple.com');
    
    if (providerType === "google") {
      (provider as GoogleAuthProvider).addScope('email');
      (provider as GoogleAuthProvider).addScope('profile');
    }
    
    const userCred = await signInWithPopup(auth, provider);
    const token = await userCred.user.getIdToken(true);
    
    const email = userCred.user.email || "";
    
    const userProfile: UserProfile = {
      id: userCred.user.uid,
      email: email,
      role: email === "salifouadnan1997@gmail.com" || email === "salifouadnan9190@gmail.com" ? "admin" : "standard",
      organization: "",
      savedSignatures: []
    };
    
    const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (response.ok) {
        const data = await response.json();
        if (data.user) {
            userProfile.role = data.user.role || userProfile.role;
            userProfile.organization = data.user.organization || "";
            userProfile.savedSignatures = data.user.savedSignatures || [];
        }
    }
    
    await this.setSession(token, userProfile);
    return { token, user: userProfile };
  },

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

  async loginWithPhone(phoneNumber: string, appVerifier: any): Promise<any> {
    console.log("Using simulated phone login for:", phoneNumber);
    return {
      confirm: async (code: string) => {
        const cleanNumber = phoneNumber.replace(/[^a-zA-Z0-9+]/g, "");
        const formattedId = phoneNumber.replace(/[^a-zA-Z0-9]/g, "");
        return {
          user: {
            uid: `mock-phone-${formattedId}`,
            email: `${formattedId}@phone-simplify.app`,
            phoneNumber: cleanNumber,
            getIdToken: async (forceRefresh?: boolean) => {
              return `mock-phone-${formattedId}`;
            }
          }
        };
      }
    };
  },

  async verifyPhoneCode(confirmationResult: any, code: string): Promise<AuthSession> {
    const userCred = await confirmationResult.confirm(code);
    const token = await userCred.user.getIdToken(true);
    
    const userProfile: UserProfile = {
      id: userCred.user.uid,
      email: userCred.user.email || "",
      phoneNumber: userCred.user.phoneNumber || "",
      role: "standard",
      organization: "",
      savedSignatures: []
    };
    
    const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
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

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    const cachedUser = localStorage.getItem(USER_KEY);

    if (!token) return null;

    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userProfile = data.user as UserProfile;
        localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
        return userProfile;
      } else {
        this.logout();
        return null;
      }
    } catch (err) {
      return cachedUser ? JSON.parse(cachedUser) : null;
    }
  },

  async updateProfile(updates: { email?: string; organization?: string; role?: string; savedSignatures?: SavedSignature[] }): Promise<UserProfile> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error("Vous devez être connecté pour modifier votre profil.");
    
    const userProfile = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
    const updatedUser = { ...userProfile, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    await this.setSession(token, updatedUser);
    
    return updatedUser as UserProfile;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    try {
        await signOut(auth);
    } catch(e) {}
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
};
