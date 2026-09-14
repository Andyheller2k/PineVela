import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import UserAvatarSelector, { renderAvatarGraphic } from './UserAvatarSelector';
import { 
  Home, 
  Wrench, 
  MessageSquare, 
  Bell, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Upload, 
  Send, 
  Phone, 
  Mail, 
  Building2, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  X, 
  Plus, 
  RefreshCw, 
  LogOut, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Search, 
  Layers,
  MapPin,
  Calendar,
  Settings,
  HelpCircle,
  AlertTriangle,
  Landmark,
  Users,
  Star,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport, HostelRoomKey, StudentDirectMessage } from '../types';

export default function PageStudentDashboard() {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'notifications' | 'options' | 'overview' | 'issues' | 'messages' | 'announcements' | 'settings' | 'register-resident' | 'become-staff'>('home');

  // Data states
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [messages, setMessages] = useState<StudentDirectMessage[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [roomKeyDetails, setRoomKeyDetails] = useState<HostelRoomKey | null>(null);
  const [studentUser, setStudentUser] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [accreditedStaff, setAccreditedStaff] = useState<any[]>([]);
  const [registeredResidents, setRegisteredResidents] = useState<any[]>([]);
  const [availableHostels, setAvailableHostels] = useState<any[]>([]);
  const [viewingHostelModal, setViewingHostelModal] = useState<any | null>(null);

  const currentUser = studentUser || user;

  // Room key display states
  const [showRoomKey, setShowRoomKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [showSignoutConfirmModal, setShowSignoutConfirmModal] = useState<boolean>(false);

  // New Issue Modal states
  const [showNewIssueModal, setShowNewIssueModal] = useState<boolean>(false);
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [issueCategory, setIssueCategory] = useState<string>('Plumbing');
  const [issueUrgency, setIssueUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [issuePhotos, setIssuePhotos] = useState<string[]>([]);
  const [issueContactMethod, setIssueContactMethod] = useState<'In-app Notification' | 'Phone Call' | 'Email'>('In-app Notification');
  const [submittingIssue, setSubmittingIssue] = useState<boolean>(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'pending' | 'in-progress' | 'awaiting-confirmation' | 'resolved'>('all');
  const [issueSearch, setIssueSearch] = useState<string>('');

  // Student Confirmation Modal for completed tasks
  const [selectedIssueForConfirm, setSelectedIssueForConfirm] = useState<IssueReport | null>(null);
  const [confirmFeedback, setConfirmFeedback] = useState<string>('');
  const [submittingConfirm, setSubmittingConfirm] = useState<boolean>(false);

  // Direct Message states
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Room Key Claim Modal (if student entered without room key)
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(false);
  const [claimRoomKeyInput, setClaimRoomKeyInput] = useState<string>('');
  const [verifyingKey, setVerifyingKey] = useState<boolean>(false);
  const [verifiedKeyInfo, setVerifiedKeyInfo] = useState<any | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.id) {
      const shown = localStorage.getItem(`pinevela_welcome_shown_${user.id}`);
      if (!shown) {
        setShowWelcomePopup(true);
        localStorage.setItem(`pinevela_welcome_shown_${user.id}`, 'true');
      }
    }
  }, [user]);

  // Image zoom viewer modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [registeredAccounts, setRegisteredAccounts] = useState<{ managerAccount: any; staffAccount: any }>({ managerAccount: null, staffAccount: null });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Fetch student & users portal data on mount
  const loadStudentData = async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    try {
      // Fetch user registered Manager/Staff accounts
      try {
        const token = localStorage.getItem('pinevela_auth_token') || (currentUser as any)?.token;
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const regRes = await fetch(`/api/users/my-registered-accounts?email=${encodeURIComponent(currentUser?.email || '')}`, { headers });
        if (regRes.ok) {
          const regData = await regRes.json();
          setRegisteredAccounts(regData);
        }
      } catch (e) {
        console.warn("Notice loading registered accounts status:", e);
      }
      // 1. Fetch accredited staff
      try {
        const staffRes = await fetch('/api/accredited-staff').then(r => r.json()).catch(() => []);
        if (Array.isArray(staffRes) && staffRes.length > 0) {
          setAccreditedStaff(staffRes);
        }
      } catch (e) {
        console.warn("Notice loading accredited staff:", e);
      }

      // 2. Fetch available hostels
      try {
        const hostelsList = await fetch('/api/hostels').then(r => r.json()).catch(() => []);
        if (Array.isArray(hostelsList)) {
          setAvailableHostels(hostelsList);
        }
      } catch (e) {
        console.warn("Notice loading available hostels:", e);
      }

      if (currentUser?.role === 'user') {
        if (!isSilent) setLoadingData(false);
        return;
      }

      // 3. Fetch student's issue reports
      const issues = await apiFetch('/api/issue-reports').catch(() => []);
      if (Array.isArray(issues)) {
        setIssueReports(issues);
      }

      // 4. Fetch direct messages with manager
      const msgs = await apiFetch('/api/student-messages').catch(() => []);
      if (Array.isArray(msgs)) {
        setMessages(msgs);
      }

      // Fetch Notifications
      const notifs = await apiFetch('/api/notifications').catch(() => []);
      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      }

      // 5. Fetch room key record and profile details
      try {
        const profileData = await apiFetch('/api/student/my-profile').catch(() => null);
        if (profileData && profileData.roomKeyDetails) {
          setRoomKeyDetails(profileData.roomKeyDetails);
        }
        if (profileData && profileData.user) {
          setStudentUser(profileData.user);
        }
      } catch (e) {
        console.warn("Notice loading student profile:", e);
      }
    } catch (err) {
      console.error("Error loading student dashboard data:", err);
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  };

  useEffect(() => {
    loadStudentData(false);
    const interval = setInterval(() => loadStudentData(true), 25000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.email]);

  // Copy room key helper
  const handleCopyKey = () => {
    const key = currentUser?.roomKey || roomKeyDetails?.roomKey || '';
    if (key) {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      triggerToast(`Digital Room Key Copied (${key})`);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  // Handle Photo Upload (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("Each image must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setIssuePhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setIssuePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit New Maintenance Issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) {
      triggerToast("Please fill in title and description");
      return;
    }

    setSubmittingIssue(true);
    try {
      const payload = {
        title: issueTitle.trim(),
        category: issueCategory,
        urgency: issueUrgency,
        description: issueDescription.trim(),
        photos: issuePhotos,
        contactMethod: issueContactMethod,
        studentId: currentUser?.studentId || currentUser?.id,
        studentName: currentUser?.name || 'Student Resident',
        studentEmail: currentUser?.email || '',
        studentPhone: currentUser?.phone || '',
        hostelId: currentUser?.hostelId || roomKeyDetails?.hostelId || '',
        hostelName: currentUser?.hostelName || roomKeyDetails?.hostelName || 'PineVela Student Residence',
        blockName: currentUser?.blockName || roomKeyDetails?.blockName || 'Block A',
        roomNumber: currentUser?.roomNumber || roomKeyDetails?.roomNumber || 'Room 101'
      };

      const newIssue = await apiFetch('/api/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setIssueReports(prev => [newIssue, ...prev]);
      setShowNewIssueModal(false);
      setIssueTitle('');
      setIssueDescription('');
      setIssuePhotos([]);
      triggerToast("Maintenance Report Submitted! Dispatched to Manager & Staff.");
    } catch (err: any) {
      triggerToast(err.message || "Failed to submit maintenance report");
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Student Confirm Resolution of Repair
  const handleConfirmResolution = async (isResolved: boolean) => {
    if (!selectedIssueForConfirm) return;

    setSubmittingConfirm(true);
    try {
      const updated = await apiFetch(`/api/issue-reports/${selectedIssueForConfirm.id}/student-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentAcceptedResolved: isResolved,
          studentFeedback: confirmFeedback.trim(),
          studentName: currentUser?.name || 'Student Resident'
        })
      });

      setIssueReports(prev => prev.map(i => i.id === updated.id ? updated : i));
      setSelectedIssueForConfirm(null);
      setConfirmFeedback('');
      triggerToast(
        isResolved 
          ? "Resolution Confirmed! Thank you. Ready for manager final sign-off." 
          : "Feedback Sent! Manager and staff notified to re-inspect."
      );
    } catch (err: any) {
      triggerToast(err.message || "Failed to update confirmation");
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // Send Direct Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    setSendingMessage(true);
    try {
      const payload = {
        message: newMessageText.trim(),
        studentId: currentUser?.studentId || currentUser?.id,
        studentName: currentUser?.name || 'Student Resident',
        hostelId: currentUser?.hostelId || roomKeyDetails?.hostelId || '',
        hostelName: currentUser?.hostelName || roomKeyDetails?.hostelName || 'PineVela Residence',
        managerId: roomKeyDetails?.managerId || '',
        managerName: roomKeyDetails?.managerName || 'Hostel Operations Manager'
      };

      const sent = await apiFetch('/api/student-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setMessages(prev => [...prev, sent]);
      setNewMessageText('');
    } catch (err: any) {
      triggerToast(err.message || "Could not send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Verify room key during claim modal
  const handleVerifyClaimKey = async () => {
    if (!claimRoomKeyInput.trim()) {
      setClaimError("Please enter your Digital Room Key");
      return;
    }
    setVerifyingKey(true);
    setClaimError(null);
    try {
      const res = await fetch('/api/room-keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomKey: claimRoomKeyInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setClaimError(data.error || "Invalid room key. Check with your manager.");
        setVerifiedKeyInfo(null);
      } else {
        setVerifiedKeyInfo(data);
        setClaimError(null);
      }
    } catch (err: any) {
      setClaimError("Could not verify key. Check network connection.");
    } finally {
      setVerifyingKey(false);
    }
  };

  // Confirm claim room key
  const handleClaimRoomKey = async () => {
    if (!verifiedKeyInfo) return;
    setSubmittingClaim(true);
    try {
      const res = await fetch('/api/room-keys/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomKey: verifiedKeyInfo.roomKey,
          studentId: currentUser?.studentId || currentUser?.id || `STU-${Date.now().toString().slice(-4)}`,
          studentName: currentUser?.name || 'Student Resident',
          studentEmail: currentUser?.email || '',
          studentPhone: currentUser?.phone || ''
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowClaimModal(false);
        setRoomKeyDetails(verifiedKeyInfo);
        triggerToast(`Room Key Activated! Connected to ${verifiedKeyInfo.hostelName} (${verifiedKeyInfo.blockName}, ${verifiedKeyInfo.roomNumber})`);
        loadStudentData();
      } else {
        setClaimError(data.error || "Failed to link room key");
      }
    } catch (err: any) {
      setClaimError("Failed to claim room key");
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Compute issue statistics
  const pendingCount = issueReports.filter(i => i.status === 'Pending').length;
  const inProgressCount = issueReports.filter(i => i.status === 'In Progress' && !i.staffCompleted).length;
  const awaitingConfirmCount = issueReports.filter(i => i.staffCompleted && !i.studentAcceptedResolved).length;
  const resolvedCount = issueReports.filter(i => i.status === 'Resolved' || i.closedByManager || i.studentAcceptedResolved).length;

  // Filter issues
  const filteredIssues = issueReports.filter(issue => {
    if (issueFilter === 'pending' && issue.status !== 'Pending') return false;
    if (issueFilter === 'in-progress' && (issue.status !== 'In Progress' || issue.staffCompleted)) return false;
    if (issueFilter === 'awaiting-confirmation' && (!issue.staffCompleted || issue.studentAcceptedResolved)) return false;
    if (issueFilter === 'resolved' && !(issue.status === 'Resolved' || issue.closedByManager || issue.studentAcceptedResolved)) return false;
    
    if (issueSearch.trim()) {
      const s = issueSearch.toLowerCase();
      return (
        issue.title.toLowerCase().includes(s) ||
        issue.category.toLowerCase().includes(s) ||
        issue.description.toLowerCase().includes(s) ||
        (issue.assignedStaffName && issue.assignedStaffName.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const navItems = [
    { id: 'home', label: 'Home Tab', sub: 'Residents & Staff Hire', icon: Home },
    { id: 'notifications', label: 'Notifications Tab', sub: 'Bulletins & Alerts', icon: Bell },
    { id: 'options', label: 'Options Tab', sub: 'Profile & Settings', icon: Settings },
    { id: 'register-resident', label: 'Register Your Resident', sub: 'Hostel Manager Gateway', icon: Building2 },
    { id: 'become-staff', label: 'Become a Staff', sub: 'Staff & Artisan Gateway', icon: Wrench },
    { id: 'login-room', label: 'Log Into Your Room', sub: 'Activate Digital Room Key', icon: Key }
  ];

  const handleNavClick = (tabId: string) => {
    if (tabId === 'register-resident') {
      setActiveTab('register-resident' as any);
    } else if (tabId === 'become-staff') {
      setActiveTab('become-staff' as any);
    } else if (tabId === 'login-room') {
      setShowClaimModal(true);
    } else {
      setActiveTab(tabId as any);
    }
  };

  if (loadingData && issueReports.length === 0) {
    return (
      <div className="min-h-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/50">
        <div className="flex flex-col items-center space-y-5 animate-fadeIn">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
            <PineLogo size={72} />
          </div>
          <div className="flex items-center space-x-3 text-blue-950 font-sans">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-black tracking-tight">Syncing Resident Portal...</span>
          </div>
        </div>
      </div>
    );
  }

  if (false && currentUser?.role === 'user') {
    return (
      <div className="min-h-screen h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/50 text-slate-800 overflow-hidden font-sans relative">
         {/* Toast Notification */}
         <AnimatePresence>
           {toastMessage && (
             <motion.div
               initial={{ opacity: 0, y: 15, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 15, scale: 0.95 }}
               transition={{ duration: 0.15 }}
               className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-4 py-2 rounded-full shadow-lg border border-slate-800 flex items-center gap-2 backdrop-blur-md text-xs font-semibold"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
               <span>{toastMessage}</span>
             </motion.div>
           )}
         </AnimatePresence>

         {/* Sidebar for Base User */}
         <aside className="hidden lg:flex w-72 my-6 ml-6 h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto z-20">
           <div className="space-y-6">
             <div className="flex items-center space-x-3 px-2">
               <PineLogo size={36} />
               <div>
                 <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                   PineVela Center
                 </h1>
                 <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">Onboarding & Setup</p>
               </div>
             </div>

             <div className="p-3 bg-white/70 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-xs">
               <div className="flex items-center gap-3 overflow-hidden">
                 {renderAvatarGraphic(currentUser?.avatar, "w-10 h-10 text-xs")}
                 <div className="overflow-hidden">
                   <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'PineVela User'}</div>
                   <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md">Generic Identity</span>
                 </div>
               </div>
             </div>
           </div>

           <button
             onClick={() => setShowSignoutConfirmModal(true)}
             className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-xs cursor-pointer"
           >
             <LogOut className="w-4 h-4" />
             <span>Sign Out Session</span>
           </button>
         </aside>

         {/* Onboarding Dashboard Area */}
         <main className="flex-1 p-6 pb-28 lg:p-10 lg:pb-10 space-y-8 overflow-y-auto h-full relative z-10 flex flex-col justify-start">
           
           {/* Top greeting bar */}
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-sky-100">
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome to PineVela, {currentUser?.name}!</h2>
               <p className="text-xs text-slate-500 font-semibold mt-1">
                 You are currently signed in with a unified generic user profile. Activate your PineVela capabilities below:
               </p>
             </div>
             
             {/* Mobile Sign out button */}
             <button
               onClick={() => setShowSignoutConfirmModal(true)}
               className="lg:hidden w-fit flex items-center space-x-2 bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer"
             >
               <LogOut className="w-4 h-4" />
               <span>Sign Out</span>
             </button>
           </div>

           {/* Capabilities Selection Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
             
             {/* 1. Student / Resident capability card */}
             <div className="bg-white hover:bg-blue-50/20 border border-sky-150 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
               <div className="space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shadow-sm">
                   <Key className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-slate-900 text-base">Resident & Student</h3>
                     <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase tracking-wider rounded-md">Activate</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Onboard into your designated student room using a digital room key code issued by your hostel manager.
                   </p>
                 </div>
               </div>
               
               <button
                 type="button"
                 onClick={() => {
                   setClaimRoomKeyInput('');
                   setVerifiedKeyInfo(null);
                   setClaimError(null);
                   setShowClaimModal(true);
                 }}
                 className="mt-6 w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>Activate Room Key</span>
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>

             {/* 2. Staff / Artisan capability card */}
             <div className="bg-white hover:bg-amber-50/20 border border-amber-150 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
               <div className="space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-sm">
                   <Wrench className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-slate-900 text-base">Staff & Artisan</h3>
                     <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-md">Register</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Register your professional service skills, set up working credentials, and apply for verified jobs around residences.
                   </p>
                 </div>
               </div>

               <button
                 type="button"
                 onClick={() => {
                   sessionStorage.setItem('navigated_to_staff_register', 'true');
                   navigate('/staff/register');
                 }}
                 className="mt-6 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>Register as Staff</span>
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>

             {/* 3. Hostel / Residence Manager capability card */}
             <div className="bg-white hover:bg-emerald-50/20 border border-emerald-150 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
               <div className="space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shadow-sm">
                   <Home className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-slate-900 text-base">Hostel Manager</h3>
                     <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-md">Manager Setup</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Register your hostel properties, manage active student room keys, track bookings, and respond to maintenance reports.
                   </p>
                 </div>
               </div>

               <button
                 type="button"
                 onClick={() => {
                   navigate('/register-manager');
                 }}
                 className="mt-6 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>Register Property</span>
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>

           </div>

           {/* Guidance Note */}
           <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl max-w-5xl flex items-start gap-4">
             <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl shrink-0">
               <Sparkles className="w-5 h-5" />
             </div>
             <div className="space-y-1">
               <h4 className="text-sm font-black text-slate-800">Need help onboarding?</h4>
               <p className="text-xs text-slate-650 leading-relaxed font-medium">
                 PineVela uses a Unified User Account. Your single email credentials protect your entire identity. If you are a student, your hostel manager has already generated a Digital Room Key for you. Activating your Room Key will automatically configure your Student Residence Desk.
               </p>
             </div>
           </div>

         </main>

         {/* MODALS */}
         {showClaimModal && (
           <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-200 space-y-5">
               <div className="flex items-start justify-between gap-3 pb-3 border-b border-blue-100">
                 <div className="flex items-start gap-3">
                   <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                     <Key className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-slate-900">Activate Digital Room Key</h3>
                     <p className="text-xs text-slate-500 font-medium">Provided exclusively by your manager</p>
                   </div>
                 </div>
                 <button
                   type="button"
                   onClick={() => setShowClaimModal(false)}
                   className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="space-y-3">
                 <div className="space-y-1">
                   <label className="text-xs font-black text-slate-800 block">Enter Key (Format: MAZE-A-123456)</label>
                   <div className="flex gap-2">
                     <input
                       type="text"
                       value={claimRoomKeyInput}
                       onChange={(e) => setClaimRoomKeyInput(e.target.value.toUpperCase())}
                       placeholder="e.g. EMERALD-A-849201"
                       className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-blue-600"
                     />
                     <button
                       type="button"
                       onClick={handleVerifyClaimKey}
                       disabled={verifyingKey || !claimRoomKeyInput.trim()}
                       className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                     >
                       {verifyingKey ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                     </button>
                   </div>
                 </div>

                 {claimError && (
                   <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2">
                     <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                     <span>{claimError}</span>
                   </div>
                 )}

                 {verifiedKeyInfo && (
                   <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950 animate-in fade-in slide-in-from-bottom-2 duration-150">
                     <div className="font-black flex items-center gap-1.5 text-emerald-850">
                       <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                       <span>Verified Room Match!</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                       <div>Hostel: <strong>{verifiedKeyInfo.hostelName}</strong></div>
                       <div>Block: <strong>{verifiedKeyInfo.blockName}</strong></div>
                       <div>Room: <strong>{verifiedKeyInfo.roomNumber}</strong></div>
                       <div>Status: <strong>{verifiedKeyInfo.status}</strong></div>
                     </div>

                     <button
                       type="button"
                       onClick={handleClaimRoomKey}
                       disabled={submittingClaim}
                       className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                     >
                       {submittingClaim ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                       <span>Confirm & Activate Room Access</span>
                     </button>
                   </div>
                 )}
               </div>
             </div>
           </div>
         )}

         {/* SIGN OUT CONFIRMATION MODAL */}
         {showSignoutConfirmModal && (
           <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 border border-slate-100 shadow-2xl">
               <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center border border-rose-100">
                 <LogOut className="w-7 h-7" />
               </div>
               <div className="space-y-1.5">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Sign Out Confirmation</h3>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Are you sure you want to sign out of your PineVela account?
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-3 pt-2">
                 <button
                   type="button"
                   onClick={() => setShowSignoutConfirmModal(false)}
                   className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                 >
                   Cancel
                 </button>
                 <button
                   type="button"
                   onClick={() => {
                     setShowSignoutConfirmModal(false);
                     logout();
                     navigate('/login');
                   }}
                   className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                 >
                   Sign Out
                 </button>
               </div>
             </div>
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/50 text-slate-800 overflow-hidden font-sans relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-4 py-2 rounded-full shadow-lg border border-slate-800 flex items-center gap-2 backdrop-blur-md text-xs font-semibold"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE HEADER (lg:hidden) */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-xl border-b border-sky-200/50 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); navigate('/student/dashboard'); }}>
          <PineLogo size={24} />
          <div>
            <h1 className="text-xs font-black tracking-tight text-blue-950 leading-tight">PineVela Portal</h1>
            <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{user?.hostelName || 'PineVela Resident'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSignoutConfirmModal(true)} 
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV (lg:hidden) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 pb-safe snap-x hide-scrollbar">
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              className={`snap-center shrink-0 flex flex-col items-center justify-center w-[64px] h-12 rounded-xl transition-all relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-blue-100/50' : ''}`}>
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`} />
              </div>
              <span className={`text-[9px] font-bold mt-0.5 ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-500'}`}>
                {tab.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* SIDEBAR: PURELY STATIC / FIXED ICE-BLUE FROSTY GLASS LOOK WITH CURVED EDGES & BLUE GLOW */}
      <aside className="hidden lg:flex w-72 my-6 ml-6 h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto z-20">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center space-x-3 px-2 cursor-pointer" onClick={() => { setActiveTab('home'); navigate('/student/dashboard'); }}>
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                PineVela Resident
              </h1>
              <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">User Account</p>
            </div>
          </div>

          {/* Student Profile Pill */}
          <div className="p-3 bg-white/70 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              {renderAvatarGraphic(currentUser?.avatar, "w-10 h-10 text-xs")}
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'PineVela User'}</div>
                <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                  <span className="truncate">Verified Account</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('options')}
                title="Account Options"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-500'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-200/70 text-blue-700 group-hover:bg-blue-300/80'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                        {tab.label}
                      </div>
                      <div className={`text-[10px] font-normal ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {tab.sub}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Footer */}
        <div className="space-y-2 pt-4 border-t border-sky-200/80 mt-4">
          <button
            onClick={() => setShowSignoutConfirmModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA WITH PERSISTENT PINEVELA GIANT WATERMARK */}
      <main className="flex-1 p-6 pb-28 lg:p-10 lg:pb-10 space-y-8 overflow-y-auto h-full relative z-10">
        
        {/* GIANT WATERMARK PINEVELA LOGO IN BACKGROUND (PERSISTS ACROSS ALL TABS) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div className="transform scale-[4.5] opacity-[0.14] blur-[0.4px]">
            <PineLogo size={180} hideText={true} />
          </div>
        </div>

        {/* TAB 0: HOME TAB (Residents View, Staff View & Gateways) */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fadeIn relative z-10">
            {/* Available Hostels Section */}
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-700" />
                    Available Hostels & Student Accommodations
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Explore verified student hostels and accommodations available across PineVela.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-900 font-black text-xs rounded-full">
                  {availableHostels.length} Available Hostels
                </span>
              </div>

              {availableHostels.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No available hostels listed yet</div>
                  <p className="text-xs text-slate-500 font-medium">Verified hostel accommodations listed by property managers will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableHostels.map((hostel: any, idx: number) => {
                    const coverImg = hostel?.image || hostel?.imageUrl || hostel?.exteriorPhotoUrl || hostel?.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                    const capacity = hostel.availableSpaces ?? hostel.bedsLeft ?? hostel.totalCapacity ?? 'Available';
                    const managerName = hostel.managerName || hostel.managerEmail || 'Verified Manager';

                    return (
                      <div key={hostel.id || idx} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                            <img
                              src={coverImg}
                              alt={hostel.name || 'Hostel'}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 bg-blue-900/90 backdrop-blur-sm text-white text-[10px] font-extrabold rounded-full">
                                {capacity} Spaces
                              </span>
                              {hostel.hostelType && (
                                <span className="px-2.5 py-0.5 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black rounded-full shadow-xs">
                                  {hostel.hostelType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-2.5">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{hostel.name || 'PineVela Hostel'}</h4>
                              <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                                <MapPin size={12} className="shrink-0 text-slate-400" />
                                <span className="truncate">{hostel.location || 'PineVela Campus Zone'}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                              <span className="text-slate-400 font-medium">Manager:</span>
                              <span className="font-bold text-slate-800 truncate max-w-[150px]">{managerName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            onClick={() => setViewingHostelModal(hostel)}
                            className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 text-slate-800 hover:text-blue-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>View Accommodation</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff & Hire Staff Section (Staff View) */}
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-700" />
                    Staff View: Accredited Staff & Hire Directory
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Verified accredited artisans and maintenance professionals available for job hire on PineVela.
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-full">
                  {accreditedStaff.length} Accredited Staff
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accreditedStaff.map((staff: any, idx: number) => (
                  <div key={staff.id || idx} className="p-4 bg-amber-50/30 border border-amber-200/80 rounded-2xl space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white font-black text-xs flex items-center justify-center">
                            {staff.name ? staff.name.slice(0, 2).toUpperCase() : 'ST'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{staff.name || 'Verified Artisan'}</div>
                            <div className="text-[10px] text-amber-800 font-bold">{staff.role || 'Facilities Technician'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{staff.rating || '4.9'}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {staff.bio || 'Accredited professional specializing in rapid hostel maintenance and repair solutions.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        triggerToast(`Job offer dispatch interface opened for ${staff.name}`);
                        setActiveTab('issues');
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Hire Staff Member</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-700" />
                    Notifications & Bulletins
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Official notices, digital room key clearances, and maintenance updates.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-900 font-black text-xs rounded-full">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">Welcome to PineVela, {user?.name || 'Resident'}!</h4>
                      <span className="text-[10px] text-slate-400">Account created</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Your account is ready. You can now discover hostels, activate your room key, and access maintenance tools.
                    </p>
                  </div>
                </div>

                {notifications.map(notif => (
                  <div key={notif.id} className={`p-4 ${notif.read ? 'bg-slate-50/70' : 'bg-white'} border ${notif.read ? 'border-slate-200/80' : 'border-blue-200/80 shadow-sm'} rounded-2xl flex items-start gap-3.5`}>
                    <div className={`p-2.5 rounded-xl ${notif.type === 'success' ? 'bg-emerald-600' : notif.type === 'warning' ? 'bg-amber-600' : 'bg-slate-800'} text-white shrink-0`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400">{notif.date || 'Recently'}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER RESIDENT TAB */}
        {activeTab === 'register-resident' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-white/90 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {registeredAccounts.managerAccount ? 'Registered Manager Account' : 'Register Your Resident'}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mt-1">
                    {registeredAccounts.managerAccount 
                      ? `You already have a registered manager account. Organization: ${registeredAccounts.managerAccount.organizationName} (${registeredAccounts.managerAccount.status}).`
                      : 'Initiate the hostel manager creation account flow to list and manage student residences on PineVela. Register your property securely and gain access to the powerful Manager Console.'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => navigate('/register-manager')}
                  className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{registeredAccounts.managerAccount ? 'Manage Manager Account' : 'Start Registration Process'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BECOME A STAFF TAB */}
        {activeTab === 'become-staff' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-white/90 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Wrench className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {registeredAccounts.staffAccount ? 'Registered Staff Account' : 'Become a Staff'}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mt-1">
                    {registeredAccounts.staffAccount
                      ? `You already have a registered staff account. Role: ${registeredAccounts.staffAccount.specialization} (${registeredAccounts.staffAccount.status}).`
                      : 'Initiate the staff creation account flow to offer accredited maintenance and artisan services across residences. Join our network of verified professionals.'}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => navigate('/staff/register')}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{registeredAccounts.staffAccount ? 'Manage Staff Account' : 'Start Registration Process'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPTIONS TAB */}
        {activeTab === 'options' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-800" />
                    User Options & Account Preferences
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Manage your resident profile, avatar, security credentials, and session options.
                  </p>
                </div>
              </div>

              {/* USER AVATAR SELECTOR & DISPLAY COMPONENT */}
              <UserAvatarSelector />

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderAvatarGraphic(currentUser?.avatar, "w-10 h-10 text-xs")}
                    <div>
                      <div className="text-xs font-black text-slate-900">{currentUser?.name || 'PineVela Resident'}</div>
                      <div className="text-[10px] text-slate-500">{currentUser?.email || 'resident@pinevela.com'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-lg">Verified Account</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black text-slate-900">Digital Room Key Status</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {roomKeyDetails ? `${roomKeyDetails.hostelName} (${roomKeyDetails.blockName}, ${roomKeyDetails.roomNumber})` : 'Not linked to a room key yet.'}
                    </p>
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      {roomKeyDetails ? 'Switch Room Key' : 'Activate Room Key Now'}
                    </button>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black text-slate-900">Session Management</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Securely sign out of your PineVela resident session across devices.
                    </p>
                    <button
                      onClick={() => setShowSignoutConfirmModal(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl cursor-pointer"
                    >
                      Sign Out Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: NOTIFICATIONS TAB */}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: REPORT MAINTENANCE ISSUE (WITH PICTURE PROOF & GLASSY FINISH) */}
      {/* ========================================================================= */}
      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-sky-200/80 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Report Room Maintenance Issue</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Auto-dispatched to <strong>{currentUser?.hostelName || 'Hostel Operations Manager'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-4">
              
              {/* Readonly Auto-filled Room & Student Details */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Student</div>
                  <div className="font-bold text-slate-900 truncate">{currentUser?.name || 'Resident'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Student ID</div>
                  <div className="font-bold text-slate-900 truncate">{currentUser?.studentId || 'STU-2026'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Block</div>
                  <div className="font-bold text-slate-900 truncate">{currentUser?.blockName || 'Block A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Room</div>
                  <div className="font-bold text-slate-900 truncate">{currentUser?.roomNumber || 'Room 101'}</div>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  Issue Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g., Leaking bathroom pipe, Broken desk chair, AC cooling fault"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

              {/* Category & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">Category</label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    {['Plumbing', 'Electrical', 'HVAC / Cooling', 'Carpentry & Doors', 'Furniture', 'Sanitation', 'Lock & Key', 'Wi-Fi / Network', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">Urgency Level</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Low', 'Medium', 'High'] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setIssueUrgency(lvl)}
                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          issueUrgency === lvl
                            ? lvl === 'High'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : lvl === 'Medium'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  Detailed Description <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Provide complete details about what is broken, where exactly in the room it is located, and when it began..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 resize-none"
                />
              </div>

              {/* PICTURE PROOF UPLOAD */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Upload Picture Proof & Evidence</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Max 5MB each
                  </span>
                </div>

                {/* Upload Button Box */}
                <label className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer transition-all text-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">Click or drag photos here</span>
                  <span className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Preview thumbnails */}
                {issuePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {issuePhotos.map((photo, pIdx) => (
                      <div key={pIdx} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 relative group">
                        <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(pIdx)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact Method */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Preferred Update Notification</label>
                <div className="flex gap-2">
                  {(['In-app Notification', 'Phone Call', 'Email'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setIssueContactMethod(method)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        issueContactMethod === method
                          ? 'bg-blue-50 text-blue-900 border-blue-300 ring-1 ring-blue-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewIssueModal(false)}
                  disabled={submittingIssue}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIssue || !issueTitle.trim() || !issueDescription.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingIssue ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending to Manager...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Maintenance Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT CONFIRMATION OF COMPLETED TASK */}
      {/* ========================================================================= */}
      {selectedIssueForConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-emerald-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Verify & Confirm Resolution</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Issue: <strong>{selectedIssueForConfirm.title}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssueForConfirm(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staff notes & completion proof */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="text-xs font-black text-emerald-950">
                Staff Completion Report:
              </div>
              <p className="text-xs text-emerald-900 font-medium">
                "{selectedIssueForConfirm.staffCompletionNotes || 'Repairs finished and inspected.'}"
              </p>
              {selectedIssueForConfirm.staffCompletionPhoto && (
                <div className="pt-1">
                  <img
                    src={selectedIssueForConfirm.staffCompletionPhoto}
                    alt="Proof"
                    onClick={() => setZoomedImage(selectedIssueForConfirm.staffCompletionPhoto!)}
                    className="w-20 h-20 object-cover rounded-xl border border-emerald-300 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 block">
                Resident Feedback / Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={confirmFeedback}
                onChange={(e) => setConfirmFeedback(e.target.value)}
                placeholder="e.g., Tested water pressure and everything is clean and fixed perfectly!"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={submittingConfirm}
                onClick={() => handleConfirmResolution(false)}
                className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all cursor-pointer"
              >
                Issue Still Persists
              </button>
              <button
                type="button"
                disabled={submittingConfirm}
                onClick={() => handleConfirmResolution(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {submittingConfirm ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Resolved</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2.5: WELCOME POPUP */}
      {/* ========================================================================= */}
      {showWelcomePopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                <Sparkles className="w-7 h-7" />
              </div>
              <button
                type="button"
                onClick={() => setShowWelcomePopup(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome to the PineVela Community!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                We're excited to have you here. PineVela is your unified platform to discover available student accommodations, report and track maintenance issues seamlessly, and connect with other residents. 
              </p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                You can also use this same account to list your own properties as a Hostel Manager or offer your professional services as an Artisan or Staff member.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWelcomePopup(false)}
                className="px-6 py-2.5 rounded-xl hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWelcomePopup(false);
                  // We'll create a learn more page later, for now just close it
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LINK / CLAIM DIGITAL ROOM KEY */}
      {/* ========================================================================= */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Activate Digital Room Key</h3>
                  <p className="text-xs text-slate-500 font-medium">Provided exclusively by your manager</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">Enter Key (Format: MAZE-A-123456)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={claimRoomKeyInput}
                    onChange={(e) => setClaimRoomKeyInput(e.target.value.toUpperCase())}
                    placeholder="e.g. EMERALD-A-849201"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyClaimKey}
                    disabled={verifyingKey || !claimRoomKeyInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifyingKey ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>

              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              {verifiedKeyInfo && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
                  <div className="font-black flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Room Match!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                    <div>Hostel: <strong>{verifiedKeyInfo.hostelName}</strong></div>
                    <div>Block: <strong>{verifiedKeyInfo.blockName}</strong></div>
                    <div>Room: <strong>{verifiedKeyInfo.roomNumber}</strong></div>
                    <div>Status: <strong>{verifiedKeyInfo.status}</strong></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClaimRoomKey}
                    disabled={submittingClaim}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submittingClaim ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Confirm & Activate Room Access</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: IMAGE ZOOM VIEWER */}
      {/* ========================================================================= */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={zoomedImage} alt="Zoomed Proof" className="w-full h-full object-contain max-h-[85vh]" />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: SIGN OUT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showSignoutConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center border border-rose-100">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to sign out of your student portal? You will need to log back in to access your digital room console.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSignoutConfirmModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignoutConfirmModal(false);
                  logout();
                  navigate('/login');
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 6: HOSTEL ACCOMMODATION DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewingHostelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <img
                src={viewingHostelModal?.image || viewingHostelModal?.imageUrl || viewingHostelModal?.exteriorPhotoUrl || viewingHostelModal?.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                alt={viewingHostelModal?.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewingHostelModal(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3 bg-blue-900/90 text-white text-xs font-black px-3 py-1 rounded-full backdrop-blur-sm">
                {viewingHostelModal?.availableSpaces ?? viewingHostelModal?.bedsLeft ?? viewingHostelModal?.totalCapacity ?? 'Available'} Spaces Open
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  {viewingHostelModal?.hostelType || 'Student Hostel'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{viewingHostelModal?.name}</h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {viewingHostelModal?.location || 'PineVela Campus Zone'}
                </p>
              </div>

              {viewingHostelModal?.description && (
                <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewingHostelModal.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px]">Manager</span>
                  <span className="font-bold text-slate-800">{viewingHostelModal?.managerName || 'Verified Manager'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact</span>
                  <span className="font-bold text-slate-800">{viewingHostelModal?.managerPhone || viewingHostelModal?.managerEmail || '+233 24 123 4567'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setViewingHostelModal(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingHostelModal(null);
                    setShowClaimModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Claim Digital Room Key</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
