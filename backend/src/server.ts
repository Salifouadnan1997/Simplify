import express from "express";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// --- Lazy clients initialization ---
let supabaseClient: any = null;
let aiClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error("Supabase URL and Anon Key are required in environment variables.");
    }
    supabaseClient = createClient(url, anonKey);
  }
  return supabaseClient;
}

function getGemini() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// In-Memory Database for local preview/demo mode fallback
const mockUsersDB = new Map<string, any>([
  [
    "salifouadnan1997@gmail.com",
    {
      id: "usr_mock_salifou",
      email: "salifouadnan1997@gmail.com",
      role: "admin",
      organization: "Saisie Pro HQ",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  [
    "test@saisiepro.com",
    {
      id: "usr_mock_test",
      email: "test@saisiepro.com",
      role: "standard",
      organization: "Entreprise Beta",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
]);

// Helper to authenticate request headers
const authenticateToken = async (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  // 1. Check if mock token
  if (token.startsWith("mock-jwt-token-")) {
    const mockId = token.replace("mock-jwt-token-", "");
    const mockUser = Array.from(mockUsersDB.values()).find(u => u.id === mockId);
    if (mockUser) return { user: mockUser, isMock: true, token };
    return null;
  }

  // 2. Real Supabase lookup
  try {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Fetch user role and details from public users table
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email,
        role: dbUser?.role || "standard",
        organization: dbUser?.organization || "",
        created_at: dbUser?.created_at || user.created_at,
        updated_at: dbUser?.updated_at || user.last_sign_in_at
      },
      isMock: false,
      token
    };
  } catch (e) {
    console.error("Auth token verification error:", e);
    return null;
  }
};

// --- API Endpoints ---

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

// --- User Authentication & Profile API Endpoints ---

// Register / Sign up
const handleRegister = async (req: any, res: any) => {
  try {
    const { email, password, role, organization } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "L'adresse email et le mot de passe sont requis." });
    }

    const assignedRole = email === "salifouadnan1997@gmail.com" ? "admin" : (role || "standard");
    let supabase: any = null;
    try {
      supabase = getSupabase();
    } catch (e) {
      // Supabase not configured yet
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        const { error: dbError } = await supabase
          .from("users")
          .upsert({
            id: data.user.id,
            email: data.user.email,
            role: assignedRole,
            organization: organization || "",
            updated_at: new Date().toISOString()
          });

        if (dbError) {
          console.error("Failed to insert profile record:", dbError);
        }

        return res.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: assignedRole,
            organization: organization || ""
          },
          session: data.session
        });
      }
    }

    // High fidelity local fallback simulation
    if (mockUsersDB.has(email)) {
      return res.status(400).json({ error: "Cet email est déjà enregistré." });
    }

    const id = "usr_mock_" + Math.random().toString(36).substring(2, 11);
    const mockUser = {
      id,
      email,
      role: assignedRole,
      organization: organization || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockUsersDB.set(email, mockUser);

    res.json({
      success: true,
      user: mockUser,
      session: {
        access_token: `mock-jwt-token-${id}`,
        expires_in: 3600,
        user: mockUser
      }
    });

  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ error: error.message || "Une erreur est survenue lors de l'inscription." });
  }
};

app.post("/auth/register", handleRegister);
app.post("/api/auth/register", handleRegister);

// Login
const handleLogin = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Veuillez fournir un email et un mot de passe." });
    }

    let supabase: any = null;
    try {
      supabase = getSupabase();
    } catch (e) {
      // Supabase not configured yet
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data.user) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        return res.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: dbUser?.role || "standard",
            organization: dbUser?.organization || ""
          },
          session: data.session
        });
      }
    }

    const mockUser = mockUsersDB.get(email);
    if (!mockUser) {
      return res.status(400).json({ error: "Identifiants de connexion invalides (Email non trouvé)." });
    }

    res.json({
      success: true,
      user: mockUser,
      session: {
        access_token: `mock-jwt-token-${mockUser.id}`,
        expires_in: 3600,
        user: mockUser
      }
    });

  } catch (error: any) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message || "Une erreur est survenue lors de la connexion." });
  }
};

