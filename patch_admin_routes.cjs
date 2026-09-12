const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /app\.put\("\/api\/manager-requests\/:id\/approve", async \(req: any, res\) => \{/g,
  'app.put("/api/manager-requests/:id/approve", requireAuth(["admin"]), async (req: any, res) => {'
);

code = code.replace(
  /app\.put\("\/api\/manager-requests\/:id\/reject", async \(req: any, res\) => \{/g,
  'app.put("/api/manager-requests/:id/reject", requireAuth(["admin"]), async (req: any, res) => {'
);

fs.writeFileSync('server.ts', code);
console.log("Admin routes patched");
