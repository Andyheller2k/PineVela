const fs = require('fs');

let code = fs.readFileSync('src/components/PageManagerDashboard.tsx', 'utf8');

code = code.replace(
  /<iframe\n\s*src=\{previewBlobUrl \|\| undefined\}\n\s*className="([^"]+)"\n\s*title="([^"]+)"\n\s*\/>/g,
  `<object
                              data={docPreviewModal.endpoint || previewBlobUrl || undefined}
                              type="application/pdf"
                              className="$1"
                              title="$2"
                            >
                              <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 space-y-3 p-6 text-center border border-slate-200 rounded-xl">
                                <p className="text-sm font-medium">Unable to render PDF securely in this frame.</p>
                                <a href={docPreviewModal.endpoint || previewBlobUrl || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Open PDF in New Tab</a>
                              </div>
                            </object>`
);

// Also need to update the iframe that might have docPreviewModal.endpoint already if I partially replaced it? No I didn't replace it because the regex failed completely.
code = code.replace(
  /<iframe\n\s*src=\{docPreviewModal\.endpoint \|\| previewBlobUrl \|\| undefined\}\n\s*className="([^"]+)"\n\s*title="([^"]+)"\n\s*\/>/g,
  `<object
                              data={docPreviewModal.endpoint || previewBlobUrl || undefined}
                              type="application/pdf"
                              className="$1"
                              title="$2"
                            >
                              <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 space-y-3 p-6 text-center border border-slate-200 rounded-xl">
                                <p className="text-sm font-medium">Unable to render PDF securely in this frame.</p>
                                <a href={docPreviewModal.endpoint || previewBlobUrl || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Open PDF in New Tab</a>
                              </div>
                            </object>`
);


fs.writeFileSync('src/components/PageManagerDashboard.tsx', code);
console.log("Updated to object tag");
