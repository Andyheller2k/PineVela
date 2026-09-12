const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const profileStart = code.indexOf('// --- Staff Settings: Profile Sync with Manager\'s Staff Directory ---');
const profileEnd = code.indexOf('// --- Accredited Staff & Job Offers Endpoints ---');

if (profileStart > -1 && profileEnd > -1) {
  const profileBlock = code.substring(profileStart, profileEnd);
  code = code.substring(0, profileStart) + code.substring(profileEnd);
  
  const targetIndex = code.indexOf('app.put("/api/staff/:id"');
  code = code.substring(0, targetIndex) + profileBlock + '\n  ' + code.substring(targetIndex);
  
  fs.writeFileSync('server.ts', code);
  console.log("Successfully moved profile route.");
} else {
  console.log("Could not find blocks.");
}
