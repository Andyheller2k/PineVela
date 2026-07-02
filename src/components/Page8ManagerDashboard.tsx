import React, { useState, useEffect } from 'react';
import PineLogo from './PineLogo';
import { Hostel, BookingRequest, IssueReport } from '../types';
import {
  LayoutDashboard,
  Building,
  CalendarCheck,
  Wrench,
  Settings,
  LogOut,
  Search,
  Bell,
  Filter,
  Plus,
  TrendingUp,
  MapPin,
  ChevronRight,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  FileText,
  Phone,
  Trash,
  Sliders,
  Sparkles,
  Layers,
  Edit2
} from 'lucide-react';

interface Page8ManagerDashboardProps {
  currentScreen: 'manager-dashboard' | 'manager-configure';
  onNavigate: (screen: 'public-browse' | 'manager-dashboard' | 'manager-configure') => void;
  hostels: Hostel[];
  bookingRequests: BookingRequest[];
  issueReports: IssueReport[];
  activities: any[];
  onUpdateHostels: (hostels: Hostel[]) => void;
  onUpdateBookingStatus: (id: string, status: 'Pending' | 'Approved' | 'Ignored') => Promise<void>;
}

export default function Page8ManagerDashboard({
  currentScreen,
  onNavigate,
  hostels,
  bookingRequests,
  issueReports,
  activities,
  onUpdateHostels,
  onUpdateBookingStatus
}: Page8ManagerDashboardProps) {
  // Local active tab to support settings subview
  const [activeTab, setActiveTab] = useState<'dashboard' | 'configure' | 'settings' | 'register'>('dashboard');

  useEffect(() => {
    if (currentScreen === 'manager-configure') {
      setActiveTab('configure');
    } else {
      setActiveTab('dashboard');
    }
  }, [currentScreen]);

  // Hostel Registration Tab States
  const [regHostelName, setRegHostelName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regWing, setRegWing] = useState<'North Wing' | 'South Side' | 'East Side' | 'West Campus' | 'Other'>('North Wing');
  const [regDescription, setRegDescription] = useState('Premium newly registered block offering high-standard student accommodation facilities.');
  const [regManagerName, setRegManagerName] = useState('Kofi Obeng');
  const [regManagerPhone, setRegManagerPhone] = useState('+234 802 123 4567');
  const [regManagerEmail, setRegManagerEmail] = useState('kofi.obeng@pinevela.com');
  const [regStatus, setRegStatus] = useState<'Open' | 'Full' | 'Under Maintenance'>('Open');
  
  // Dynamic blocks state: number of blocks, block name, total rooms, total floors, names of each room
  const [regBlocks, setRegBlocks] = useState<Array<{
    id: string;
    name: string;
    floors: number;
    totalRooms: number;
    roomPrefix: string;
    startNum: number;
  }>>([
    { id: '1', name: 'NAB Block 1', floors: 4, totalRooms: 200, roomPrefix: 'NAB', startNum: 1 }
  ]);

  // Temporary inputs to add a new block config
  const [tempBlockName, setTempBlockName] = useState('NAB Block 1');
  const [tempFloors, setTempFloors] = useState(4);
  const [tempRooms, setTempRooms] = useState(200);
  const [tempPrefix, setTempPrefix] = useState('NAB');
  const [tempStartNum, setTempStartNum] = useState(1);

  // Page 8 selected hostel in detail panel
  const [selectedManagerHostelId, setSelectedManagerHostelId] = useState('hostel-2'); // default Sapphire Gardens

  // Page 9 state (Manage Hostels form)
  const [formHostelName, setFormHostelName] = useState('Pine Crest Residency');
  const [formLocation, setFormLocation] = useState('42 University Way, North Campus');
  const [formBlocks, setFormBlocks] = useState(['Block A', 'Block B']);
  const [formNewBlockName, setFormNewBlockName] = useState('');
  const [formFloors, setFormFloors] = useState(4);
  const [formRooms, setFormRooms] = useState(12);
  const [formBeds, setFormBeds] = useState(2);
  const [formStatus, setFormStatus] = useState<'Open' | 'Full' | 'Under Maintenance'>('Open');
  const [formPhone, setFormPhone] = useState('+234 802 123 4567');
  const [formRegistrationDate, setFormRegistrationDate] = useState('2026-06-28');
  const [formSubscriptionPaid, setFormSubscriptionPaid] = useState(true);
  const [editingHostelId, setEditingHostelId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Active state lists
  const [localBookingRequests, setLocalBookingRequests] = useState<BookingRequest[]>(bookingRequests);
  const [localActivities, setLocalActivities] = useState<any[]>(activities);

  // Synchronize state when props update after initial async fetch
  useEffect(() => {
    setLocalBookingRequests(bookingRequests);
  }, [bookingRequests]);

  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Actions
  const handleApproveBooking = async (id: string, name: string) => {
    try {
      await onUpdateBookingStatus(id, 'Approved');
      setLocalBookingRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Approved' } : req));
      triggerToast(`Booking request for ${name} APPROVED!`);
      
      // Add activity
      const newAct = {
        id: `act-new-${Date.now()}`,
        text: `Booking request for ${name} approved successfully.`,
        time: 'Just now',
        type: 'success'
      };
      setLocalActivities([newAct, ...localActivities]);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update booking status on server.');
    }
  };

  const handleIgnoreBooking = async (id: string, name: string) => {
    try {
      await onUpdateBookingStatus(id, 'Ignored');
      setLocalBookingRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'Ignored' } : req));
      triggerToast(`Booking request for ${name} IGNORED`);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update booking status on server.');
    }
  };

  // Manage Hostels Block handlers
  const handleAddBlock = () => {
    const name = formNewBlockName.trim() || `Block ${String.fromCharCode(65 + formBlocks.length)}`;
    if (formBlocks.includes(name)) {
      triggerToast('Block name already exists');
      return;
    }
    setFormBlocks([...formBlocks, name]);
    setFormNewBlockName('');
    triggerToast(`Added ${name}`);
  };

  const handleRemoveBlock = (index: number) => {
    setFormBlocks(formBlocks.filter((_, i) => i !== index));
  };

  // Load selected hostel from Existing Hostels Portfolio in form
  const handleLoadHostelForEdit = (hostel: Hostel) => {
    setFormHostelName(hostel.name);
    setFormLocation(hostel.location);
    setFormBlocks(['Block A', 'Block B']); // mock blocks for sample
    setFormFloors(4);
    setFormRooms(12);
    setFormBeds(2);
    setFormStatus(hostel.status);
    setFormPhone(hostel.managerPhone || '+234 802 123 4567');
    setFormRegistrationDate(hostel.registrationDate || '2026-06-28');
    setFormSubscriptionPaid(hostel.subscriptionPaid ?? true);
    setEditingHostelId(hostel.id);
    triggerToast(`Loaded ${hostel.name} details`);
  };

  // Save/Add hostel
  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formHostelName.trim()) {
      triggerToast('Please specify a hostel name');
      return;
    }

    const calculatedCapacity = formBlocks.length * formFloors * formRooms * formBeds;

    if (editingHostelId) {
      // update
      const updated = hostels.map(h => h.id === editingHostelId ? {
        ...h,
        name: formHostelName,
        location: formLocation,
        status: formStatus,
        totalCapacity: calculatedCapacity,
        availableSpaces: formStatus === 'Open' ? Math.floor(calculatedCapacity * 0.2) : 0,
        bedsLeft: formStatus === 'Open' ? Math.floor(calculatedCapacity * 0.2) : 0,
        managerPhone: formPhone,
        registrationDate: formRegistrationDate,
        subscriptionPaid: formSubscriptionPaid
      } : h);
      onUpdateHostels(updated);
      triggerToast(`Successfully saved edits for ${formHostelName}`);
    } else {
      // create new
      const newHostel: Hostel = {
        id: `hostel-new-${Date.now()}`,
        name: formHostelName,
        location: formLocation,
        wing: 'North Wing',
        status: formStatus,
        bedsLeft: Math.floor(calculatedCapacity * 0.15),
        totalCapacity: calculatedCapacity,
        availableSpaces: Math.floor(calculatedCapacity * 0.15),
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        managerName: 'Kofi Obeng',
        managerPhone: formPhone,
        managerEmail: 'kofi.obeng@pinevela.com',
        description: 'Newly registered premium campus living blocks with modern high-capacity floor arrangements and responsive utility setups.',
        registrationDate: formRegistrationDate,
        subscriptionPaid: formSubscriptionPaid
      };
      onUpdateHostels([newHostel, ...hostels]);
      triggerToast(`Successfully registered new hostel ${formHostelName}`);
    }

    // Reset Form
    setFormHostelName('Pine Crest Residency');
    setFormLocation('42 University Way, North Campus');
    setFormBlocks(['Block A', 'Block B']);
    setFormFloors(4);
    setFormRooms(12);
    setFormBeds(2);
    setFormStatus('Open');
    setFormPhone('+234 802 123 4567');
    setFormRegistrationDate('2026-06-28');
    setFormSubscriptionPaid(true);
    setEditingHostelId(null);
  };

  const handleDiscardChanges = () => {
    setFormHostelName('Pine Crest Residency');
    setFormLocation('42 University Way, North Campus');
    setFormBlocks(['Block A', 'Block B']);
    setFormFloors(4);
    setFormRooms(12);
    setFormBeds(2);
    setFormStatus('Open');
    setFormPhone('+234 802 123 4567');
    setFormRegistrationDate('2026-06-28');
    setFormSubscriptionPaid(true);
    setEditingHostelId(null);
    triggerToast('Form cleared');
  };

  // New Hostel Onboarding Tab Handlers
  const handleAddRegBlock = () => {
    if (!tempBlockName.trim()) {
      triggerToast('Please provide a block name');
      return;
    }
    if (tempFloors <= 0) {
      triggerToast('Total floors must be 1 or more');
      return;
    }
    if (tempRooms <= 0) {
      triggerToast('Total rooms must be 1 or more');
      return;
    }

    const newBlock = {
      id: `block-${Date.now()}`,
      name: tempBlockName.trim(),
      floors: Number(tempFloors),
      totalRooms: Number(tempRooms),
      roomPrefix: tempPrefix.trim() || 'RM',
      startNum: Number(tempStartNum) || 1
    };

    setRegBlocks([...regBlocks, newBlock]);
    triggerToast(`Added ${tempBlockName} configuration with ${tempRooms} rooms successfully`);

    // Suggest next block name automatically
    const match = tempBlockName.match(/^(.*?)(\d+)$/);
    if (match) {
      const base = match[1];
      const num = parseInt(match[2], 10);
      setTempBlockName(`${base}${num + 1}`);
    } else {
      setTempBlockName(tempBlockName + ' (Next)');
    }
  };

  const handleRemoveRegBlock = (id: string) => {
    setRegBlocks(prev => prev.filter(b => b.id !== id));
    triggerToast('Removed block configuration');
  };

  const handleRegisterNewHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regHostelName.trim()) {
      triggerToast('Please provide a hostel name');
      return;
    }
    if (!regLocation.trim()) {
      triggerToast('Please provide a physical location/campus address');
      return;
    }
    if (regBlocks.length === 0) {
      triggerToast('Please add at least one block to configure your rooms');
      return;
    }

    // Calculate total capacity
    const totalCapacity = regBlocks.reduce((acc, b) => acc + b.totalRooms, 0);

    // Create a rich description outlining block floor details and sequential range e.g. "NAB1 - NAB200"
    const blockSummaries = regBlocks.map(b => `${b.name} (${b.roomPrefix}${b.startNum} - ${b.roomPrefix}${b.startNum + b.totalRooms - 1})`).join(", ");
    const finalDescription = `${regDescription.trim()} Features ${regBlocks.length} customized onboarded blocks: ${blockSummaries}.`;

    const newHostel: Hostel = {
      id: `hostel-new-${Date.now()}`,
      name: regHostelName,
      location: regLocation,
      wing: regWing,
      status: regStatus,
      bedsLeft: totalCapacity,
      totalCapacity: totalCapacity,
      availableSpaces: totalCapacity,
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
      managerName: regManagerName || 'Kofi Obeng',
      managerPhone: regManagerPhone || '+234 802 123 4567',
      managerEmail: regManagerEmail || 'kofi.obeng@pinevela.com',
      description: finalDescription,
      registrationDate: new Date().toISOString().split('T')[0],
      subscriptionPaid: true
    };

    try {
      await onUpdateHostels([newHostel, ...hostels]);
      triggerToast(`Hostel "${regHostelName}" successfully registered!`);
      
      // Reset form fields
      setRegHostelName('');
      setRegLocation('');
      setRegWing('North Wing');
      setRegDescription('Premium newly registered block offering high-standard student accommodation facilities.');
      setRegBlocks([{ id: '1', name: 'NAB Block 1', floors: 4, totalRooms: 200, roomPrefix: 'NAB', startNum: 1 }]);
      
      // Navigate to dashboard
      setActiveTab('dashboard');
    } catch (err: any) {
      triggerToast(`Error registering hostel: ${err.message}`);
    }
  };

  // Derived metrics for portfolio summary on Page 9
  const liveTotalRoomCount = formBlocks.length * formFloors * formRooms;
  const liveTotalBedCapacity = liveTotalRoomCount * formBeds;

  // Registered Hostels is now dynamic and linked directly to the live hostels state!
  const selectedManagerHostel = hostels.find(h => h.id === selectedManagerHostelId) || hostels[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-950 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-2xl z-50">
          <span>✓ </span>
          {toastMessage}
        </div>
      )}

      {/* Global Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-3 sticky top-0 z-30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="cursor-pointer flex items-center gap-2" onClick={() => onNavigate('manager-dashboard')}>
          <PineLogo />
          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded border border-blue-200">System Admin Portal</span>
        </div>

        {/* Global Search */}
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search for hostels or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => triggerToast('System metrics are up to date.')} className="p-1.5 bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg relative transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>

          {/* Admin profile summary info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                alt="System Owner"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left text-xs hidden sm:block">
              <p className="font-extrabold text-slate-900">Kofi Obeng</p>
              <p className="text-slate-400 text-[10px]">System Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container workspace */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Manager Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-slate-900 text-slate-400 p-4 flex flex-col justify-between gap-6">
          <nav className="space-y-1">
            <button
              onClick={() => {
                onNavigate('manager-dashboard');
                setActiveTab('dashboard');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                onNavigate('manager-configure');
                setActiveTab('configure');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'configure'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Building size={16} />
              <span>Manage Hostels</span>
            </button>

             <button
              onClick={() => {
                onNavigate('manager-configure'); // triggers right routing
                setActiveTab('register');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'register'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Plus size={16} />
              <span>Register Hostel</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all text-left ${
                activeTab === 'settings'
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={16} />
              <span>Settings</span>
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

        {/* Content Pane */}
        {activeTab === 'dashboard' ? (
          /* PAGE 8: MANAGER DASHBOARD OVERVIEW */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
            
            {/* Dashboard Header Title Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Administrator Owner Dashboard</h1>
                <p className="text-xs text-slate-500">Overview for Kofi Obeng • System Administrator</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => triggerToast('Opening filter controls...')} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 flex items-center gap-1.5 hover:bg-slate-50">
                  <Filter size={14} />
                  <span>Filter Views</span>
                </button>
                <button onClick={() => onNavigate('manager-configure')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5">
                  <Plus size={14} />
                  <span>Manage Portfolio</span>
                </button>
              </div>
            </div>

            {/* Key Metrics Dashboard Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              
              {/* Metric 1 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-4 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Live
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Hostels</span>
                <span className="text-2xl font-black text-slate-800 block">{hostels.length}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Properties under admin</span>
              </div>

              {/* Metric 2 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Beds</span>
                <span className="text-2xl font-black text-slate-800 block">
                  {hostels.reduce((acc, h) => acc + h.totalCapacity, 0)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Across all blocks</span>
              </div>

              {/* Metric 3 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-4 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Vacancy
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Beds</span>
                <span className="text-2xl font-black text-slate-800 block">
                  {hostels.reduce((acc, h) => acc + (h.bedsLeft || 0), 0)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Spaces free currently</span>
              </div>

              {/* Metric 4 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 shadow-sm relative overflow-hidden">
                <div className="absolute top-4 right-4 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Monthly Rate
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Subscriptions</span>
                <span className="text-2xl font-black text-slate-800 block">
                  {hostels.length > 0 
                    ? Math.round((hostels.filter(h => h.subscriptionPaid).length / hostels.length) * 100) 
                    : 0}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {hostels.filter(h => h.subscriptionPaid).length} of {hostels.length} paid
                </span>
              </div>

            </div>

            {/* Middle Section: Registered Hostels vs. Selected Hostel Details */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
              
              {/* Registered Hostels quick switcher list */}
              <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Registered Hostels</h3>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{hostels.length} Properties</span>
                  </div>

                  {/* List container */}
                  <div className="space-y-3 pt-3">
                    {hostels.map((h) => {
                      const isSelected = h.id === selectedManagerHostelId;
                      const isFull = h.status === 'Full';
                      const isMaintenance = h.status === 'Under Maintenance';
                      
                      let badgeColor = 'bg-emerald-100 text-emerald-800';
                      if (isFull) badgeColor = 'bg-rose-100 text-rose-800';
                      else if (isMaintenance) badgeColor = 'bg-amber-100 text-amber-800';

                      return (
                        <div
                          key={h.id}
                          onClick={() => setSelectedManagerHostelId(h.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                            isSelected
                              ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                              <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 text-xs">
                              <p className="font-black text-slate-800 truncate">{h.name}</p>
                              <p className="text-slate-400 text-[10px] mt-0.5 flex items-center gap-0.5">
                                <MapPin size={10} />
                                <span className="truncate">{h.location}</span>
                              </p>
                              <p className="text-slate-500 font-bold text-[9px] mt-1 uppercase tracking-wider">
                                {h.bedsLeft} / {h.totalCapacity} beds free
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
                              {h.status}
                            </span>
                            <ChevronRight size={14} className="text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('manager-configure')}
                  className="w-full mt-4 py-2 border border-dashed border-slate-200 hover:border-blue-900 rounded-xl text-center text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors"
                >
                  Configure Hostels
                </button>
              </div>

              {/* Selected Hostel Detail Pane */}
              <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 space-y-6 shadow-sm">
                
                {/* Header card with name & controls */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-150">
                      <img src={selectedManagerHostel.image} alt={selectedManagerHostel.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">{selectedManagerHostel.name}</h2>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase px-2 py-0.5 rounded">
                          {selectedManagerHostel.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-0.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{selectedManagerHostel.location}</span>
                      </p>
                    </div>
                  </div>

                  <button onClick={() => triggerToast('Options menu')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>

                {/* Occupancy Trend & Chart Simulator */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 flex items-center gap-1">
                      <TrendingUp size={14} className="text-emerald-500" />
                      Occupancy Trend
                    </span>
                    <span className="text-emerald-600">92% Average</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Weekly fill-rate percentage across all blocks.</p>

                  {/* Simulated spark chart */}
                  <div className="h-28 w-full bg-amber-50/50 rounded-xl border border-amber-100/40 p-4 flex flex-col justify-between">
                    {/* Visual waveform peaks */}
                    <div className="flex items-end justify-between h-14 px-2">
                      <div className="w-5 bg-amber-300 rounded-t-md h-[78%]"></div>
                      <div className="w-5 bg-amber-300 rounded-t-md h-[82%]"></div>
                      <div className="w-5 bg-amber-400/90 rounded-t-md h-[90%]"></div>
                      <div className="w-5 bg-amber-300 rounded-t-md h-[88%]"></div>
                      <div className="w-5 bg-amber-300 rounded-t-md h-[84%]"></div>
                      <div className="w-5 bg-amber-400 rounded-t-md h-[92%]"></div>
                      <div className="w-5 bg-amber-500 rounded-t-md h-[95%]"></div>
                    </div>
                    {/* Days indicator */}
                    <div className="flex justify-between text-[8px] font-mono font-bold text-slate-400 uppercase pt-2 border-t border-amber-100/40">
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>

                {/* Hostel Subscription Details */}
                <div className="space-y-4 border-t border-slate-100 pt-4 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
                      <span>💳</span> Subscription Details
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      ID: {selectedManagerHostel?.id}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registration Date</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">
                        {selectedManagerHostel?.registrationDate || '2026-01-15'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan Term</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">Monthly Billing</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount Due</p>
                      <p className="font-extrabold text-slate-800 mt-0.5">₵1,500.00 / mo</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subscription Status</p>
                      <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-1 ${
                        selectedManagerHostel?.subscriptionPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {selectedManagerHostel?.subscriptionPaid ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedManagerHostel) return;
                        const isPaid = selectedManagerHostel.subscriptionPaid ?? true;
                        const updated = hostels.map(h => h.id === selectedManagerHostel.id ? {
                          ...h,
                          subscriptionPaid: !isPaid
                        } : h);
                        onUpdateHostels(updated);
                        triggerToast(`${selectedManagerHostel.name} subscription toggled to ${!isPaid ? 'PAID' : 'UNPAID'}!`);
                      }}
                      className="flex-1 py-2 bg-blue-900 hover:bg-blue-850 text-white font-extrabold text-xs rounded-xl transition-all shadow-md text-center"
                    >
                      Toggle Payment Status
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerToast(`Generated monthly receipt for ${selectedManagerHostel?.name}`)}
                      className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Receipt
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Row grid: Recent Bookings & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Hostel Subscriptions & Registration Status */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Hostel Subscriptions</h3>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">Monthly Billings</span>
                  </div>

                  <div className="space-y-3 pt-3 overflow-y-auto max-h-[360px] pr-1">
                    {hostels.map((h) => {
                      const isPaid = h.subscriptionPaid ?? true;
                      return (
                        <div key={h.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3 text-xs hover:bg-slate-100/50 transition-all">
                          <div className="min-w-0 flex items-center gap-2.5">
                            <span className="text-xl shrink-0">🏢</span>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 truncate">{h.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="shrink-0">Reg: {h.registrationDate || '2026-01-15'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="truncate">{h.location}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const updated = hostels.map(item => item.id === h.id ? {
                                  ...item,
                                  subscriptionPaid: !isPaid
                                } : item);
                                onUpdateHostels(updated);
                                triggerToast(`${h.name} subscription status updated!`);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-center flex items-center justify-between text-xs text-slate-500">
                  <span>Average fee: ₵1,500/mo</span>
                  <button onClick={() => triggerToast('Subscription reconciliation report exported to admin email.')} className="font-bold text-blue-900 hover:underline">
                    Export billing sheet
                  </button>
                </div>
              </div>

              {/* Portfolio Activity Feed */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Portfolio Activity</h3>
                  <span className="text-[10px] text-slate-400">⏱️ Live</span>
                </div>

                <div className="space-y-4 pt-3 text-xs">
                  {localActivities.map((act) => {
                    let indicator = 'bg-slate-300';
                    if (act.type === 'success') indicator = 'bg-emerald-400';
                    else if (act.type === 'warning') indicator = 'bg-amber-400';
                    else if (act.type === 'danger') indicator = 'bg-red-400';

                    return (
                      <div key={act.id} className="flex gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${indicator}`} />
                        <div className="flex-1 space-y-0.5">
                          <p className="font-semibold text-slate-700 leading-relaxed">{act.text}</p>
                          <p className="text-[10px] text-slate-400">{act.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </main>
        ) : activeTab === 'configure' ? (
          /* PAGE 9: MANAGE HOSTELS CONFIGURATION */
          <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
            
            {/* Title block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="text-left">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Hostels</h1>
                <p className="text-xs text-slate-500">Add new properties or modify existing accommodation blocks.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={handleSaveProperty}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/10 transition-colors"
                >
                  {editingHostelId ? 'Save Edits' : 'Save Property'}
                </button>
              </div>
            </div>

            {/* Layout Grid: Left Form, Right Sidebar Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
              
              {/* Form panel */}
              <form onSubmit={handleSaveProperty} className="xl:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 md:p-8 space-y-6 shadow-sm">
                
                <h3 className="font-extrabold text-slate-900 text-sm pb-2 border-b border-slate-100 uppercase tracking-wider">
                  Hostel Configuration
                </h3>

                {/* Section 1: Basic Details */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Basic Details</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Hostel Name</label>
                      <input
                        type="text"
                        required
                        value={formHostelName}
                        onChange={(e) => setFormHostelName(e.target.value)}
                        placeholder="Pine Crest Residency"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Location / Address</label>
                      <input
                        type="text"
                        required
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        placeholder="42 University Way, North Campus"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Capacity & Structure */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Capacity & Structure</p>
                  
                  {/* Blocks Pills manager */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Property Blocks</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {formBlocks.map((blk, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-sm">
                          <span>{blk}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(idx)}
                            className="text-slate-400 hover:text-red-600 text-sm font-semibold transition-colors shrink-0"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Add block trigger */}
                      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200 shrink-0">
                        <input
                          type="text"
                          value={formNewBlockName}
                          onChange={(e) => setFormNewBlockName(e.target.value)}
                          placeholder="Block C"
                          className="w-16 bg-white outline-none text-xs px-1.5 py-0.5 border border-slate-150 rounded"
                        />
                        <button
                          type="button"
                          onClick={handleAddBlock}
                          className="p-1 bg-blue-900 text-white rounded text-[10px] font-bold"
                        >
                          + Add Block
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Floors per Block</label>
                      <input
                        type="number"
                        required
                        value={formFloors}
                        onChange={(e) => setFormFloors(parseInt(e.target.value) || 0)}
                        placeholder="4"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Rooms per Floor</label>
                      <input
                        type="number"
                        required
                        value={formRooms}
                        onChange={(e) => setFormRooms(parseInt(e.target.value) || 0)}
                        placeholder="12"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Beds per Room</label>
                      <input
                        type="number"
                        required
                        value={formBeds}
                        onChange={(e) => setFormBeds(parseInt(e.target.value) || 0)}
                        placeholder="2"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Operational Status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      >
                        <option value="Open">Open (Active)</option>
                        <option value="Full">Full</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Section 3: Media & Contact */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Media & Contact</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Manager Contact</label>
                      <input
                        type="text"
                        required
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="+234 802 123 4567"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Hostel Images</label>
                      <div
                        onClick={() => triggerToast('Select a photo from system')}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-900 cursor-pointer transition-colors bg-slate-50 flex flex-col items-center justify-center gap-1"
                      >
                        <Plus className="text-slate-400" size={18} />
                        <span className="text-[10px] font-bold text-slate-600 block">Click to upload or drag and drop</span>
                        <span className="text-[8px] text-slate-400 block">PNG, JPG or WEBP (Max 5MB)</span>
                      </div>
                    </div>
                  </div>
                </div>

              </form>

              {/* Right Summary Panel inside form workspace */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Live Summary Card */}
                <div className="bg-amber-500 rounded-2xl p-6 text-slate-950 space-y-5 text-left shadow shadow-amber-500/10">
                  <h3 className="font-black text-sm tracking-tight uppercase flex items-center gap-1.5">
                    <Layers size={16} />
                    <span>Live Summary</span>
                  </h3>

                  <div className="space-y-3 font-semibold text-xs">
                    <div className="bg-white/80 rounded-xl p-3 border border-white/20">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Bed Capacity</span>
                      <span className="text-xl font-black text-slate-950 block mt-0.5">{liveTotalBedCapacity}</span>
                    </div>

                    <div className="bg-white/80 rounded-xl p-3 border border-white/20">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Room Count</span>
                      <span className="text-xl font-black text-slate-950 block mt-0.5">{liveTotalRoomCount}</span>
                    </div>

                    <div className="bg-white/80 rounded-xl p-3 border border-white/20">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Occupancy</span>
                      <span className="text-xl font-black text-slate-950 block mt-0.5">0%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-800 leading-relaxed italic">
                    *Summary updates automatically based on structural changes in the form. Current configuration estimates {liveTotalBedCapacity} available spaces upon opening.
                  </p>

                  <button
                    type="button"
                    onClick={() => triggerToast('Occupancy projection model activated!')}
                    className="w-full text-center py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 rounded-xl text-xs font-bold transition-all shadow"
                  >
                    Review occupancy projection →
                  </button>
                </div>

                {/* Configuration Tip */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-left space-y-2 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1">
                    <AlertCircle size={14} className="text-blue-900" />
                    <span>Configuration Tip</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Standardizing room sizes across blocks helps in faster bed space allocation and management reporting.
                  </p>
                </div>

              </div>

            </div>

            {/* Bottom Row Section: Existing Hostels Portfolio Table list */}
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Existing Hostels Portfolio</h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {hostels.length} Total Properties
                </span>
              </div>

              {/* Table list */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Hostel Property</th>
                        <th className="px-6 py-3.5">Location</th>
                        <th className="px-6 py-3.5">Capacity</th>
                        <th className="px-6 py-3.5">Current Status</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hostels.map((h) => {
                        const isSelected = h.id === editingHostelId;
                        let badgeColor = 'bg-emerald-100 text-emerald-800';
                        if (h.status === 'Full') badgeColor = 'bg-rose-100 text-rose-800';
                        else if (h.status === 'Under Maintenance') badgeColor = 'bg-amber-100 text-amber-800';

                        return (
                          <tr key={h.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-amber-50/40 font-semibold' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">🏢</span>
                                <div>
                                  <p className="font-extrabold text-slate-900">{h.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">2 Blocks • 96 Rooms</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {h.location}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">
                              {h.totalCapacity} Beds
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${badgeColor}`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleLoadHostelForEdit(h)}
                                  className="py-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Edit2 size={11} />
                                  <span>Edit</span>
                                </button>
                                <button onClick={() => triggerToast('Options menu launched')} className="p-1 hover:bg-slate-100 rounded text-slate-400">
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </main>
        ) : activeTab === 'register' ? (
          /* PAGE: REGISTER NEW HOSTEL WITH DYNAMIC BLOCKS */
          <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
            
            {/* Title Block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="text-left">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Onboard & Register Hostel</h1>
                <p className="text-xs text-slate-500">Configure real sequential room naming, blocks layout, and capacities.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    triggerToast('Registration cancelled');
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel Onboarding
                </button>
                <button
                  type="button"
                  onClick={handleRegisterNewHostel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg transition-colors"
                >
                  Complete Registration
                </button>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
              
              {/* Form Panel */}
              <div className="xl:col-span-8 space-y-6">
                
                {/* Section 1: Hostel Basic Details */}
                <form onSubmit={handleRegisterNewHostel} className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 space-y-6 shadow-sm">
                  <h3 className="font-extrabold text-slate-900 text-sm pb-2 border-b border-slate-100 uppercase tracking-wider">
                    Hostel Parameters
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Hostel Name</label>
                      <input
                        type="text"
                        required
                        value={regHostelName}
                        onChange={(e) => setRegHostelName(e.target.value)}
                        placeholder="e.g. Pine Crest NAB Complex"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Physical Location</label>
                      <input
                        type="text"
                        required
                        value={regLocation}
                        onChange={(e) => setRegLocation(e.target.value)}
                        placeholder="e.g. East Gate, Sector 3 Campus"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Wing / Location Sector</label>
                      <select
                        value={regWing}
                        onChange={(e: any) => setRegWing(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800 bg-white"
                      >
                        <option value="North Wing">North Wing</option>
                        <option value="South Side">South Side</option>
                        <option value="East Side">East Side</option>
                        <option value="West Campus">West Campus</option>
                        <option value="Other">Other Sector</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Operational Status</label>
                      <select
                        value={regStatus}
                        onChange={(e: any) => setRegStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800 bg-white"
                      >
                        <option value="Open">Open (Accepting Bookings)</option>
                        <option value="Full">Full</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Public Description</label>
                    <textarea
                      rows={3}
                      value={regDescription}
                      onChange={(e) => setRegDescription(e.target.value)}
                      placeholder="Write a clear public description of services and location pros..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Designated Manager</label>
                      <input
                        type="text"
                        value={regManagerName}
                        onChange={(e) => setRegManagerName(e.target.value)}
                        placeholder="Manager full name"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Manager Contact Phone</label>
                      <input
                        type="text"
                        value={regManagerPhone}
                        onChange={(e) => setRegManagerPhone(e.target.value)}
                        placeholder="+234..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Manager Email</label>
                      <input
                        type="email"
                        value={regManagerEmail}
                        onChange={(e) => setRegManagerEmail(e.target.value)}
                        placeholder="manager@pinevela.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </form>

                {/* Section 2: Dynamic Blocks & Room Generation */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 space-y-6 shadow-sm text-left">
                  <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                        Blocks Layout & Sequential Room Onboarding
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Specify blocks, rooms, floors and sequence naming rules (e.g. NAB1 to NAB200).</p>
                    </div>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded self-start sm:self-auto">
                      {regBlocks.length} Block(s) Configured
                    </span>
                  </div>

                  {/* Add Block Form Block */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Block Name</label>
                      <input
                        type="text"
                        value={tempBlockName}
                        onChange={(e) => setTempBlockName(e.target.value)}
                        placeholder="e.g. NAB Block 1"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Floors / Block</label>
                      <input
                        type="number"
                        min="1"
                        value={tempFloors}
                        onChange={(e) => setTempFloors(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Total Rooms</label>
                      <input
                        type="number"
                        min="1"
                        value={tempRooms}
                        onChange={(e) => setTempRooms(Number(e.target.value))}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Prefix</label>
                        <input
                          type="text"
                          value={tempPrefix}
                          onChange={(e) => setTempPrefix(e.target.value)}
                          placeholder="NAB"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Start #</label>
                        <input
                          type="number"
                          min="1"
                          value={tempStartNum}
                          onChange={(e) => setTempStartNum(Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleAddRegBlock}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus size={12} />
                        <span>Add Block</span>
                      </button>
                    </div>
                  </div>

                  {/* Configured Blocks Table */}
                  <div className="space-y-3 text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Blocks Layout</p>
                    
                    {regBlocks.length === 0 ? (
                      <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-xs">No blocks added yet. Add a block above to set up capacity.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {regBlocks.map((block) => {
                          const start = block.startNum;
                          const end = start + block.totalRooms - 1;
                          return (
                            <div key={block.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                              <div className="space-y-1 text-left">
                                <p className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                                  <span>🏢</span>
                                  <span>{block.name}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                                  <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded">Floors: {block.floors}</span>
                                  <span className="font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Rooms Count: {block.totalRooms}</span>
                                  <span className="font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                    Range: {block.roomPrefix}{start} - {block.roomPrefix}{end}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRegBlock(block.id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 self-end sm:self-auto"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Live Preview Sidebar Panel */}
              <div className="xl:col-span-4 space-y-6">
                
                {/* Total Capacity Summary Widget */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-sm text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onboarding Portfolio Analysis</p>
                  
                  <div className="space-y-2">
                    <p className="text-3xl font-black tracking-tight text-amber-400 text-left">
                      {regBlocks.reduce((acc, b) => acc + b.totalRooms, 0)} Beds
                    </p>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      This calculation is derived sequentially from all active block layouts defined on the left.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-left">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Total Blocks</p>
                      <p className="text-sm font-extrabold text-white mt-0.5">{regBlocks.length}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Unique Rooms</p>
                      <p className="text-sm font-extrabold text-white mt-0.5">
                        {regBlocks.reduce((acc, b) => acc + b.totalRooms, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real Sequence Naming Live Visualizer */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm text-left">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Sequential Room Names Visualizer</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Live previews of exactly how sequential names look inside each block</p>
                  </div>

                  {regBlocks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No room structures defined yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto text-left">
                      {regBlocks.map((block) => {
                        const roomSampleList = [];
                        const maxSample = Math.min(block.totalRooms, 15);
                        for (let i = 0; i < maxSample; i++) {
                          roomSampleList.push(`${block.roomPrefix}${block.startNum + i}`);
                        }

                        return (
                          <div key={block.id} className="space-y-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                            <p className="text-[11px] font-extrabold text-slate-800 flex items-center justify-between">
                              <span>📂 {block.name} Rooms</span>
                              <span className="text-[9px] text-slate-400">({block.totalRooms} total)</span>
                            </p>

                            <div className="flex flex-wrap gap-1">
                              {roomSampleList.map((roomName, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-50 text-slate-700 border border-slate-100 rounded"
                                >
                                  {roomName}
                                </span>
                              ))}
                              {block.totalRooms > maxSample && (
                                <span className="text-[9px] font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  + {block.totalRooms - maxSample} more rooms (up to {block.roomPrefix}{block.startNum + block.totalRooms - 1})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </main>
        ) : (
          /* NEW: SYSTEM SETTINGS VIEW */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            <div className="pb-4 border-b border-slate-100">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
              <p className="text-xs text-slate-500">Configure global platform constants, billing thresholds, and database states.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Billing Config */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span>💳</span> Billing & Subscriptions
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Monthly Hostel Subscription Fee (GHS / USD)</label>
                    <input type="text" defaultValue="₵1,500.00" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Grace Period (Days)</label>
                    <input type="number" defaultValue="5" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800" />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" defaultChecked id="autoInvoicing" className="rounded text-blue-900" />
                    <label htmlFor="autoInvoicing" className="font-semibold text-slate-600">Enable automatic monthly invoicing</label>
                  </div>
                </div>
              </div>

              {/* Security & Access */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span>🔒</span> Security & Authentication
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Minimum Password Length (Admin / Manager)</label>
                    <input type="number" defaultValue="8" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800" />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" defaultChecked id="mfaRequire" className="rounded text-blue-900" />
                    <label htmlFor="mfaRequire" className="font-semibold text-slate-600">Require MFA for Manager Accounts</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked id="sessionLimit" className="rounded text-blue-900" />
                    <label htmlFor="sessionLimit" className="font-semibold text-slate-600">Terminate sessions after 2 hours of inactivity</label>
                  </div>
                </div>
              </div>

              {/* Maintenance & SLA */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span>⚙️</span> Notifications & Escalation SLA
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">High Urgency SLA Response Target</label>
                    <select defaultValue="12" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800">
                      <option value="4">4 Hours</option>
                      <option value="12">12 Hours</option>
                      <option value="24">24 Hours</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked id="smsNotif" className="rounded text-blue-900" />
                    <label htmlFor="smsNotif" className="font-semibold text-slate-600">Send SMS warnings to managers for unpaid subscriptions</label>
                  </div>
                </div>
              </div>

              {/* Data & Backup */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span>💾</span> System Backups & Logs
                </h3>
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 leading-relaxed">
                    Automated nightly database backups are running successfully. Next backup scheduled in 8 hours.
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => triggerToast('Initiating standard backup export...')} className="px-3 py-1.5 bg-blue-900 hover:bg-blue-850 text-white font-bold rounded-lg transition-colors text-[10px]">
                      Trigger Manual Backup
                    </button>
                    <button type="button" onClick={() => triggerToast('Clearing development log caches...')} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors text-[10px]">
                      Clear System Logs
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="bg-blue-950 p-6 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-black text-sm">Save Global Config changes?</p>
                <p className="text-[10px] text-blue-200 mt-1">Changes are immediately replicated across all managers and tenant portals.</p>
              </div>
              <button type="button" onClick={() => triggerToast('System configuration saved successfully!')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-650 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg transition-colors shrink-0">
                Save System Settings
              </button>
            </div>
          </main>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-[10px] text-slate-400 mt-auto">
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
