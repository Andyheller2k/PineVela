const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'data', 'pinevela_store.json');
if (fs.existsSync(file)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.users = (data.users || []).filter(u => u.role === 'admin' || (u.user && u.user.role === 'admin'));
  data.managerRegistrationRequests = [];
  data.managerVerifications = []; // Wait, is this in data? Let me check persistentDb.ts. Ah, managerVerifications isn't directly in the interface? Oh, managerRegistrationRequests is.
  data.staff = [];
  data.staffApplications = [];
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('Cleared users and requests.');
}
