import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IssueReport } from '../types';
import { 
  LogOut, 
  CheckCircle, 
  Clock, 
  Wrench, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle,
  Briefcase,
  User,
  ExternalLink,
  MessageSquare,
  Menu,
  X,
  RefreshCw,
  CheckCheck,
  ShieldCheck
} from 'lucide-react';
import PineLogo from './PineLogo';

export default function Page11StaffDashboard() {
  const { user, logout, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'tickets' | 'completed' | 'profile'>('tickets');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [assignedJobs, setAssignedJobs] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchJobs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list: IssueReport[] = await apiFetch('/api/issue-reports');
      // Filter issues assigned to this specific staff member
      const myJobs = list.filter(issue => issue.assignedStaffId === user.id);
      setAssignedJobs(myJobs);
    } catch (err) {
      console.error("Failed to load staff jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const handleMarkJobDone = async (issueId: string) => {
    try {
      const updated = await apiFetch(`/api/issue-reports/${issueId}`, {
        method: 'PUT',
        body: JSON.stringify({ staffCompleted: true })
      });
      setAssignedJobs(prev => prev.map(job => job.id === issueId ? updated : job));
      triggerToast('Job marked as done! Sent to manager. Awaiting student final confirmation.');
    } catch (err) {
      console.error("Failed to complete job:", err);
      triggerToast('Failed to update job status.');
    }
  };

  const pendingJobs = assignedJobs.filter(j => j && !j.staffCompleted && j.status !== 'Resolved');
  const completedJobs = assignedJobs.filter(j => j && (j.staffCompleted || j.status === 'Resolved'));

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800 text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <CheckCircle size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Full-Height Stationary Left Sidebar covering the entire side with curved edges */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 lg:w-72 bg-slate-900 text-slate-400 flex flex-col justify-between border-r border-slate-800
        transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-screen shrink-0 shadow-2xl lg:shadow-xl
        lg:rounded-r-[36px] overflow-hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Section with PineVela and Logo in sidebar theme */}
          <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="cursor-pointer flex items-center gap-2.5">
              <PineLogo variant="dark" size={32} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-white/15">
                Staff
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-4 flex-1 overflow-y-auto">
            {/* Quick Status Pill */}
            <div className="bg-white/5 rounded-3xl p-3.5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-white text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>On-Duty Maintenance</span>
              </div>
              <p className="text-[10px] text-slate-400">Assigned across licensed campus hostels</p>
            </div>

            {/* Side Tabs Navigation with fully curved pill edges */}
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab('tickets');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Wrench size={18} />
                  <span>Assigned Tickets</span>
                </div>
                {pendingJobs.length > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full">
                    {pendingJobs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('completed');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
                  activeTab === 'completed'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <CheckCheck size={18} />
                  <span>Completed Work</span>
                </div>
                {completedJobs.length > 0 && (
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full">
                    {completedJobs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <User size={18} />
                <span>My Info & Profile</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Staff Profile & Logout at bottom of sidebar with curved pill edges */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-amber-300 font-black text-xs shrink-0">
              {user?.name ? user.name.charAt(0) : 'S'}
            </div>
            <div className="text-left text-xs truncate">
              <p className="font-extrabold text-white truncate">{user?.name || 'Staff Specialist'}</p>
              <p className="text-slate-400 text-[10px] truncate">{user?.id || 'STAFF-MEMBER'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all text-left"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area: Scrolls independently while sidebar stays stationary */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0 bg-slate-50">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3 sticky top-0 z-20 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 hidden sm:inline">
                Staff Operations Portal
              </span>
              <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {activeTab === 'tickets' && 'Assigned Tickets'}
                {activeTab === 'completed' && 'Work History'}
                {activeTab === 'profile' && 'Technician Profile'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchJobs} 
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
              title="Refresh Tickets"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={logout}
              className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Tab Pane */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Job Tickets</h1>
                  <p className="text-slate-500 text-xs font-medium">Review pending physical issues, check location specs, and log completed work</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-bold mt-4">Syncing assigned jobs database...</p>
                </div>
              ) : pendingJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                    <Wrench size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">No Pending Jobs</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      You are currently all caught up! When hostel managers assign you maintenance tasks, they will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {pendingJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-6 shadow-xs transition-all space-y-5"
                    >
                      {/* Header Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              job.urgency === 'High' ? 'bg-red-100 text-red-800' :
                              job.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {job.urgency} Urgency
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <Clock size={11} /> {job.date}
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">{job.title}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 border border-amber-200">
                            ⚠️ Job In Progress
                          </span>
                        </div>
                      </div>

                      {/* Content columns */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Job Specs */}
                        <div className="md:col-span-2 space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Issue Description</span>
                            <p className="text-xs text-slate-700 italic leading-relaxed">
                              "{job.description || 'No description provided.'}"
                            </p>
                          </div>

                          {job.photos && job.photos.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Reported Photos</span>
                              <div className="flex gap-2">
                                {job.photos.map((url, index) => (
                                  <a 
                                    key={index} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="border border-slate-200 rounded-xl overflow-hidden hover:opacity-90 transition-opacity block shrink-0"
                                  >
                                    <img src={url} alt="physical proof" className="w-20 h-20 object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Location & Reporter details */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                              <MapPin size={12} className="text-slate-500" /> Location Specs
                            </span>
                            <div className="text-xs text-slate-700 font-semibold space-y-1">
                              <p>{job.hostelName}</p>
                              <p className="text-[11px] text-slate-500">{job.blockFloor} • Room: {job.roomBed}</p>
                            </div>
                          </div>

                          <div className="border-t border-slate-200 pt-3 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                              <User size={12} className="text-slate-500" /> Filer Student Info
                            </span>
                            <div className="text-xs text-slate-700 font-semibold space-y-1">
                              <p>{job.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{job.studentId}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-slate-100 gap-4">
                        <div className="text-[11px] text-slate-400 font-medium italic">
                          <span>Note: Once completed by you, the student confirms the resolution for final closure.</span>
                        </div>

                        <button
                          onClick={() => handleMarkJobDone(job.id)}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle size={15} /> Mark Job as Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Completed Work History</h1>
                <p className="text-slate-500 text-xs font-medium">Tickets that you have completed or that students have verified resolved</p>
              </div>

              {completedJobs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                    <CheckCheck size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">No Completed History Yet</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      As you fix and resolve maintenance issues, your logged accomplishments will be recorded here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-3xl border border-emerald-200 bg-emerald-50/20 p-6 space-y-4 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{job.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">{job.hostelName} • {job.blockFloor} (Room: {job.roomBed})</p>
                        </div>
                        {job.status === 'Resolved' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-200 self-start sm:self-auto">
                            ✓ Verified Resolved by Student
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 border border-blue-200 self-start sm:self-auto">
                            ⏳ Done by Staff • Awaiting Student Confirmation
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 italic">"{job.description}"</p>
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                        <span>Filer: {job.studentName} ({job.studentId})</span>
                        <span>Logged: {job.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Specialist Profile</h1>
                <p className="text-slate-500 text-xs font-medium">Your credentials and authorization in the PineVela operations network</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white font-black text-2xl flex items-center justify-center">
                    {user?.name ? user.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{user?.name}</h2>
                    <p className="text-xs text-blue-600 font-bold">{user?.role || 'Maintenance Staff'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">Staff ID: {user?.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">System Status</p>
                    <p className="text-sm font-black text-emerald-600 mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={14} /> Active & Verified
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Completed Tickets</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{completedJobs.length} Jobs Logged</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-[10px] text-slate-400 mt-auto shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 PineVela. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-600">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
