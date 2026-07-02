import React, { useState, useEffect } from 'react';
import PineLogo from './PineLogo';
import { IssueReport, MeetingRequest, Notification, HostelRating, Hostel } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  AlertTriangle,
  Calendar,
  History,
  Bell,
  Star,
  LogOut,
  MapPin,
  Key,
  MessageSquare,
  ChevronRight,
  Info,
  ChevronLeft,
  Upload,
  X,
  CheckCircle,
  Copy,
  Video,
  Send,
  ThumbsUp,
  MessageCircle,
  Image as ImageIcon,
  UserPlus,
  Settings,
  Mic,
  StopCircle,
  Smile,
  Paperclip
} from 'lucide-react';

interface Page5StudentDashboardProps {
  currentScreen: 'student-dashboard' | 'student-report-issue';
  onNavigate: (screen: 'public-browse' | 'student-dashboard' | 'student-report-issue') => void;
  onSubmitIssue: (issue: Partial<IssueReport>) => void;
}

export default function Page5StudentDashboard({
  currentScreen,
  onNavigate,
  onSubmitIssue
}: Page5StudentDashboardProps) {
  const { user, apiFetch } = useAuth();

  // Local state for Digital Key modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'room' | 'report' | 'meetings' | 'history' | 'notifications' | 'rate' | 'chat'>('room');

  // Stateful datasets synchronized with full-stack APIs
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [ratingsList, setRatingsList] = useState<HostelRating[]>([]);
  const [issuesHistory, setIssuesHistory] = useState<IssueReport[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(true);

  // Chat Lounge State Variables
  const [chatProfile, setChatProfile] = useState<{ nickname: string; avatarUrl: string } | null>(null);
  const [chatNickname, setChatNickname] = useState('');
  const [chatAvatar, setChatAvatar] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [activeChatChannel, setActiveChatChannel] = useState<'global' | 'hostel' | 'dm'>('global');
  const [activeChatId, setActiveChatId] = useState('global');
  const [dmRoomsList, setDmRoomsList] = useState<any[]>([]);
  const [availableStudentsList, setAvailableStudentsList] = useState<any[]>([]);
  const [showDMSlotModal, setShowDMSlotModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showPhotoDropdown, setShowPhotoDropdown] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // New states for extended chat capabilities (audio recording, reactions, stickers/gifs)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showStickersGifsDropdown, setShowStickersGifsDropdown] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = React.useRef<any>(null);
  const recordingTimerRef = React.useRef<any>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Form State for "Report an Issue"
  const [issueTitle, setIssueTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [description, setDescription] = useState('');
  const [contactMethod, setContactMethod] = useState<'In-app Notification' | 'Phone Call' | 'Email'>('In-app Notification');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80' // default preview photo
  ]);

  // Form State for "Book Meeting"
  const [meetType, setMeetType] = useState<'Video Call' | 'Chat' | 'In-Person'>('Video Call');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetReason, setMeetReason] = useState('');

  // Form State for "Rate Hostel"
  const [ratingHostelId, setRatingHostelId] = useState('');
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingReview, setRatingReview] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAcceptResolution = async (issueId: string) => {
    try {
      const updated = await apiFetch(`/api/issue-reports/${issueId}`, {
        method: 'PUT',
        body: JSON.stringify({ studentAcceptedResolved: true, status: 'Resolved' })
      });
      setIssuesHistory(prev => prev.map(issue => issue.id === issueId ? updated : issue));
      triggerToast('You have accepted/confirmed the resolution of this issue!');
    } catch (err: any) {
      console.error("Failed to accept resolution:", err);
      triggerToast(`Failed to update resolution confirmation: ${err.message}`);
    }
  };

  // Synchronize screen state with activeTab
  useEffect(() => {
    if (currentScreen === 'student-report-issue') {
      setActiveTab('report');
    } else {
      setActiveTab('room');
    }
  }, [currentScreen]);

  // Fetch all synchronized states on mount
  const fetchAllData = async () => {
    try {
      setLoadingDatasets(true);
      const [mList, nList, rList, iList, hList] = await Promise.all([
        apiFetch('/api/meetings').catch(() => []),
        apiFetch('/api/notifications').catch(() => []),
        apiFetch('/api/ratings').catch(() => []),
        apiFetch('/api/issue-reports').catch(() => []),
        fetch('/api/hostels').then(r => r.json()).catch(() => [])
      ]);
      setMeetings(mList);
      setNotificationsList(nList);
      setRatingsList(rList);
      
      // Filter issues by logged-in user or Alex Thompson as default fallback
      const currentStudentId = user?.id || 'STU-2024-8842';
      const currentStudentName = user?.name || 'Alex Thompson';
      setIssuesHistory(iList.filter((item: any) => 
        item.studentId === currentStudentId || 
        item.studentName === currentStudentName ||
        (currentStudentId === 'student_882' && (item.studentId === 'STU-882' || item.studentId === 'student_882')) ||
        (currentStudentId === 'student_102' && (item.studentId === 'STU-102' || item.studentId === 'student_102')) ||
        (currentStudentId === 'student_994' && (item.studentId === 'STU-994' || item.studentId === 'student_994'))
      ));
      setHostels(hList);

      if (hList.length > 0 && !ratingHostelId) {
        setRatingHostelId(hList[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch fullstack datasets:", err);
    } finally {
      setLoadingDatasets(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Poll notifications every 4 seconds for real-time alerts and chat dot update
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const nList = await apiFetch('/api/notifications');
        setNotificationsList(nList);
      } catch (err) {
        console.warn("Failed to poll notifications:", err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-read notifications for the active chat channel
  useEffect(() => {
    if (activeTab === 'chat') {
      const markAsRead = async () => {
        let toRead = [];
        if (activeChatChannel === 'global') {
          toRead = notificationsList.filter(n => !n.read && n.title === 'Global Chat Lounge');
        } else if (activeChatChannel === 'hostel') {
          toRead = notificationsList.filter(n => !n.read && n.title === 'My Hostel Lounge');
        } else if (activeChatChannel === 'dm') {
          const activeRoom = dmRoomsList.find(r => r.id === activeChatId);
          if (activeRoom) {
            toRead = notificationsList.filter(n => 
              !n.read && 
              n.title === 'Direct Chat' && 
              n.message.includes(activeRoom.opponent?.nickname || '')
            );
          }
        }

        if (toRead.length > 0) {
          try {
            await Promise.all(toRead.map(n => apiFetch(`/api/notifications/${n.id}/read`, { method: 'PUT' })));
            setNotificationsList(prev => prev.map(n => toRead.some(tr => tr.id === n.id) ? { ...n, read: true } : n));
          } catch (err) {
            console.error("Failed to auto-read notifications:", err);
          }
        }
      };
      markAsRead();
    }
  }, [activeTab, activeChatChannel, activeChatId, notificationsList, dmRoomsList]);

  // Fetch Chat Profile & DM rooms
  const loadChatBaseInfo = async () => {
    try {
      const profile = await apiFetch('/api/chat/profile');
      setChatProfile(profile);
      setChatNickname(profile.nickname);
      setChatAvatar(profile.avatarUrl);

      const dms = await apiFetch('/api/chat/dms');
      setDmRoomsList(dms);
      
      const students = await apiFetch('/api/chat/students');
      setAvailableStudentsList(students);
    } catch (err) {
      console.error("Failed to load chat base info:", err);
    }
  };

  const loadChatMessages = async (channelType: string, channelId: string) => {
    try {
      const msgs = await apiFetch(`/api/chat/messages?channelType=${channelType}&channelId=${channelId}`);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Failed to load chat messages:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      loadChatBaseInfo();
      loadChatMessages(activeChatChannel, activeChatId);

      // Poll messages every 4 seconds for real-time emulation!
      const interval = setInterval(() => {
        loadChatMessages(activeChatChannel, activeChatId);
        // Also refresh DM rooms to see if any request is accepted
        apiFetch('/api/chat/dms').then(setDmRoomsList).catch(console.error);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [activeTab, activeChatChannel, activeChatId]);

  const handleUpdateChatProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatNickname.trim() || !chatAvatar.trim()) {
      triggerToast('Please provide both a nickname and avatar URL');
      return;
    }
    try {
      const updated = await apiFetch('/api/chat/profile', {
        method: 'POST',
        body: JSON.stringify({ nickname: chatNickname, avatarUrl: chatAvatar })
      });
      setChatProfile(updated);
      setShowProfileEdit(false);
      triggerToast('Chat profile updated successfully!');
      loadChatMessages(activeChatChannel, activeChatId);
    } catch (err: any) {
      triggerToast(`Failed to update profile: ${err.message}`);
    }
  };

  const handleSendChatMessage = async (content: string, type: 'text' | 'image' = 'text') => {
    if (!content.trim()) return;
    try {
      const newMsg = await apiFetch('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          channelType: activeChatChannel,
          channelId: activeChatId,
          messageType: type,
          content: content.trim()
        })
      });
      setChatMessages(prev => [...prev, newMsg]);
      setChatInput('');
      setShowPhotoDropdown(false);
    } catch (err: any) {
      triggerToast(`Failed to send message: ${err.message}`);
    }
  };

  const handleStartDMChat = async (recipientId: string) => {
    try {
      const room = await apiFetch('/api/chat/dms/request', {
        method: 'POST',
        body: JSON.stringify({ recipientId })
      });
      setShowDMSlotModal(false);
      triggerToast('Direct message request sent!');
      const dms = await apiFetch('/api/chat/dms');
      setDmRoomsList(dms);
      setActiveChatChannel('dm');
      setActiveChatId(room.id);
    } catch (err: any) {
      triggerToast(`Failed to start DM: ${err.message}`);
    }
  };

  const handleAcceptDMRequest = async (roomId: string) => {
    try {
      const room = await apiFetch('/api/chat/dms/accept', {
        method: 'POST',
        body: JSON.stringify({ roomId })
      });
      triggerToast('Message request accepted!');
      const dms = await apiFetch('/api/chat/dms');
      setDmRoomsList(dms);
    } catch (err: any) {
      triggerToast(`Failed to accept request: ${err.message}`);
    }
  };

  const copyKeyToClipboard = () => {
    setCopiedCode(true);
    triggerToast('Room Access Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddMockPhoto = () => {
    if (photos.length >= 3) {
      triggerToast('Maximum of 3 photos reached');
      return;
    }
    const mockPhotos = [
      'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1563453392212-326f5185007a?auto=format&fit=crop&w=400&q=80'
    ];
    const newPhoto = mockPhotos[photos.length - 1] || mockPhotos[0];
    setPhotos([...photos, newPhoto]);
    triggerToast('Added mock photo attachment');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) {
      triggerToast('Please provide an issue title');
      return;
    }

    try {
      const issuePayload = {
        title: issueTitle,
        category,
        urgency,
        description,
        contactMethod,
        photos,
        studentName: user?.name || 'Alex Thompson',
        studentId: user?.id || 'STU-2024-8842',
        hostelName: 'Pine Crest Residency',
        blockFloor: 'Block C, 4th Floor',
        roomBed: 'Room C-402, Bed A',
      };
      
      await apiFetch('/api/issue-reports', {
        method: 'POST',
        body: JSON.stringify(issuePayload)
      });

      triggerToast('Maintenance issue reported successfully!');
      
      // Reset Form
      setIssueTitle('');
      setDescription('');
      setUrgency('Medium');
      setCategory('Plumbing');
      setPhotos(['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80']);

      // Reload
      await fetchAllData();
      
      // Go to history to see reported issue
      setActiveTab('history');
    } catch (err: any) {
      triggerToast(`Submission failed: ${err.message}`);
    }
  };

  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetDate || !meetTime || !meetReason.trim()) {
      triggerToast('Please fill out all meeting request details');
      return;
    }

    try {
      const payload = {
        hostelName: 'Pine Crest Residency',
        type: meetType,
        date: meetDate,
        time: meetTime,
        reason: meetReason
      };

      await apiFetch('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      triggerToast(`Meeting request submitted successfully! Status is Pending.`);
      
      // Clear meeting form
      setMeetReason('');
      setMeetDate('');
      setMeetTime('');

      // Reload
      await fetchAllData();
    } catch (err: any) {
      triggerToast(`Meeting registration failed: ${err.message}`);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      triggerToast('Notification marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingReview.trim()) {
      triggerToast('Please provide feedback review text');
      return;
    }

    const selectedHostelObj = hostels.find(h => h.id === ratingHostelId);
    if (!selectedHostelObj) return;

    try {
      const payload = {
        hostelId: ratingHostelId,
        hostelName: selectedHostelObj.name,
        score: ratingScore,
        review: ratingReview
      };

      await apiFetch('/api/ratings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      triggerToast(`Thank you! Your ${ratingScore}-star review has been posted.`);
      
      // Clear rate form
      setRatingReview('');
      setRatingScore(5);

      // Reload
      await fetchAllData();
    } catch (err: any) {
      triggerToast(`Rating failed: ${err.message}`);
    }
  };

  const hasUnreadChatNotification = notificationsList.some(n => 
    !n.read && 
    (n.title === 'Global Chat Lounge' || n.title === 'My Hostel Lounge' || n.title === 'Direct Chat')
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-950 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border border-slate-700">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="cursor-pointer flex items-center gap-2" onClick={() => onNavigate('student-dashboard')}>
          <PineLogo />
          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-100">Student Portal</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notifications button */}
          <button onClick={() => triggerToast('No new unread messages')} className="p-2 hover:bg-slate-50 rounded-xl relative text-slate-500 hover:text-slate-700 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
          </button>
          
          {/* User profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="Alex Thompson"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-extrabold text-slate-900">{user?.name || 'Alex Thompson'}</p>
              <p className="text-slate-400 text-[10px]">{user?.id || 'STU-2024-8842'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 bg-slate-900 text-slate-400 p-4 lg:py-6 flex flex-col justify-between shrink-0 gap-4">
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('room');
                onNavigate('student-dashboard');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'room'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Home size={16} />
              <span>Room Information</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('report');
                onNavigate('student-report-issue');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'report'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <AlertTriangle size={16} />
              <span>Report an Issue</span>
            </button>

            <button
              onClick={() => setActiveTab('meetings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left ${
                activeTab === 'meetings'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar size={16} />
              <span>Meeting Requests</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left ${
                activeTab === 'history'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <History size={16} />
              <span>Reports History</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left ${
                activeTab === 'notifications'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Bell size={16} />
              <span className="flex-1">Notifications</span>
              {notificationsList.filter(n => !n.read).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {notificationsList.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rate')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left ${
                activeTab === 'rate'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Star size={16} />
              <span>Rate Management</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left ${
                activeTab === 'chat'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageSquare size={16} />
              <span className="flex-1">Chat Lounge</span>
              {hasUnreadChatNotification && activeTab !== 'chat' && (
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
              )}
            </button>
          </nav>

          <button
            onClick={() => onNavigate('public-browse')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all mt-auto"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Content Pane */}
        {activeTab === 'room' ? (
          /* PAGE 5: DASHBOARD (ROOM INFORMATION) */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
            
            {/* Top Bar / Header titles */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight text-left">My Residence</h1>
                <p className="text-xs text-slate-500 text-left font-medium">Manage your stay and stay updated with hostel events.</p>
              </div>

              {/* Location Badge */}
              <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold self-start md:self-auto">
                <MapPin size={14} className="text-slate-400" />
                <span>University South Campus, Sector 12</span>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column Content - Room Specs, Maintenance, Quick Contacts */}
              <div className="xl:col-span-8 space-y-6">
                
                {/* Starlight Residency Header Card */}
                <div className="bg-blue-900 rounded-3xl p-6 text-white space-y-6 relative overflow-hidden shadow-lg shadow-blue-900/10">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-20" />
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10">
                      <Home size={24} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-extrabold tracking-tight">Starlight Residency</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">Occupied</span>
                        <span className="text-slate-300 text-xs">Manager: Sarah Jenkins</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-left">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Block / Wing</span>
                      <span className="text-sm font-extrabold block mt-0.5 text-white">Block C (Alpha)</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Floor Level</span>
                      <span className="text-sm font-extrabold block mt-0.5 text-white">4th Floor</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Room Number</span>
                      <span className="text-sm font-extrabold block mt-0.5 text-white">C-402</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block">Assigned Bed</span>
                      <span className="text-sm font-extrabold block mt-0.5 text-white">Bed A (Window)</span>
                    </div>
                  </div>

                  {/* Footer inside the card */}
                  <div className="pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <p className="text-xs text-slate-300 flex items-center gap-2 text-left">
                      <Key size={14} className="text-amber-400 shrink-0" />
                      <span>Room access code is available in your digital key settings.</span>
                    </p>
                    <button
                      onClick={() => setShowKeyModal(true)}
                      className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-50 font-bold text-xs rounded-xl shadow transition-colors shrink-0"
                    >
                      View Digital Key
                    </button>
                  </div>
                </div>

                {/* Sub row: Maintenance & Quick Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  
                  {/* Maintenance Status */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Maintenance Status</h3>
                    <p className="text-[11px] text-slate-400">Current health of your utilities</p>
                    
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">Electricity</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-[9px]">Stable</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">WiFi Connectivity</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold uppercase text-[9px]">Intermittent</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700">Water Supply</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-[9px]">Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Contacts */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Quick Contacts</h3>
                    <p className="text-[11px] text-slate-400">Emergency & Hostel Staff</p>

                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">Front Desk</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">+23357389363</p>
                        </div>
                        <button onClick={() => triggerToast('Opening secure chat with Front Desk...')} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-900 rounded-lg transition-colors">
                          <MessageSquare size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">Security (24/7)</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">+233253883837</p>
                        </div>
                        <button onClick={() => triggerToast('Emergency Security line is dialing...')} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-900 rounded-lg transition-colors">
                          <MessageSquare size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">Hostel Warden</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">sarah.j@pinevela.com</p>
                        </div>
                        <button onClick={() => triggerToast('Opening email to Hostel Warden...')} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-900 rounded-lg transition-colors">
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Column Content - Quick Actions & Notifications overview */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Report an Issue yellow prompt card */}
                <div className="bg-amber-500 rounded-2xl p-5 text-slate-950 space-y-4 text-left shadow-md shadow-amber-500/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm tracking-tight uppercase">Quick Actions</h3>
                    <span className="text-xs">⚡</span>
                  </div>
                  
                  <button
                    onClick={() => setActiveTab('report')}
                    className="w-full bg-slate-950 text-amber-400 hover:bg-slate-900 py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-colors shadow"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={15} />
                      <span>Report an Issue</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-slate-800">
                    <button onClick={() => setActiveTab('meetings')} className="bg-white/80 hover:bg-white p-3 rounded-xl font-extrabold text-[10px] text-center transition-all">
                      Request Meeting
                    </button>
                    <button onClick={() => setActiveTab('rate')} className="bg-white/80 hover:bg-white p-3 rounded-xl font-extrabold text-[10px] text-center transition-all">
                      Rate Management
                    </button>
                  </div>
                </div>

                {/* Notifications Preview Panel */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Recent Updates</h3>
                    <span className="bg-blue-50 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">Realtime</span>
                  </div>

                  <div className="space-y-4 pt-1">
                    {notificationsList.slice(0, 3).map((notif) => (
                      <div key={notif.id} className="flex gap-3 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                          notif.type === 'success' ? 'bg-green-500' :
                          notif.type === 'warning' ? 'bg-amber-500' :
                          notif.type === 'error' ? 'bg-red-500' : 'bg-blue-400'
                        }`} />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800">{notif.title}</p>
                            <span className="text-[9px] text-slate-400">{notif.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    {notificationsList.length === 0 && (
                      <p className="text-xs text-slate-400 italic py-2 text-center">No recent alerts</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-center">
                    <button onClick={() => setActiveTab('notifications')} className="text-xs font-bold text-blue-900 hover:underline">
                      View Full Alerts Center ({notificationsList.length})
                    </button>
                  </div>
                </div>

                {/* Pro Tip Card */}
                <div className="bg-blue-950 text-white rounded-2xl p-5 text-left relative overflow-hidden shadow">
                  <div className="absolute right-2 bottom-2 text-white/5 pointer-events-none">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💡</span> Pro Tip
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-2.5">
                    Book meetings with the Hostel Manager to resolve bed transfers or room amenity policies directly.
                  </p>
                </div>

              </div>

            </div>

            {/* View Digital Key Modal Dialog */}
            {showKeyModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl relative text-center space-y-6">
                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={18} />
                  </button>

                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                    🔑
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-slate-900 text-base">Digital Room Key</h3>
                    <p className="text-xs text-slate-500">Hold near your smart lock sensor to open door</p>
                  </div>

                  {/* Mock QR Code */}
                  <div className="w-40 h-40 bg-slate-100 rounded-2xl mx-auto border border-slate-200 flex flex-col items-center justify-center p-3">
                    <div className="grid grid-cols-4 gap-2 w-full h-full opacity-80">
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-300 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-300 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-300 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-300 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                      <div className="bg-slate-300 rounded"></div>
                      <div className="bg-slate-800 rounded"></div>
                    </div>
                  </div>

                  {/* Access code */}
                  <div className="bg-slate-50 rounded-xl border border-slate-150 p-3 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Access PIN Code</span>
                      <span className="font-mono font-bold text-sm tracking-widest text-slate-800 block mt-0.5">C-402-4521</span>
                    </div>
                    <button
                      onClick={copyKeyToClipboard}
                      className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                    >
                      {copiedCode ? <span className="text-xs text-emerald-600 font-bold">Copied!</span> : <Copy size={16} />}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowKeyModal(false)}
                    className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors"
                  >
                    Close Key Card
                  </button>
                </div>
              </div>
            )}

          </main>
        ) : activeTab === 'report' ? (
          /* PAGE 6: REPORT AN ISSUE */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            
            {/* Top Breadcrumb */}
            <button
              onClick={() => setActiveTab('room')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Back to Room Information</span>
            </button>

            {/* Title Block */}
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Report an Issue</h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Something not working? Let us know and our maintenance team will get it fixed for you as soon as possible.
              </p>
            </div>

            {/* Reporting Context Info Block */}
            <div className="bg-slate-50 rounded-2xl border border-slate-150 p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>📋</span> Reporting Context
              </h3>
              <p className="text-[11px] text-slate-400">Your room assignment context is automatically linked to this report.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block">Student Name</span>
                  <span className="font-extrabold text-slate-800">{user?.name || 'Alex Thompson'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block">Hostel Name</span>
                  <span className="font-extrabold text-slate-800">Pine Crest Residency</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block">Block / Floor</span>
                  <span className="font-extrabold text-slate-800">Block C, 4th Floor</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block">Room / Bed</span>
                  <span className="font-extrabold text-slate-800">Room C-402, Bed A</span>
                </div>
              </div>
            </div>

            {/* Main Issue Form */}
            <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 space-y-6 shadow-sm">
              
              {/* Issue Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Issue Title</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="Short summary (e.g., Leaking kitchen faucet)"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-sm"
                />
              </div>

              {/* Category & Urgency Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-sm"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="WiFi / Internet">WiFi / Internet</option>
                    <option value="Appliances">Appliances / A/C</option>
                    <option value="Other">Other Issues</option>
                  </select>
                </div>

                {/* Urgency Level Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">Urgency Level</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setUrgency('Low')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        urgency === 'Low'
                          ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('Medium')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        urgency === 'Medium'
                          ? 'bg-blue-900 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('High')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        urgency === 'High'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us exactly what happened, where it is, and when you noticed it..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-sm"
                />
              </div>

              {/* Attach Photos */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 block">Attach Photos (Up to 3)</label>
                <div className="grid grid-cols-3 gap-4">
                  
                  {/* Plus/Add Box */}
                  <div
                    onClick={handleAddMockPhoto}
                    className="aspect-square border-2 border-dashed border-slate-200 hover:border-blue-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-900 cursor-pointer transition-colors bg-slate-50"
                  >
                    <Upload size={20} />
                    <span className="text-[9px] font-bold uppercase mt-1.5">Add Photo</span>
                  </div>

                  {/* Photo previews */}
                  {photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden group">
                      <img
                        src={photo}
                        alt="attachment"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-90 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Empty state slots */}
                  {Array.from({ length: Math.max(0, 2 - photos.length) }).map((_, i) => (
                    <div key={i} className="aspect-square border border-dashed border-slate-150 rounded-2xl flex items-center justify-center text-slate-300 bg-slate-50/50">
                      <Upload size={16} className="opacity-30" />
                    </div>
                  ))}

                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Upload clear photos of the issue to help our maintenance team understand the problem faster.</span>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-extrabold text-slate-700 block">Preferred Contact Method</label>
                <div className="flex flex-wrap gap-6 text-xs text-slate-600 font-semibold pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contact-method"
                      checked={contactMethod === 'In-app Notification'}
                      onChange={() => setContactMethod('In-app Notification')}
                      className="border-slate-300 text-blue-900 focus:ring-blue-900 w-4 h-4"
                    />
                    <span>In-app Notification</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contact-method"
                      checked={contactMethod === 'Phone Call'}
                      onChange={() => setContactMethod('Phone Call')}
                      className="border-slate-300 text-blue-900 focus:ring-blue-900 w-4 h-4"
                    />
                    <span>Phone Call</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contact-method"
                      checked={contactMethod === 'Email'}
                      onChange={() => setContactMethod('Email')}
                      className="border-slate-300 text-blue-900 focus:ring-blue-900 w-4 h-4"
                    />
                    <span>Email</span>
                  </label>
                </div>
              </div>

              {/* Bottom notes and action buttons */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <span>⚠️</span>
                  <span>Falsely reporting issues may lead to fines.</span>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('room')}
                    className="flex-1 sm:flex-initial py-2.5 px-5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs text-center transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl text-center shadow transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </div>

            </form>

          </main>
        ) : activeTab === 'meetings' ? (
          /* NEW: MEETING REQUESTS SCREEN */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meeting Requests</h1>
                <p className="text-xs text-slate-500 font-medium">Book real-time meetings with your hostel manager to voice queries.</p>
              </div>
              <span className="bg-indigo-50 text-indigo-900 border border-indigo-100 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shrink-0 self-start md:self-auto">
                Automatic Sync
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Form to book a new meeting */}
              <form onSubmit={handleBookMeeting} className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <span>📅</span> Book a New Meeting
                </h2>
                <p className="text-xs text-slate-400">Choose your communication mode, set the time, and submit to the manager.</p>

                {/* Communication Mode Select */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Meeting Mode</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-150">
                    <button
                      type="button"
                      onClick={() => setMeetType('Video Call')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        meetType === 'Video Call'
                          ? 'bg-blue-900 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Video size={14} />
                      <span>Video Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetType('Chat')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        meetType === 'Chat'
                          ? 'bg-purple-900 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <MessageCircle size={14} />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetType('In-Person')}
                      className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                        meetType === 'In-Person'
                          ? 'bg-teal-900 text-white shadow'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <MapPin size={14} />
                      <span>In-Person</span>
                    </button>
                  </div>
                </div>

                {/* Schedule & Time Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Target Date</label>
                    <input
                      type="date"
                      required
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Preferred Time</label>
                    <input
                      type="time"
                      required
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Agenda / Reason */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Meeting Reason / Agenda</label>
                  <textarea
                    required
                    rows={3}
                    value={meetReason}
                    onChange={(e) => setMeetReason(e.target.value)}
                    placeholder="Briefly describe the purpose of the meeting..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl transition-all shadow"
                >
                  Submit Meeting Request
                </button>
              </form>

              {/* Right Column: List of meeting requests */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm min-h-[350px]">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Your Requested Meetings</h2>
                <p className="text-xs text-slate-400">Track approvals and scheduled times. Once approved, details will activate.</p>

                <div className="space-y-3.5 pt-1 max-h-[360px] overflow-y-auto pr-1">
                  {meetings.map((meet) => (
                    <div key={meet.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-2 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wide ${
                            meet.type === 'Video Call' ? 'bg-blue-100 text-blue-900' :
                            meet.type === 'Chat' ? 'bg-purple-100 text-purple-900' : 'bg-teal-100 text-teal-900'
                          }`}>
                            {meet.type}
                          </span>
                          <span className="font-extrabold text-slate-700">{meet.date} at {meet.time}</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">“{meet.reason}”</p>
                        {meet.status === 'Approved' && (
                          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Approved! Join via in-app dashboard details at schedule.</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider shrink-0 ${
                        meet.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        meet.status === 'Declined' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {meet.status}
                      </span>
                    </div>
                  ))}
                  {meetings.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <Calendar size={32} className="mx-auto text-slate-200 mb-2" />
                      <p className="text-xs italic">No meeting requests logged. Book one on the left!</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </main>
        ) : activeTab === 'history' ? (
          /* NEW: REPORTS HISTORY SCREEN */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports History</h1>
                <p className="text-xs text-slate-500 font-medium">Review and monitor progress on all your submitted maintenance reports.</p>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full">
                Total Logs: {issuesHistory.length}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-black tracking-wider text-[9px]">
                      <th className="py-3 px-4">Issue Details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date Reported</th>
                      <th className="py-3 px-4 text-center">Resolution Confirmation</th>
                      <th className="py-3 px-4 text-right">Photo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                    {issuesHistory.map((issue) => (
                      <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-extrabold text-slate-900">{issue.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{issue.description}</p>
                        </td>
                        <td className="py-4 px-4">{issue.category}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.urgency === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                            issue.urgency === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {issue.urgency}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            issue.staffCompleted ? 'bg-indigo-100 text-indigo-800 animate-pulse' :
                            issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {issue.status === 'Resolved' ? 'Resolved' : issue.staffCompleted ? 'Fix Pending Review' : issue.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400">{issue.date}</td>
                        <td className="py-4 px-4 text-center">
                          {issue.studentAcceptedResolved ? (
                            <span className="text-emerald-600 font-extrabold inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 text-[10px]">
                              ✓ Accepted
                            </span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              {issue.staffCompleted && (
                                <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                  Staff marked as fixed
                                </span>
                              )}
                              <button
                                onClick={() => handleAcceptResolution(issue.id)}
                                className={`px-2.5 py-1 text-slate-950 text-[10px] font-black rounded-lg shadow-sm transition-colors cursor-pointer ${
                                  issue.staffCompleted ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-amber-500 hover:bg-amber-600'
                                }`}
                              >
                                Confirm Resolved
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {issue.photos && issue.photos.length > 0 ? (
                            <img
                              src={issue.photos[0]}
                              alt="attached thumbnail"
                              className="w-8 h-8 rounded-lg object-cover ml-auto border border-slate-200"
                            />
                          ) : (
                            <span className="text-slate-300 italic text-[10px]">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {issuesHistory.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                          No history items found. Fill in the 'Report an Issue' form to log problems!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        ) : activeTab === 'notifications' ? (
          /* NEW: NOTIFICATIONS SCREEN */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifications Center</h1>
                <p className="text-xs text-slate-500 font-medium">Review official updates, booking statuses, and utility notices.</p>
              </div>
              <button
                onClick={() => {
                  notificationsList.forEach(n => {
                    if (!n.read) handleMarkNotificationRead(n.id);
                  });
                  triggerToast('All notifications marked as read!');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow self-start md:self-auto shrink-0 transition-colors"
              >
                Mark all as read
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              {notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                    notif.read
                      ? 'bg-slate-50/55 border-slate-100 opacity-75'
                      : 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/50 shadow-sm'
                  }`}
                >
                  {/* Visual Status Dot */}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                    notif.read ? 'bg-slate-300' : 'bg-blue-600 animate-pulse'
                  }`} />

                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`font-extrabold ${notif.read ? 'text-slate-700' : 'text-slate-900 text-sm'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold">{notif.date}</span>
                    </div>
                    <p className="text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    
                    {!notif.read && (
                      <span className="text-[9px] font-black uppercase text-blue-600 mt-2 block tracking-wide">
                        Click to mark read
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {notificationsList.length === 0 && (
                <p className="text-center py-12 text-slate-400 italic">No notifications alerts registered at the moment.</p>
              )}
            </div>

          </main>
        ) : activeTab === 'rate' ? (
          /* NEW: RATE MANAGEMENT SCREEN */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rate Management</h1>
                <p className="text-xs text-slate-500 font-medium">Rate residences, voice your experience, and assist prospective juniors.</p>
              </div>
              <span className="bg-amber-500/10 text-amber-800 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 self-start md:self-auto">
                ⭐ Community Focused
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Write Review form */}
              <form onSubmit={handleSubmitRating} className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <span>✍️</span> Review Your Hostel
                </h2>
                <p className="text-xs text-slate-400">Share your real staying feedback to update our public average rating score.</p>

                {/* Target Hostel Select */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Select Property</label>
                  <select
                    value={ratingHostelId}
                    onChange={(e) => setRatingHostelId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs text-slate-800"
                  >
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stars Score Button Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Your Score Rating</label>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-150 justify-around">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        className={`p-1 rounded transition-colors text-lg ${
                          star <= ratingScore ? 'text-amber-500' : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Review Text */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">Written Review Comments</label>
                  <textarea
                    required
                    rows={4}
                    value={ratingReview}
                    onChange={(e) => setRatingReview(e.target.value)}
                    placeholder="Describe cleanliness, WiFi speeds, manager interaction, safety..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow"
                >
                  Submit Written Review
                </button>
              </form>

              {/* Right Column: Scrolling feedback feed */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm min-h-[350px]">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Student Testimonials</h2>
                <p className="text-xs text-slate-400">View real reviews logged statefully from verified campus students.</p>

                <div className="space-y-4 pt-1 max-h-[360px] overflow-y-auto pr-1">
                  {ratingsList.map((rating) => (
                    <div key={rating.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-left">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-extrabold text-slate-900">{rating.studentName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Staying at {rating.hostelName}</p>
                        </div>

                        {/* Stars Block */}
                        <div className="flex items-center gap-0.5 bg-white px-2 py-1 rounded-lg border border-slate-150 font-bold text-amber-500">
                          <span>{rating.score}</span>
                          <span className="text-xs">★</span>
                        </div>
                      </div>

                      <p className="text-slate-600 font-medium leading-relaxed italic">
                        “{rating.review}”
                      </p>
                      
                      <div className="text-[9px] text-slate-400 text-right font-medium">
                        Posted on {rating.date}
                      </div>
                    </div>
                  ))}
                  {ratingsList.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-xs italic">No ratings logged for any properties yet.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </main>
        ) : (
          /* CHAT LOUNGE SCREEN */
          <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-61px)] overflow-hidden bg-slate-50 text-xs">
            {/* Left Column: Channels & DMs list */}
            <div className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-900" />
                  <span>Chat Lounge</span>
                </span>
                <button
                  onClick={() => setShowDMSlotModal(true)}
                  className="p-1.5 hover:bg-blue-50 text-blue-900 rounded-lg transition-colors border border-slate-100"
                  title="Start Direct Message"
                >
                  <UserPlus size={14} />
                </button>
              </div>

              {/* Channels list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2 text-left">Rooms & Channels</span>
                  {(() => {
                    const hasGlobalNotification = notificationsList.some(n => !n.read && n.title === 'Global Chat Lounge');
                    const hasHostelNotification = notificationsList.some(n => !n.read && n.title === 'My Hostel Lounge');
                    return (
                      <>
                        <button
                          onClick={() => {
                            setActiveChatChannel('global');
                            setActiveChatId('global');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition-all ${
                            activeChatChannel === 'global'
                              ? 'bg-blue-50 text-blue-900 border border-blue-100/50'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>🌐</span>
                            <span>Global Chat Lounge</span>
                          </div>
                          {hasGlobalNotification && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveChatChannel('hostel');
                            setActiveChatId('hostel-1');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition-all ${
                            activeChatChannel === 'hostel'
                              ? 'bg-blue-50 text-blue-900 border border-blue-100/50'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>🏫</span>
                            <span>My Hostel Lounge</span>
                          </div>
                          {hasHostelNotification && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                          )}
                        </button>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-left">Direct Messages</span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {dmRoomsList.map((room) => {
                      const isSelected = activeChatChannel === 'dm' && activeChatId === room.id;
                      const hasDMNotification = notificationsList.some(n => 
                        !n.read && 
                        n.title === 'Direct Chat' && 
                        n.message.includes(room.opponent?.nickname || '')
                      );
                      return (
                        <button
                          key={room.id}
                          onClick={() => {
                            setActiveChatChannel('dm');
                            setActiveChatId(room.id);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-bold transition-all border ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 border-blue-150'
                              : 'text-slate-600 hover:bg-slate-50 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={room.opponent?.avatarUrl}
                              alt={room.opponent?.nickname}
                              className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="truncate text-left min-w-0">
                              <p className="font-extrabold text-[11px] truncate">{room.opponent?.nickname}</p>
                              <p className="text-[9px] text-slate-400 font-medium truncate">{room.opponent?.name}</p>
                            </div>
                          </div>
                          {room.status === 'pending' ? (
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              room.isInitiator ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {room.isInitiator ? 'Sent' : 'Request'}
                            </span>
                          ) : hasDMNotification ? (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {dmRoomsList.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic px-2 py-1 text-left">No DMs started yet. Click + to begin!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Chat Window */}
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden border-r border-slate-200">
              {/* Active Channel Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center text-white text-base">
                    {activeChatChannel === 'global' ? '🌐' : activeChatChannel === 'hostel' ? '🏫' : '💬'}
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-900 text-xs">
                      {activeChatChannel === 'global' ? 'Global Chat Lounge' :
                       activeChatChannel === 'hostel' ? 'My Hostel Lounge' :
                       dmRoomsList.find(r => r.id === activeChatId)?.opponent?.nickname || 'Direct Chat'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {activeChatChannel === 'global' ? 'Global channel for all registered students' :
                       activeChatChannel === 'hostel' ? 'Hostel student community (Manager: Admin)' :
                       dmRoomsList.find(r => r.id === activeChatId)?.status === 'pending' ? 'Awaiting acceptance' : 'Secure direct messaging channel'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfileEdit(!showProfileEdit)}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold transition-all text-[10px]"
                  >
                    <Settings size={12} />
                    <span>Chat Profile</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                {chatMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  const isManager = msg.senderId?.startsWith('manager_') || msg.senderId === 'manager_101';
                  return (
                    <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMine ? 'ml-auto flex-row-reverse text-right' : 'text-left'}`}>
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-full object-cover mt-0.5 border border-slate-200 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className={`flex items-center gap-1.5 text-[9px] text-slate-400 font-bold ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-slate-700 font-black">{msg.senderName}</span>
                          {isManager && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-1 rounded">Manager</span>
                          )}
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Bubble */}
                        <div className={`p-3 rounded-2xl text-left ${
                          isMine
                            ? 'bg-blue-900 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.messageType === 'image' ? (
                            <div className="space-y-1.5">
                              <img src={msg.content} alt="shared proof" className="max-w-[200px] sm:max-w-[280px] max-h-52 rounded-xl object-cover border border-black/5" />
                            </div>
                          ) : (
                            <p className="leading-relaxed font-medium">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {chatMessages.length === 0 && (
                  <div className="text-center py-20 text-slate-400 italic">
                    <span>💬 No messages logged. Be the first to start the conversation!</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-100 bg-white">
                {activeChatChannel === 'dm' && dmRoomsList.find(r => r.id === activeChatId)?.status === 'pending' ? (
                  // DM Pending UI
                  dmRoomsList.find(r => r.id === activeChatId)?.isInitiator ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-center text-slate-500">
                      <p className="font-bold text-[10px] uppercase tracking-wider">DM Request Sent</p>
                      <p className="text-[9px] text-slate-400 mt-1">Awaiting recipient's acceptance before you can send messages.</p>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-center text-amber-900 flex flex-col items-center gap-2">
                      <p className="font-extrabold text-[10px] uppercase tracking-wider">Message Request Awaiting Approval</p>
                      <button
                        onClick={() => handleAcceptDMRequest(activeChatId)}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow transition-all text-[10px]"
                      >
                        Accept Message Request
                      </button>
                    </div>
                  )
                ) : (
                  // Active Chat Inputs
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Photo Attachment dropdown button */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPhotoDropdown(!showPhotoDropdown)}
                          className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all border border-slate-200"
                          title="Attach Photo"
                        >
                          <ImageIcon size={16} />
                        </button>
                        {showPhotoDropdown && (
                          <div className="absolute bottom-11 left-0 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xl z-40 w-64 text-left space-y-2">
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                              <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400">Share Campus Snapshot</span>
                              <button onClick={() => setShowPhotoDropdown(false)} className="text-slate-400 hover:text-slate-600">×</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { name: 'Dorm Study', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80' },
                                { name: 'Gardens', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80' },
                                { name: 'Kitchenette', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80' },
                                { name: 'Game Lounge', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80' }
                              ].map((img) => (
                                <button
                                  key={img.name}
                                  type="button"
                                  onClick={() => handleSendChatMessage(img.url, 'image')}
                                  className="border border-slate-150 rounded-xl overflow-hidden hover:opacity-90 transition-opacity block shrink-0 text-center bg-slate-50"
                                >
                                  <img src={img.url} alt={img.name} className="w-full h-12 object-cover" />
                                  <span className="block text-[8px] font-bold p-1 truncate text-slate-600">{img.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Text Input */}
                      <input
                        type="text"
                        placeholder="Type your message here..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendChatMessage(chatInput);
                        }}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={() => handleSendChatMessage(chatInput)}
                        disabled={!chatInput.trim()}
                        className="p-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Profile customization panel */}
            {showProfileEdit && (
              <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col h-full shrink-0 text-left p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="font-black text-slate-900 text-sm">Personalize Chat Profile</h3>
                  <button onClick={() => setShowProfileEdit(false)} className="text-slate-400 hover:text-slate-600 text-base">×</button>
                </div>

                <form onSubmit={handleUpdateChatProfile} className="space-y-5 text-xs font-semibold">
                  {/* Current Preview */}
                  <div className="flex flex-col items-center space-y-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <img
                      src={chatAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt="avatar preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-900 shadow-md"
                    />
                    <div className="text-center">
                      <p className="font-black text-slate-800 text-[13px]">{chatNickname || 'No Nickname'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Chat Identity</p>
                    </div>
                  </div>

                  {/* Nickname input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Chat Nickname</label>
                    <input
                      type="text"
                      required
                      value={chatNickname}
                      onChange={(e) => setChatNickname(e.target.value)}
                      placeholder="e.g. Sarah Connor (Resilience)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-1 focus:ring-blue-900 font-semibold"
                    />
                  </div>

                  {/* Avatar presets */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Select Preset Avatar</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setChatAvatar(preset)}
                          className={`aspect-square rounded-full overflow-hidden border-2 transition-all ${
                            chatAvatar === preset ? 'border-blue-900 ring-2 ring-blue-100' : 'border-transparent hover:scale-105'
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom avatar input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Or Custom Image URL</label>
                    <input
                      type="text"
                      value={chatAvatar}
                      onChange={(e) => setChatAvatar(e.target.value)}
                      placeholder="Paste direct link to image..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-[10px] font-semibold"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChatNickname(chatProfile?.nickname || '');
                        setChatAvatar(chatProfile?.avatarUrl || '');
                        setShowProfileEdit(false);
                      }}
                      className="flex-1 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 font-bold transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl font-bold shadow-md transition-all text-center"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* NEW DM START CHAT MODAL */}
            {showDMSlotModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-150 shadow-2xl relative space-y-4 text-left animate-fade-in">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-slate-900 text-sm">Start Direct Chat</h3>
                    <button onClick={() => setShowDMSlotModal(false)} className="text-slate-400 hover:text-slate-600 text-base">×</button>
                  </div>
                  <p className="text-[10px] text-slate-400">Select a student from the registered hostels list to send a direct message request.</p>
                  
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {availableStudentsList.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleStartDMChat(student.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-100"
                      >
                        <img
                          src={student.avatarUrl}
                          alt={student.nickname}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-extrabold text-slate-800 text-[11px] truncate">{student.nickname}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{student.name}</p>
                        </div>
                      </button>
                    ))}
                    {availableStudentsList.length === 0 && (
                      <p className="text-center py-6 text-slate-400 italic">No other students registered in the sandbox system.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

      </div>

      {/* Workspace Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-[10px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 PineVela. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
