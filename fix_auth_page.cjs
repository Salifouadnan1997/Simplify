const fs = require('fs');

const code = `
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { authService, UserProfile } from "../lib/authService";
import { ShieldCheck, Loader2, Phone, KeyRound, Mail, ArrowRight, Building } from "lucide-react";

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

type AuthMode = "login" | "register" | "forgot";

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<"google" | "phone" | null>(null);
  
  // Phone auth state
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+33");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    // Initialize reCAPTCHA on mount
    try {
      authService.setupRecaptcha("recaptcha-container");
    } catch (e) {
      console.error("Recaptcha error", e);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const session = await authService.login(email, password);
        setSuccessMessage("Connexion réussie ! Chargement de l'espace de travail...");
        setTimeout(() => {
          onLoginSuccess(session.user);
        }, 1000);
      } else if (mode === "register") {
        const session = await authService.register(email, password, organization);
        setSuccessMessage("Compte créé avec succès ! Bienvenue sur Simplify.");
        setTimeout(() => {
          onLoginSuccess(session.user);
        }, 1000);
      } else {
        setSuccessMessage("Un email de réinitialisation a été envoyé à l'adresse indiquée.");
        setTimeout(() => {
          setMode("login");
        }, 3000);
      }
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        setError("L'authentification par email n'est pas activée. Veuillez l'activer dans la console Firebase.");
      } else if (err.code === "auth/email-already-in-use") {
         setError("Cette adresse email est déjà utilisée.");
      } else if (err.code === "auth/invalid-credential") {
         setError("Identifiants incorrects.");
      } else {
        setError(err.message || "Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProviderLogin = async (provider: "google") => {
    setError(null);
    setSuccessMessage(null);
    setProviderLoading(provider);
    
    try {
      const session = await authService.handleProviderLogin(provider);
      setSuccessMessage("Connexion réussie ! Chargement de l'espace de travail...");
      setTimeout(() => {
        onLoginSuccess(session.user);
      }, 1000);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Une erreur est survenue lors de la connexion.");
    } finally {
      setProviderLoading(null);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 5) {
      setError("Veuillez entrer un numéro de téléphone valide avec l'indicatif");
      return;
    }

    setError(null);
    setProviderLoading("phone");
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await authService.loginWithPhone(phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setSuccessMessage("Code SMS envoyé.");
    } catch (err: any) {
      console.error("Phone auth error:", err);
      setError(err.message || "Erreur lors de l'envoi du SMS.");
    } finally {
      setProviderLoading(null);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 4) {
      setError("Veuillez entrer le code reçu par SMS");
      return;
    }

    setError(null);
    setProviderLoading("phone");
    try {
      const session = await authService.verifyPhoneCode(confirmationResult, verificationCode);
      setSuccessMessage("Connexion réussie ! Chargement de l'espace de travail...");
      setTimeout(() => {
        onLoginSuccess(session.user);
      }, 1000);
    } catch (err: any) {
      console.error("Code verification error:", err);
      setError("Le code est invalide ou a expiré.");
    } finally {
      setProviderLoading(null);
    }
  };

  return (
    <div id="auth_page_container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
            <ShieldCheck size={28} id="auth_logo" />
          </div>
          <span className="font-sans font-bold text-2xl tracking-tight text-slate-900">
            Simplify <span className="text-blue-600 text-base font-medium px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-lg ml-1">v2.0</span>
          </span>
        </div>
        
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight mt-6 mb-2">
          {mode === "login" && "Connectez-vous à votre espace"}
          {mode === "register" && "Créez votre compte pro"}
          {mode === "forgot" && "Récupération de compte"}
        </h2>
        <p className="text-center text-sm text-slate-500 mb-8">
          {mode === "login" && (
            <>Nouveau sur Simplify ? <button onClick={() => setMode("register")} className="font-medium text-blue-600 hover:text-blue-500">Créer un compte</button></>
          )}
          {mode === "register" && (
            <>Déjà un compte ? <button onClick={() => setMode("login")} className="font-medium text-blue-600 hover:text-blue-500">Se connecter</button></>
          )}
          {mode === "forgot" && (
            <>Un trou de mémoire ? <button onClick={() => setMode("login")} className="font-medium text-blue-600 hover:text-blue-500">Retour à la connexion</button></>
          )}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100"
        >
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center">
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl text-center font-medium flex items-center justify-center gap-2">
              <ShieldCheck size={16} />
              {successMessage}
            </motion.div>
          )}

          {!showPhoneInput ? (
            <>
              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Adresse email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
                      placeholder="exemple@entreprise.com"
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                        Mot de passe
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs font-medium text-blue-600 hover:text-blue-500"
                        >
                          Mot de passe oublié ?
                        </button>
                      )}
                    </div>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} />
                      </div>
                      <input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                )}

                {mode === "register" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <label htmlFor="organization" className="block text-sm font-medium text-slate-700">
                      Nom de l'organisation <span className="text-slate-400 font-normal text-xs">(Optionnel)</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building size={16} />
                      </div>
                      <input
                        id="organization"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
                        placeholder="ex. Ma Société SAS"
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading || providerLoading !== null}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin mr-2" />
                    ) : (
                      <>
                        {mode === "login" && "Se connecter"}
                        {mode === "register" && "Créer mon compte"}
                        {mode === "forgot" && "Envoyer le lien"}
                        <ArrowRight size={16} className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Ou continuer avec</span>
                </div>
              </div>

              {/* External Providers */}
              <div className="space-y-3">
                <button
                  onClick={() => handleProviderLogin("google")}
                  disabled={providerLoading !== null || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {providerLoading === "google" ? (
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Google
                </button>

                <button
                  onClick={() => setShowPhoneInput(true)}
                  disabled={providerLoading !== null || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Phone size={18} className="text-slate-600" />
                  Numéro de téléphone
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {!confirmationResult ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                      Numéro de téléphone
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone size={16} />
                      </div>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
                        placeholder="+33612345678"
                        dir="ltr"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Inclure l'indicatif du pays (ex: +33)
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPhoneInput(false)}
                      className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={providerLoading === "phone"}
                      className="flex-[2] flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {providerLoading === "phone" ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        "Envoyer le code"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-slate-700">
                      Code de vérification SMS
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} />
                      </div>
                      <input
                        id="code"
                        type="text"
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm tracking-widest font-semibold text-slate-900 text-center"
                        placeholder="123456"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmationResult(null);
                        setVerificationCode("");
                      }}
                      className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={providerLoading === "phone"}
                      className="flex-[2] flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {providerLoading === "phone" ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        "Vérifier"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container"></div>
        </motion.div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/AuthPage.tsx', code);
