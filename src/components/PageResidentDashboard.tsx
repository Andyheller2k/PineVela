import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import PineLogo from './PineLogo';
import { renderAvatarGraphic } from './UserAvatarSelector';
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
  X, 
  Plus, 
  RefreshCw, 
  LogOut, 
  Sparkles, 
  FileText, 
  Search, 
  MapPin, 
  Calendar, 
  Settings, 
  HelpCircle, 
  AlertTriangle, 
  Landmark, 
  Users, 
  Lock, 
  ShieldAlert, 
  BookOpen, 
  User 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport, HostelRoomKey, StudentDirectMessage } from '../types';

export default function PageResidentDashboard() {
  const { user, logout, apiFetch } = useAuth();
  const { notifications, unreadCount, registeredAccounts, markAsRead, pushToast } = useNotifications();
  const navigate = useNavigate();

  // Navigation tabs for the resident dashboard
  const [activeTab, setActiveTab] = useState<'room' | 'complaints' | 'billing' | 'alerts' | 'settings'>('room');

  // Data states
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [messages, setMessages] = useState<StudentDirectMessage[]>([]);
  const [roomKeyDetails, setRoomKeyDetails] = useState<HostelRoomKey | null>(null);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [accreditedStaff, setAccreditedStaff] = useState<any[]>([]);

  // Selected chat or issue
  const [activeChatIssueId, setActiveChatIssueId] = useState<string | null>(null);

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

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSignoutConfirmModal, setShowSignoutConfirmModal] = useState<boolean>(false);
  const [showRoomKey, setShowRoomKey] = useState<boolean>(false);

  // Load profile, issues, messages, and staff on mount
  useEffect(() => {
    async function init() {
      if (!user) return;
      setLoadingData(true);
      try {
        const profile = await apiFetch('/api/student/my-profile').catch(() => null);
        if (profile) setStudentProfile(profile);

        const issues = await apiFetch('/api/issue-reports').catch(() => []);
        setIssueReports(issues);

        const msgs = await apiFetch('/api/student-messages').catch(() => []);
        setMessages(msgs);

        const staff = await fetch('/api/accredited-staff').then(r => r.json()).catch(() => []);
        setAccreditedStaff(staff);
      } catch (err) {
        console.error('Error fetching resident dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    init();
  }, [user]);

  // Polling data
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const issues = await apiFetch('/api/issue-reports').catch(() => []);
        setIssueReports(issues);

        const msgs = await apiFetch('/api/student-messages').catch(() => []);
        setMessages(msgs);
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentUser = studentProfile || user;

  // Submit New Maintenance Issue
  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) {
      triggerToast('Please provide a title and detailed description.');
      return;
    }

    setSubmittingIssue(true);
    try {
      const newIssue = await apiFetch('/api/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issueTitle.trim(),
          category: issueCategory,
          urgency: issueUrgency,
          description: issueDescription.trim(),
          photos: issuePhotos,
          contactMethod: issueContactMethod
        })
      });

      setIssueReports(prev => [newIssue, ...prev]);
      setShowNewIssueModal(false);
      triggerToast('Maintenance Report Submitted successfully!');
      
      // Reset fields
      setIssueTitle('');
      setIssueDescription('');
      setIssuePhotos([]);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to submit maintenance issue.');
    } finally {
      setSubmittingIssue(false);
    }
  };

  // Student confirms the maintenance completion
  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueForConfirm) return;

    setSubmittingConfirm(true);
    try {
      const updated = await apiFetch(`/api/issue-reports/${selectedIssueForConfirm.id}/student-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: confirmFeedback })
      });

      setIssueReports(prev => prev.map(issue => issue.id === updated.id ? updated : issue));
      setSelectedIssueForConfirm(null);
      setConfirmFeedback('');
      triggerToast('Thank you for confirming resolution!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to confirm resolution.');
    } finally {
      setSubmittingConfirm(false);
    }
  };

  // Submit Direct Message to Staff
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatIssueId) return;

    // Find the staff assigned to this issue
    const issue = issueReports.find(i => i.id === activeChatIssueId);
    if (!issue || !issue.assignedStaffId) {
      triggerToast('No active technician assigned to this complaint yet.');
      return;
    }

    setSendingMessage(true);
    try {
      const sent = await apiFetch('/api/student-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: issue.assignedStaffId,
          messageText: newMessageText.trim(),
          issueId: activeChatIssueId
        })
      });

      setMessages(prev => [...prev, sent]);
      setNewMessageText('');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper function to extract chat messages for the selected issue
  const activeChatMessages = messages.filter(m => (m as any).issueId === activeChatIssueId);

  // Filtering issues
  const filteredIssues = issueReports.filter(issue => {
    const matchesFilter = 
      issueFilter === 'all' || 
      (issueFilter === 'pending' && issue.status === 'Pending') ||
      (issueFilter === 'in-progress' && issue.status === 'In Progress') ||
      (issueFilter === 'awaiting-confirmation' && issue.status === 'Resolved' && !issue.studentAcceptedResolved) ||
      (issueFilter === 'resolved' && issue.status === 'Resolved' && issue.studentAcceptedResolved);

    const matchesSearch = 
      issue.title.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.description.toLowerCase().includes(issueSearch.toLowerCase()) ||
      issue.category.toLowerCase().includes(issueSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loadingData) {
    return (
      <div className="min-h-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/50">
        <div className="flex flex-col items-center space-y-4 animate-pulse">
          <PineLogo size={60} />
          <div className="flex items-center space-x-2 text-blue-950">
            <RefreshCw className="animate-spin h-5 w-5 text-blue-600" />
            <span className="text-sm font-black">Syncing Resident Portal...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 text-white px-5 py-2.5 rounded-full shadow-lg border border-slate-800 flex items-center gap-2 backdrop-blur-md text-xs font-semibold"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE HEADER (lg:hidden) */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <PineLogo size={24} />
          <div>
            <h1 className="text-xs font-black tracking-tight text-blue-950 leading-tight">PineVela Resident</h1>
            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{currentUser?.hostelName || 'Verifying Accommodation'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 rounded-lg ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowSignoutConfirmModal(true)} 
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 shrink-0 p-6 justify-between select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">PineVela</h1>
              <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
                <ShieldCheck size={12} />
                <span>Verified Resident</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Resident</div>
            <div className="text-xs font-black text-slate-900 truncate">{currentUser?.name}</div>
            <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 pt-1">
              <Building2 size={12} className="text-slate-400" />
              <span className="truncate">{currentUser?.hostelName || 'No Hostel Assigned'}</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('room')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'room' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home size={16} />
                <span>My Resident Room</span>
              </span>
              <ChevronRight size={14} className={activeTab === 'room' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'complaints' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Wrench size={16} />
                <span>Maintenance Complaints</span>
              </span>
              <ChevronRight size={14} className={activeTab === 'complaints' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'billing' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText size={16} />
                <span>Billing & Statements</span>
              </span>
              <ChevronRight size={14} className={activeTab === 'billing' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'alerts' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Bell size={16} />
                <span>Bulletins & Alerts</span>
              </span>
              <ChevronRight size={14} className={activeTab === 'alerts' ? 'text-white' : 'text-slate-400'} />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === 'settings' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings size={16} />
                <span>Profile & Settings</span>
              </span>
              <ChevronRight size={14} className={activeTab === 'settings' ? 'text-white' : 'text-slate-400'} />
            </button>
          </nav>
        </div>

        <button
          onClick={() => setShowSignoutConfirmModal(true)}
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border border-rose-100 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out Session</span>
        </button>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-2 shadow-lg">
        <button 
          onClick={() => setActiveTab('room')}
          className={`flex flex-col items-center p-1.5 cursor-pointer ${activeTab === 'room' ? 'text-blue-900' : 'text-slate-400'}`}
        >
          <Home size={18} />
          <span className="text-[10px] font-bold mt-0.5">My Room</span>
        </button>
        <button 
          onClick={() => setActiveTab('complaints')}
          className={`flex flex-col items-center p-1.5 cursor-pointer ${activeTab === 'complaints' ? 'text-blue-900' : 'text-slate-400'}`}
        >
          <Wrench size={18} />
          <span className="text-[10px] font-bold mt-0.5">Complaints</span>
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center p-1.5 cursor-pointer ${activeTab === 'billing' ? 'text-blue-900' : 'text-slate-400'}`}
        >
          <FileText size={18} />
          <span className="text-[10px] font-bold mt-0.5">Billing</span>
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center p-1.5 cursor-pointer ${activeTab === 'alerts' ? 'text-blue-900' : 'text-slate-400'}`}
        >
          <Bell size={18} />
          <span className="text-[10px] font-bold mt-0.5">Bulletins</span>
        </button>
      </nav>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-8 pb-24 lg:pb-8 flex flex-col space-y-6">
        
        {/* ROOM TAB */}
        {activeTab === 'room' && (
          <div className="space-y-6 max-w-4xl animate-fade-in">
            {/* Header */}
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Room Desk</h2>
              <p className="text-xs text-slate-500 font-medium">View your registered student accommodation, keys, and alerts</p>
            </div>

            {/* Room Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Room details */}
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-4 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                    <Home size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Assigned Accommodation</span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{currentUser?.hostelName || 'Premium Resident Lodge'}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Resident Block</span>
                    <span className="text-slate-900 font-extrabold">{currentUser?.blockName || 'Block A (Alpha)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Room Number</span>
                    <span className="text-slate-900 font-extrabold">{currentUser?.roomNumber || 'A-102'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Institution Link</span>
                    <span className="text-slate-900 font-extrabold truncate block">{currentUser?.institution || 'PineVela University'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Program / Department</span>
                    <span className="text-slate-900 font-extrabold truncate block">{currentUser?.programOfStudy || 'Undergrad Resident'}</span>
                  </div>
                </div>
              </div>

              {/* Digital Room Key Details */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl space-y-4 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Room Key</span>
                  <Key className="w-5 h-5 text-blue-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-blue-200/60 uppercase">Resident Code Access</div>
                  <div className="font-mono text-lg font-black tracking-wider bg-white/10 p-2 rounded-xl text-center">
                    {showRoomKey ? currentUser?.roomKey || 'PREMU-AALPHA-428185' : '•••••••••••••••••'}
                  </div>
                </div>

                <button
                  onClick={() => setShowRoomKey(!showRoomKey)}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer text-center"
                >
                  {showRoomKey ? 'Hide Digital Key' : 'Reveal Digital Key'}
                </button>
              </div>

            </div>

            {/* Submitting complaints promo section */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-lg">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Wrench className="text-blue-600 w-4 h-4 shrink-0" />
                  <span>Is something broken in your room?</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  Report immediate electrical, plumbing, appliance, or general maintenance complaints. Registered staff technicians will be auto-dispatched to bargain or schedule repairs instantly.
                </p>
              </div>
              <button
                onClick={() => { setActiveTab('complaints'); setShowNewIssueModal(true); }}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 cursor-pointer shrink-0 transition-colors"
              >
                File New Maintenance Report
              </button>
            </div>

            {/* Emergency Contacts card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <AlertCircle size={16} className="text-rose-500" />
                <span>Hostel Emergency Operations</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Front Desk</div>
                    <div className="text-slate-900 font-extrabold">+233 302 9481</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                  <Phone size={16} className="text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Security Guard</div>
                    <div className="text-slate-900 font-extrabold">+233 24 990 0112</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Operations Mail</div>
                    <div className="text-slate-900 font-extrabold truncate">admin@pinevela.com</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === 'complaints' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fade-in max-w-7xl">
            
            {/* List & Controls Panel */}
            <div className="space-y-4 xl:col-span-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Maintenance Desk</h2>
                  <p className="text-xs text-slate-500 font-medium">File, negotiate, and track resident room repairs and resolved tasks</p>
                </div>
                <button
                  onClick={() => setShowNewIssueModal(true)}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Report New Issue</span>
                </button>
              </div>

              {/* Filters / Search */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search complaints..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <select
                  value={issueFilter}
                  onChange={(e: any) => setIssueFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="all">All Complaints ({issueReports.length})</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="awaiting-confirmation">Awaiting Resident Confirmation</option>
                  <option value="resolved">Resolved & Confirmed</option>
                </select>
              </div>

              {/* Complaints List Container */}
              <div className="space-y-3">
                {filteredIssues.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
                    <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">No maintenance complaints matches your filter.</p>
                  </div>
                ) : (
                  filteredIssues.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => {
                        if (issue.assignedStaffId) {
                          setActiveChatIssueId(issue.id);
                        } else {
                          triggerToast("Chat with technician is only available once staff has been assigned.");
                        }
                      }}
                      className={`p-4 bg-white border rounded-2xl cursor-pointer transition-all hover:border-slate-300 space-y-3 ${
                        activeChatIssueId === issue.id ? 'ring-2 ring-blue-600 border-blue-600' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black inline-block ${
                            issue.urgency === 'High' ? 'bg-rose-100 text-rose-800' : issue.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {issue.urgency} Urgency
                          </span>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">{issue.title}</h3>
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg text-right ${
                          (issue.status === 'Resolved' && issue.studentAcceptedResolved) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          (issue.status === 'Resolved' && !issue.studentAcceptedResolved) ? 'bg-teal-50 text-teal-800 border border-teal-200 animate-pulse' :
                          issue.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {(issue.status === 'Resolved' && issue.studentAcceptedResolved) ? 'Completed & Confirmed' :
                           (issue.status === 'Resolved' && !issue.studentAcceptedResolved) ? 'Resolved Awaiting Confirmation' :
                           issue.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate">{issue.description}</p>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>Filed: {new Date(issue.date || '').toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {issue.assignedStaffName ? (
                            <span className="text-blue-700 font-extrabold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              Assigned Tech: {issue.assignedStaffName} ({issue.assignedStaffRole || 'Artisan'})
                            </span>
                          ) : (
                            <span className="text-slate-400">Awaiting technical assignment...</span>
                          )}
                        </div>
                      </div>

                      {/* Immediate Resident resolution confirm button */}
                      {issue.status === 'Resolved' && !issue.studentAcceptedResolved && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIssueForConfirm(issue);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/10 transition-colors"
                          >
                            Verify & Confirm Repair Resolution
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Chat & Tech Bargain Panel */}
            <div className="xl:col-span-5 h-[600px] xl:h-[70vh] bg-white border border-slate-200 rounded-3xl flex flex-col justify-between overflow-hidden shadow-xs">
              {activeChatIssueId ? (
                (() => {
                  const currentIssue = issueReports.find(i => i.id === activeChatIssueId);
                  if (!currentIssue) return <div className="p-6 text-center text-slate-400">Loading chat...</div>;

                  return (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-xl text-blue-800 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-slate-900 leading-tight">Chat with Technician</h3>
                            <p className="text-[10px] text-slate-500 font-bold truncate max-w-[180px]">
                              Issue: {currentIssue.title}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveChatIssueId(null)}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Message Log */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                        <div className="text-[10px] text-slate-400 font-extrabold text-center uppercase tracking-wider py-1 bg-white border border-slate-100 rounded-full max-w-xs mx-auto">
                          Dispatched: {currentIssue.assignedStaffName || 'Accredited Specialist'}
                        </div>

                        {activeChatMessages.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 font-semibold space-y-2">
                            <MessageSquare className="w-8 h-8 text-slate-200 mx-auto" />
                            <p>No messages yet. Send a message to coordinate access or bargain repair rates.</p>
                          </div>
                        ) : (
                          activeChatMessages.map(m => {
                            const isMe = m.senderRole === 'student';
                            return (
                              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs p-3 rounded-2xl text-xs font-semibold ${
                                  isMe ? 'bg-blue-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                }`}>
                                  <div>{m.message}</div>
                                  <span className={`block text-[9px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {new Date(m.timestamp || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat Input */}
                      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input
                          type="text"
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          placeholder="Type message to technician..."
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !newMessageText.trim()}
                          className="p-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl disabled:opacity-40 cursor-pointer"
                        >
                          <Send size={15} />
                        </button>
                      </form>
                    </>
                  );
                })()
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2.5 text-slate-400 bg-slate-50/20">
                  <MessageSquare className="w-12 h-12 text-slate-200" />
                  <h4 className="text-xs font-black text-slate-900">Coordinate and Chat with assigned Technicians</h4>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Select any of your submitted maintenance issues from the left panel that has an assigned technician to open a real-time coordination chat workspace.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-6 max-w-4xl animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Billing & Utilities Portal</h2>
              <p className="text-xs text-slate-500 font-medium">Track your room statements, rent balances, and utilities dues</p>
            </div>

            {/* Grid stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rent Balance</span>
                <div className="text-2xl font-black text-slate-900">GHS 0.00</div>
                <span className="text-[10px] text-emerald-600 font-bold block">Paid / Up-to-date</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Utility Bill Dues</span>
                <div className="text-2xl font-black text-slate-900">GHS 45.50</div>
                <span className="text-[10px] text-rose-500 font-bold block">Due in 5 days (Water & Power)</span>
              </div>
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Last Payment</span>
                <div className="text-lg font-black text-slate-900">GHS 3,400.00</div>
                <span className="text-[10px] text-slate-500 font-bold block">Accredited Bank Transfer - Sep 2026</span>
              </div>
            </div>

            {/* Utility Billing Statement Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900">Room Billing Statement</h3>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black">Room A-102</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 uppercase text-[9px] border-b border-slate-100">
                      <th className="p-3.5">Bill ID</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Period</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3.5 font-mono">UT-0926-02</td>
                      <td className="p-3.5">Water & Power Tariff</td>
                      <td className="p-3.5">September 2026</td>
                      <td className="p-3.5 font-bold">GHS 45.50</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[10px]">Unpaid</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono">UT-0826-04</td>
                      <td className="p-3.5">Water & Power Tariff</td>
                      <td className="p-3.5">August 2026</td>
                      <td className="p-3.5 font-bold">GHS 38.00</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px]">Paid</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3.5 font-mono">RT-2026-A1</td>
                      <td className="p-3.5">Semester Rent Fees</td>
                      <td className="p-3.5">Academic Yr 26/27</td>
                      <td className="p-3.5 font-bold">GHS 3,400.00</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px]">Paid</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 max-w-4xl animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Hostel Bulletins & Announcements</h2>
              <p className="text-xs text-slate-500 font-medium">Read bulletins and emergency announcements posted by your manager</p>
            </div>

            {/* List of Alerts */}
            <div className="space-y-4">
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-black text-[9px] rounded-full uppercase tracking-wider">Scheduled Water Shutoff</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Posted Today, 2:15 PM</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">Maintenance: Water Pump Servicing (A-Block Wing)</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Attention all residents of Block A. There will be a temporary scheduled water shutoff tomorrow from 8:00 AM to 12:00 PM as engineers service the primary water filtration pumps. Please store water beforehand. Sorry for the brief inconvenience.
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-black text-[9px] rounded-full uppercase tracking-wider">Community Update</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Sep 12, 2026</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">Hostel Security Gate Protocol Enforcement</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  To ensure resident safety, the main security gates will be closed at 10:00 PM nightly. Security guards will verify valid resident profiles or key assignments at the gate. If you expect to arrive later, please coordinate with the security desk or have your digital portal key ready for verify checks.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-xl animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Profile & Security Settings</h2>
              <p className="text-xs text-slate-500 font-medium">Manage your personal information, room credentials, and settings</p>
            </div>

            {/* Settings Forms */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                {renderAvatarGraphic(currentUser?.avatar, "w-14 h-14 text-base bg-blue-100 text-blue-900")}
                <div>
                  <h3 className="text-sm font-black text-slate-900">{currentUser?.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{currentUser?.email}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.name}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.email}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Verification Role Type</label>
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold capitalize">
                    {currentUser?.role === 'student' ? 'Student Resident' : 'Special Resident'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* NEW COMPLAINT MODAL */}
      {showNewIssueModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-200/80 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">File Maintenance Complaint</h3>
              <button 
                onClick={() => setShowNewIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="block text-slate-700">Complaint Title *</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. Broken water tap or shower leaking"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-700">Category *</label>
                  <select
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700">Urgency Level *</label>
                  <select
                    value={issueUrgency}
                    onChange={(e: any) => setIssueUrgency(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                  >
                    <option value="Low">Low (No rush)</option>
                    <option value="Medium">Medium (Fix in 24h)</option>
                    <option value="High">High (Immediate Risk)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700">Detailed Complaint Description *</label>
                <textarea
                  required
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what is wrong, exact location in room, and any other helpful instructions for dispatching the artisan..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewIssueModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl cursor-pointer disabled:opacity-40"
                >
                  {submittingIssue ? 'Submitting...' : 'File Maintenance Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* VERIFY RESOLUTION MODAL */}
      {selectedIssueForConfirm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b">Verify Technical Repair Work</h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Confirm that the assigned technician has fully resolved the issue: <strong>{selectedIssueForConfirm.title}</strong> to your satisfaction.
            </p>
            <form onSubmit={handleConfirmCompletion} className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Resident Feedback (Optional)</label>
              <input
                type="text"
                value={confirmFeedback}
                onChange={(e) => setConfirmFeedback(e.target.value)}
                placeholder="e.g. Excellent job, tap fixed perfectly!"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIssueForConfirm(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConfirm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl"
                >
                  {submittingConfirm ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showSignoutConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <LogOut size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">Are you sure you want to sign out?</h3>
              <p className="text-xs text-slate-500 font-semibold">Your resident workspace session will be safely signed out.</p>
            </div>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => setShowSignoutConfirmModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Keep Session
              </button>
              <button
                onClick={() => { setShowSignoutConfirmModal(false); logout(); navigate('/', { replace: true }); }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer"
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
