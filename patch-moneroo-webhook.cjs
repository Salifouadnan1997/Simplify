const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');

const webhookCode = `
// Webhook Moneroo.io pour la validation asynchrone des paiements
app.post("/api/webhooks/moneroo", express.json(), async (req, res) => {
  try {
    const webhookSecret = process.env.MONEROO_WEBHOOK_SECRET;
    const signature = req.headers["x-moneroo-signature"];

    if (webhookSecret && signature) {
      const crypto = require("crypto");
      const hash = crypto.createHmac("sha256", webhookSecret).update(JSON.stringify(req.body)).digest("hex");
      if (hash !== signature) {
        console.warn("Signature webhook Moneroo invalide.");
        return res.status(401).send("Signature invalide");
      }
    }

    const payload = req.body;
    console.log("Webhook Moneroo reçu :", payload);

    if (payload.event === "payment.successful") {
      const customerEmail = payload.data?.customer?.email;
      const planName = payload.data?.metadata?.planName || "Pro";
      
      console.log(\`Paiement validé pour l'email \${customerEmail}, souscription au plan \${planName}\`);
      
      // Ici, on mettrait à jour le rôle de l'utilisateur dans la base de données
      // Par exemple : await db.update(users).set({ role: planName }).where(eq(users.email, customerEmail));
    }

    res.status(200).send("Webhook reçu avec succès");
  } catch (err: any) {
    console.error("Erreur Webhook Moneroo:", err);
    res.status(500).send("Erreur interne du serveur");
  }
});

// 8. Génération de Documents (PDF & DOCX)
`;

serverTs = serverTs.replace('// 8. Génération de Documents (PDF & DOCX)', webhookCode);

// Add crypto import if not present
if (!serverTs.includes('import crypto from')) {
  serverTs = serverTs.replace('import express from "express";', 'import express from "express";\nimport crypto from "crypto";');
}

fs.writeFileSync('server.ts', serverTs);
