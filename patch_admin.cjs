const fs = require('fs');
let code = fs.readFileSync('src/components/PageAdminDashboard.tsx', 'utf8');

// Update state definition
code = code.replace(
  "<{ title: string; type: 'cv' | 'id'; data: string; fileName?: string; name?: string } | null>",
  "<{ title: string; type: 'cv' | 'id'; data: string; fileName?: string; name?: string; endpoint?: string } | null>"
);

// Update first block: setDocPreviewModal for application CV
code = code.replace(
  /onClick=\{\(\) => setDocPreviewModal\(\{\n\s*title: `Curriculum Vitae \(CV\) - \$\{staff\.name\}`,\n\s*name: staff\.name,\n\s*type: 'cv',\n\s*data: staff\.cvData \|\| `CURRICULUM VITAE\\n\\nName: \$\{staff\.name\}\\nEmail: \$\{staff\.email\}\\nPhone: \$\{staff\.phone\}\\nRole: \$\{staff\.role\}\\nExperience: \$\{staff\.yearsExperience \|\| '3 Years'\}\\n\\nQualifications & Summary:\\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.`,\n\s*fileName: staff\.cvFileName \|\| `\$\{staff\.name\}_CV\.pdf`\n\s*\}\)\}/g,
  `onClick={() => setDocPreviewModal({
                                  title: \`Curriculum Vitae (CV) - \${staff.name}\`,
                                  name: staff.name,
                                  type: 'cv',
                                  data: staff.cvData || \`CURRICULUM VITAE\\n\\nName: \${staff.name}\\nEmail: \${staff.email}\\nPhone: \${staff.phone}\\nRole: \${staff.role}\\nExperience: \${staff.yearsExperience || '3 Years'}\\n\\nQualifications & Summary:\\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.\`,
                                  fileName: staff.cvFileName || \`\${staff.name}_CV.pdf\`,
                                  endpoint: \`/api/staff-applications/\${staff.id}/cv\`
                                })}`
);

// Update second block: setDocPreviewModal for verified staff CV
code = code.replace(
  /onClick=\{\(\) => setDocPreviewModal\(\{\n\s*title: `Curriculum Vitae \(PDF\) - \$\{staff\.name\}`,\n\s*name: staff\.name,\n\s*type: 'cv',\n\s*data: staff\.cvData \|\| `CURRICULUM VITAE\\n\\nName: \$\{staff\.name\}\\nEmail: \$\{staff\.email\}\\nPhone: \$\{staff\.phone\}\\nRole: \$\{staff\.role\}\\nExperience: \$\{staff\.yearsExperience \|\| '3 Years'\}\\n\\nQualifications & Summary:\\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.`,\n\s*fileName: staff\.cvFileName \|\| `\$\{staff\.name\}_CV\.pdf`\n\s*\}\)\}/g,
  `onClick={() => setDocPreviewModal({
                                  title: \`Curriculum Vitae (PDF) - \${staff.name}\`,
                                  name: staff.name,
                                  type: 'cv',
                                  data: staff.cvData || \`CURRICULUM VITAE\\n\\nName: \${staff.name}\\nEmail: \${staff.email}\\nPhone: \${staff.phone}\\nRole: \${staff.role}\\nExperience: \${staff.yearsExperience || '3 Years'}\\n\\nQualifications & Summary:\\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.\`,
                                  fileName: staff.cvFileName || \`\${staff.name}_CV.pdf\`,
                                  endpoint: \`/api/staff-verifications/\${staff.userId || staff.id}/cv\`
                                })}`
);

// Also need to handle the case inside the Modal "selectedVerifiedStaffModal" around line 2568
code = code.replace(
  /setDocPreviewModal\(\{\n\s*title: `Curriculum Vitae \(PDF\) - \$\{selectedVerifiedStaffModal\.name\}`,\n\s*name: selectedVerifiedStaffModal\.name,\n\s*type: 'cv',\n\s*data: selectedVerifiedStaffModal\.cvData \|\| `CURRICULUM VITAE\\n\\nName: \$\{selectedVerifiedStaffModal\.name\}\\nEmail: \$\{selectedVerifiedStaffModal\.email\}\\nPhone: \$\{selectedVerifiedStaffModal\.phone\}\\nRole: \$\{selectedVerifiedStaffModal\.role\}\\nExperience: \$\{selectedVerifiedStaffModal\.yearsExperience \|\| '3 Years'\}\\n\\nQualifications & Summary:\\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.`,\n\s*fileName: selectedVerifiedStaffModal\.cvFileName \|\| `\$\{selectedVerifiedStaffModal\.name\}_CV\.pdf`\n\s*\}\)/g,
  `setDocPreviewModal({
                      title: \`Curriculum Vitae (PDF) - \${selectedVerifiedStaffModal.name}\`,
                      name: selectedVerifiedStaffModal.name,
                      type: 'cv',
                      data: selectedVerifiedStaffModal.cvData || \`CURRICULUM VITAE\\n\\nName: \${selectedVerifiedStaffModal.name}\\nEmail: \${selectedVerifiedStaffModal.email}\\nPhone: \${selectedVerifiedStaffModal.phone}\\nRole: \${selectedVerifiedStaffModal.role}\\nExperience: \${selectedVerifiedStaffModal.yearsExperience || '3 Years'}\\n\\nQualifications & Summary:\\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.\`,
                      fileName: selectedVerifiedStaffModal.cvFileName || \`\${selectedVerifiedStaffModal.name}_CV.pdf\`,
                      endpoint: \`/api/staff-verifications/\${selectedVerifiedStaffModal.userId || selectedVerifiedStaffModal.id}/cv\`
                    })`
);

// Update iframe src rendering in docPreviewModal
code = code.replace(
  /<iframe\n\s*src=\{previewBlobUrl \|\| undefined\}\n\s*className="w-full h-\[520px\] rounded-xl border border-slate-300 shadow-inner bg-white"\n\s*title="CV PDF Viewer"\n\s*\/>/g,
  `<iframe
                      src={docPreviewModal.endpoint || previewBlobUrl || undefined}
                      className="w-full h-[520px] rounded-xl border border-slate-300 shadow-inner bg-white"
                      title="CV PDF Viewer"
                    />`
);

// Update the external link href as well
code = code.replace(
  /href=\{previewBlobUrl\}\n\s*target="_blank"/g,
  `href={docPreviewModal.endpoint || previewBlobUrl || '#'}\n                            target="_blank"`
);

// Update text in the viewer
code = code.replace(
  /MIME: <strong className="text-blue-900">application\/pdf<\/strong> \(Sanitized Blob\)/g,
  `MIME: <strong className="text-blue-900">application/pdf</strong> {docPreviewModal.endpoint ? '(Backend Stream)' : '(Sanitized Blob)'}`
);

fs.writeFileSync('src/components/PageAdminDashboard.tsx', code);
console.log("Admin Dashboard Patched");
