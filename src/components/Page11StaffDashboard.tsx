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
  MessageSquare
} from 'lucide-react';
import PineLogo from './PineLogo';

export default function Page11StaffDashboard() {
  const { user, logout, apiFetch } = useAuth();
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <CheckCircle size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PineLogo />
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
            <span>Staff Portal: Maintenance Operations</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900">{user?.name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1 justify-end">
              <Briefcase size={10} /> Designated Staff
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Job Tickets</h1>
            <p className="text-slate-500 text-xs font-medium">Review pending issues, check location specs, and log completed work</p>
          </div>
          <button 
            onClick={fetchJobs} 
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Refresh Tickets
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold mt-4">Syncing assigned jobs database...</p>
          </div>
        ) : assignedJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <Wrench size={32} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">No Jobs Assigned</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                You are currently all caught up! When the hostel manager assigns you a physical concern, it will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {assignedJobs.map((job) => (
              <div 
                key={job.id} 
                className={`bg-white rounded-2xl border p-6 shadow-md transition-all space-y-6 ${
                  job.staffCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
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
                    {job.status === 'Resolved' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-200">
                        ✓ Fully Resolved & Closed
                      </span>
                    ) : job.staffCompleted ? (
                      <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 border border-blue-200 animate-pulse">
                        ⏳ Done by You • Awaiting Student Confirm
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 border border-amber-200">
                        ⚠️ Job In Progress
                      </span>
                    )}
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
                    {job.studentAcceptedResolved ? (
                      <span className="text-emerald-600 font-bold">✓ Student has already confirmed the fix is complete.</span>
                    ) : (
                      <span>Note: Once complete, student verification is needed for final closure.</span>
                    )}
                  </div>

                  {!job.staffCompleted && job.status !== 'Resolved' && (
                    <button
                      onClick={() => handleMarkJobDone(job.id)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <CheckCircle size={15} /> Mark Job as Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
