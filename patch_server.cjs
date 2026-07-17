const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const route = `
app.post("/api/verify-recaptcha", express.json(), async (req, res) => {
  try {
    const { token, action } = req.body;
    if (!token) return res.status(400).json({ error: "No token provided" });
    
    // In production, the API key should come from process.env
    const API_KEY = process.env.RECAPTCHA_API_KEY || "API_KEY";
    const url = \`https://recaptchaenterprise.googleapis.com/v1/projects/valid-amplifier-498710-r3/assessments?key=\${API_KEY}\`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: {
          token: token,
          expectedAction: action || "LOGIN",
          siteKey: "6LcBJlItAAAAAKuj7-n6hecSr6NR_MemG2z5pCta"
        }
      })
    });
    
    const data = await response.json();
    if (data.tokenProperties && data.tokenProperties.valid) {
      res.json({ success: true, score: data.riskAnalysis ? data.riskAnalysis.score : null });
    } else {
      res.status(400).json({ success: false, reason: data.tokenProperties ? data.tokenProperties.invalidReason : "Unknown error" });
    }
  } catch (error) {
    console.error("Recaptcha verification error:", error);
    res.status(500).json({ error: "Server error during verification" });
  }
});
`;

// Insert after 'const app = express();' or similar
code = code.replace(/const app = express\(\);/, 'const app = express();\n' + route);
fs.writeFileSync('server.ts', code);
