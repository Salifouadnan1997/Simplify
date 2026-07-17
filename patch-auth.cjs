const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf-8');

const authMeAPI = `
// Replace handleMe with simple return of req.dbUser
app.get("/auth/me", requireAuth, (req: any, res: any) => {
  res.json({ success: true, user: req.dbUser });
});
app.get("/api/auth/me", requireAuth, (req: any, res: any) => {
  res.json({ success: true, user: req.dbUser });
});
`;

// Replace handleMe implementation
serverTs = serverTs.replace(/const handleMe = async [\s\S]+?app\.get\("\/api\/auth\/me", handleMe\);/m, authMeAPI);

fs.writeFileSync('server.ts', serverTs);
