import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import { 
  Home, 
  Wrench, 
  MessageSquare, 
  Bell, 
  User, 
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
  MapPin, 
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
  Shield, 
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  ExternalLink
} from 'lucide-react';
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
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Room key display states
  const [showRoomKey, setShowRoomKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

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
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (title: string, desc?: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch student data on mount
  const loadStudentData = async () => {
    setLoadingData(true);
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

      // 3. Fetch room key record if student has one
      if (user?.roomKey) {
        try {
          const verifyRes = await fetch('/api/room-keys/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomKey: user.roomKey })
          });
          if (verifyRes.ok) {
            const keyData = await verifyRes.json();
            setRoomKeyDetails(keyData);
          }
        } catch (e) {
          console.warn("Could not verify room key record:", e);
        }
      }
    } catch (err) {
      console.error("Error loading student dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadStudentData();
    const interval = setInterval(loadStudentData, 12000);
    return () => clearInterval(interval);
  }, [user]);

  // Copy room key helper
  const handleCopyKey = () => {
    const key = user?.roomKey || roomKeyDetails?.roomKey || 'N/A';
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    triggerToast("Digital Room Key Copied", key, 'info');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // Handle Photo Upload (Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        triggerToast("File Too Large", "Max image size is 5MB.", 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIssuePhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo from list
  const removePhoto = (index: number) => {
    setIssuePhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Issue Submission
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) {
      triggerToast("Missing Information", "Please enter a title and detailed description.", 'error');
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
        studentName: user?.name || 'Student Resident',
        studentId: user?.studentId || user?.id || 'STU-UNKNOWN',
        studentEmail: user?.email || '',
        studentPhone: user?.phone || '',
        hostelId: user?.hostelId || roomKeyDetails?.hostelId || '',
        hostelName: user?.hostelName || roomKeyDetails?.hostelName || 'PineVela Residence',
        blockFloor: user?.blockName || roomKeyDetails?.blockName || 'Block A',
        blockName: user?.blockName || roomKeyDetails?.blockName || 'Block A',
        roomBed: user?.roomNumber || roomKeyDetails?.roomNumber || 'Room 101',
        roomNumber: user?.roomNumber || roomKeyDetails?.roomNumber || 'Room 101'
      };

      const created = await apiFetch('/api/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setIssueReports(prev => [created, ...prev]);
      setShowNewIssueModal(false);
      // Reset form
      setIssueTitle('');
      setIssueDescription('');
      setIssuePhotos([]);
      setIssueUrgency('Medium');

      triggerToast("Maintenance Report Submitted", "Your hostel manager has been notified with proof details.");
      setActiveTab('issues');
    } catch (err: any) {
      triggerToast("Submission Failed", err.message || "Failed to submit report", 'error');
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Student Confirm Resolution
  const handleConfirmResolution = async (isResolved: boolean) => {
    if (!selectedIssueForConfirm) return;
    setSubmittingConfirm(true);
    try {
      const updated = await apiFetch(`/api/issue-reports/${selectedIssueForConfirm.id}/student-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isResolved,
          feedback: confirmFeedback.trim()
        })
      });

      setIssueReports(prev => prev.map(i => i.id === updated.id ? updated : i));
      setSelectedIssueForConfirm(null);
      setConfirmFeedback('');
      triggerToast(
        isResolved ? "Resolution Confirmed" : "Feedback Sent to Management",
        isResolved ? "Thank you for confirming. The task is ready for manager final sign-off." : "Manager and staff have been notified to re-inspect."
      );
    } catch (err: any) {
      triggerToast("Error", err.message || "Failed to update confirmation", 'error');
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
        studentId: user?.studentId || user?.id,
        studentName: user?.name || 'Student Resident',
        hostelId: user?.hostelId || roomKeyDetails?.hostelId || '',
        hostelName: user?.hostelName || roomKeyDetails?.hostelName || 'PineVela Residence',
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
      triggerToast("Message Failed", err.message || "Could not send message", 'error');
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
          studentId: user?.studentId || user?.id || `STU-${Date.now().toString().slice(-4)}`,
          studentName: user?.name || 'Student Resident',
          studentEmail: user?.email || '',
          studentPhone: user?.phone || ''
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowClaimModal(false);
        setRoomKeyDetails(verifiedKeyInfo);
        triggerToast("Room Key Activated", `Connected to ${verifiedKeyInfo.hostelName} (${verifiedKeyInfo.blockName}, ${verifiedKeyInfo.roomNumber})`);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-50 flex flex-col font-sans relative">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 max-w-md ${
            toastMessage.type === 'error'
              ? 'bg-rose-950 text-white border-rose-800'
              : toastMessage.type === 'info'
              ? 'bg-blue-950 text-white border-blue-800'
              : 'bg-emerald-950 text-white border-emerald-800'
          }`}>
            <div className="mt-0.5">
              {toastMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              ) : toastMessage.type === 'info' ? (
                <Key className="w-5 h-5 text-sky-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div className="space-y-0.5 flex-1">
              <h4 className="font-bold text-sm leading-tight">{toastMessage.title}</h4>
              {toastMessage.desc && <p className="text-xs text-slate-300 font-medium">{toastMessage.desc}</p>}
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP ELEVATED HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-blue-100/80 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <PineLogo />
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Student Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-blue-900 font-bold">{user?.hostelName || roomKeyDetails?.hostelName || 'My Residence'}</span>
          </div>
        </div>

        {/* Action Controls & Profile badge */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Room Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 px-3 py-1.5 rounded-xl shadow-xs">
            <Key className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Room Assigned</div>
              <div className="text-xs font-black text-blue-950">
                {user?.blockName || roomKeyDetails?.blockName || 'Block A'} • {user?.roomNumber || roomKeyDetails?.roomNumber || 'Room 101'}
              </div>
            </div>
          </div>

          {/* Direct Message with Manager Quick Launch */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">Manager Chat</span>
          </button>

          {/* New Issue Button */}
          <button
            onClick={() => setShowNewIssueModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report Issue</span>
          </button>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-black text-slate-900 leading-tight">{user?.name || 'Student Resident'}</div>
              <div className="text-[10px] font-bold text-slate-400">ID: {user?.studentId || 'STU-2026'}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* SUB-NAV TABS */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Residence Hub', icon: Home },
            { id: 'issues', label: 'Maintenance & Repairs', icon: Wrench, badge: pendingCount + inProgressCount + awaitingConfirmCount },
            { id: 'messages', label: 'Manager Messages', icon: MessageSquare, badge: messages.length > 0 ? messages.length : undefined },
            { id: 'announcements', label: 'Hostel Notices', icon: Bell },
            { id: 'settings', label: 'My Room Key & Profile', icon: Key }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* AWAITING STUDENT CONFIRMATION ALERT BANNER */}
        {awaitingConfirmCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border-2 border-emerald-400/80 rounded-3xl p-5 shadow-lg shadow-emerald-950/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
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
          <div className="space-y-6">
            {/* Top Grid: Digital Room Key Card + Manager Connect Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* DIGITAL ROOM KEY CARD */}
              <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden flex flex-col justify-between">
                {/* Background decorative crystal shapes */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/30 border border-blue-400/40 text-blue-200">
                        Official Digital Resident Key
                      </span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="text-xs text-blue-300 font-bold">
                      PineVela Verified Resident
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {user?.hostelName || roomKeyDetails?.hostelName || 'PineVela Student Residence'}
                    </h2>
                    <p className="text-xs text-blue-200/80 font-medium mt-1 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{user?.blockName || roomKeyDetails?.blockName || 'Block A'}</span>
                      <span>•</span>
                      <span>Floor {roomKeyDetails?.floor || '1'}</span>
                      <span>•</span>
                      <span>Room {user?.roomNumber || roomKeyDetails?.roomNumber || '101'}</span>
                    </p>
                  </div>

                  {/* DIGITAL KEY VALUE BOX */}
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                    <div>
                      <div className="text-[10px] font-black text-blue-300 uppercase tracking-wider">
                        Room Key Identifier (Keep Confidential)
                      </div>
                      <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white mt-0.5">
                        {showRoomKey ? (user?.roomKey || roomKeyDetails?.roomKey || 'MAZE-A-749201') : '••••-•-••••••'}
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

                <div className="pt-4 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-blue-200/70 gap-2 relative z-10">
                  <div className="flex items-center gap-4">
                    <span>Resident: <strong>{user?.name || 'Student'}</strong></span>
                    <span>Student ID: <strong>{user?.studentId || 'STU-2026'}</strong></span>
                  </div>
                  <div className="text-[11px] text-blue-300">
                    Single Resident Key Binding
                  </div>
                </div>
              </div>

              {/* HOSTEL OPERATIONS MANAGER CONTACT CARD */}
              <div className="bg-white rounded-3xl p-6 border border-blue-100/80 shadow-sm shadow-blue-950/5 flex flex-col justify-between space-y-4">
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
                      <span className="font-semibold">{roomKeyDetails?.managerPhone || '+233 24 000 0000'}</span>
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
                  <span>Send Direct Message to Manager</span>
                </button>
              </div>
            </div>

            {/* MAINTENANCE SUMMARY METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Reports</span>
                  <Wrench className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">{issueReports.length}</div>
                <div className="text-[11px] text-slate-500 font-medium">Filing history</div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-amber-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">With manager</div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-blue-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-blue-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-900">{inProgressCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">Staff attending</div>
              </div>

              <div className="bg-white p-4.5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Resolved & Closed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900">{resolvedCount}</div>
                <div className="text-[11px] text-slate-500 font-medium">Fully resolved</div>
              </div>
            </div>

            {/* RECENT MAINTENANCE ISSUES LIST PREVIEW */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base">My Recent Maintenance Reports</h3>
                  <p className="text-xs text-slate-500 font-medium">Track your reported room issues and staff progress in real time</p>
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
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No active maintenance issues</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                      Everything in your room is in top shape! If you notice any defect, file a report with photo proof anytime.
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
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
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
                            onClick={() => {
                              setSelectedIssueForConfirm(issue);
                            }}
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
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MAINTENANCE & REPAIRS TRACKER */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* Header & Filter Controls */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Maintenance & Repairs Tracker</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Room: <strong>{user?.blockName || 'Block A'}</strong>, <strong>{user?.roomNumber || 'Room 101'}</strong> • Full lifecycle from report to staff fix and student verification.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewIssueModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report New Issue with Photos</span>
                </button>
              </div>

              {/* Filter pills & search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'all', label: 'All Issues', count: issueReports.length },
                    { id: 'pending', label: 'Pending Review', count: pendingCount },
                    { id: 'in-progress', label: 'Staff Attending', count: inProgressCount },
                    { id: 'awaiting-confirmation', label: 'Awaiting My Confirmation', count: awaitingConfirmCount },
                    { id: 'resolved', label: 'Resolved & Closed', count: resolvedCount }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setIssueFilter(f.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                        issueFilter === f.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
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
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4">
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
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 transition-all hover:border-blue-200"
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
                      <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-150">
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

                    {/* STAFF COMPLETION PROOF & NOTES (If staff completed) */}
                    {issue.staffCompleted && (
                      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
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
                            : 'bg-slate-50 border-slate-200 text-slate-400'
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
                            : 'bg-slate-50 border-slate-200 text-slate-400'
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
                            : 'bg-slate-50 border-slate-200 text-slate-400'
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
                      <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 p-3.5 rounded-2xl">
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
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[650px]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-xs border border-white/20">
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

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
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
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-900 rounded-lg text-[11px] font-medium border border-blue-200 whitespace-nowrap transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
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
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
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
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
              <h2 className="text-xl font-black text-slate-900">Hostel Notices & Announcements</h2>
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
                <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
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
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-900">Student Profile & Digital Room Credentials</h2>
                <p className="text-xs text-slate-500 font-medium">Verify your assigned room credentials and registered details</p>
              </div>

              {/* Room Key Box */}
              <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span>Special Digital Room Key</span>
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                    Unique to Room
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-blue-200">
                  <div className="font-mono text-base font-black text-slate-900">
                    {user?.roomKey || roomKeyDetails?.roomKey || 'MAZE-A-749201'}
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
                  This key was uniquely generated for your room (combining hostel prefix, block initial, and 6 random digits). Only manager and resident hold this key.
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Full Name</div>
                  <div className="font-black text-slate-900">{user?.name || 'Student Resident'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Student ID</div>
                  <div className="font-black text-slate-900">{user?.studentId || 'STU-2026-8842'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Hostel Property</div>
                  <div className="font-black text-slate-900">{user?.hostelName || 'Emerald Heights'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                  <div className="font-bold text-slate-400 text-[10px] uppercase">Block & Room</div>
                  <div className="font-black text-slate-900">{user?.blockName || 'Block A'} • {user?.roomNumber || 'Room 101'}</div>
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
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
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
      {/* MODAL 1: REPORT MAINTENANCE ISSUE (WITH PICTURE PROOF & DETAILS) */}
      {/* ========================================================================= */}
      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-blue-200/80 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Report Room Maintenance Issue</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Auto-dispatched to <strong>{user?.hostelName || 'Hostel Operations Manager'}</strong>
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
                  <div className="font-bold text-slate-900 truncate">{user?.name || 'Resident'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Student ID</div>
                  <div className="font-bold text-slate-900 truncate">{user?.studentId || 'STU-2026'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Block</div>
                  <div className="font-bold text-slate-900 truncate">{user?.blockName || 'Block A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Room</div>
                  <div className="font-bold text-slate-900 truncate">{user?.roomNumber || 'Room 101'}</div>
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
    </div>
  );
}