app.post("/auth/login", handleLogin);
app.post("/api/auth/login", handleLogin);

// Current User info (me)
const handleMe = async (req: any, res: any) => {
  try {
    const authState = await authenticateToken(req);
    if (!authState) {
      return res.status(401).json({ error: "Session expirée ou invalide." });
    }

    res.json({
      success: true,
      user: authState.user
    });
  } catch (error: any) {
    console.error("Auth Me Error:", error);
    res.status(500).json({ error: error.message || "Une erreur est survenue." });
  }
};

app.get("/auth/me", handleMe);
app.get("/api/auth/me", handleMe);

// Profile Update
const handleUpdateProfile = async (req: any, res: any) => {
  try {
    const authState = await authenticateToken(req);
    if (!authState) {
      return res.status(401).json({ error: "Authentification requise." });
    }

    const { email, organization, role } = req.body;
    const isMock = authState.isMock;

    if (isMock) {
      const mockUser = authState.user;
      if (email && email !== mockUser.email) {
        mockUsersDB.delete(mockUser.email);
        mockUser.email = email;
        mockUsersDB.set(email, mockUser);
      }
      if (organization !== undefined) {
        mockUser.organization = organization;
      }
      if (role && mockUser.role === "admin") {
        mockUser.role = role;
      }
      mockUser.updated_at = new Date().toISOString();
      return res.json({ success: true, user: mockUser });
    }

    const supabase = getSupabase();
    if (supabase) {
      const payload: any = {
        id: authState.user.id,
        email: email || authState.user.email,
        organization: organization !== undefined ? organization : authState.user.organization,
        updated_at: new Date().toISOString()
      };

      if (role) {
        payload.role = role;
      }

      const { data, error } = await supabase
        .from("users")
        .upsert(payload)
        .select();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (email && email !== authState.user.email) {
        await supabase.auth.updateUser({ email });
      }

      return res.json({
        success: true,
        user: {
          id: authState.user.id,
          email: payload.email,
          role: data?.[0]?.role || authState.user.role,
          organization: payload.organization
        }
      });
    }

    res.status(400).json({ error: "Impossible de modifier le profil." });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: error.message || "Une erreur est survenue." });
  }
};

app.post("/auth/update", handleUpdateProfile);
app.post("/api/auth/update", handleUpdateProfile);

// Logout
const handleLogout = async (req: any, res: any) => {
  try {
    let supabase: any = null;
    try {
      supabase = getSupabase();
    } catch (e) {}
    if (supabase) {
      await supabase.auth.signOut();
    }
    res.json({ success: true, message: "Déconnexion réussie." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

app.post("/auth/logout", handleLogout);
app.post("/api/auth/logout", handleLogout);

// 2. Fetch all documents from Supabase (Database API proxy)
app.get("/api/documents", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header is required" });
    }

    const supabase = getSupabase();
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid user token" });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Save / Update a document in Supabase
app.post("/api/documents", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header is required" });
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid user token" });
    }

    const { title, content, meta_data } = req.body;
    const { data, error } = await supabase
      .from("documents")
      .upsert({
        user_id: user.id,
        title,
        content,
        meta_data,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    res.json(data?.[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Generate signed/secured PDF document and upload it to Supabase 'documents' Bucket
app.post("/api/documents/upload-signed", async (req, res) => {
  try {
    const { fileName, fileContentBase64, contentType } = req.body;
    const supabase = getSupabase();

    // Convert base64 to buffer for upload
    const buffer = Buffer.from(fileContentBase64, "base64");

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(`signed_${Date.now()}_${fileName}`, buffer, {
        contentType: contentType || "application/pdf",
        upsert: true
      });

    if (error) throw error;

    // Retrieve public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(data.path);

    res.json({
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server successfully listening on port ${PORT}`);
});
