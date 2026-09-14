const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'data', 'pinevela_store.json');
if (fs.existsSync(file)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.users = (data.users || []).filter(u => u.role === 'admin' || (u.user && u.user.role === 'admin'));
  data.managerRegistrationRequests = [];
  data.staff = [];
  data.staffApplications = [];
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('Cleared users and requests.');
}
