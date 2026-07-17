const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');

// Replace imports and add Drizzle + auth
serverTs = serverTs.replace(
  'import { PDFDocument, StandardFonts, rgb } from "pdf-lib";',
  'import { PDFDocument, StandardFonts, rgb } from "pdf-lib";\nimport { db } from "./src/db/index.js";\nimport { documents, users } from "./src/db/schema.js";\nimport { eq, desc } from "drizzle-orm";\nimport { requireAuth } from "./src/middleware/auth.js";'
);

// We need to replace authenticateToken with requireAuth in document endpoints
// Let's just do a big replace for the document block

const docAPI = `// --- Document Management API Endpoints ---

// Create document
app.post("/api/documents", requireAuth, async (req: any, res: any) => {
  try {
    const { title, type, status, file_url } = req.body;
    const result = await db.insert(documents).values({
      userId: req.dbUser.id,
      title,
      type: type || 'document',
      content: file_url || '',
      styleSettings: {},
      signatures: []
    }).returning();
    res.json({ document: result[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List documents
app.get("/api/documents", requireAuth, async (req: any, res: any) => {
  try {
    const docs = await db.select().from(documents).where(eq(documents.userId, req.dbUser.id)).orderBy(desc(documents.createdAt));
    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get document detail
app.get("/api/documents/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const docs = await db.select().from(documents).where(eq(documents.id, Number(id)));
    if (!docs.length || docs[0].userId !== req.dbUser.id) return res.status(404).json({error: "Not found"});
    res.json({ document: docs[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update document
app.put("/api/documents/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const docs = await db.select().from(documents).where(eq(documents.id, Number(id)));
    if (!docs.length || docs[0].userId !== req.dbUser.id) return res.status(404).json({error: "Not found"});
    
    const result = await db.update(documents).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(documents.id, Number(id))).returning();
    res.json({ document: result[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete document
app.delete("/api/documents/:id", requireAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const docs = await db.select().from(documents).where(eq(documents.id, Number(id)));
    if (!docs.length || docs[0].userId !== req.dbUser.id) return res.status(404).json({error: "Not found"});
    
    await db.delete(documents).where(eq(documents.id, Number(id)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
`;

// Replace the old document API endpoints
const startIndex = serverTs.indexOf('// --- Document Management API Endpoints ---');
const endIndex = serverTs.indexOf('// Upload document file');

if (startIndex !== -1 && endIndex !== -1) {
  serverTs = serverTs.substring(0, startIndex) + docAPI + '\n' + serverTs.substring(endIndex);
}

fs.writeFileSync('server.ts', serverTs);
