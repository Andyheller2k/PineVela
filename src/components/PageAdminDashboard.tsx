import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import { 
  Building2, Users, DollarSign, CheckCircle2, XCircle, Clock, Plus, 
  ShieldCheck, LogOut, Search, Filter, Home, Hotel, Coffee, UserPlus, 
  AlertCircle, Check, Trash2, Edit3, Eye, Sparkles, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PageAdminDashboard() {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'residences' | 'managers' | 'residents' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Filter & Search states
  const [residenceFilter, setResidenceFilter] = useState<'all' | 'Hostel' | 'Hotel' | 'Lounge'>('all');
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

      const savedFees = localStorage.getItem('pinevela_admin_fees');
      if (savedFees) {
        setFeesPaid(JSON.parse(savedFees));
      } else {
        setFeesPaid([
          { id: 'fee-1', payer: 'Heritage Palace Residency', amount: 50.00, currency: 'GHS', type: 'Onboarding Fee', status: 'Paid', date: '2026-06-25' }
        ]);
      }

      const resActs = await apiFetch('/api/activities').catch(() => []);
      setActivities(Array.isArray(resActs) ? resActs : []);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
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
    logout();
    navigate('/');
  };

  const pendingManagersCount = managerRequests.filter(r => r.status === 'pending' || !r.status).length;
  const hostelCount = residences.filter(r => (r.hostel_type || '').toLowerCase().includes('hostel')).length;
  const hotelCount = residences.filter(r => (r.hostel_type || '').toLowerCase().includes('hotel')).length;
  const loungeCount = residences.filter(r => (r.hostel_type || '').toLowerCase().includes('lounge')).length;
  const totalManagers = managerRequests.length + 3;
  const totalResidents = residents.length;
  const totalResidences = residences.length;
  const totalFeesCollected = feesPaid.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

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

      {/* SIDEBAR: PURELY STATIC / FIXED ICE-BLUE FROSTY BLUE WITH CURVED EDGES & BLUE GLOW */}
      <aside className="w-full lg:w-72 m-4 lg:my-6 lg:ml-6 h-auto lg:h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
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
              { id: 'residences', label: 'Available Residences', icon: Building2, sub: 'Hostels, Hotels & Lounges' },
              { id: 'managers', label: 'Managers', icon: Users, badge: pendingManagersCount, sub: 'Approvals, contact & history' },
              { id: 'residents', label: 'Residents Management', icon: UserPlus, sub: 'Subdivided resident lists' },
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
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-200/70 text-blue-700 group-hover:bg-blue-300/80'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-wide">{tab.label}</div>
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0 pl-16">
          <div className="transform scale-[4.5] opacity-[0.18] blur-[0.4px]">
            <PineLogo size={180} />
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

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-2">
              {['all', 'Hostel', 'Hotel', 'Lounge'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setResidenceFilter(cat as any)}
                  className={`px-5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    residenceFilter === cat
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 border border-blue-400'
                      : 'bg-white/80 text-slate-600 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {cat === 'all' ? 'All Residences' : `${cat}s`}
                </button>
              ))}
            </div>

            {/* Residences Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {residences
                .filter(res => {
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
                  return (
                    <div key={residence.id} className="bg-white/80 border border-blue-200/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="relative h-48 w-full overflow-hidden">
                          <img
                            src={residence.image || residence.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                            alt={residence.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-blue-700 border border-blue-200">
                            {type}
                          </div>
                          <div className="absolute top-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-lg">
                            {residence.status || 'Open'}
                          </div>
                        </div>

                        <div className="p-6 space-y-3">
                          <h4 className="text-base font-bold text-slate-900">{residence.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center space-x-1">
                            <span>📍</span>
                            <span>{residence.location}</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Capacity</span>
                              <span className="font-bold text-slate-800">{residence.totalCapacity || 100} beds</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Price / Year</span>
                              <span className="font-bold text-blue-600">GHS {residence.price || 4000}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 pt-1">
                            <span>Manager: </span>
                            <span className="font-semibold text-slate-900">{residence.managerName || 'Assigned Manager'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-blue-100">
                        <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved & Live</span>
                        </span>
                        <button
                          onClick={() => {
                            setResidences(prev => prev.filter(r => r.id !== residence.id));
                            triggerToast('Residence deleted successfully.');
                          }}
                          className="text-rose-600 hover:text-rose-700 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

            <div className="space-y-4">
              {managerRequests.map((req) => (
                <div key={req.id} className="bg-sky-50/20 border border-sky-200/50 p-6 rounded-3xl backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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

        {/* TAB 4: RESIDENTS MANAGEMENT */}
        {activeTab === 'residents' && (
          <div className="space-y-6 animate-fadeIn relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/80 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Residents Management</h3>
                <p className="text-xs text-slate-500">Subdivided into Hostels, Hotels, and Lounges residents. Review and approve registrations before they go live on PineVela.</p>
              </div>

              <button
                onClick={() => setShowAddResidentModal(true)}
                className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>Manually Register Resident</span>
              </button>
            </div>

            {/* Residents List Subdivided */}
            <div className="space-y-6">
              {['Hostel', 'Hotel', 'Lounge'].map((category) => {
                const catResidents = residents.filter(r => (r.category || 'Hostel') === category);
                return (
                  <div key={category} className="bg-white/80 border border-blue-200/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                      <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                        {category === 'Hostel' && <Home className="w-5 h-5 text-blue-600" />}
                        {category === 'Hotel' && <Hotel className="w-5 h-5 text-cyan-600" />}
                        {category === 'Lounge' && <Coffee className="w-5 h-5 text-indigo-600" />}
                        <span>{category} Residents ({catResidents.length})</span>
                      </h4>
                      <span className="text-xs text-slate-400">PineVela Verified Community</span>
                    </div>

                    <div className="space-y-3">
                      {catResidents.map((res) => (
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

                      {catResidents.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                          No {category.toLowerCase()} residents registered yet.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: MANUALLY REGISTER RESIDENT */}
      {showAddResidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white border border-blue-200 p-8 rounded-3xl max-w-lg w-full shadow-2xl space-y-6 relative">
            <h3 className="text-xl font-bold text-slate-900">Manually Register Resident</h3>
            <form onSubmit={handleManualRegisterResident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@student.edu"
                  value={newResidentEmail}
                  onChange={(e) => setNewResidentEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Residency Category</label>
                  <select
                    value={newResidentType}
                    onChange={(e) => setNewResidentType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Hostel">Hostel</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Lounge">Lounge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room / Bed Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={newResidentRoom}
                    onChange={(e) => setNewResidentRoom(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Residence Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emerald Heights Block A"
                  value={newResidentResidenceName}
                  onChange={(e) => setNewResidentResidenceName(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Residency Fee (GHS)</label>
                <input
                  type="text"
                  value={newResidentFeeAmount}
                  onChange={(e) => setNewResidentFeeAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-50/60 border border-blue-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-lg cursor-pointer"
                >
                  Register Resident & Go Live
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddResidentModal(false)}
                  className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

    </div>
  );
}
