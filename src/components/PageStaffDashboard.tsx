import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import PineLogo from './PineLogo';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import {
  Bell, Settings, Briefcase, CheckCircle2, Clock, XCircle, AlertCircle,
  Phone, Mail, User, Building2, FileText, UploadCloud, ChevronRight,
  ShieldCheck, ArrowRight, RefreshCw, Sparkles, MapPin, Eye, ExternalLink,
  Camera, Check, Lock, Send, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffApplication {
  id: string;
  staffId: string;
  staffUsername?: string;
  staffEmail: string;
  applicantName: string;
  phone: string;
  role: string;
  hostelId: string;
  hostelName: string;
  nationalId?: string;
  idDocumentUrl?: string;
  cvUrl?: string;
  cvData?: string;
  cvFileName?: string;
  coverLetter?: string;
  status: 'pending' | 'Approved' | 'Rejected';
  shift?: string;
  assignedBlock?: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  date?: string;
  read?: boolean;
}

export default function PageStaffDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const isStaffVerified = Boolean(
    user?.isVerified === true ||
    user?.verificationStatus === 'Verified' ||
    user?.verificationStatus === 'verified' ||
    user?.verificationStatus === 'approved'
  );

  // Active Tab: only 3 tabs as requested: notifications, apply, settings
  const [activeTab, setActiveTab] = useState<'notifications' | 'apply' | 'settings'>('apply');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Data States
  const [hostels, setHostels] = useState<any[]>([]);
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [staffRecord, setStaffRecord] = useState<any | null>(null);

  // Application Form States
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [appliedRole, setAppliedRole] = useState<string>('Facilities & Maintenance Technician');
  const [applicantPhone, setApplicantPhone] = useState<string>('');
  const [applicantNationalId, setApplicantNationalId] = useState<string>('');
  const [coverNote, setCoverNote] = useState<string>('');
  const [cvFileName, setCvFileName] = useState<string>('');
  const [cvData, setCvData] = useState<string>('');
  const [idDocFileName, setIdDocFileName] = useState<string>('');
  const [idDocData, setIdDocData] = useState<string>('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Settings / Profile Form States
  const [settingsName, setSettingsName] = useState<string>('');
  const [settingsUsername, setSettingsUsername] = useState<string>('');
  const [settingsEmail, setSettingsEmail] = useState<string>('');
  const [settingsPhone, setSettingsPhone] = useState<string>('');
  const [settingsPhoto, setSettingsPhoto] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState(false);

  // CV Preview Modal
  const [previewCv, setPreviewCv] = useState<{ name: string; data: string } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch accredited hostels
      const hostelsData = await apiFetch('/api/hostels').catch(() => []);
      const validHostels = (Array.isArray(hostelsData) ? hostelsData : []).filter((h: any) => {
        return h && !h.isDeleted && (h.isApproved === true || h.approvalStatus === 'Approved' || h.status === 'Approved');
      });
      setHostels(validHostels);
      if (validHostels.length > 0 && !selectedHostelId) {
        setSelectedHostelId(validHostels[0].id);
      }

      // 2. Fetch staff applications
      const appsData = await apiFetch('/api/staff-applications').catch(() => []);
      setApplications(Array.isArray(appsData) ? appsData : []);

      // 3. Fetch notifications
      const notifsData = await apiFetch('/api/notifications').catch(() => []);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);

      // 4. Fetch staff record to see if user has already been approved
      const allStaff = await apiFetch('/api/staff').catch(() => []);
      const myStaff = Array.isArray(allStaff)
        ? allStaff.find((s: any) => s.userId === user?.id || s.email?.toLowerCase() === user?.email?.toLowerCase() || s.id === user?.id)
        : null;
      setStaffRecord(myStaff || null);

      // If approved, default to notifications or apply view
      if (myStaff && activeTab === 'apply') {
        // Can remain on apply or view status
      }
    } catch (err: any) {
      console.error("Error loading staff console data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Sync settings inputs when user changes
  useEffect(() => {
    if (user) {
      setSettingsName(user.name || '');
      setSettingsUsername(user.username || (user as any).userName || '');
      setSettingsEmail(user.email || '');
      setSettingsPhone(user.phone || (user as any).phoneNumber || '');
      setSettingsPhoto(user.photo || user.avatar || (user as any).profilePicture || '');
      setApplicantPhone(user.phone || '');
      setApplicantNationalId((user as any).nationalId || '');
    }
  }, [user]);

  const [showVerificationSuccessBanner, setShowVerificationSuccessBanner] = useState(true);

  // Find active pending application
  const activePendingApp = applications.find(a => a.status === 'pending');
  // Find approved application (ONLY if job application approved or staff explicitly appointed to hostel)
  const approvedApp = applications.find(a => (a.status as string) === 'Approved' || (a.status as string) === 'approved') || (staffRecord && staffRecord.hostelId && (staffRecord.isApproved === true || staffRecord.status === 'Approved') ? {
    id: staffRecord.id,
    role: staffRecord.role,
    hostelName: staffRecord.hostelName || 'Accredited Residence',
    shift: staffRecord.shift || 'Day Shift',
    assignedBlock: staffRecord.assignedBlock || 'All Wings',
    status: 'Approved',
    appliedAt: staffRecord.createdAt || new Date().toISOString()
  } as any : null);

  // File Upload Handlers (CV & ID)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'id') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'cv') {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        triggerToast("CV document MUST be in PDF format (.pdf)", 'error');
        return;
      }
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerToast("File size cannot exceed 5MB.", 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'cv') {
        setCvFileName(file.name);
        setCvData(result);
        triggerToast(`CV PDF "${file.name}" attached successfully!`, 'success');
      } else {
        setIdDocFileName(file.name);
        setIdDocData(result);
        triggerToast(`ID Document "${file.name}" attached successfully!`, 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      triggerToast("Image file size should be less than 3MB.", 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSettingsPhoto(result);
      triggerToast("New profile picture preview loaded. Tap Save to apply.", 'info');
    };
    reader.readAsDataURL(file);
  };

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activePendingApp) {
      triggerToast("You already have an active application under review. You cannot enroll into other roles until a decision is finalized.", 'error');
      return;
    }

    if (!selectedHostelId) {
      triggerToast("Please choose an accredited hostel to apply to.", 'error');
      return;
    }

    if (!applicantPhone) {
      triggerToast("Please enter your contact phone number.", 'error');
      return;
    }

    if (!cvData) {
      triggerToast("Please upload your Curriculum Vitae (CV / Resume).", 'error');
      return;
    }

    const targetHostel = hostels.find(h => h.id === selectedHostelId);
    if (!targetHostel) {
      triggerToast("Selected hostel could not be found.", 'error');
      return;
    }

    setSubmittingApp(true);
    try {
      const newApp = await apiFetch('/api/staff-applications', {
        method: 'POST',
        body: JSON.stringify({
          applicantName: user?.name || settingsName || 'Staff Applicant',
          phone: applicantPhone,
          email: user?.email || settingsEmail,
          role: appliedRole,
          hostelId: targetHostel.id,
          hostelName: targetHostel.name,
          nationalId: applicantNationalId,
          idDocumentUrl: idDocData,
          cvData: cvData,
          cvFileName: cvFileName || 'Resume_CV.pdf',
          coverLetter: coverNote
        })
      });

      setApplications(prev => [newApp, ...prev]);
      triggerToast(`Application submitted! Your CV has been sent to the manager of ${targetHostel.name}.`, 'success');
      
      // Reset upload states
      setCvData('');
      setCvFileName('');
      setIdDocData('');
      setIdDocFileName('');
      setCoverNote('');

      // Refresh data
      loadData();
    } catch (err: any) {
      triggerToast(err?.message || "Failed to submit application. Please try again.", 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Save Settings: Directly updates user credentials and updates manager's staff directory
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settingsEmail) {
      triggerToast("Email address is required.", 'error');
      return;
    }

    setSavingSettings(true);
    try {
      const res = await apiFetch('/api/staff/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: settingsName,
          username: settingsUsername,
          email: settingsEmail,
          phone: settingsPhone,
          profilePicture: settingsPhoto
        })
      });

      if (res.user && updateUser) {
        updateUser(res.user);
      }

      triggerToast("Profile updated successfully! All contact details are directly synchronized with your manager's staff directory.", 'success');
      loadData();
    } catch (err: any) {
      triggerToast(err?.message || "Failed to update profile settings.", 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row relative text-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30' 
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
              : 'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <LogoutConfirmationModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
            navigate('/login');
          }}
        />
      )}

      {/* CV Preview Modal */}
      {previewCv && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">{previewCv.name}</h3>
              </div>
              <button onClick={() => setPreviewCv(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1">
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-50 p-4 rounded-xl border border-slate-200">
              {previewCv.data.startsWith('data:image') ? (
                <img src={previewCv.data} alt="CV Document" className="w-full object-contain max-h-[60vh] rounded-lg" />
              ) : previewCv.data.startsWith('data:application/pdf') ? (
                <iframe src={previewCv.data} title="CV PDF" className="w-full h-[60vh] rounded-lg border-0" />
              ) : (
                <div className="text-xs text-slate-600 whitespace-pre-wrap font-mono p-4">
                  {previewCv.data.substring(0, 1000)}...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 m-4 lg:my-6 lg:ml-6 h-auto lg:h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto z-20">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center space-x-3 px-2">
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                PineVela Staff
              </h1>
              <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">Team Operations</p>
            </div>
          </div>

          {/* Staff Member Profile Card */}
          <div className="p-3.5 bg-white/80 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              {settingsPhoto || user?.photo || user?.avatar ? (
                <img 
                  src={settingsPhoto || user?.photo || user?.avatar} 
                  alt="Staff Avatar" 
                  className="w-10 h-10 rounded-xl object-cover border border-blue-200 shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                  {user?.name?.[0] || 'S'}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Staff Member'}</div>
                <div className="text-[10px] font-semibold text-blue-700 flex items-center gap-1">
                  {approvedApp ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                      <span className="truncate text-emerald-700 font-bold">{approvedApp.role || 'Enrolled Staff'}</span>
                    </>
                  ) : activePendingApp ? (
                    <>
                      <Clock className="w-3 h-3 text-amber-600 inline shrink-0" />
                      <span className="truncate text-amber-700 font-bold">Application Pending</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-3 h-3 text-slate-500 inline shrink-0" />
                      <span className="truncate text-slate-600 font-medium">Ready to Apply</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              title="Staff Profile Settings"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* The 3 Tabs as requested: Notifications, Apply, Settings */}
          <nav className="space-y-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Staff Portal</p>
            
            {/* Tab 1: Apply (Job Board & Active Application) */}
            <button
              onClick={() => setActiveTab('apply')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'apply'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/25'
                  : 'bg-white/40 hover:bg-white/80 text-slate-700 border border-slate-200/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className={`w-4 h-4 ${activeTab === 'apply' ? 'text-amber-300' : 'text-blue-700'}`} />
                <div className="text-left">
                  <div>Apply & Vacancies</div>
                  <div className={`text-[10px] font-normal ${activeTab === 'apply' ? 'text-blue-200' : 'text-slate-500'}`}>
                    {approvedApp ? 'My Appointed Role' : activePendingApp ? 'Under Review' : 'Find Hostel Work'}
                  </div>
                </div>
              </div>
              {activePendingApp ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950">
                  Review
                </span>
              ) : approvedApp ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-400 text-emerald-950">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-100 text-blue-900">
                  Open
                </span>
              )}
            </button>

            {/* Tab 2: Notifications */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/25'
                  : 'bg-white/40 hover:bg-white/80 text-slate-700 border border-slate-200/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-amber-300' : 'text-blue-700'}`} />
                <div className="text-left">
                  <div>Notifications</div>
                  <div className={`text-[10px] font-normal ${activeTab === 'notifications' ? 'text-blue-200' : 'text-slate-500'}`}>
                    Management alerts & updates
                  </div>
                </div>
              </div>
              {notifications.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                  activeTab === 'notifications' ? 'bg-amber-400 text-slate-950' : 'bg-blue-900 text-white'
                }`}>
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Tab 3: Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-900 text-white shadow-lg shadow-blue-900/25'
                  : 'bg-white/40 hover:bg-white/80 text-slate-700 border border-slate-200/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-amber-300' : 'text-blue-700'}`} />
                <div className="text-left">
                  <div>Staff Settings</div>
                  <div className={`text-[10px] font-normal ${activeTab === 'settings' ? 'text-blue-200' : 'text-slate-500'}`}>
                    Profile & directory sync
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'text-blue-300' : 'text-slate-400'}`} />
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-sky-200/80 space-y-3">
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/40 text-[11px] text-blue-900 font-medium">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PineVela Staff Network</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-0.5">Accredited student housing personnel system.</p>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/60 hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <main className="flex-1 m-4 lg:my-6 lg:mr-6 h-auto lg:h-[calc(100vh-3rem)] overflow-y-auto bg-gradient-to-br from-white/95 via-sky-50/50 to-blue-50/30 backdrop-blur-2xl border border-sky-200/70 shadow-2xl rounded-3xl p-6 md:p-8 space-y-8">
        {/* TOP STATUS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded-md border border-blue-200">
                Staff Console
              </span>
              <span className="text-xs text-slate-500 font-semibold">Academic Year 2026/2027</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
              {activeTab === 'apply' && 'Staff Applications & Job Board'}
              {activeTab === 'notifications' && 'Operational Notifications'}
              {activeTab === 'settings' && 'Staff Account & Profile Settings'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-900 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
              title="Refresh console state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{user?.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">@{user?.username || 'staff'}</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: APPLY (JOB BOARD, ACTIVE APPLICATION & APPLICATION SUBMISSION) */}
        {/* ========================================================================= */}
        {activeTab === 'apply' && (
          <div className="space-y-8">
            {/* VERIFIED STAFF WELCOME GREEN BANNER */}
            {isStaffVerified && showVerificationSuccessBanner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl shadow-xl border border-emerald-400 relative overflow-hidden"
              >
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-md">
                      <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-black uppercase tracking-wider border border-emerald-300/30">
                          Admin Credential Verified
                        </span>
                        <span className="text-xs text-emerald-200 font-bold">• Account Unlocked</span>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        🎉 Welcome! Your Staff Account Credentials Are Verified!
                      </h3>
                      <p className="text-xs text-emerald-100 leading-relaxed font-medium max-w-2xl">
                        PineVela Super Administration has reviewed and approved your <strong>Curriculum Vitae (CV)</strong> and <strong>National ID</strong> credentials. You are now fully unlocked to browse accredited university hostels and submit job applications!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => {
                        const el = document.getElementById('accredited-hostels-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-5 py-3 rounded-2xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <span>Apply For Work Now</span>
                      <ArrowRight className="w-4 h-4 text-emerald-700" />
                    </button>
                    <button
                      onClick={() => setShowVerificationSuccessBanner(false)}
                      className="p-2.5 rounded-2xl bg-emerald-700/60 hover:bg-emerald-800/80 text-white/80 hover:text-white transition-all cursor-pointer"
                      title="Dismiss notice"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* UNVERIFIED STAFF CREDENTIAL LOCK BANNER */}
            {!isStaffVerified && (
              <div className="p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-2 border-amber-300 rounded-3xl shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-lg shadow-amber-500/30">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">
                        Staff Account Verification Required Before Applying
                      </h3>
                      <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-200 text-amber-950 border border-amber-300">
                        Admin Review Pending
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Your registered <strong>Curriculum Vitae (CV)</strong> and <strong>National ID (Ghana Card)</strong> documents have been forwarded to the PineVela Super Administrator verification desk under the <strong>Verified Staffs</strong> tab.
                    </p>
                    <div className="p-3 bg-white/90 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Job applications for accredited hostels remain <strong>LOCKED</strong> until an Administrator reviews and approves your credentials. Once verified, options to apply for jobs will immediately unlock!</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVE APPOINTMENT OR PENDING STATUS BANNER */}
            {approvedApp ? (
              <div className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border-2 border-emerald-300 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Appointed & Enrolled Staff Member</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Official Appointment: {approvedApp.role}
                  </h3>
                  <p className="text-xs text-slate-700 font-medium">
                    Property: <strong className="text-slate-950 font-bold">{approvedApp.hostelName}</strong> | Assigned Shift: <strong className="text-slate-950 font-bold">{approvedApp.shift || 'Day Shift'}</strong> | Wing: <strong className="text-slate-950 font-bold">{approvedApp.assignedBlock || 'All Blocks'}</strong>
                  </p>
                </div>
                <div className="px-4 py-3 bg-white/90 border border-emerald-200 rounded-2xl text-center shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status</span>
                  <span className="text-sm font-black text-emerald-800">Active On Duty</span>
                </div>
              </div>
            ) : activePendingApp ? (
              <div className="p-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border-2 border-amber-300 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Application Pending Manager Review</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">
                      Position Applied: {activePendingApp.role} at {activePendingApp.hostelName}
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">
                      Submitted on {new Date(activePendingApp.appliedAt).toLocaleDateString()} with verified CV and National ID.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black shrink-0">
                    Under Review
                  </span>
                </div>

                {/* Constraint Notice */}
                <div className="p-3.5 bg-white/80 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-950 font-semibold">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Application Lock Active:</strong> You currently have an application under review by the hostel manager. As per housing policy, you cannot apply or enroll in another role until the manager finalizes their decision (approved or rejected).
                  </span>
                </div>

                {activePendingApp.cvData && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPreviewCv({ name: activePendingApp.cvFileName || 'Submitted CV', data: activePendingApp.cvData! })}
                      className="px-3.5 py-1.5 bg-blue-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-blue-800 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Submitted CV</span>
                    </button>
                    <span className="text-xs text-slate-500 font-medium">File: {activePendingApp.cvFileName || 'Curriculum_Vitae.pdf'}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* If has previous rejected applications, display note */}
            {applications.some(a => a.status === 'Rejected') && !activePendingApp && !approvedApp && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Previous Application Update:</strong> Your earlier application was reviewed and not accepted at that time. You are now free to apply for any other available staff positions below.
                </div>
              </div>
            )}

            {/* ACCREDITED HOSTELS HIRING DIRECTORY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Accredited Hostels Hiring Staff</h3>
                  <p className="text-xs text-slate-500 font-medium">Browse verified residences in need of maintenance, security, front desk, and housekeeping personnel.</p>
                </div>
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {hostels.length} Verified Properties
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {hostels.map(h => {
                  const isHiring = h.staffHiringOpen !== false;
                  const openRoles = Array.isArray(h.openStaffRoles) && h.openStaffRoles.length > 0
                    ? h.openStaffRoles
                    : [
                        { role: 'Facilities & Plumbing Technician', vacancies: 2, shift: 'Day Shift' },
                        { role: 'Security & Safety Officer', vacancies: 3, shift: 'Night Shift' },
                        { role: 'Housekeeping Supervisor', vacancies: 1, shift: 'Morning Shift' }
                      ];

                  return (
                    <div 
                      key={h.id}
                      className={`p-5 bg-white border rounded-2xl shadow-sm transition-all space-y-4 flex flex-col justify-between ${
                        selectedHostelId === h.id ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100">
                          <img 
                            src={h.image || h.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'} 
                            alt={h.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                            Accredited
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-300" />
                            <span>{h.location}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-900">{h.name}</h4>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">{h.description || 'Modern student community residence.'}</p>
                        </div>

                        {/* Open Staff Roles Chips */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Needed Personnel:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {openRoles.map((r: any, idx: number) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-[10px] font-bold"
                              >
                                {r.role || r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] text-slate-600">
                          <span className="font-bold text-slate-900">{h.managerName || 'Manager'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isStaffVerified) {
                              setToastMessage({ text: 'Application Locked: Your account credentials must be verified by Admin first.', type: 'error' });
                              return;
                            }
                            setSelectedHostelId(h.id);
                            const element = document.getElementById('apply-form-section');
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          disabled={!isStaffVerified || !!activePendingApp}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedHostelId === h.id
                              ? 'bg-blue-900 text-white'
                              : 'bg-slate-100 hover:bg-blue-50 text-slate-800'
                          } ${(!isStaffVerified || activePendingApp) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {!isStaffVerified ? 'Locked (Unverified)' : selectedHostelId === h.id ? 'Selected' : 'Select Hostel'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* APPLICATION FORM (LOCKED IF UNVERIFIED OR PENDING APPLICATION EXISTS) */}
            <div id="apply-form-section" className="p-6 md:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Submit Staff Application with CV & ID</h3>
                  <p className="text-xs text-slate-500 font-medium">Your credentials will be forwarded directly to the property manager's notification center.</p>
                </div>
                {!isStaffVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Locked (Unverified Credentials)</span>
                  </span>
                ) : activePendingApp ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Locked (Pending Active Application)</span>
                  </span>
                ) : null}
              </div>

              {!isStaffVerified ? (
                <div className="p-8 bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-3xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto font-bold shadow-md shadow-amber-500/30">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">Application Options Locked</h4>
                  <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                    Your submitted <strong>CV</strong> and <strong>National ID</strong> documents are undergoing verification review by PineVela Administrators in the <strong>Verified Staffs</strong> portal.
                  </p>
                  <p className="text-xs text-amber-900 font-bold max-w-lg mx-auto">
                    Once an Administrator approves your credentials, job application options will be unlocked immediately!
                  </p>
                </div>
              ) : activePendingApp ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">You have already submitted an application</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    You cannot submit another application until the manager of <strong>{activePendingApp.hostelName}</strong> has made an approval or rejection decision on your current submission.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Choose Hostel */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Accredited Hostel *</label>
                      <select
                        value={selectedHostelId}
                        onChange={(e) => setSelectedHostelId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        required
                      >
                        <option value="">-- Choose a Hostel --</option>
                        {hostels.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.location})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Desired Staff Role */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Role / Position You Want to Apply For *</label>
                      <select
                        value={appliedRole}
                        onChange={(e) => setAppliedRole(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        required
                      >
                        <option value="Facilities & Maintenance Technician">Facilities & Maintenance Technician</option>
                        <option value="Plumber & Water Systems Lead">Plumber & Water Systems Lead</option>
                        <option value="Electrician & Backup Power Specialist">Electrician & Backup Power Specialist</option>
                        <option value="Head of Security & Gate Operations">Head of Security & Gate Operations</option>
                        <option value="Security Officer (Night Shift)">Security Officer (Night Shift)</option>
                        <option value="Front Desk & Operations Assistant">Front Desk & Operations Assistant</option>
                        <option value="Housekeeping & Sanitation Staff">Housekeeping & Sanitation Staff</option>
                        <option value="Hostel Warden / Residential Assistant">Hostel Warden / Residential Assistant</option>
                      </select>
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+233 24 123 4567"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        required
                      />
                    </div>

                    {/* National ID Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">National ID / Ghana Card Number *</label>
                      <input
                        type="text"
                        value={applicantNationalId}
                        onChange={(e) => setApplicantNationalId(e.target.value)}
                        placeholder="GHA-000000000-0"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* FILE UPLOAD SECTION: CV & NATIONAL ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    {/* CV / Resume Upload */}
                    <div className="p-5 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 rounded-2xl transition-all space-y-3 text-center">
                      <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Curriculum Vitae (CV / Resume) *</span>
                        <span className="text-[10px] text-slate-500 font-medium">Upload PDF, DOCX, or Image (Max 5MB)</span>
                      </div>
                      
                      {cvFileName ? (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                          <span className="truncate max-w-[200px]">{cvFileName}</span>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">Ready</span>
                        </div>
                      ) : (
                        <label className="inline-block px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all">
                          <span>Select CV Document</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={(e) => handleFileUpload(e, 'cv')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* National ID Document Upload */}
                    <div className="p-5 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50 rounded-2xl transition-all space-y-3 text-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">National ID Card Document</span>
                        <span className="text-[10px] text-slate-500 font-medium">Clear photo or scan of Ghana Card (Optional)</span>
                      </div>

                      {idDocFileName ? (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                          <span className="truncate max-w-[200px]">{idDocFileName}</span>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">Attached</span>
                        </div>
                      ) : (
                        <label className="inline-block px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all">
                          <span>Upload ID Image</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e, 'id')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Cover Note */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cover Note / Practical Experience</label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Briefly state your relevant experience (e.g. 4 years maintaining campus plumbing and borehole pumps)."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  {/* Submit Action */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <button
                      type="submit"
                      disabled={submittingApp || !cvData}
                      className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submittingApp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Application to Manager...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Application to Manager</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: NOTIFICATIONS (APPLICATION UPDATES, NOTICES & DECISIONS) */}
        {/* ========================================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Notifications & Decisions</h3>
                <p className="text-xs text-slate-500 font-medium">Official updates from property managers regarding your applications and duty assignments.</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {notifications.length} Total Notices
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No New Notifications</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a hostel manager reviews your CV, approves your role, or posts updates, notifications will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => {
                  const isSuccess = n.type === 'success' || n.title?.toLowerCase().includes('approved');
                  const isWarning = n.type === 'warning' || n.title?.toLowerCase().includes('reject');

                  return (
                    <div
                      key={n.id}
                      className={`p-5 bg-white border rounded-2xl shadow-xs transition-all space-y-2 ${
                        isSuccess ? 'border-emerald-200 bg-emerald-50/30' : isWarning ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isSuccess ? 'bg-emerald-100 text-emerald-700' : isWarning ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : isWarning ? <XCircle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{n.title}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">{n.date || 'Today'}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed pl-10">
                        {n.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SETTINGS (PROFILE, USERNAME, EMAIL, PHONE, PICTURE -> MANAGER SYNC) */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-black text-slate-900">Staff Account Settings</h3>
              <p className="text-xs text-slate-500 font-medium">
                Update your contact phone, email address, profile picture, and username. Any changes made here are directly synchronized with your manager's staff management directory.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Profile Picture Upload & Preview */}
              <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative">
                  {settingsPhoto ? (
                    <img 
                      src={settingsPhoto} 
                      alt="Profile Preview" 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-200 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                      {settingsName?.[0] || 'S'}
                    </div>
                  )}
                  <label className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-blue-900 text-white rounded-xl shadow-md cursor-pointer hover:bg-blue-800 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfilePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">Profile Picture</h4>
                  <p className="text-[10px] text-slate-500">Tap camera icon to upload a passport-size photo. Shows on manager roster.</p>
                  <input
                    type="text"
                    value={settingsPhoto}
                    onChange={(e) => setSettingsPhoto(e.target.value)}
                    placeholder="Or enter image URL"
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    value={settingsUsername}
                    onChange={(e) => setSettingsUsername(e.target.value)}
                    placeholder="e.g. kwame_staff"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (Direct Line)</label>
                  <input
                    type="text"
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    placeholder="+233 24 123 4567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={settingsEmail}
                    onChange={(e) => setSettingsEmail(e.target.value)}
                    placeholder="kwame@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    required
                  />
                </div>
              </div>


              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synchronizing Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Synchronize Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
