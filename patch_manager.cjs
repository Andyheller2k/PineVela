const fs = require('fs');
let code = fs.readFileSync('src/components/PageManagerDashboard.tsx', 'utf8');

let chatBlockStart = code.indexOf(`id="manager-secure-chat-container">`);
let chatBlockEnd = code.indexOf(`</main>`, chatBlockStart);

if (chatBlockStart > -1 && chatBlockEnd > -1) {
  let chatBlock = code.substring(chatBlockStart, chatBlockEnd);
  
  // Replace emerald with blue/sky
  chatBlock = chatBlock.replace(/emerald/g, 'blue');
  // Specific tweaks
  chatBlock = chatBlock.replace(/bg-blue-950/g, 'bg-slate-900/90 backdrop-blur-md');
  chatBlock = chatBlock.replace(/text-blue-100/g, 'text-sky-100');
  chatBlock = chatBlock.replace(/bg-blue-800\/80/g, 'bg-blue-800/80 backdrop-blur-sm');
  chatBlock = chatBlock.replace(/bg-blue-900\/80/g, 'bg-slate-950/50 backdrop-blur-sm');
  chatBlock = chatBlock.replace(/border-blue-800/g, 'border-white/10');
  chatBlock = chatBlock.replace(/bg-blue-500/g, 'bg-sky-500');
  
  // Update the code string
  code = code.substring(0, chatBlockStart) + chatBlock + code.substring(chatBlockEnd);
  fs.writeFileSync('src/components/PageManagerDashboard.tsx', code);
  console.log("Successfully patched PageManagerDashboard.");
} else {
  console.log("Could not find blocks in PageManagerDashboard.");
}
