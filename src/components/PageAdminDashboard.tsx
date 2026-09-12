import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import ResidentOnboardingWizard from './ResidentOnboardingWizard';
import EditResidenceModal from './EditResidenceModal';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import { getPdfBlobUrl, downloadPdfDocument } from '../utils/pdfHelper';
import { 
  Building2, Users, DollarSign, CheckCircle2, XCircle, Clock, Plus, 
  ShieldCheck, LogOut, Search, Filter, Home, Hotel, Coffee, UserPlus, 
  AlertCircle, Check, Trash2, Edit3, Eye, Sparkles, ArrowRight,
  Bell, MessageSquare, Send, X, FileText, File, Download, Lock, FileCheck,
  ChevronRight, ShieldAlert, RefreshCw, Ban, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PageAdminDashboard() {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'residences' | 'managers' | 'staff_verification' | 'notifications' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Residence State
  const [editingResidence, setEditingResidence] = useState<any | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Rejection Reason Modal State for Staff Verification
  const [rejectStaffModal, setRejectStaffModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Verified Staff Options & Account Action Modals
  const [selectedVerifiedStaffModal, setSelectedVerifiedStaffModal] = useState<any | null>(null);
  const [staffStatusActionModal, setStaffStatusActionModal] = useState<{ staff: any; action: 'disable' | 'ban' | 'activate' } | null>(null);
  const [actionReasonText, setActionReasonText] = useState('');

  // Search Query States across Sections
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [residentSearchQuery, setResidentSearchQuery] = useState('');

  // Settings State
  const [registrationFeeGHS, setRegistrationFeeGHS] = useState('3500');
  const [platformCommission, setPlatformCommission] = useState('5');
  const [systemAnnouncement, setSystemAnnouncement] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Datasets
  const [residences, setResidences] = useState<any[]>([]);
  const [managerRequests, setManagerRequests] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [feesPaid, setFeesPaid] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Board Requests & Notifications State
  const [boardRequests, setBoardRequests] = useState<any[]>([]);
  const [boardFilter, setBoardFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');
  const [replyingRequestId, setReplyingRequestId] = useState<string | null>(null);
  const [replyNotes, setReplyNotes] = useState('');

  // Verified Staffs Review State
  const [staffVerifications, setStaffVerifications] = useState<any[]>([]);
  const [notifSubTab, setNotifSubTab] = useState<'verified_staffs' | 'manager_requests'>('verified_staffs');
  const [docPreviewModal, setDocPreviewModal] = useState<{ title: string; type: 'cv' | 'id'; data: string; fileName?: string; name?: string; endpoint?: string } | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (docPreviewModal && docPreviewModal.type === 'cv' && docPreviewModal.data) {
      const url = getPdfBlobUrl(docPreviewModal.data, docPreviewModal.name || 'Applicant');
      setPreviewBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewBlobUrl(null);
    }
  }, [docPreviewModal?.data, docPreviewModal?.type, docPreviewModal?.name]);

  // Filter & Search states
  const [residenceFilter, setResidenceFilter] = useState<'all' | 'Hostel' | 'Hotel' | 'Lounge'>('all');
  const [approvalTabFilter, setApprovalTabFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Resident Registration Modal / Form State
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [newResidentName, setNewResidentName] = useState('');
  const [newResidentEmail, setNewResidentEmail] = useState('');
  const [newResidentPhone, setNewResidentPhone] = useState('');
  const [newResidentType, setNewResidentType] = useState<'Hostel' | 'Hotel' | 'Lounge'>('Hostel');
  const [newResidentResidenceName, setNewResidentResidenceName] = useState('');
  const [newResidentRoom, setNewResidentRoom] = useState('');
  const [newResidentFeePaid, setNewResidentFeePaid] = useState(true);
  const [newResidentFeeAmount, setNewResidentFeeAmount] = useState('3500');

  // Manual Residence Registration Modal / Form State
  const [showAddResidenceModal, setShowAddResidenceModal] = useState(false);
  const [newResName, setNewResName] = useState('');
  const [newResType, setNewResType] = useState<'Hostel' | 'Hotel' | 'Lounge'>('Hostel');
  const [newResLocation, setNewResLocation] = useState('');
  const [newResCapacity, setNewResCapacity] = useState('100');
  const [newResPrice, setNewResPrice] = useState('4000');
  const [newResManager, setNewResManager] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveResidenceEdit = async (updatedResidence: any) => {
    try {
      const res = await apiFetch(`/api/hostels/${updatedResidence.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedResidence)
      });
      const fresh = res.hostel || res || updatedResidence;
      setResidences(prev => prev.map(r => r.id === updatedResidence.id ? { ...r, ...fresh } : r));
      triggerToast(`Residence "${updatedResidence.name}" updated successfully!`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update residence.');
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const resHostels = await fetch('/api/hostels');
      if (resHostels.ok) {
        const data = await resHostels.json();
        setResidences(Array.isArray(data) ? data : []);
      }

      const resMgrReqs = await apiFetch('/api/manager-requests').catch(() => []);
      setManagerRequests(Array.isArray(resMgrReqs) ? resMgrReqs : []);

      const savedResidents = localStorage.getItem('pinevela_admin_residents');
      if (savedResidents) {
        setResidents(JSON.parse(savedResidents));
      } else {
        setResidents([]);
      }

      const resBoard = await apiFetch('/api/board-requests').catch(() => []);
      setBoardRequests(Array.isArray(resBoard) ? resBoard : []);

      const savedFees = localStorage.getItem('pinevela_admin_fees');
      if (savedFees) {
        setFeesPaid(JSON.parse(savedFees));
      } else {
        setFeesPaid([]);
      }

      const resActs = await apiFetch('/api/activities').catch(() => []);
      setActivities(Array.isArray(resActs) ? resActs : []);

      const resStaffVrf = await apiFetch('/api/admin/staff-verifications').catch(() => []);
      if (Array.isArray(resStaffVrf)) {
        setStaffVerifications(resStaffVrf);
      } else {
        const fallbackStaff = await apiFetch('/api/staff').catch(() => []);
        setStaffVerifications(Array.isArray(fallbackStaff) ? fallbackStaff : []);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffVerificationDecision = async (staffId: string, status: 'Verified' | 'Rejected', staffName: string, reviewNotes?: string) => {
    try {
      await apiFetch(`/api/admin/staff-verifications/${staffId}/decision`, {
        method: 'PUT',
        body: JSON.stringify({ status, reviewNotes: reviewNotes || '' })
      });
      setStaffVerifications(prev => prev.map(s => (s.id === staffId || s.userId === staffId) ? {
        ...s,
        verificationStatus: status,
        isVerified: status === 'Verified',
        reviewNotes: reviewNotes || s.reviewNotes
      } : s));
      triggerToast(`Staff applicant "${staffName}" ${status === 'Verified' ? 'Approved & Verified' : 'Rejected'}.`);
      setRejectStaffModal(null);
      setRejectionReasonText('');
      fetchAdminData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update staff verification status.');
    }
  };

  const handleStaffStatusChange = async (staffId: string, accountStatus: 'Active' | 'Disabled' | 'Banned', reason?: string) => {
    try {
      const res = await apiFetch(`/api/admin/staff-verifications/${staffId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ accountStatus, reason: reason || '' })
      });
      setStaffVerifications(prev => prev.map(s => {
        if (s.id === staffId || s.userId === staffId) {
          return {
            ...s,
            accountStatus,
            status: accountStatus,
            isDisabled: accountStatus === 'Disabled',
            isBanned: accountStatus === 'Banned'
          };
        }
        return s;
      }));

      if (selectedVerifiedStaffModal && (selectedVerifiedStaffModal.id === staffId || selectedVerifiedStaffModal.userId === staffId)) {
        setSelectedVerifiedStaffModal((prev: any) => prev ? {
          ...prev,
          accountStatus,
          status: accountStatus,
          isDisabled: accountStatus === 'Disabled',
          isBanned: accountStatus === 'Banned'
        } : null);
      }

      triggerToast(res.message || `Staff account set to ${accountStatus}.`);
      setStaffStatusActionModal(null);
      setActionReasonText('');
    } catch (err: any) {
      triggerToast(err.message || `Failed to update staff account status.`);
    }
  };

  const handleUpdateBoardRequest = async (id: string, status: 'Acknowledged' | 'Resolved', notes?: string) => {
    try {
      const updated = await apiFetch(`/api/board-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          adminNotes: notes !== undefined ? notes : replyNotes
        })
      });
      setBoardRequests(prev => prev.map(r => r.id === id ? updated : r));
      setReplyingRequestId(null);
      setReplyNotes('');
      triggerToast(`Request updated to ${status}. Manager notified.`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update request');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const saveResidentsToStorage = (updated: any[]) => {
    setResidents(updated);
    localStorage.setItem('pinevela_admin_residents', JSON.stringify(updated));
  };

  const handleApproveManager = async (reqId: string, managerEmail: string) => {
    try {
      await apiFetch(`/api/manager-requests/${reqId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      }).catch(() => {});

      setManagerRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved' } : r));
      triggerToast(`Manager account for ${managerEmail} approved successfully!`);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to approve manager.');
    }
  };

  const handleBlockManager = async (reqId: string, managerEmail: string) => {
    try {
      setManagerRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'blocked' } : r));
      triggerToast(`Manager access revoked/blocked for ${managerEmail}.`);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to block manager.');
    }
  };

  const handleRejectManager = async (reqId: string) => {
    try {
      setManagerRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'rejected' } : r));
      triggerToast('Manager request rejected.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({
          registrationFee: parseFloat(registrationFeeGHS),
          commission: parseFloat(platformCommission),
          announcement: systemAnnouncement,
          maintenanceMode: maintenanceMode
        })
      });
      triggerToast('Admin settings updated successfully across PineVela!');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update settings.');
    }
  };

  useEffect(() => {
    apiFetch('/api/settings').then(data => {
      if (data) {
        setRegistrationFeeGHS(data.registrationFee?.toString() || '3500');
        setPlatformCommission(data.commission?.toString() || '5');
        setSystemAnnouncement(data.announcement || '');
        setMaintenanceMode(data.maintenanceMode || false);
      }
    });
  }, []);

  const handleManualRegisterResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResidentName || !newResidentEmail || !newResidentResidenceName) {
      triggerToast('Please fill in all required resident details.');
      return;
    }

    const newResObj = {
      id: `res-${Date.now()}`,
      name: newResidentName,
      email: newResidentEmail,
      phone: newResidentPhone || '+233 24 000 0000',
      category: newResidentType,
      residenceName: newResidentResidenceName,
      roomNumber: newResidentRoom || 'Room 101',
      feePaid: newResidentFeePaid,
      feeAmount: newResidentFeeAmount,
      status: 'Live & Approved'
    };

    const updated = [newResObj, ...residents];
    saveResidentsToStorage(updated);
    setShowAddResidentModal(false);
    setNewResidentName('');
    setNewResidentEmail('');
    setNewResidentPhone('');
    setNewResidentResidenceName('');
    setNewResidentRoom('');
    triggerToast(`Resident ${newResidentName} registered and live on PineVela!`);
  };

  const handleManualRegisterResidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName || !newResLocation) {
      triggerToast('Please fill in residence name and location.');
      return;
    }

    const newResidenceObj = {
      id: `residence-${Date.now()}`,
      name: newResName,
      hostel_type: newResType,
      location: newResLocation,
      totalCapacity: Number(newResCapacity) || 100,
      price: Number(newResPrice) || 4000,
      managerName: newResManager || 'Admin Direct',
      status: 'Open',
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'
    };

    setResidences(prev => [newResidenceObj, ...prev]);
    setShowAddResidenceModal(false);
    setNewResName('');
    setNewResLocation('');
    setNewResManager('');
    triggerToast(`Residence ${newResName} registered successfully!`);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    navigate('/', { replace: true });
    setTimeout(() => {
      logout();
    }, 50);
  };

  const pendingManagersCount = managerRequests.filter(r => r.status === 'pending' || !r.status).length;
  const hostelCount = residences.filter(r => (r.hostel_type || '').toLowerCase().includes('hostel')).length;
  const hotelCount = residences.filter(r => (r.hostel_type || '').toLowerCase().includes('hotel')).length;
  const loungeCount = residences.filter(r => (r.hostel_type || '').toLowerCase().includes('lounge')).length;
  const totalManagers = 1 + managerRequests.filter(m => m.status === 'approved' || m.status === 'Approved').length;
  const totalResidents = residents.length;
  const totalResidences = residences.length;
  const totalFeesCollected = feesPaid.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const pendingHostelsCount = residences.filter(r => (
    r.status === 'Pending Approval' || 
    r.approvalStatus === 'Pending Approval' || 
    r.isApproved === false
  )).length;

  const pendingBoardRequestsCount = boardRequests.filter(r => r.status === 'Pending').length;
  const pendingStaffCount = staffVerifications.filter(s => s.verificationStatus === 'Pending' || s.verificationStatus === 'pending' || (!s.isVerified && s.verificationStatus !== 'Rejected' && s.verificationStatus !== 'rejected')).length;

  const availableManagersList = [
    {
      id: 'manager_101',
      name: 'Anthony Davis',
      email: 'manager@pinevela.com',
      phone: '+233 24 123 4567',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      hostelName: 'Emerald Heights Block A'
    },
    ...managerRequests.filter(m => m.status === 'approved' || m.status === 'Approved').map(m => ({
      id: m.id || m._id || `mgr-${Date.now()}`,
      name: m.managerName || m.name || 'Property Manager',
      email: m.managerEmail || m.email || '',
      phone: m.managerPhone || m.phone || '+233 24 000 0000',
      photo: m.managerPhoto || m.photo || m.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      hostelName: m.hostelName || 'Assigned Property'
    }))
  ];

  return (
    <div className="min-h-screen h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50/70 to-indigo-50/50 text-slate-800 overflow-hidden font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-blue-400/30 backdrop-blur-md"
          >
            <Sparkles className="w-5 h-5 text-cyan-200" />
            <span className="font-medium text-sm">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* MOBILE HEADER (lg:hidden) */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3 bg-white/90 backdrop-blur-xl border-b border-sky-200/50 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <PineLogo size={24} />
          <div>
            <h1 className="text-xs font-black tracking-tight text-blue-950 leading-tight">PineVela Admin</h1>
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
        <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 pb-safe snap-x hide-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: ShieldCheck },
            { id: 'residences', label: 'Residences', icon: Building2, badge: pendingHostelsCount },
            { id: 'managers', label: 'Managers', icon: Users, badge: pendingManagersCount },
            { id: 'staff_verification', label: 'Staffs', icon: FileCheck, badge: pendingStaffCount },
            { id: 'notifications', label: 'Alerts', icon: Bell, badge: (pendingBoardRequestsCount + pendingHostelsCount) },
            { id: 'settings', label: 'Settings', icon: Edit3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`snap-center shrink-0 flex flex-col items-center justify-center w-[72px] h-12 rounded-xl transition-all relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-blue-100/50' : ''}`}>
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`} />
                {tab.badge ? (
                  <span className="absolute top-1 right-3 w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[9px] font-bold mt-0.5 ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* SIDEBAR: PURELY STATIC / FIXED ICE-BLUE FROSTY BLUE WITH CURVED EDGES & BLUE GLOW */}

      <aside className="hidden lg:flex w-72 my-6 ml-6 h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="space-y-8">
          {/* Logo & Header */}
          <div className="flex items-center space-x-3 px-2">
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                PineVela Admin
              </h1>
              <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">Master Control</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Management Console</p>
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: ShieldCheck, sub: 'Metrics & activity audit' },
              { id: 'residences', label: 'Available Residences', icon: Building2, badge: pendingHostelsCount || null, sub: 'Hostels, Hotels & Lounges' },
              { id: 'managers', label: 'Managers & Staffs', icon: Users, badge: pendingManagersCount || null, sub: 'Approvals, contact & history' },
              { id: 'staff_verification', label: 'Staff Verification', icon: FileCheck, badge: pendingStaffCount || null, isRedDot: pendingStaffCount > 0, sub: 'Review staff CVs & National IDs' },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: (pendingBoardRequestsCount + pendingHostelsCount) || null, sub: 'Manager requests & alerts' },
              { id: 'settings', label: 'Admin Settings', icon: Edit3, sub: 'Fees, commission & controls' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-medium transition-all duration-300 cursor-pointer text-left group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 border border-blue-400/50 ring-2 ring-blue-400/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-blue-200/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors relative ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-200/70 text-blue-700 group-hover:bg-blue-300/80'
                    }`}>
                      <Icon className="w-4 h-4" />
                      {tab.isRedDot && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-ping" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                        <span>{tab.label}</span>
                        {tab.isRedDot && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        )}
                      </div>
                      <div className={`text-[10px] font-normal ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{tab.sub}</div>
                    </div>
                  </div>
                  {tab.badge ? (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white font-bold rounded-full animate-pulse shadow-sm">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button Box */}
        <div className="pt-6 border-t border-sky-200/80 mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-3 rounded-2xl font-semibold text-xs transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto h-full relative">
        {/* GIANT WATERMARK PINEVELA LOGO IN BACKGROUND (PERSISTS ACROSS ALL TABS) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div className="transform scale-[4.5] opacity-[0.18] blur-[0.4px]">
            <PineLogo size={180} hideText={true} />
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn relative z-10">
            {/* Welcome banner */}
            <div className="bg-sky-50/20 border border-sky-200/50 p-8 rounded-3xl backdrop-blur-2xl shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-3d tracking-tight">Welcome back, Andy Heller</h2>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Available Residences', value: totalResidences, sub: `${hostelCount} Hostels, ${hotelCount} Hotels, ${loungeCount} Lounges`, icon: Building2, color: 'bg-blue-600 text-white' },
                { label: 'Registered Managers', value: totalManagers, sub: `${pendingManagersCount} pending requests`, icon: Users, color: 'bg-cyan-600 text-white' },
                { label: 'Total Residents', value: totalResidents, sub: 'Active & verified students/guests', icon: UserPlus, color: 'bg-indigo-600 text-white' },
                { label: 'Residency Fees Paid', value: `GHS ${totalFeesCollected.toLocaleString()}`, sub: 'Verified revenue collection', icon: DollarSign, color: 'bg-emerald-600 text-white' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-sky-50/20 border border-sky-200/50 p-6 rounded-3xl backdrop-blur-2xl shadow-xl relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-700 tracking-wider uppercase text-outline-sm">{stat.label}</span>
                      <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-3d-blue mb-1">{stat.value}</div>
                      <div className="text-xs text-slate-600 font-medium text-outline-sm">{stat.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions & Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-sky-50/20 border border-sky-200/50 p-8 rounded-3xl backdrop-blur-2xl shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 text-outline-sm">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span>System Activities & Audit Log</span>
                  </h3>
                  <button 
                    onClick={() => setActiveTab('managers')} 
                    className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center space-x-1 text-outline-sm"
                  >
                    <span>View all requests</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.slice(0, 5).map((act, i) => (
                      <div key={i} className="flex items-start space-x-4 p-4 rounded-2xl bg-sky-100/30 border border-sky-200/40 backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                        <div className="flex-1">
                          <p className="text-xs lg:text-sm text-slate-800 font-medium text-outline-sm">{act.text}</p>
                          <span className="text-[10px] text-blue-700 font-semibold">{act.time || 'Just now'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs text-outline-sm">
                      No recent activities recorded. System is fully operational.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Admin Actions */}
              <div className="bg-sky-50/20 border border-sky-200/50 p-8 rounded-3xl backdrop-blur-2xl shadow-xl space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4 text-outline-sm">Quick Admin Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAddResidenceModal(true)}
                      className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      <span className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>Register New Residence</span>
                      </span>
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShowAddResidentModal(true)}
                      className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-sky-100/40 hover:bg-sky-100/70 border border-sky-200/60 text-blue-900 font-semibold text-xs transition-all cursor-pointer backdrop-blur-md"
                    >
                      <span className="flex items-center space-x-2">
                        <UserPlus className="w-4 h-4 text-blue-600" />
                        <span>Manually Register Resident</span>
                      </span>
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTab('managers')}
                      className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-sky-100/40 hover:bg-sky-100/70 border border-sky-200/60 text-blue-900 font-semibold text-xs transition-all cursor-pointer backdrop-blur-md"
                    >
                      <span className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>Review Manager Requests ({pendingManagersCount})</span>
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-100/30 border border-sky-200/50 text-xs text-blue-900 backdrop-blur-md">
                  <p className="font-bold mb-1 text-outline-sm">Secure Admin Credential</p>
                  <p className="text-[11px] text-slate-700 font-medium">Master account secured under <span className="font-mono font-semibold text-blue-600">andyheller2k@gmail.com</span>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AVAILABLE RESIDENCES */}
        {activeTab === 'residences' && (
          <div className="space-y-6 animate-fadeIn relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Available Residences Directory</h3>
                <p className="text-xs text-slate-500">Manage all Hostels, Hotels, and Lounges listed on PineVela</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search residences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  onClick={() => setShowAddResidenceModal(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Residence</span>
                </button>
              </div>
            </div>

            {/* Filters Row: Category Pills and Approval Status Tabs */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Approval Status Sub-Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setApprovalTabFilter('all')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    approvalTabFilter === 'all'
                      ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                      : 'bg-white/80 text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Properties ({residences.length})
                </button>
                <button
                  onClick={() => setApprovalTabFilter('pending')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    approvalTabFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-amber-50/80 text-amber-900 border border-amber-200 hover:bg-amber-100/70'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Approvals</span>
                  {residences.filter(r => (r.status === 'Pending Approval' || r.approvalStatus === 'Pending Approval' || r.isApproved === false)).length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      approvalTabFilter === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'
                    }`}>
                      {residences.filter(r => (r.status === 'Pending Approval' || r.approvalStatus === 'Pending Approval' || r.isApproved === false)).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setApprovalTabFilter('approved')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    approvalTabFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-emerald-50/80 text-emerald-900 border border-emerald-200 hover:bg-emerald-100/70'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved Hostels</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    approvalTabFilter === 'approved' ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'
                  }`}>
                    {residences.filter(r => ((r.status === 'Approved' || r.approvalStatus === 'Approved' || r.isApproved === true || r.status === 'Open') && r.status !== 'Pending Approval' && r.approvalStatus !== 'Pending Approval' && r.isApproved !== false)).length}
                  </span>
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-2">
                {['all', 'Hostel', 'Hotel', 'Lounge'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setResidenceFilter(cat as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      residenceFilter === cat
                        ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                        : 'bg-white/80 text-slate-600 border border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {cat === 'all' ? 'All Types' : `${cat}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Residences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {residences
                .filter(res => {
                  const isApproved = (res.status === 'Approved' || res.approvalStatus === 'Approved' || res.isApproved === true || res.status === 'Open') &&
                    res.status !== 'Pending Approval' &&
                    res.approvalStatus !== 'Pending Approval' &&
                    res.isApproved !== false;

                  if (approvalTabFilter === 'pending' && isApproved) return false;
                  if (approvalTabFilter === 'approved' && !isApproved) return false;

                  if (residenceFilter !== 'all') {
                    const type = res.hostel_type || 'Hostel';
                    if (!type.toLowerCase().includes(residenceFilter.toLowerCase())) return false;
                  }
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    return res.name?.toLowerCase().includes(q) || res.location?.toLowerCase().includes(q) || res.managerName?.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map((residence) => {
                  const type = residence.hostel_type || 'Hostel';
                  const isApproved = residence.isApproved === true || residence.approvalStatus === 'Approved' || residence.status === 'Approved';

                  return (
                    <div key={residence.id} className="bg-white/90 border border-blue-200/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                          <img
                            src={residence.image || residence.imageUrl || residence.exteriorPhotoUrl || residence.imagePreviewUrl || residence.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                            alt={residence.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-blue-700 border border-blue-200">
                            {type}
                          </div>
                          <div className="absolute top-3 right-3">
                            {isApproved ? (
                              <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                Approved & Live
                              </span>
                            ) : (
                              <span className="bg-amber-500 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Pending Approval
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">{residence.name}</h4>
                            <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                              <span>📍</span>
                              <span className="truncate">{residence.location}</span>
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Capacity</span>
                              <span className="font-bold text-slate-800">{residence.totalCapacity || 100} beds</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Price / Year</span>
                              <span className="font-bold text-blue-600">GHS {residence.price || 3500}</span>
                            </div>
                          </div>

                          {/* Verified Manager Profile with Photo */}
                          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/60 flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={residence.managerPhoto || (residence as any).managerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                                alt={residence.managerName || 'Manager'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs" title="Verified Manager">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {residence.managerName || 'Anthony Davis'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                  Verified
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">
                                {residence.managerEmail || 'manager@pinevela.com'}
                              </p>
                              <p className="text-[10px] text-slate-700 font-semibold">
                                {residence.managerPhone || '+233 24 123 4567'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-blue-100">
                        {isApproved ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Approved Hostel</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                if (!confirm(`Are you sure you want to reject registration for "${residence.name}"?`)) return;
                                try {
                                  const updated = await apiFetch(`/api/hostels/${residence.id}/verify`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ status: 'Rejected', isApproved: false, approvalStatus: 'Rejected' })
                                  });
                                  const freshHostel = updated.hostel || { ...residence, status: 'Rejected', isApproved: false, approvalStatus: 'Rejected' };
                                  setResidences(prev => prev.map(r => r.id === residence.id ? freshHostel : r));
                                  triggerToast(`Hostel "${residence.name}" rejected.`);
                                } catch(e) {
                                  triggerToast('Failed to reject hostel');
                                }
                              }}
                              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer border border-rose-200 flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const updated = await apiFetch(`/api/hostels/${residence.id}/verify`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ status: 'Approved', isApproved: true, approvalStatus: 'Approved' })
                                  });
                                  const freshHostel = updated.hostel || { ...residence, status: 'Approved', isApproved: true, approvalStatus: 'Approved' };
                                  setResidences(prev => prev.map(r => r.id === residence.id ? freshHostel : r));
                                  triggerToast(`Hostel "${residence.name}" approved successfully! Kept under Approved Hostels and live on landing page.`);
                                } catch(e) {
                                  triggerToast('Failed to approve hostel');
                                }
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Hostel</span>
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingResidence(residence)}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-blue-200"
                            title="Edit residence, blocks, amenities, rules & payments"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to delete "${residence.name}"?`)) return;
                              try {
                                 await apiFetch(`/api/hostels/${residence.id}`, { method: 'DELETE' });
                                 setResidences(prev => prev.filter(r => r.id !== residence.id));
                                 triggerToast('Residence deleted successfully.');
                              } catch(e) {}
                            }}
                            className="text-rose-600 hover:text-rose-700 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {residences.length === 0 && (
              <div className="text-center py-16 bg-white/60 border border-blue-200 rounded-3xl">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-slate-900 mb-1">No Residences Registered Yet</h4>
                <p className="text-xs text-slate-500 mb-6">Start by registering the first hostel, hotel, or lounge on PineVela.</p>
                <button
                  onClick={() => setShowAddResidenceModal(true)}
                  className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-medium text-sm shadow-lg hover:bg-blue-500 cursor-pointer"
                >
                  Register First Residence
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGERS */}
        {activeTab === 'managers' && (
          <div className="space-y-6 animate-fadeIn relative z-10">
            <div className="bg-sky-50/20 border border-sky-200/50 p-6 rounded-3xl backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-3d">Managers Control & History</h3>
                <p className="text-xs text-slate-600 font-medium text-outline-sm">Review registrations, view full contact info, approve/reject, or block manager access.</p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700 bg-sky-100/50 px-4 py-2 rounded-2xl border border-sky-200/60 backdrop-blur-md">
                <span>Total Managers: {managerRequests.length}</span>
              </div>
            </div>

            {/* Manager Search Input Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 p-3.5 rounded-2xl border border-sky-200/80 shadow-xs backdrop-blur-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search managers by name, email, phone, organization, or hostel property..."
                  value={managerSearchQuery}
                  onChange={(e) => setManagerSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {managerSearchQuery && (
                  <button onClick={() => setManagerSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-xs font-bold text-slate-500 shrink-0 px-2">
                Showing {managerRequests.filter(m => {
                  if (!managerSearchQuery.trim()) return true;
                  const q = managerSearchQuery.toLowerCase();
                  return (
                    m.managerName?.toLowerCase().includes(q) ||
                    m.managerEmail?.toLowerCase().includes(q) ||
                    m.managerPhone?.toLowerCase().includes(q) ||
                    m.organization?.toLowerCase().includes(q) ||
                    m.propertyName?.toLowerCase().includes(q)
                  );
                }).length} of {managerRequests.length}
              </span>
            </div>

            <div className="space-y-4">
              {managerRequests
                .filter(m => {
                  if (!managerSearchQuery.trim()) return true;
                  const q = managerSearchQuery.toLowerCase();
                  return (
                    m.managerName?.toLowerCase().includes(q) ||
                    m.managerEmail?.toLowerCase().includes(q) ||
                    m.managerPhone?.toLowerCase().includes(q) ||
                    m.organization?.toLowerCase().includes(q) ||
                    m.propertyName?.toLowerCase().includes(q)
                  );
                })
                .map((req, idx) => (
                <div key={`${req.id || 'mreq'}-${idx}`} className="bg-sky-50/20 border border-sky-200/50 p-6 rounded-3xl backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-base font-bold text-slate-900 text-outline-sm">{req.managerName}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === 'approved' 
                          ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' 
                          : req.status === 'rejected'
                          ? 'bg-rose-100/80 text-rose-800 border border-rose-200'
                          : req.status === 'blocked'
                          ? 'bg-slate-200/80 text-slate-800 border border-slate-300'
                          : 'bg-amber-100/80 text-amber-800 border border-amber-200'
                      }`}>
                        {req.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700 font-medium">
                      <p>📧 Email: <span className="text-slate-900 font-semibold">{req.managerEmail}</span></p>
                      <p>📞 Phone: <span className="text-slate-900 font-semibold">{req.managerPhone || '+233 24 555 1234'}</span></p>
                      <p className="col-span-full">🏢 Organization / Property: <span className="font-bold text-blue-800">{req.organization || req.propertyName}</span></p>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-sky-100/30 p-3 rounded-2xl border border-sky-200/40 backdrop-blur-md">
                      "{req.notes || req.reason || 'Requested manager access to onboard hostel property.'}"
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end flex-wrap gap-2">
                    {req.status !== 'approved' && req.status !== 'blocked' ? (
                      <>
                        <button
                          onClick={() => handleApproveManager(req.id, req.managerEmail)}
                          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg cursor-pointer transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectManager(req.id)}
                          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold text-xs cursor-pointer transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : req.status === 'approved' ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-semibold bg-emerald-100/60 px-4 py-2 rounded-2xl border border-emerald-200 backdrop-blur-md">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Active Manager</span>
                        </div>
                        <button
                          onClick={() => handleBlockManager(req.id, req.managerEmail)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs cursor-pointer transition-all"
                        >
                          <span>Block Access</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 text-slate-700 text-xs font-semibold bg-slate-200/60 px-4 py-2 rounded-2xl border border-slate-300 backdrop-blur-md">
                          <span>Access Revoked / Blocked</span>
                        </div>
                        <button
                          onClick={() => handleApproveManager(req.id, req.managerEmail)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer transition-all"
                        >
                          <span>Restore Access</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {managerRequests.length === 0 && (
                <div className="text-center py-16 bg-sky-50/20 border border-sky-200/50 rounded-3xl backdrop-blur-2xl">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-slate-900 mb-1 text-outline-sm">No Manager History Recorded Yet</h4>
                  <p className="text-xs text-slate-600">All manager registration requests, approvals, rejections, and block actions will appear in this audit history.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-sky-50/20 border border-sky-200/50 p-6 rounded-3xl backdrop-blur-2xl shadow-xl">
              <h3 className="text-xl font-bold text-3d">PineVela Admin Settings</h3>
              <p className="text-xs text-slate-600 font-medium text-outline-sm">Configure global platform parameters, registration fees in GHS, commission rates, and system announcements.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-sky-50/20 border border-sky-200/50 p-8 rounded-3xl backdrop-blur-2xl shadow-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2 text-outline-sm">Standard Residency Registration Fee (GHS ₵)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-bold text-blue-700">₵</span>
                    <input
                      type="text"
                      value={registrationFeeGHS}
                      onChange={(e) => setRegistrationFeeGHS(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-sky-100/40 border border-sky-200/60 rounded-2xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 backdrop-blur-md"
                      placeholder="3500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Applied across all student hostel and hotel bookings in cedis.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2 text-outline-sm">Platform Commission Rate (%)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={platformCommission}
                      onChange={(e) => setPlatformCommission(e.target.value)}
                      className="w-full px-4 py-3 bg-sky-100/40 border border-sky-200/60 rounded-2xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-600 backdrop-blur-md"
                      placeholder="5"
                    />
                    <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Deducted per successful transaction.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 text-outline-sm">Global System Announcement Banner</label>
                <textarea
                  rows={3}
                  value={systemAnnouncement}
                  onChange={(e) => setSystemAnnouncement(e.target.value)}
                  className="w-full px-4 py-3 bg-sky-100/40 border border-sky-200/60 rounded-2xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600 backdrop-blur-md"
                  placeholder="Enter important announcement for students and managers..."
                />
                <p className="text-[10px] text-slate-500 mt-1">Displayed on student and manager portals instantly.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-sky-100/30 border border-sky-200/50 rounded-2xl backdrop-blur-md">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Platform Maintenance Mode</h4>
                  <p className="text-[11px] text-slate-600">Temporarily restrict non-admin student logins during database updates.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex justify-end pt-4 border-t border-sky-200/40">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl cursor-pointer transition-all"
                >
                  Save Admin Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS & MANAGER BOARD REQUESTS */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/80 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/30">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Notifications & Admin Board Desk</h3>
                  <p className="text-xs text-slate-500">Review manager requests, process operational notices, and manage property verification alerts.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddResidentModal(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4 text-slate-600" />
                  <span>Register Resident</span>
                </button>
              </div>
            </div>

            {/* PENDING RESIDENCE VERIFICATION ALERTS */}
            {pendingHostelsCount > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-3xl backdrop-blur-xl shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                      <Clock className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Property Verification Requests</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white">
                          {pendingHostelsCount} Pending
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600">These residences have been submitted by managers and are awaiting PineVela verification.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {residences.filter(r => r.status === 'Pending Approval' || r.approvalStatus === 'Pending Approval' || r.isApproved === false).map((res, idx) => (
                    <div key={`${res.id || 'res'}-${idx}`} className="bg-white/90 border border-amber-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={res.image || res.imageUrl || res.exteriorPhotoUrl || res.imagePreviewUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'}
                          alt={res.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80';
                          }}
                          className="w-16 h-16 rounded-xl object-cover border border-amber-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-sm font-bold text-slate-900 truncate">{res.name}</h5>
                          <p className="text-xs text-slate-500">📍 {res.location}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Manager: <strong className="text-slate-800">{res.managerName || 'Assigned Manager'}</strong> ({res.managerPhone || '+233 24 123 4567'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs font-semibold text-blue-600">
                          {res.totalCapacity || 100} Beds • GHS {res.price || 3500}/yr
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to reject registration for "${res.name}"?`)) return;
                              try {
                                const updated = await apiFetch(`/api/hostels/${res.id}/verify`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ status: 'Rejected', isApproved: false, approvalStatus: 'Rejected' })
                                });
                                const freshHostel = updated.hostel || { ...res, status: 'Rejected', isApproved: false, approvalStatus: 'Rejected' };
                                setResidences(prev => prev.map(r => r.id === res.id ? freshHostel : r));
                                triggerToast(`Hostel "${res.name}" rejected.`);
                              } catch (e) {
                                triggerToast('Failed to reject hostel');
                              }
                            }}
                            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-3 rounded-xl transition-all cursor-pointer border border-rose-200 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const updated = await apiFetch(`/api/hostels/${res.id}/verify`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ status: 'Approved', isApproved: true, approvalStatus: 'Approved' })
                                });
                                const freshHostel = updated.hostel || { ...res, status: 'Approved', isApproved: true, approvalStatus: 'Approved' };
                                setResidences(prev => prev.map(r => r.id === res.id ? freshHostel : r));
                                triggerToast(`Hostel "${res.name}" approved successfully and is now Live!`);
                              } catch (e) {
                                triggerToast('Failed to approve hostel');
                              }
                            }}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Go Live</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Tabs: Verified Staffs vs Manager Requests */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 border border-slate-300/60 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setNotifSubTab('verified_staffs')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                  notifSubTab === 'verified_staffs'
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Staffs (Credential Review)</span>
                {staffVerifications.filter(s => s.verificationStatus === 'Pending' || s.verificationStatus === 'pending' || !s.isVerified).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 animate-pulse">
                    {staffVerifications.filter(s => s.verificationStatus === 'Pending' || s.verificationStatus === 'pending' || !s.isVerified).length} Pending
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setNotifSubTab('manager_requests')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                  notifSubTab === 'manager_requests'
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Manager Requests to Board</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
                  {boardRequests.length}
                </span>
              </button>
            </div>

            {/* VERIFIED STAFFS CREDENTIAL REVIEW SECTION */}
            {notifSubTab === 'verified_staffs' && (
              <div className="bg-white/90 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span>Staff Credentials Verification Desk</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                          {staffVerifications.length} Staff Records
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">Review staff CVs, National ID documents, and verify credentials before staff can apply for hostel positions.</p>
                    </div>
                  </div>
                </div>

                {/* Search Bar for Staff Verification Desk */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-blue-100">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search staff by name, email, phone, role specialization, ID number..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                    />
                    {staffSearchQuery && (
                      <button onClick={() => setStaffSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500 shrink-0 px-2">
                    Showing {staffVerifications.filter(s => {
                      if (!staffSearchQuery.trim()) return true;
                      const q = staffSearchQuery.toLowerCase();
                      return (
                        s.name?.toLowerCase().includes(q) ||
                        s.email?.toLowerCase().includes(q) ||
                        s.phone?.toLowerCase().includes(q) ||
                        (s.role || s.specialization)?.toLowerCase().includes(q) ||
                        (s.nationalId || s.idNumber)?.toLowerCase().includes(q)
                      );
                    }).length} of {staffVerifications.length} staff
                  </span>
                </div>

                {staffVerifications.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No staff members registered yet</p>
                    <p className="text-[11px] text-slate-400">Staff registrations will appear here with submitted CV and National ID documents for Admin review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffVerifications
                      .filter(s => {
                        if (!staffSearchQuery.trim()) return true;
                        const q = staffSearchQuery.toLowerCase();
                        return (
                          s.name?.toLowerCase().includes(q) ||
                          s.email?.toLowerCase().includes(q) ||
                          s.phone?.toLowerCase().includes(q) ||
                          (s.role || s.specialization)?.toLowerCase().includes(q) ||
                          (s.nationalId || s.idNumber)?.toLowerCase().includes(q)
                        );
                      })
                      .map((staff, idx) => {
                      const isVerified = staff.isVerified || staff.verificationStatus === 'Verified' || staff.verificationStatus === 'verified';
                      const isRejected = staff.verificationStatus === 'Rejected' || staff.verificationStatus === 'rejected';
                      const isPending = !isVerified && !isRejected;

                      return (
                        <div
                          key={`${staff.id || 'stf'}-${idx}`}
                          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                            isPending
                              ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                              : isVerified
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">
                                  {staff.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <h5 className="text-sm font-black text-slate-900">{staff.name}</h5>
                                  <p className="text-xs text-slate-500">@{staff.username || 'staff'} • {staff.email}</p>
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                isVerified
                                  ? 'bg-emerald-600 text-white'
                                  : isRejected
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white animate-pulse'
                              }`}>
                                {isVerified ? 'Verified Staff' : isRejected ? 'Verification Rejected' : 'Pending Review'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200/60">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Role Specialization</span>
                                <span className="font-extrabold text-blue-900">{staff.role || staff.specialization || 'Maintenance Staff'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Phone Contact</span>
                                <span className="font-bold">{staff.phone || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Experience</span>
                                <span className="font-semibold">{staff.yearsExperience || '1-3 Years'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">National ID</span>
                                <span className="font-mono text-[11px] font-bold text-slate-900">{staff.nationalId || staff.idNumber || 'GHA-00000000-0'}</span>
                              </div>
                            </div>

                            {/* DOCUMENT VIEW BUTTONS */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setDocPreviewModal({
                                  title: `National ID Document - ${staff.name}`,
                                  name: staff.name,
                                  type: 'id',
                                  data: staff.idCardDoc || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
                                  fileName: staff.nationalId || 'National_ID_Card.png'
                                })}
                                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>View ID Document</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDocPreviewModal({
                                  title: `Curriculum Vitae (CV) - ${staff.name}`,
                                  name: staff.name,
                                  type: 'cv',
                                  data: staff.cvData || `CURRICULUM VITAE\n\nName: ${staff.name}\nEmail: ${staff.email}\nPhone: ${staff.phone}\nRole: ${staff.role}\nExperience: ${staff.yearsExperience || '3 Years'}\n\nQualifications & Summary:\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.`,
                                  fileName: staff.cvFileName || `${staff.name}_CV.pdf`,
                                  endpoint: `/api/staff-applications/${staff.id}/cv`
                                })}
                                className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-700" />
                                <span>Review Staff CV</span>
                              </button>
                            </div>
                          </div>

                          {/* DECISION / VERIFIED BUTTONS */}
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80">
                            {isVerified ? (
                              <button
                                type="button"
                                onClick={() => setSelectedVerifiedStaffModal(staff)}
                                className={`px-4 py-2 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                  staff.accountStatus === 'Banned' || staff.isBanned
                                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                    : staff.accountStatus === 'Disabled' || staff.isDisabled
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <ShieldCheck className="w-4 h-4 text-white" />
                                <span>
                                  {staff.accountStatus === 'Banned' || staff.isBanned
                                    ? 'Verified Staff (Banned)'
                                    : staff.accountStatus === 'Disabled' || staff.isDisabled
                                    ? 'Verified Staff (Disabled)'
                                    : 'Verified Staff'}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRejectStaffModal({ id: staff.id || staff.userId, name: staff.name })}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject Credentials</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStaffVerificationDecision(staff.id || staff.userId, 'Verified', staff.name)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>Approve & Verify Staff</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MANAGER REQUESTS TO ADMIN BOARD */}
            {notifSubTab === 'manager_requests' && (
            <div className="bg-white/90 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/30">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Manager Requests to Admin Board</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                        {boardRequests.length} Total
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">Operational requests, capacity updates, and maintenance tickets submitted by registered managers.</p>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  {(['all', 'pending', 'acknowledged', 'resolved'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setBoardFilter(f)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                        boardFilter === f
                          ? 'bg-white text-blue-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Requests List */}
              {boardRequests.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No requests from managers at this time</p>
                  <p className="text-[11px] text-slate-400">Managers can submit requests to the Admin Board directly from their dashboard.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {boardRequests
                    .filter(req => {
                      if (boardFilter === 'pending') return req.status === 'Pending';
                      if (boardFilter === 'acknowledged') return req.status === 'Acknowledged';
                      if (boardFilter === 'resolved') return req.status === 'Resolved';
                      return true;
                    })
                    .map((req, idx) => {
                      const isPending = req.status === 'Pending';
                      const isResolved = req.status === 'Resolved';
                      const isReplying = replyingRequestId === req.id;

                      return (
                        <div
                          key={`${req.id || 'board'}-${idx}`}
                          className={`p-5 rounded-2xl border transition-all ${
                            isPending
                              ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                              : isResolved
                              ? 'bg-slate-50/70 border-slate-200 opacity-90'
                              : 'bg-blue-50/40 border-blue-200'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-blue-100/60 pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                {(req.managerName || 'M').charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900">{req.managerName || 'Property Manager'}</span>
                                  <span className="text-xs text-slate-500">• {req.hostelName || 'Assigned Property'}</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {req.managerEmail || ''} {req.managerPhone ? `| ${req.managerPhone}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                {req.category || 'General'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                req.priority === 'Urgent'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : req.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {req.priority || 'Normal'} Priority
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                req.status === 'Pending'
                                  ? 'bg-amber-500 text-white'
                                  : req.status === 'Acknowledged'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                          </div>

                          <div className="py-3 space-y-1">
                            <h5 className="text-sm font-bold text-slate-900">{req.subject}</h5>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{req.message}</p>
                            <p className="text-[10px] text-slate-400 pt-1">
                              Submitted: {new Date(req.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {/* Existing Admin Notes */}
                          {req.adminNotes && (
                            <div className="p-3 bg-white rounded-xl border border-blue-200/70 text-xs text-blue-900 space-y-1 my-2">
                              <span className="font-bold text-[10px] uppercase text-blue-600">Admin Response:</span>
                              <p className="text-xs">{req.adminNotes}</p>
                            </div>
                          )}

                          {/* Reply / Note Drawer */}
                          {isReplying && (
                            <div className="mt-3 p-4 bg-white rounded-xl border border-blue-300 space-y-2">
                              <label className="text-xs font-bold text-slate-700">Reply / Note to Manager:</label>
                              <textarea
                                value={replyNotes}
                                onChange={(e) => setReplyNotes(e.target.value)}
                                rows={2}
                                placeholder="Enter operational reply or resolution instructions for manager..."
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setReplyingRequestId(null);
                                    setReplyNotes('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateBoardRequest(req.id, 'Acknowledged')}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                                >
                                  Save as Acknowledged
                                </button>
                                <button
                                  onClick={() => handleUpdateBoardRequest(req.id, 'Resolved')}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                >
                                  Save & Resolve
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-blue-100/60 gap-2">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setReplyingRequestId(isReplying ? null : req.id);
                                  setReplyNotes(req.adminNotes || '');
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{req.adminNotes ? 'Edit Response' : 'Reply to Manager'}</span>
                              </button>

                              {(() => {
                                const matchingRes = residences.find(r => 
                                  (r.name && req.hostelName && r.name.toLowerCase() === req.hostelName.toLowerCase()) ||
                                  (r.id && req.hostelId && r.id === req.hostelId)
                                );
                                if (matchingRes) {
                                  return (
                                    <button
                                      onClick={() => setEditingResidence(matchingRes)}
                                      className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit {matchingRes.name}</span>
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            <div className="flex items-center gap-2">
                              {req.status !== 'Acknowledged' && req.status !== 'Resolved' && (
                                <button
                                  onClick={() => handleUpdateBoardRequest(req.id, 'Acknowledged', req.adminNotes)}
                                  className="text-xs px-3 py-1.5 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold transition-all cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                              )}
                              {req.status !== 'Resolved' && (
                                <button
                                  onClick={() => handleUpdateBoardRequest(req.id, 'Resolved', req.adminNotes)}
                                  className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mark Resolved</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            )}

            {/* REGISTERED RESIDENTS OVERVIEW */}
            <div className="bg-white/90 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-blue-100 pb-4 gap-3">
                <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Verified Residents Community ({residents.length})</span>
                </h4>
                <span className="text-xs text-slate-400">Active & Registered</span>
              </div>

              {/* Resident Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-blue-100">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search residents by student name, email, room number, or hostel residence..."
                    value={residentSearchQuery}
                    onChange={(e) => setResidentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                  {residentSearchQuery && (
                    <button onClick={() => setResidentSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500 shrink-0 px-2">
                  Showing {residents.filter(r => {
                    if (!residentSearchQuery.trim()) return true;
                    const q = residentSearchQuery.toLowerCase();
                    return (
                      r.name?.toLowerCase().includes(q) ||
                      r.email?.toLowerCase().includes(q) ||
                      r.residenceName?.toLowerCase().includes(q) ||
                      r.roomNumber?.toLowerCase().includes(q)
                    );
                  }).length} of {residents.length}
                </span>
              </div>

              {residents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No residents registered yet. Use "Register Resident" above to enroll verified residents.
                </div>
              ) : (
                <div className="space-y-3">
                  {residents
                    .filter(r => {
                      if (!residentSearchQuery.trim()) return true;
                      const q = residentSearchQuery.toLowerCase();
                      return (
                        r.name?.toLowerCase().includes(q) ||
                        r.email?.toLowerCase().includes(q) ||
                        r.residenceName?.toLowerCase().includes(q) ||
                        r.roomNumber?.toLowerCase().includes(q)
                      );
                    })
                    .map((res) => (
                    <div key={res.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-blue-50/60 border border-blue-100 p-4 rounded-2xl gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-slate-900 text-sm">{res.name}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {res.status || 'Live & Approved'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Email: <span className="text-slate-900 font-semibold">{res.email}</span> | Residence: <span className="text-blue-600 font-semibold">{res.residenceName}</span> ({res.roomNumber})
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          Fee Paid: GHS {res.feeAmount || '3,500'}
                        </span>
                        <button
                          onClick={() => {
                            saveResidentsToStorage(residents.filter(r => r.id !== res.id));
                            triggerToast('Resident removed.');
                          }}
                          className="text-rose-600 hover:text-rose-700 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: STAFF VERIFICATION DESK */}
        {activeTab === 'staff_verification' && (
          <div className="space-y-8 animate-fadeIn relative z-10">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-black uppercase tracking-wider border border-blue-400/30">
                      Super Admin Desk
                    </span>
                    {pendingStaffCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-black uppercase tracking-wider animate-pulse">
                        {pendingStaffCount} New Applicants Waiting
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
                    Staff Credential Verification Console
                  </h2>
                  <p className="text-xs text-blue-200 font-medium max-w-2xl leading-relaxed">
                    Review incoming staff registrations, inspect compulsory PDF Curriculum Vitae (CV) and Dual Ghana National ID cards (Front & Back), and approve or reject staff credentials.
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Desk Card Container */}
            <div className="bg-white/90 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-blue-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>Staff Applications Desk</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                        {staffVerifications.length} Registered Applicants
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500">Only verified staff can apply for positions across accredited university hostels.</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {(['all', 'pending', 'verified', 'rejected'] as const).map(tabF => (
                    <button
                      key={tabF}
                      onClick={() => setApprovalTabFilter(tabF === 'verified' ? 'approved' : tabF as any)}
                      className={`px-3.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                        (approvalTabFilter === tabF || (tabF === 'verified' && approvalTabFilter === 'approved'))
                          ? 'bg-blue-900 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tabF === 'pending' && pendingStaffCount > 0 ? (
                        <span className="flex items-center gap-1.5">
                          <span>Pending</span>
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
                        </span>
                      ) : (
                        tabF
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar for Verification Console */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-blue-100">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search staff applicants by name, email, phone, role, ID number..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  />
                  {staffSearchQuery && (
                    <button onClick={() => setStaffSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500 shrink-0 px-2">
                  Showing {staffVerifications.filter(staff => {
                    const isV = staff.isVerified || staff.verificationStatus === 'Verified' || staff.verificationStatus === 'verified';
                    const isR = staff.verificationStatus === 'Rejected' || staff.verificationStatus === 'rejected';
                    const isP = !isV && !isR;
                    if (approvalTabFilter === 'pending') if (!isP) return false;
                    if ((approvalTabFilter as string) === 'approved' || (approvalTabFilter as string) === 'verified') if (!isV) return false;
                    if (approvalTabFilter === 'rejected') if (!isR) return false;

                    if (staffSearchQuery.trim()) {
                      const q = staffSearchQuery.toLowerCase();
                      const matchName = staff.name?.toLowerCase().includes(q);
                      const matchEmail = staff.email?.toLowerCase().includes(q);
                      const matchPhone = staff.phone?.toLowerCase().includes(q);
                      const matchRole = (staff.role || staff.specialization)?.toLowerCase().includes(q);
                      const matchId = (staff.idNumber || staff.nationalId)?.toLowerCase().includes(q);
                      if (!matchName && !matchEmail && !matchPhone && !matchRole && !matchId) return false;
                    }
                    return true;
                  }).length} of {staffVerifications.length} staff
                </span>
              </div>

              {staffVerifications.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No staff applicants registered yet</p>
                  <p className="text-[11px] text-slate-400">Staff registrations will appear here with submitted CV and National ID documents for Admin review.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffVerifications
                    .filter(staff => {
                      const isV = staff.isVerified || staff.verificationStatus === 'Verified' || staff.verificationStatus === 'verified';
                      const isR = staff.verificationStatus === 'Rejected' || staff.verificationStatus === 'rejected';
                      const isP = !isV && !isR;
                      if (approvalTabFilter === 'pending') if (!isP) return false;
                      if ((approvalTabFilter as string) === 'approved' || (approvalTabFilter as string) === 'verified') if (!isV) return false;
                      if (approvalTabFilter === 'rejected') if (!isR) return false;

                      if (staffSearchQuery.trim()) {
                        const q = staffSearchQuery.toLowerCase();
                        const matchName = staff.name?.toLowerCase().includes(q);
                        const matchEmail = staff.email?.toLowerCase().includes(q);
                        const matchPhone = staff.phone?.toLowerCase().includes(q);
                        const matchRole = (staff.role || staff.specialization)?.toLowerCase().includes(q);
                        const matchId = (staff.idNumber || staff.nationalId)?.toLowerCase().includes(q);
                        if (!matchName && !matchEmail && !matchPhone && !matchRole && !matchId) return false;
                      }
                      return true;
                    })
                    .map((staff, idx) => {
                      const isVerified = staff.isVerified || staff.verificationStatus === 'Verified' || staff.verificationStatus === 'verified';
                      const isRejected = staff.verificationStatus === 'Rejected' || staff.verificationStatus === 'rejected';
                      const isPending = !isVerified && !isRejected;

                      return (
                        <div
                          key={`${staff.id || 'stf'}-${idx}`}
                          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all ${
                            isPending
                              ? 'bg-amber-50/60 border-amber-300 shadow-sm ring-2 ring-amber-400/20'
                              : isVerified
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm uppercase shadow-md">
                                  {staff.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-sm text-slate-900">{staff.name}</span>
                                    {isPending && (
                                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="New Applicant Verification Pending" />
                                    )}
                                  </div>
                                  <span className="text-xs text-blue-700 font-bold block">{staff.role || 'Facilities Technician'}</span>
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isVerified
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isRejected
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                              }`}>
                                {isVerified ? '✓ Verified Staff' : isRejected ? '✕ Rejected' : '● Verification Pending'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-3 bg-white/90 rounded-xl border border-slate-200/80 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Email</span>
                                <span className="font-semibold text-slate-800 truncate block">{staff.email}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Phone Contact</span>
                                <span className="font-bold text-slate-800">{staff.phone || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Experience</span>
                                <span className="font-semibold text-slate-800">{staff.yearsExperience || '1-3 Years'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">National ID Number</span>
                                <span className="font-mono text-[11px] font-bold text-blue-900">{staff.idNumber || staff.nationalId || 'GHA-Card'}</span>
                              </div>
                            </div>

                            {/* DOCUMENT VIEW BUTTONS */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setDocPreviewModal({
                                  title: `Ghana National ID (Front & Back) - ${staff.name}`,
                                  name: staff.name,
                                  type: 'id',
                                  data: staff.idCardDoc || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
                                  fileName: staff.idNumber || 'Ghana_Card_Front_Back.png'
                                })}
                                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Front & Back ID</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDocPreviewModal({
                                  title: `Curriculum Vitae (PDF) - ${staff.name}`,
                                  name: staff.name,
                                  type: 'cv',
                                  data: staff.cvData || `CURRICULUM VITAE\n\nName: ${staff.name}\nEmail: ${staff.email}\nPhone: ${staff.phone}\nRole: ${staff.role}\nExperience: ${staff.yearsExperience || '3 Years'}\n\nQualifications & Summary:\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.`,
                                  fileName: staff.cvFileName || `${staff.name}_CV.pdf`,
                                  endpoint: `/api/staff-verifications/${staff.userId || staff.id}/cv`
                                })}
                                className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-700" />
                                <span>Review PDF CV</span>
                              </button>
                            </div>

                            {staff.reviewNotes && (
                              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-medium text-rose-900">
                                <strong>Rejection Reason Sent:</strong> "{staff.reviewNotes}"
                              </div>
                            )}
                          </div>

                          {/* DECISION / VERIFIED BUTTONS */}
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80">
                            {isVerified ? (
                              <button
                                type="button"
                                onClick={() => setSelectedVerifiedStaffModal(staff)}
                                className={`px-4 py-2 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                                  staff.accountStatus === 'Banned' || staff.isBanned
                                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                    : staff.accountStatus === 'Disabled' || staff.isDisabled
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                <ShieldCheck className="w-4 h-4 text-white" />
                                <span>
                                  {staff.accountStatus === 'Banned' || staff.isBanned
                                    ? 'Verified Staff (Banned)'
                                    : staff.accountStatus === 'Disabled' || staff.isDisabled
                                    ? 'Verified Staff (Disabled)'
                                    : 'Verified Staff'}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRejectStaffModal({ id: staff.id || staff.userId, name: staff.name })}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject Credentials</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStaffVerificationDecision(staff.id || staff.userId, 'Verified', staff.name)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>Approve & Verify Staff</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* FULL 5-PHASE ONBOARDING WIZARD WITH MANAGER INFO: MANUALLY REGISTER RESIDENT */}
      <ResidentOnboardingWizard
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
        onResidentRegistered={(newResident) => {
          const updated = [newResident, ...residents.filter(r => r.id !== newResident.id)];
          saveResidentsToStorage(updated);
          triggerToast(`Resident ${newResident.name} onboarded successfully and linked to Manager ${newResident.managerName || 'Assigned Manager'}!`);
        }}
        availableHostels={residences}
        availableManagers={availableManagersList}
      />

      {/* MODAL: MANUALLY REGISTER RESIDENCE */}
      {showAddResidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white border border-blue-200 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 relative">
            <h3 className="text-xl font-bold text-slate-900">Register New Residence</h3>
            <form onSubmit={handleManualRegisterResidence} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Residence Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sapphire Gardens"
                  value={newResName}
                  onChange={(e) => setNewResName(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category Type</label>
                  <select
                    value={newResType}
                    onChange={(e) => setNewResType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Hostel">Hostel</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Lounge">Lounge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Capacity (Beds/Rooms)</label>
                  <input
                    type="number"
                    value={newResCapacity}
                    onChange={(e) => setNewResCapacity(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location / Campus Zone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legon Campus East Gate, Accra"
                  value={newResLocation}
                  onChange={(e) => setNewResLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Annual Fee (GHS)</label>
                  <input
                    type="text"
                    value={newResPrice}
                    onChange={(e) => setNewResPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Anthony Davis"
                    value={newResManager}
                    onChange={(e) => setNewResManager(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg cursor-pointer"
                >
                  Register & Approve Residence
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddResidenceModal(false)}
                  className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT REGISTERED RESIDENCE */}
      {editingResidence && (
        <EditResidenceModal
          isOpen={Boolean(editingResidence)}
          onClose={() => setEditingResidence(null)}
          residence={editingResidence}
          onSave={handleSaveResidenceEdit}
        />
      )}

      {/* MODAL: DOCUMENT PREVIEW (CV PDF & NATIONAL ID FRONT/BACK) */}
      {docPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-3xl p-6 max-w-3xl w-full max-h-[92vh] flex flex-col space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-md">
                  {docPreviewModal.type === 'cv' ? <FileText className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{docPreviewModal.title}</h4>
                  <p className="text-[11px] text-slate-500">{docPreviewModal.fileName || 'Official Submitted Credential Document'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDocPreviewModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[350px] max-h-[580px] bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {docPreviewModal.type === 'id' ? (
                <div>
                  {(() => {
                    let parsed: any = null;
                    try {
                      if (docPreviewModal.data.startsWith('{')) {
                        parsed = JSON.parse(docPreviewModal.data);
                      }
                    } catch (e) {}

                    if (parsed && (parsed.front || parsed.back)) {
                      return (
                        <div className="space-y-4">
                          <div className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Ghana National ID Card (Front & Back Sides Submitted)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                              <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">1. Front Side (Ghana Card)</span>
                              {parsed.front && (parsed.front.startsWith('data:') || parsed.front.startsWith('http')) ? (
                                <img src={parsed.front} alt="ID Front" className="w-full h-48 object-contain rounded-xl border bg-slate-100" />
                              ) : (
                                <div className="p-6 text-center text-xs font-mono text-slate-600 bg-slate-100 rounded-xl">{parsed.front || 'Front Document Attached'}</div>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono block text-center truncate">{parsed.frontName || 'Front Side Photo'}</span>
                            </div>

                            <div className="space-y-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
                              <span className="text-[11px] font-black text-slate-700 block uppercase tracking-wider">2. Back Side (Ghana Card)</span>
                              {parsed.back && (parsed.back.startsWith('data:') || parsed.back.startsWith('http')) ? (
                                <img src={parsed.back} alt="ID Back" className="w-full h-48 object-contain rounded-xl border bg-slate-100" />
                              ) : (
                                <div className="p-6 text-center text-xs font-mono text-slate-600 bg-slate-100 rounded-xl">{parsed.back || 'Back Document Attached'}</div>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono block text-center truncate">{parsed.backName || 'Back Side Photo'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (docPreviewModal.data.startsWith('data:') || docPreviewModal.data.startsWith('http')) {
                      return (
                        <div className="text-center space-y-3">
                          <img
                            src={docPreviewModal.data}
                            alt="National ID Document"
                            className="max-w-full h-auto mx-auto rounded-xl border border-slate-300 shadow-md max-h-[480px] object-contain"
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                          <ShieldCheck className="w-12 h-12 text-blue-900 mx-auto" />
                          <p className="text-xs font-bold text-slate-800">Ghana National ID Document Reference</p>
                          <p className="font-mono text-sm text-blue-900 font-bold">{docPreviewModal.data}</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <object
                      data={docPreviewModal.endpoint || previewBlobUrl || undefined}
                      type="application/pdf"
                      className="w-full h-[520px] rounded-xl border border-slate-300 shadow-inner bg-white"
                      title="CV PDF Viewer"
                    >
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50 space-y-3">
                        <p className="text-sm font-medium">Unable to render PDF securely in this frame.</p>
                        <a href={docPreviewModal.endpoint || previewBlobUrl || '#'} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700">Open PDF in New Tab</a>
                      </div>
                    </object>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        MIME: <strong className="text-blue-900">application/pdf</strong> {docPreviewModal.endpoint ? '(Backend Stream)' : '(Sanitized Blob)'}
                      </span>
                      <div className="flex items-center gap-2">
                        {previewBlobUrl && (
                          <a
                            href={docPreviewModal.endpoint || previewBlobUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-600" /> Open in New Tab
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadPdfDocument(docPreviewModal.data, docPreviewModal.fileName, docPreviewModal.name || 'Applicant')}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Download className="w-4 h-4 text-emerald-400" /> Download PDF File
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDocPreviewModal(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT STAFF CREDENTIALS WITH REASON */}
      {rejectStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-500/30">
                  <X className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Reject Staff Credentials</h4>
                  <p className="text-xs text-slate-500">Applicant: <strong>{rejectStaffModal.name}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectStaffModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Provide Rejection Reason <span className="text-rose-500">* (Sent directly to staff member)</span>
              </label>
              <textarea
                required
                rows={4}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="e.g. CV is missing required certifications, or Ghana Card image is unreadable. Please re-upload a clear PDF CV and front/back National ID."
                className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none bg-slate-50"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                This message will be instantly delivered to <strong>{rejectStaffModal.name}'s</strong> notifications tab so they understand why their application was rejected and what credentials to fix.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setRejectStaffModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectionReasonText.trim()) {
                    triggerToast("Please type a rejection reason for the applicant.");
                    return;
                  }
                  handleStaffVerificationDecision(rejectStaffModal.id, 'Rejected', rejectStaffModal.name, rejectionReasonText);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Confirm Rejection & Send Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VERIFIED STAFF MANAGEMENT & DETAILS */}
      {selectedVerifiedStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-base shadow-md">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-900">{selectedVerifiedStaffModal.name}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedVerifiedStaffModal.accountStatus === 'Banned' || selectedVerifiedStaffModal.isBanned
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : selectedVerifiedStaffModal.accountStatus === 'Disabled' || selectedVerifiedStaffModal.isDisabled
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {selectedVerifiedStaffModal.accountStatus || (selectedVerifiedStaffModal.isBanned ? 'Banned' : selectedVerifiedStaffModal.isDisabled ? 'Disabled' : 'Active On Duty')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Official Accredited Staff Profile & Credentials Record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVerifiedStaffModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detailed Info Cards */}
            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Email Address</span>
                  <span className="font-bold text-slate-900 break-all">{selectedVerifiedStaffModal.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Phone Contact</span>
                  <span className="font-bold text-slate-900">{selectedVerifiedStaffModal.phone || '+233 24 000 0000'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Role Specialization</span>
                  <span className="font-extrabold text-blue-900">{selectedVerifiedStaffModal.role || selectedVerifiedStaffModal.specialization || 'Maintenance Specialist'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Years Experience</span>
                  <span className="font-semibold text-slate-800">{selectedVerifiedStaffModal.yearsExperience || '1-3 Years'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Ghana National ID</span>
                  <span className="font-mono text-xs font-black text-blue-900">{selectedVerifiedStaffModal.nationalId || selectedVerifiedStaffModal.idNumber || 'GHA-000000000-0'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Verification Status</span>
                  <span className="font-bold text-emerald-700">✓ Verified & Approved</span>
                </div>
              </div>

              {selectedVerifiedStaffModal.statusReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <strong>Status Note / Action Reason:</strong> "{selectedVerifiedStaffModal.statusReason}"
                </div>
              )}

              {/* Document Review Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDocPreviewModal({
                      title: `Ghana National ID (Front & Back) - ${selectedVerifiedStaffModal.name}`,
                      name: selectedVerifiedStaffModal.name,
                      type: 'id',
                      data: selectedVerifiedStaffModal.idCardDoc || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
                      fileName: selectedVerifiedStaffModal.idNumber || 'Ghana_Card_Front_Back.png'
                    });
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>View ID Card (Front & Back)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDocPreviewModal({
                      title: `Curriculum Vitae (PDF) - ${selectedVerifiedStaffModal.name}`,
                      name: selectedVerifiedStaffModal.name,
                      type: 'cv',
                      data: selectedVerifiedStaffModal.cvData || `CURRICULUM VITAE\n\nName: ${selectedVerifiedStaffModal.name}\nEmail: ${selectedVerifiedStaffModal.email}\nPhone: ${selectedVerifiedStaffModal.phone}\nRole: ${selectedVerifiedStaffModal.role}\nExperience: ${selectedVerifiedStaffModal.yearsExperience || '3 Years'}\n\nQualifications & Summary:\nCertified technician with experience in electrical, plumbing, and residence facilities maintenance.`,
                      fileName: selectedVerifiedStaffModal.cvFileName || `${selectedVerifiedStaffModal.name}_CV.pdf`,
                      endpoint: `/api/staff-verifications/${selectedVerifiedStaffModal.userId || selectedVerifiedStaffModal.id}/cv`
                    });
                  }}
                  className="flex-1 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>Review PDF CV</span>
                </button>
              </div>

              {/* Administrative Security Controls */}
              <div className="pt-3 border-t space-y-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Account Security Controls</span>
                
                <div className="flex flex-wrap items-center gap-2">
                  {(selectedVerifiedStaffModal.accountStatus === 'Disabled' || selectedVerifiedStaffModal.accountStatus === 'Banned' || selectedVerifiedStaffModal.isDisabled || selectedVerifiedStaffModal.isBanned) ? (
                    <button
                      type="button"
                      onClick={() => setStaffStatusActionModal({ staff: selectedVerifiedStaffModal, action: 'activate' })}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Reactivate Account</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setStaffStatusActionModal({ staff: selectedVerifiedStaffModal, action: 'disable' })}
                        className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Disable Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffStatusActionModal({ staff: selectedVerifiedStaffModal, action: 'ban' })}
                        className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Ban Account</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end border-t pt-3">
              <button
                type="button"
                onClick={() => setSelectedVerifiedStaffModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISABLE / BAN / REACTIVATE STAFF ACCOUNT ACTION */}
      {staffStatusActionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold shadow-md ${
                  staffStatusActionModal.action === 'ban'
                    ? 'bg-rose-600 shadow-rose-500/30'
                    : staffStatusActionModal.action === 'disable'
                    ? 'bg-amber-500 shadow-amber-500/30'
                    : 'bg-emerald-600 shadow-emerald-500/30'
                }`}>
                  {staffStatusActionModal.action === 'ban' ? <Ban className="w-5 h-5" /> : staffStatusActionModal.action === 'disable' ? <ShieldAlert className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 capitalize">
                    {staffStatusActionModal.action} Staff Account
                  </h4>
                  <p className="text-xs text-slate-500">Staff: <strong>{staffStatusActionModal.staff.name}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStaffStatusActionModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Reason for <span className="capitalize">{staffStatusActionModal.action}</span> Action <span className="text-slate-400 font-normal">(Optional note for audit log)</span>
              </label>
              <textarea
                rows={3}
                value={actionReasonText}
                onChange={(e) => setActionReasonText(e.target.value)}
                placeholder={
                  staffStatusActionModal.action === 'ban'
                    ? 'e.g. Severe breach of residence safety protocol or fraudulent identity submission.'
                    : staffStatusActionModal.action === 'disable'
                    ? 'e.g. Account temporarily paused pending routine background check update.'
                    : 'e.g. Credentials re-verified upon administrator review.'
                }
                className="w-full p-3 border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setStaffStatusActionModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetStatus = staffStatusActionModal.action === 'disable'
                    ? 'Disabled'
                    : staffStatusActionModal.action === 'ban'
                    ? 'Banned'
                    : 'Active';
                  handleStaffStatusChange(
                    staffStatusActionModal.staff.id || staffStatusActionModal.staff.userId,
                    targetStatus,
                    actionReasonText
                  );
                }}
                className={`px-5 py-2.5 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  staffStatusActionModal.action === 'ban'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : staffStatusActionModal.action === 'disable'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <span className="capitalize">Confirm {staffStatusActionModal.action}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      <LogoutConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        userRole="Super Administrator"
        userName={user?.name || 'Administrator'}
      />
    </div>
  );
}
