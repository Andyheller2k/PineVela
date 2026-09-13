import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
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
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport, HostelRoomKey, StudentDirectMessage } from '../types';

export default function PageStudentDashboard() {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'messages' | 'announcements' | 'settings'>('overview');

  // Data states
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [messages, setMessages] = useState<StudentDirectMessage[]>([]);
  const [roomKeyDetails, setRoomKeyDetails] = useState<HostelRoomKey | null>(null);
  const [studentUser, setStudentUser] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

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
  const [claimRoomKeyInput, setClaimRoomKeyInput] = useState<string>('');
  const [verifyingKey, setVerifyingKey] = useState<boolean>(false);
  const [verifiedKeyInfo, setVerifiedKeyInfo] = useState<any | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);

  // Image zoom viewer modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Fetch student data on mount
  const loadStudentData = async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    try {
      // 1. Fetch student's issue reports
      const issues = await apiFetch('/api/issue-reports');
      if (Array.isArray(issues)) {
        setIssueReports(issues);
      }

      // 2. Fetch direct messages with manager
      const msgs = await apiFetch('/api/student-messages');
      if (Array.isArray(msgs)) {
        setMessages(msgs);
      }

      // 3. Fetch room key record and profile details
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
    { id: 'overview', label: 'Residence Hub', sub: 'Overview & Room Access', icon: Home },
    { id: 'issues', label: 'Maintenance & Repairs', sub: 'Track & Report Issues', icon: Wrench, badge: pendingCount + inProgressCount + awaitingConfirmCount },
    { id: 'messages', label: 'Manager Line', sub: 'Direct Resident Chat', icon: MessageSquare, badge: messages.length > 0 ? messages.length : undefined },
    { id: 'announcements', label: 'Hostel Bulletins', sub: 'Official Notices', icon: Bell },
    { id: 'settings', label: 'Digital Key & Profile', sub: 'Access Credentials', icon: Key }
  ];

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
        <div className="flex items-center gap-2">
          <PineLogo size={24} />
          <div>
            <h1 className="text-xs font-black tracking-tight text-blue-950 leading-tight">Student Portal</h1>
            <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{user?.hostelName || 'PineVela Resident'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewIssueModal(true)}
            className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs"
            title="Report Issue"
          >
            <Plus className="w-4 h-4" />
          </button>
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
              onClick={() => setActiveTab(tab.id as any)}
              className={`snap-center shrink-0 flex flex-col items-center justify-center w-[64px] h-12 rounded-xl transition-all relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-blue-100/50' : ''}`}>
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`} />
                {tab.badge ? (
                  <span className="absolute top-1 right-2 w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                ) : null}
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
          <div className="flex items-center space-x-3 px-2 cursor-pointer" onClick={() => navigate('/')}>
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                PineVela Student
              </h1>
              <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">Resident Portal</p>
            </div>
          </div>

          {/* Student Profile Pill */}
          <div className="p-3 bg-white/70 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white font-black text-xs flex items-center justify-center border border-blue-200 shadow-sm shrink-0">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'Student Resident'}</div>
                <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                  <span className="truncate">Verified Resident</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('settings')}
                title="Resident Profile"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Room Allocation Badge in Sidebar */}
          <div className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Room Allocation</div>
                <div className="text-xs font-black text-blue-950 truncate">
                  {currentUser?.blockName || roomKeyDetails?.blockName || 'Block A'} • {currentUser?.roomNumber || roomKeyDetails?.roomNumber || 'Room 101'}
                </div>
              </div>
            </div>
            <button
              onClick={handleCopyKey}
              title="Copy Digital Room Key"
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
                  {tab.badge ? (
                    <span className="px-2 py-0.5 text-[10px] bg-amber-400 text-slate-900 font-bold rounded-full shadow-xs">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Report Issue & Sign Out Footer */}
        <div className="space-y-2 pt-4 border-t border-sky-200/80 mt-4">
          <button
            onClick={() => setShowNewIssueModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report Maintenance</span>
          </button>

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

        {/* AWAITING STUDENT CONFIRMATION ALERT BANNER */}
        {awaitingConfirmCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border-2 border-emerald-400/80 rounded-3xl p-5 shadow-lg shadow-emerald-950/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn relative z-10 backdrop-blur-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Action Required
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    Staff Submitted Repair Completion Form!
                  </h3>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  You have <strong>{awaitingConfirmCount}</strong> maintenance issue(s) marked complete by staff. Please inspect your room and confirm satisfaction to close the task.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveTab('issues');
                setIssueFilter('awaiting-confirmation');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Inspect & Confirm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW & RESIDENCE HUB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn relative z-10">
            
            {/* Top Spotlight Banner: Digital Room Key Card */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Decorative radial blur shapes */}
              <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/30 border border-blue-400/40 text-blue-200">
                    Official Digital Resident Key
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs text-blue-300 font-bold">
                    Active Resident Clearance
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {currentUser?.hostelName || roomKeyDetails?.hostelName || 'Hostel Residence'}
                  </h2>
                  <p className="text-xs text-blue-200/80 font-medium mt-1 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{currentUser?.blockName || roomKeyDetails?.blockName || 'Block A'}</span>
                    <span>•</span>
                    <span>Floor {roomKeyDetails?.floor || '1'}</span>
                    <span>•</span>
                    <span>Room {currentUser?.roomNumber || roomKeyDetails?.roomNumber || '101'}</span>
                  </p>
                </div>

                {/* Digital Key Value Box with Glassy Finish */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div>
                    <div className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                      Room Key Identifier (Keep Confidential)
                    </div>
                    <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white mt-0.5">
                      {showRoomKey ? (currentUser?.roomKey || roomKeyDetails?.roomKey || 'NO-KEY-LINKED') : '••••-•-••••••'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRoomKey(!showRoomKey)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {showRoomKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRoomKey ? 'Hide' : 'Reveal'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Spotlight */}
              <div className="relative z-10 flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <button
                  onClick={() => setShowNewIssueModal(true)}
                  className="px-5 py-3 rounded-2xl bg-white text-blue-950 font-black text-xs shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Report Maintenance Issue</span>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-cyan-300" />
                  <span>Message Hostel Manager</span>
                </button>
              </div>
            </div>

            {/* STATS & METRICS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 backdrop-blur-2xl p-5 rounded-2xl border border-sky-100/80 shadow-md space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Reports</span>
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                    <Wrench className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">{issueReports.length}</div>
                <div className="text-[11px] text-slate-500 font-medium">All historical filings</div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl p-5 rounded-2xl border border-amber-200/60 shadow-md space-y-1">
                <div className="flex items-center justify-between text-amber-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">With operations manager</div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl p-5 rounded-2xl border border-blue-200/60 shadow-md space-y-1">
                <div className="flex items-center justify-between text-blue-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Staff In Progress</span>
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-900">{inProgressCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">Active repairs underway</div>
              </div>

              <div className="bg-white/80 backdrop-blur-2xl p-5 rounded-2xl border border-emerald-200/60 shadow-md space-y-1">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Resolved & Closed</span>
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-900">{resolvedCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">Signed-off & completed</div>
              </div>
            </div>

            {/* TWO COLUMN SECTION: RECENT MAINTENANCE REPORTS & MANAGER CONTACT CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Reports Preview */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-2xl rounded-3xl p-6 border border-sky-100/80 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">My Recent Maintenance Reports</h3>
                    <p className="text-xs text-slate-500 font-medium">Track reported issues, assigned staff, and completion status</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('issues')}
                    className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Issues</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {issueReports.length === 0 ? (
                  <div className="p-8 text-center bg-blue-50/40 rounded-2xl border border-dashed border-sky-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">No active maintenance issues</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                        Everything in your room is running smoothly! If you notice any fault, report it with photo proof anytime.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewIssueModal(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
                    >
                      Report First Issue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issueReports.slice(0, 3).map(issue => (
                      <div
                        key={issue.id}
                        className="p-4 rounded-2xl border border-sky-100/80 hover:border-blue-300 bg-white/90 backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl text-white font-bold text-xs ${
                            issue.urgency === 'High' ? 'bg-rose-600' : issue.urgency === 'Medium' ? 'bg-amber-600' : 'bg-blue-600'
                          }`}>
                            <Wrench className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900">{issue.title}</h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                {issue.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                issue.status === 'Resolved' || issue.closedByManager
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : issue.staffCompleted
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : issue.status === 'In Progress'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {issue.status === 'Resolved' || issue.closedByManager
                                  ? 'Resolved & Closed'
                                  : issue.staffCompleted
                                  ? 'Awaiting Your Confirmation'
                                  : issue.status === 'In Progress'
                                  ? `In Progress (${issue.assignedStaffName || 'Staff Assigned'})`
                                  : 'Pending Manager Review'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{issue.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {issue.staffCompleted && !issue.studentAcceptedResolved && (
                            <button
                              onClick={() => setSelectedIssueForConfirm(issue)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm Resolved</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab('issues');
                              setIssueSearch(issue.title);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hostel Manager Contact Card */}
              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 border border-sky-100/80 shadow-xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Operations Management
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      On-Duty
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/20">
                      HM
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        {roomKeyDetails?.managerName || 'Hostel Operations Manager'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Resident Hall Master & Supervisor</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold">{roomKeyDetails?.managerPhone || '+233 24 123 4567'}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold truncate">{roomKeyDetails?.managerEmail || 'manager@pinevela.com'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('messages')}
                  className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Send Direct Message</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MAINTENANCE & REPAIRS TRACKER */}
        {activeTab === 'issues' && (
          <div className="space-y-6 animate-fadeIn relative z-10">
            {/* Header & Filter Controls Card */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 border border-sky-100/80 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Maintenance & Repairs Tracker</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Room: <strong>{user?.blockName || 'Block A'}</strong>, <strong>{user?.roomNumber || 'Room 101'}</strong> • Lifecycle tracking from initial report to staff repair and resident confirmation.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewIssueModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report New Issue</span>
                </button>
              </div>

              {/* Filter pills & search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'all', label: 'All Issues', count: issueReports.length },
                    { id: 'pending', label: 'Pending Review', count: pendingCount },
                    { id: 'in-progress', label: 'Staff Attending', count: inProgressCount },
                    { id: 'awaiting-confirmation', label: 'Awaiting Confirmation', count: awaitingConfirmCount },
                    { id: 'resolved', label: 'Resolved & Closed', count: resolvedCount }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setIssueFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                        issueFilter === f.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white/70 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        issueFilter === f.id ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search issues..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                  {issueSearch && (
                    <button
                      onClick={() => setIssueSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ISSUES LIST */}
            {filteredIssues.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-12 text-center border border-sky-100/80 shadow-xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <Wrench className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">No issues found in this filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {issueSearch ? 'Try a different search term or clear the filter.' : 'All clear! Click below if you need to submit a maintenance request.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowNewIssueModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Report Issue Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="bg-white/85 backdrop-blur-2xl rounded-3xl p-6 border border-sky-100/80 shadow-lg space-y-5 transition-all hover:border-blue-300"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            issue.urgency === 'High'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : issue.urgency === 'Medium'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {issue.urgency} Urgency
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {issue.category}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Reported on {issue.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">{issue.title}</h3>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
                          {issue.description}
                        </p>
                      </div>

                      {/* Current Status Badge */}
                      <div className="shrink-0">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                          issue.status === 'Resolved' || issue.closedByManager
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : issue.staffCompleted
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                            : issue.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {issue.status === 'Resolved' || issue.closedByManager ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Resolved & Closed</span>
                            </>
                          ) : issue.staffCompleted ? (
                            <>
                              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                              <span>Awaiting Your Confirmation</span>
                            </>
                          ) : issue.status === 'In Progress' ? (
                            <>
                              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                              <span>Staff Attending</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span>Pending Manager Review</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* PHOTO PROOF GALLERY */}
                    {issue.photos && issue.photos.length > 0 && (
                      <div className="space-y-1.5 p-3.5 bg-blue-50/40 rounded-2xl border border-sky-200/60">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>Student Picture Proof ({issue.photos.length} photo{issue.photos.length > 1 ? 's' : ''})</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5 pt-1">
                          {issue.photos.map((photo, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => setZoomedImage(photo)}
                              className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs relative group cursor-pointer"
                            >
                              <img src={photo} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                Zoom
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STAFF COMPLETION PROOF & NOTES */}
                    {issue.staffCompleted && (
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Staff Completion Report Submitted</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800">
                            By {issue.assignedStaffName || 'Assigned Staff'}
                          </span>
                        </div>

                        {issue.staffCompletionNotes && (
                          <p className="text-xs text-emerald-900 font-medium">
                            "{issue.staffCompletionNotes}"
                          </p>
                        )}

                        {issue.staffCompletionPhoto && (
                          <div className="pt-1">
                            <div className="text-[10px] font-bold text-emerald-800 mb-1">Completion Photo Proof:</div>
                            <img
                              src={issue.staffCompletionPhoto}
                              alt="Staff Completion"
                              onClick={() => setZoomedImage(issue.staffCompletionPhoto!)}
                              className="w-24 h-24 object-cover rounded-xl border border-emerald-300 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* RESOLUTION LIFECYCLE TRACKER (VISUAL STEPPER) */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Workflow Lifecycle
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        {/* Step 1: Reported */}
                        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 space-y-0.5">
                          <div className="font-bold text-[11px] flex items-center justify-center gap-1 text-blue-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>1. Reported</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{issue.studentName}</div>
                        </div>

                        {/* Step 2: Staff Assigned */}
                        <div className={`p-2.5 rounded-xl border space-y-0.5 ${
                          issue.assignedStaffId
                            ? 'bg-blue-50 border-blue-200 text-blue-950'
                            : 'bg-white/60 border-slate-200 text-slate-400'
                        }`}>
                          <div className="font-bold text-[11px] flex items-center justify-center gap-1">
                            {issue.assignedStaffId ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>2. Assigned</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {issue.assignedStaffName || 'Pending Staff'}
                          </div>
                        </div>

                        {/* Step 3: Staff Completed */}
                        <div className={`p-2.5 rounded-xl border space-y-0.5 ${
                          issue.staffCompleted
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-white/60 border-slate-200 text-slate-400'
                        }`}>
                          <div className="font-bold text-[11px] flex items-center justify-center gap-1">
                            {issue.staffCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>3. Staff Repaired</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {issue.staffCompleted ? 'Repairs Complete' : 'In Progress'}
                          </div>
                        </div>

                        {/* Step 4: Student Confirmed & Closed */}
                        <div className={`p-2.5 rounded-xl border space-y-0.5 ${
                          issue.studentAcceptedResolved || issue.closedByManager
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-white/60 border-slate-200 text-slate-400'
                        }`}>
                          <div className="font-bold text-[11px] flex items-center justify-center gap-1">
                            {issue.studentAcceptedResolved || issue.closedByManager ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            <span>4. Closed & Archived</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {issue.closedByManager ? 'Closed by Manager' : issue.studentAcceptedResolved ? 'Student Confirmed' : 'Awaiting Sign-off'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTION FOOTER */}
                    {issue.staffCompleted && !issue.studentAcceptedResolved && (
                      <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/80 p-3.5 rounded-2xl">
                        <div className="text-xs text-amber-950 font-medium">
                          <strong>Your confirmation is needed:</strong> Has the issue in your room been repaired to your satisfaction?
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedIssueForConfirm(issue)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
                        >
                          <Check className="w-4 h-4" />
                          <span>Inspect & Confirm Resolution</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DIRECT MESSAGES WITH MANAGER */}
        {activeTab === 'messages' && (
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl border border-sky-100/80 shadow-2xl overflow-hidden flex flex-col h-[650px] animate-fadeIn relative z-10">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-xs border border-white/20 shadow-xs">
                  HM
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {roomKeyDetails?.managerName || 'Hostel Operations Manager'}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Direct Channel • {user?.hostelName || 'Hostel Management'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Official Communication
              </span>
            </div>

            {/* Quick Topics */}
            <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[10px] font-bold text-blue-900 shrink-0">Quick Topics:</span>
              {[
                'Maintenance inspection follow-up',
                'Question about electricity / water prepaid',
                'Guest registration policy',
                'Lost room key query'
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setNewMessageText(chip)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 rounded-lg text-[11px] font-medium border border-blue-200 whitespace-nowrap transition-all cursor-pointer shadow-xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/60">
              {messages.length === 0 ? (
                <div className="text-center py-16 space-y-2 text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No messages yet. Send a direct message to your hostel manager below.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderRole === 'student';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 px-1">
                        <span>{isMe ? 'You (Resident)' : (msg.managerName || 'Hostel Manager')}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl max-w-lg text-xs font-medium shadow-xs ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white/95 border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type a message to your hostel manager..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessageText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: HOSTEL NOTICES & ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-4 animate-fadeIn relative z-10">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 border border-sky-100/80 shadow-xl space-y-1">
              <h2 className="text-xl font-black text-slate-900">Hostel Notices & Bulletins</h2>
              <p className="text-xs text-slate-500 font-medium">Official bulletins and operational notices published by your management</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'n-1',
                  title: 'Water Booster Pump Maintenance Schedule',
                  date: 'Today, 8:00 AM',
                  priority: 'High',
                  body: 'Please be informed that routine maintenance on the overhead water supply tank in Block A and Block B will take place tomorrow between 10:00 AM and 1:00 PM. Water supply will temporarily run on secondary reservoirs.'
                },
                {
                  id: 'n-2',
                  title: 'Quiet Study Hours for Mid-Semester Examinations',
                  date: 'Yesterday',
                  priority: 'Medium',
                  body: 'Quiet hours will be observed across all blocks from 9:00 PM to 6:00 AM daily. Please keep hallway noise and loud audio devices muted to support your fellow residents during exam week.'
                },
                {
                  id: 'n-3',
                  title: 'Digital Room Keys Security Policy Reminder',
                  date: '3 days ago',
                  priority: 'Normal',
                  body: 'Every room is assigned an exclusive Digital Room Key generated by the manager. Do not share your digital key with unregistered visitors to maintain hostel security.'
                }
              ].map(item => (
                <div key={item.id} className="bg-white/85 backdrop-blur-xl rounded-2xl p-5 border border-sky-100/80 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        item.priority === 'High'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.priority} Priority
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MY ROOM KEY & PROFILE */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn relative z-10">
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl p-6 border border-sky-100/80 shadow-xl space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-900">Resident Profile & Digital Room Credentials</h2>
                <p className="text-xs text-slate-500 font-medium">Verify your assigned room credentials and registered identity</p>
              </div>

              {/* Room Key Box */}
              <div className="p-5 bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Special Digital Room Key</span>
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                    Unique to Room
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white/90 p-3.5 rounded-xl border border-blue-200 shadow-xs">
                  <div className="font-mono text-base font-black text-slate-900">
                    {currentUser?.roomKey || roomKeyDetails?.roomKey || 'NO-KEY-LINKED'}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  This key was uniquely generated for your room. Only hostel management and the verified resident hold this key.
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-white/80 rounded-xl border border-sky-100 shadow-xs space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Full Name</div>
                  <div className="font-black text-slate-900">{currentUser?.name || 'Resident'}</div>
                </div>
                <div className="p-3.5 bg-white/80 rounded-xl border border-sky-100 shadow-xs space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Student ID / Index</div>
                  <div className="font-black text-slate-900">{currentUser?.studentId || currentUser?.id || ''}</div>
                </div>
                <div className="p-3.5 bg-white/80 rounded-xl border border-sky-100 shadow-xs space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Hostel Property</div>
                  <div className="font-black text-slate-900">{currentUser?.hostelName || roomKeyDetails?.hostelName || 'Hostel Residence'}</div>
                </div>
                <div className="p-3.5 bg-white/80 rounded-xl border border-sky-100 shadow-xs space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Block & Room</div>
                  <div className="font-black text-slate-900">{currentUser?.blockName || roomKeyDetails?.blockName || 'Block A'} • {currentUser?.roomNumber || roomKeyDetails?.roomNumber || 'Room'}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setShowClaimModal(true)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Link Different Digital Room Key
                </button>
                <button
                  onClick={() => setShowSignoutConfirmModal(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
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
    </div>
  );
}
