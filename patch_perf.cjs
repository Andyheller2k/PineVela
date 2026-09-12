const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('import compression from "compression";')) {
  code = code.replace(
    /import express from "express";/,
    'import express from "express";\nimport compression from "compression";'
  );
  
  code = code.replace(
    /app\.use\(express\.json\(\{ limit: '30mb' \}\)\);/,
    'app.use(compression());\n  app.use(express.json({ limit: \'30mb\' }));'
  );

  fs.writeFileSync('server.ts', code);
  console.log("Compression added");
} else {
  console.log("Already added");
}
