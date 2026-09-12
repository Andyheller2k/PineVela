const fs = require('fs');

function extractTabs(file) {
  const code = fs.readFileSync(file, 'utf8');
  const match = code.match(/\[\s*\{\s*id:\s*'[a-zA-Z_]+'[\s\S]*?\}\s*\]\.map/);
  if (match) {
    console.log(`\n--- TABS FOR ${file} ---\n` + match[0]);
  }
}

extractTabs('src/components/PageAdminDashboard.tsx');
extractTabs('src/components/PageManagerDashboard.tsx');

