const fs = require('fs');
let code = fs.readFileSync('src/components/PageManagerDashboard.tsx', 'utf8');

// Update state definition
code = code.replace(
  "<{ title: string; type: 'cv' | 'id'; data: string; fileName?: string; name?: string } | null>",
  "<{ title: string; type: 'cv' | 'id'; data: string; fileName?: string; name?: string; endpoint?: string } | null>"
);

// Update first block: setDocPreviewModal for application CV
code = code.replace(
  /onClick=\{\(\) => setDocPreviewModal\(\{\n\s*title: `Curriculum Vitae \(CV\) — \$\{app\.applicantName\}`,\n\s*type: 'cv',\n\s*data: app\.cvData \|\| '',\n\s*fileName: app\.cvFileName \|\| 'Curriculum_Vitae\.pdf',\n\s*name: app\.applicantName\n\s*\}\)\}/g,
  `onClick={() => setDocPreviewModal({
                                      title: \`Curriculum Vitae (CV) — \${app.applicantName}\`,
                                      type: 'cv',
                                      data: app.cvData || '',
                                      fileName: app.cvFileName || 'Curriculum_Vitae.pdf',
                                      name: app.applicantName,
                                      endpoint: \`/api/staff-applications/\${app.id}/cv\`
                                    })}`
);

// Update iframe src rendering in docPreviewModal
code = code.replace(
  /<iframe\n\s*src=\{previewBlobUrl \|\| undefined\}\n\s*className="w-full h-\[520px\] rounded-xl border border-slate-300 shadow-inner bg-slate-50"\n\s*title="Document Viewer"\n\s*\/>/g,
  `<iframe
                                src={docPreviewModal.endpoint || previewBlobUrl || undefined}
                                className="w-full h-[520px] rounded-xl border border-slate-300 shadow-inner bg-slate-50"
                                title="Document Viewer"
                              />`
);

// Update the external link href as well
code = code.replace(
  /href=\{previewBlobUrl\}\n\s*target="_blank"/g,
  `href={docPreviewModal.endpoint || previewBlobUrl || '#'}\n                                    target="_blank"`
);

// Update text in the viewer
code = code.replace(
  /MIME: <strong className="text-blue-900">application\/pdf<\/strong> \(Sanitized Blob\)/g,
  `MIME: <strong className="text-blue-900">application/pdf</strong> {docPreviewModal.endpoint ? '(Backend Stream)' : '(Sanitized Blob)'}`
);

fs.writeFileSync('src/components/PageManagerDashboard.tsx', code);
console.log("Manager Dashboard Patched");
