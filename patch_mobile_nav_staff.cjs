const fs = require('fs');

let code = fs.readFileSync('src/components/PageStaffDashboard.tsx', 'utf8');

// Hide aside on mobile
code = code.replace(
  /<aside className="w-full lg:w-72 m-4 lg:my-6 lg:ml-6 h-auto lg:h-\[calc\(100vh-3rem\)\]/g,
  '<aside className="hidden lg:flex w-72 my-6 ml-6 h-[calc(100vh-3rem)]'
);

// Add mobile bottom spacing to main
code = code.replace(
  /<main className="flex-1 m-4 lg:my-6 lg:mr-6 h-auto lg:h-\[calc\(100vh-3rem\)\] overflow-y-auto/g,
  '<main className="flex-1 m-4 mb-24 lg:mb-6 lg:my-6 lg:mr-6 h-auto lg:h-[calc(100vh-3rem)] overflow-y-auto pb-24 lg:pb-8'
);

// Insert Mobile Header & Bottom Nav right before <aside>
const mobileBars = `
      {/* MOBILE HEADER (lg:hidden) */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-xl border-b border-sky-200/50 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <PineLogo size={24} />
          <div>
            <h1 className="text-xs font-black tracking-tight text-blue-950 leading-tight">PineVela Staff</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLogoutConfirm(true)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {[
            { id: 'apply', icon: Briefcase, label: 'Board' },
            { id: 'offers', icon: Briefcase, label: 'Offers', badge: jobOffers.filter(o => o.status === 'Pending').length },
            { id: 'notifications', icon: Bell, label: 'Alerts', badge: notifications.length },
            { id: 'settings', icon: Settings, label: 'Settings' },
            ...(approvedApp ? [{ id: 'chat', icon: MessageSquare, label: 'Chat', dot: true }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={\`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all relative \${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }\`}
            >
              <div className={\`p-1.5 rounded-lg \${activeTab === tab.id ? 'bg-blue-100/50' : ''}\`}>
                <tab.icon className={\`w-5 h-5 \${activeTab === tab.id ? 'scale-110 transition-transform' : ''}\`} />
                {tab.badge ? (
                  <span className="absolute top-1 right-3 w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                ) : null}
                {tab.dot ? (
                  <span className="absolute top-1 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                ) : null}
              </div>
              <span className={\`text-[9px] font-bold mt-0.5 \${activeTab === tab.id ? 'text-blue-700' : 'text-slate-500'}\`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* LEFT SIDEBAR NAVIGATION */}
`;

code = code.replace(
  /\{\/\* LEFT SIDEBAR NAVIGATION \*\/\}/g,
  mobileBars
);

// We need LogOut icon. Let's make sure it's imported.
if (!code.includes('LogOut')) {
  code = code.replace(/import \{([^}]+)\} from 'lucide-react';/, "import { $1, LogOut } from 'lucide-react';");
}

fs.writeFileSync('src/components/PageStaffDashboard.tsx', code);
console.log("Patched PageStaffDashboard.tsx mobile layout");
