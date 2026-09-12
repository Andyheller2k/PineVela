const fs = require('fs');

function replaceIframeWithObject(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  
  code = code.replace(
    /<iframe\n\s*src=\{docPreviewModal\.endpoint \|\| previewBlobUrl \|\| undefined\}\n\s*className="([^"]+)"\n\s*title="([^"]+)"\n\s*\/>/g,
    `<object
                      data={docPreviewModal.endpoint || previewBlobUrl || undefined}
                      type="application/pdf"
                      className="$1"
                      title="$2"
                    >
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 space-y-3">
                        <p className="text-sm font-medium">Unable to render PDF securely in this frame.</p>
                        <a href={docPreviewModal.endpoint || previewBlobUrl || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Open PDF in New Tab</a>
                      </div>
                    </object>`
  );
  
  fs.writeFileSync(filePath, code);
}

replaceIframeWithObject('src/components/PageAdminDashboard.tsx');
replaceIframeWithObject('src/components/PageManagerDashboard.tsx');
console.log("Updated to object tag");
