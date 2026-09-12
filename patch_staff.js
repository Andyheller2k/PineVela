const fs = require('fs');
let code = fs.readFileSync('src/components/PageStaffDashboard.tsx', 'utf8');

// Sidebar button
code = code.replace(
  /activeTab === 'chat' \? 'text-amber-300' : 'text-emerald-700'/g,
  "activeTab === 'chat' ? 'text-sky-300' : 'text-blue-700'"
);
code = code.replace(
  /'bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-900\/25 border-emerald-500'/g,
  "'bg-gradient-to-r from-blue-700 to-sky-800 text-white shadow-lg shadow-blue-900/25 border-blue-500'"
);
code = code.replace(
  /'bg-emerald-50\/50 hover:bg-emerald-100\/80 text-emerald-950 border border-emerald-200\/60'/g,
  "'bg-blue-50/50 hover:bg-blue-100/80 text-blue-950 border border-blue-200/60'"
);
code = code.replace(
  /bg-emerald-400 text-slate-950/g,
  "bg-blue-400 text-white"
);
code = code.replace(
  /activeTab === 'chat' \? 'text-emerald-200' : 'text-slate-500'/g,
  "activeTab === 'chat' ? 'text-blue-200' : 'text-slate-500'"
);

// Main chat block replaces
let chatBlockStart = code.indexOf(`{/* ========================================================================= */}\n        {/* TAB 4: SECURE ENCRYPTED CHAT SYSTEM                                       */}`);
let chatBlockEnd = code.indexOf(`{/* View Offer Precise Location Modal */}`);

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
  fs.writeFileSync('src/components/PageStaffDashboard.tsx', code);
  console.log("Successfully patched PageStaffDashboard.");
} else {
  console.log("Could not find blocks in PageStaffDashboard.");
}
