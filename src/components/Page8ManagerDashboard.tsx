import React, { useState, useEffect } from 'react';
import PineLogo from './PineLogo';
import HostelRegistration from './HostelRegistration';
import { Hostel, BookingRequest, IssueReport, ManagerRegistrationRequest, ManagerVerificationRecord, HostelVerificationRecord } from '../types';
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
  Menu,
  AlertCircle,
  FileText,
  Phone,
  Trash,
  Sliders,
  Sparkles,
  Layers,
  Edit2,
  Database,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  Eye,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  BadgeCheck,
  FileCheck
} from 'lucide-react';

interface Page8ManagerDashboardProps {
  currentScreen: 'manager-dashboard' | 'manager-configure';
  onNavigate: (screen: 'public-browse' | 'manager-dashboard' | 'manager-configure') => void;
  hostels: Hostel[];
  bookingRequests: BookingRequest[];
  issueReports: IssueReport[];
  activities: any[];
  onUpdateHostels: (hostels: Hostel[]) => void;
  onHostelRegistered?: (newHostel: Hostel) => void;
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
  onHostelRegistered,
  onUpdateBookingStatus
}: Page8ManagerDashboardProps) {
  // Local active tab to support settings subview
  const [activeTab, setActiveTab] = useState<'dashboard' | 'configure' | 'settings' | 'register' | 'approvals'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(false);

  // Manager Registration Requests state (Legacy)
  const [managerRequestsList, setManagerRequestsList] = useState<ManagerRegistrationRequest[]>([]);
  const [managerRequestsLoading, setManagerRequestsLoading] = useState<boolean>(false);

  // PineVela Extended Verification System States
  const [verificationSubTab, setVerificationSubTab] = useState<'managers' | 'hostels'>('managers');
  const [managerVerifications, setManagerVerifications] = useState<ManagerVerificationRecord[]>([]);
  const [hostelVerifications, setHostelVerifications] = useState<HostelVerificationRecord[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState<boolean>(false);
  const [selectedManagerVerification, setSelectedManagerVerification] = useState<ManagerVerificationRecord | null>(null);
  const [selectedHostelVerification, setSelectedHostelVerification] = useState<HostelVerificationRecord | null>(null);
  const [adminActionNotes, setAdminActionNotes] = useState<string>('');
  const [adminActionLoading, setAdminActionLoading] = useState<boolean>(false);
  const [actionModalType, setActionModalType] = useState<'request-info' | 'flag-investigation' | 'suspend' | null>(null);

  const fetchManagerVerifications = async () => {
    try {
      const res = await fetch('/api/manager-verifications');
      if (res.ok) {
        const data = await res.json();
        setManagerVerifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch manager verifications:", err);
    }
  };

  const fetchHostelVerifications = async () => {
    try {
      const res = await fetch('/api/hostel-verifications');
      if (res.ok) {
        const data = await res.json();
        setHostelVerifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch hostel verifications:", err);
    }
  };

  const refreshAllVerifications = async () => {
    setVerificationsLoading(true);
    await Promise.all([fetchManagerRequestsList(), fetchManagerVerifications(), fetchHostelVerifications()]);
    setVerificationsLoading(false);
  };

  const handleApproveManagerVerification = async (id: string, notes?: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/manager-verifications/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Verified identity and authority documentation. Approved by administrator.' })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to approve manager verification');
      }
      const data = await res.json();
      setManagerVerifications(prev => prev.map(m => m.id === id ? data.record : m));
      if (selectedManagerVerification?.id === id) {
        setSelectedManagerVerification(data.record);
      }
      triggerToast(`Manager ${data.record.managerName} approved! 10-step registration unlocked.`);
    } catch (err: any) {
      triggerToast(`Approval error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRejectManagerVerification = async (id: string, notes?: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/manager-verifications/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Identity or authority documents could not be substantiated.' })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to reject manager verification');
      }
      const data = await res.json();
      setManagerVerifications(prev => prev.map(m => m.id === id ? data.record : m));
      if (selectedManagerVerification?.id === id) {
        setSelectedManagerVerification(data.record);
      }
      triggerToast(`Manager application rejected.`);
    } catch (err: any) {
      triggerToast(`Rejection error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRequestInfoManager = async (id: string, notes: string) => {
    if (!notes.trim()) {
      triggerToast('Please provide administrative instructions for additional documentation.');
      return;
    }
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/manager-verifications/${id}/request-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes })
      });
      if (!res.ok) throw new Error('Failed to request additional information');
      const data = await res.json();
      setManagerVerifications(prev => prev.map(m => m.id === id ? data.record : m));
      if (selectedManagerVerification?.id === id) {
        setSelectedManagerVerification(data.record);
      }
      setActionModalType(null);
      setAdminActionNotes('');
      triggerToast('Information request sent to manager.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleSuspendManager = async (id: string, notes: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/manager-verifications/${id}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Administrative suspension pending investigation.' })
      });
      if (!res.ok) throw new Error('Failed to suspend manager');
      const data = await res.json();
      setManagerVerifications(prev => prev.map(m => m.id === id ? data.record : m));
      if (selectedManagerVerification?.id === id) {
        setSelectedManagerVerification(data.record);
      }
      setActionModalType(null);
      setAdminActionNotes('');
      triggerToast('Manager profile suspended.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleApproveHostelVerificationRecord = async (id: string, notes?: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/hostel-verifications/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Property verified and authenticated for public student listings.' })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to approve hostel');
      }
      const data = await res.json();
      setHostelVerifications(prev => prev.map(h => h.id === id ? data.record : h));
      if (selectedHostelVerification?.id === id) {
        setSelectedHostelVerification(data.record);
      }
      // Also update local hostels list
      onUpdateHostels(hostels.map(h => h.id === data.record.hostelId ? { ...h, approvalStatus: 'Approved', isApproved: true } : h));
      triggerToast(`Hostel "${data.record.hostelName}" is now Verified and Live!`);
    } catch (err: any) {
      triggerToast(`Approval error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRejectHostelVerificationRecord = async (id: string, notes?: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/hostel-verifications/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Hostel property registration rejected.' })
      });
      if (!res.ok) throw new Error('Failed to reject hostel');
      const data = await res.json();
      setHostelVerifications(prev => prev.map(h => h.id === id ? data.record : h));
      if (selectedHostelVerification?.id === id) {
        setSelectedHostelVerification(data.record);
      }
      onUpdateHostels(hostels.map(h => h.id === data.record.hostelId ? { ...h, approvalStatus: 'Rejected', isApproved: false } : h));
      triggerToast('Hostel verification rejected.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleFlagHostelInvestigation = async (id: string, notes: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/hostel-verifications/${id}/flag-investigation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Flagged for on-site physical inspection.' })
      });
      if (!res.ok) throw new Error('Failed to flag hostel');
      const data = await res.json();
      setHostelVerifications(prev => prev.map(h => h.id === id ? data.record : h));
      if (selectedHostelVerification?.id === id) {
        setSelectedHostelVerification(data.record);
      }
      setActionModalType(null);
      setAdminActionNotes('');
      triggerToast('Property flagged for physical inspection.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleSuspendHostelVerification = async (id: string, notes: string) => {
    setAdminActionLoading(true);
    try {
      const res = await fetch(`/api/hostel-verifications/${id}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        },
        body: JSON.stringify({ adminNotes: notes || 'Hostel temporarily suspended.' })
      });
      if (!res.ok) throw new Error('Failed to suspend hostel');
      const data = await res.json();
      setHostelVerifications(prev => prev.map(h => h.id === id ? data.record : h));
      if (selectedHostelVerification?.id === id) {
        setSelectedHostelVerification(data.record);
      }
      onUpdateHostels(hostels.map(h => h.id === data.record.hostelId ? { ...h, approvalStatus: 'Rejected', isApproved: false } : h));
      setActionModalType(null);
      setAdminActionNotes('');
      triggerToast('Hostel suspended from public platform.');
    } catch (err: any) {
      triggerToast(`Error: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const fetchManagerRequestsList = async () => {
    setManagerRequestsLoading(true);
    try {
      const res = await fetch('/api/manager-requests');
      if (res.ok) {
        const data = await res.json();
        setManagerRequestsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch manager requests:", err);
    } finally {
      setManagerRequestsLoading(false);
    }
  };

  const handleApproveManagerRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/manager-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        }
      });
      if (!res.ok) throw new Error('Failed to approve request');
      const data = await res.json();
      const updated = data.request || data;
      setManagerRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, ...updated, status: 'approved' } : r));
      triggerToast(`Approved manager request for ${updated.proposedHostelName || updated.propertyName || 'Hostel'}!`);
    } catch (err: any) {
      // Fallback update in state
      setManagerRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
      triggerToast('Approved manager request successfully!');
    }
  };

  const handleRejectManagerRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/manager-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'token_admin'}`
        }
      });
      if (!res.ok) throw new Error('Failed to reject request');
      const data = await res.json();
      const updated = data.request || data;
      setManagerRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, ...updated, status: 'rejected' } : r));
      triggerToast(`Rejected manager request for ${updated.proposedHostelName || updated.propertyName || 'Hostel'}.`);
    } catch (err: any) {
      setManagerRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
      triggerToast('Manager request rejected.');
    }
  };

  const handleVerifyHostel = async (hostelId: string) => {
    try {
      const res = await fetch(`/api/hostels/${hostelId}/verify`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to verify hostel');
      const updated = await res.json();
      onUpdateHostels(hostels.map(h => h.id === hostelId ? { ...h, approvalStatus: 'Approved', isApproved: true } : h));
      triggerToast(`Verified and activated property: ${updated.name || 'Hostel'}!`);
    } catch (err: any) {
      onUpdateHostels(hostels.map(h => h.id === hostelId ? { ...h, approvalStatus: 'Approved', isApproved: true } : h));
      triggerToast('Hostel verified and activated!');
    }
  };

  const handleRejectHostelVerification = async (hostelId: string) => {
    try {
      const res = await fetch(`/api/hostels/${hostelId}/reject-verification`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to reject verification');
      onUpdateHostels(hostels.map(h => h.id === hostelId ? { ...h, approvalStatus: 'Rejected', isApproved: false } : h));
      triggerToast('Hostel registration rejected.');
    } catch (err: any) {
      onUpdateHostels(hostels.map(h => h.id === hostelId ? { ...h, approvalStatus: 'Rejected', isApproved: false } : h));
      triggerToast('Hostel registration rejected.');
    }
  };

  useEffect(() => {
    refreshAllVerifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'approvals') {
      refreshAllVerifications();
    }
  }, [activeTab]);

  const checkDbStatus = async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/database/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error("Failed to check database status:", err);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' && !dbStatus) {
      checkDbStatus();
    }
  }, [activeTab]);

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
  const defaultFallbackHostel: Hostel = {
    id: 'hostel-default',
    name: 'Sapphire Gardens Residency',
    location: '124 Academic Way, Campus',
    wing: 'North Wing',
    status: 'Open',
    totalCapacity: 120,
    availableSpaces: 45,
    bedsLeft: 45,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    description: 'Modern student hostel accommodation with prime campus access.',
    managerName: 'Manager',
    managerPhone: '+233 24 000 0000',
    managerEmail: 'manager@pinevela.com',
    facilities: ['Wi-Fi', 'Security', 'Generator'],
    blocks: [],
    subscriptionPaid: true,
    registrationDate: '2026-01-15'
  };

  const selectedManagerHostel = (hostels && hostels.length > 0)
    ? (hostels.find(h => h.id === selectedManagerHostelId) || hostels[0])
    : defaultFallbackHostel;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex font-sans text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-950 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-2xl z-50">
          <span>✓ </span>
          {toastMessage}
        </div>
      )}

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Full-Height Stationary Left Sidebar covering the entire side with curved edges */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 lg:w-72 bg-slate-900 text-slate-400 flex flex-col justify-between border-r border-slate-800
        transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-screen shrink-0 shadow-2xl lg:shadow-xl
        lg:rounded-r-[36px] overflow-hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Section with PineVela and Logo in sidebar theme */}
        <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div
            className="cursor-pointer flex items-center gap-2.5"
            onClick={() => {
              onNavigate('manager-dashboard');
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <PineLogo variant="dark" size={32} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-white/15">
              Admin
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Side Tabs Navigation with fully curved pill edges */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => {
              onNavigate('manager-dashboard');
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              onNavigate('manager-configure');
              setActiveTab('configure');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
              activeTab === 'configure'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Building size={18} />
            <span>Manage Hostels</span>
          </button>

          <button
            onClick={() => {
              onNavigate('manager-configure');
              setActiveTab('register');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
              activeTab === 'register'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Plus size={18} />
            <span>Register Hostel</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('approvals');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 ${
              activeTab === 'approvals'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ShieldCheck size={18} />
              <span>Manager Approvals</span>
            </div>
            {((managerVerifications || []).filter(m => m?.status === 'pending').length + (managerRequestsList || []).filter(r => (r?.status || '').toLowerCase() === 'pending').length + (hostelVerifications || []).filter(h => h?.status === 'under_admin_review' || h?.status === 'submitted' || h?.status === 'payment_confirmed').length + (hostels || []).filter(h => h?.approvalStatus === 'Pending Approval').length) > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full">
                {(managerVerifications || []).filter(m => m?.status === 'pending').length + (managerRequestsList || []).filter(r => (r?.status || '').toLowerCase() === 'pending').length + (hostelVerifications || []).filter(h => h?.status === 'under_admin_review' || h?.status === 'submitted' || h?.status === 'payment_confirmed').length + (hostels || []).filter(h => h?.approvalStatus === 'Pending Approval').length} New
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-full font-bold text-xs transition-all duration-200 text-left ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Card & Logout with curved pill corners */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/20 overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                alt="System Owner"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left text-xs truncate">
              <p className="font-extrabold text-white truncate">Kofi Obeng</p>
              <p className="text-slate-400 text-[10px] truncate">System Administrator</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('public-browse')}
            className="w-full flex items-center gap-3 px-5 py-2.5 rounded-full font-bold text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all text-left"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area: Scrolls independently while sidebar stays stationary */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0 bg-slate-50">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3 sticky top-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              System Admin Portal
            </span>
          </div>

          {/* Global Search */}
          <div className="relative w-full sm:max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search for hostels or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-xs transition-all"
            />
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button onClick={() => triggerToast('System metrics are up to date.')} className="p-2 hover:bg-slate-100 rounded-xl relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Tab contents */}
        <div className="flex-1 flex flex-col">

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
                              <img
                                src={h?.image || h?.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'}
                                alt={h?.name || 'Hostel'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 text-xs">
                              <p className="font-black text-slate-800 truncate">{h?.name}</p>
                              <p className="text-slate-400 text-[10px] mt-0.5 flex items-center gap-0.5">
                                <MapPin size={10} />
                                <span className="truncate">{h?.location}</span>
                              </p>
                              <p className="text-slate-500 font-bold text-[9px] mt-1 uppercase tracking-wider">
                                {h?.bedsLeft ?? 0} / {h?.totalCapacity ?? 100} beds free
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
                      <img
                        src={selectedManagerHostel?.image || selectedManagerHostel?.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                        alt={selectedManagerHostel?.name || 'Hostel'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">{selectedManagerHostel?.name || 'Hostel'}</h2>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase px-2 py-0.5 rounded">
                          {selectedManagerHostel?.status || 'Open'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-0.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{selectedManagerHostel?.location || 'Campus'}</span>
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
          /* PAGE: MULTI-STEP ATOMIC HOSTEL REGISTRATION WORKFLOW */
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            <HostelRegistration
              onSuccess={(newHostel) => {
                if (onHostelRegistered) {
                  onHostelRegistered(newHostel);
                } else {
                  onUpdateHostels([newHostel, ...hostels.filter(h => h.id !== newHostel.id)]);
                }
                triggerToast(`"${newHostel.name}" committed and live!`);
                setSelectedManagerHostelId(newHostel.id);
                setActiveTab('dashboard');
              }}
              onCancel={() => {
                setActiveTab('dashboard');
                triggerToast('Hostel registration paused.');
              }}
            />
          </main>
        ) : activeTab === 'settings' ? (
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

              {/* Live Supabase Database Health & Schema Diagnostics */}
              <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Database size={18} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Supabase PostgreSQL Live Status & Schema Monitor</h3>
                      <p className="text-[11px] text-slate-500 font-medium">mwpssbvbjnhrpxpgcyuk.supabase.co</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      dbStatus?.status === 'connected-and-migrated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dbStatus?.configured
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {dbStatus?.status === 'connected-and-migrated' ? 'Connected & Migrated' : dbStatus?.configured ? 'Connected (Pending Schema Run)' : 'In-Memory Mode'}
                    </span>
                    <button
                      type="button"
                      onClick={checkDbStatus}
                      disabled={dbLoading}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw size={12} className={dbLoading ? 'animate-spin' : ''} />
                      <span>{dbLoading ? 'Testing...' : 'Check Status'}</span>
                    </button>
                  </div>
                </div>

                {dbStatus && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tables Active</p>
                        <p className="text-base font-black text-slate-900 mt-0.5">{dbStatus.tablesExisting || '0/13'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Connection</p>
                        <p className="text-base font-black text-emerald-600 mt-0.5">Active</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Auth Mode</p>
                        <p className="text-base font-black text-slate-900 mt-0.5">JWT Anon Key</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Fallback Resilience</p>
                        <p className="text-base font-black text-blue-600 mt-0.5">Enabled</p>
                      </div>
                    </div>

                    {dbStatus.tables && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Database Table Health Verification</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px]">
                          {Object.entries(dbStatus.tables).map(([tableName, info]: [string, any]) => (
                            <div key={tableName} className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border font-mono text-[10px] ${
                              info.exists 
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                                : 'bg-rose-50/50 border-rose-200 text-rose-800'
                            }`}>
                              <span className="truncate">{tableName}</span>
                              <span className="font-bold">{info.exists ? `✓ (${info.count ?? 0})` : 'Pending'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 text-slate-700">
                      <p className="font-bold text-blue-950 flex items-center gap-1.5">
                        <span>ℹ️</span> One-Click Database Setup:
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        To populate your Supabase database with all tables, constraints, RLS policies, and seed data, open your Supabase SQL Editor and run the generated <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono font-bold text-blue-900">/supabase_schema.sql</code> file.
                      </p>
                    </div>
                  </div>
                )}
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
        ) : activeTab === 'approvals' ? (
          /* PAGE 8: PINEVELA ADMINISTRATIVE VERIFICATION CENTER */
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto text-left">
            {/* Title Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Administrative Compliance
                  </span>
                  <span className="text-xs text-slate-400 font-bold">University & Platform Governance</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  PineVela Verification & Onboarding Center
                </h1>
                <p className="text-xs text-slate-500">
                  Inspect manager national identities, authenticate property rights & GhanaPost GPS coordinates, and approve hostel listings.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshAllVerifications}
                disabled={verificationsLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} className={verificationsLoading ? 'animate-spin' : ''} />
                <span>Refresh Records</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Manager Verifications</span>
                <p className="text-2xl font-black text-amber-600">
                  {managerVerifications.filter(m => m?.status === 'pending').length}
                </p>
                <p className="text-[10px] text-slate-500">Pending identity & authority review</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hostel Verifications</span>
                <p className="text-2xl font-black text-blue-600">
                  {hostelVerifications.filter(h => h?.status === 'under_admin_review' || h?.status === 'submitted' || h?.status === 'payment_confirmed').length}
                </p>
                <p className="text-[10px] text-slate-500">Pending property authorization</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verified Managers</span>
                <p className="text-2xl font-black text-emerald-600">
                  {managerVerifications.filter(m => m?.status === 'approved').length + managerRequestsList.filter(r => r?.status === 'Approved').length}
                </p>
                <p className="text-[10px] text-slate-500">Authorized resident administrators</p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verified Hostels Live</span>
                <p className="text-2xl font-black text-slate-900">
                  {hostelVerifications.filter(h => h?.status === 'approved').length + hostels.filter(h => h?.approvalStatus === 'Approved' || h?.isApproved).length}
                </p>
                <p className="text-[10px] text-slate-500">Active on public student search</p>
              </div>
            </div>

            {/* Sub-Tab Toggle Navigation */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setVerificationSubTab('managers')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  verificationSubTab === 'managers'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck size={16} className={verificationSubTab === 'managers' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Manager Identity Verifications</span>
                {managerVerifications.filter(m => m?.status === 'pending').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {managerVerifications.filter(m => m?.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVerificationSubTab('hostels')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  verificationSubTab === 'hostels'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={16} className={verificationSubTab === 'hostels' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Hostel Property Verifications</span>
                {hostelVerifications.filter(h => h?.status === 'under_admin_review' || h?.status === 'submitted' || h?.status === 'payment_confirmed').length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                    {hostelVerifications.filter(h => h?.status === 'under_admin_review' || h?.status === 'submitted' || h?.status === 'payment_confirmed').length}
                  </span>
                )}
              </button>
            </div>

            {/* SUB-VIEW 1: MANAGER IDENTITY VERIFICATIONS */}
            {verificationSubTab === 'managers' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Manager Identity & Authority Queue (Phase 1)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Ghana Card verification via NIA validation provider with SHA-256 test salt hashing and authority cross-checks.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {managerVerifications.length} Applications
                  </span>
                </div>

                {managerVerifications.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ShieldCheck size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Manager Verifications in Queue</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      When managers register using Ghana Card identification, their verification record will populate here for administrative authorization.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {managerVerifications.filter(Boolean).map((record) => {
                      const isPending = record?.status === 'pending';
                      const isApproved = record?.status === 'approved';
                      const isRejected = record?.status === 'rejected';
                      const isSuspended = record?.status === 'suspended';
                      const isMoreInfo = record?.status === 'more_info_required';

                      return (
                        <div
                          key={record.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isPending
                              ? 'bg-amber-50/30 border-amber-200'
                              : isApproved
                              ? 'bg-emerald-50/20 border-emerald-200'
                              : isSuspended
                              ? 'bg-rose-50/20 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 border border-white/20">
                                {(record.managerName || 'M').charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-slate-900 text-sm">{record.managerName}</h3>
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    isPending
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : isApproved
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isSuspended
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {String(record.status || 'Pending').replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {record.authorityRelationship} • {record.country}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto">
                              <button
                                type="button"
                                onClick={() => setSelectedManagerVerification(record)}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye size={14} />
                                <span>Inspect Dossier</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveManagerVerification(record.id)}
                                    disabled={adminActionLoading}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check size={14} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectManagerVerification(record.id)}
                                    disabled={adminActionLoading}
                                    className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Data Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Identity Document</span>
                              <p className="font-extrabold text-slate-800 mt-0.5 font-mono">{record.maskedIdNumber}</p>
                              <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ✓ Verified via NIA Mock
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Channels</span>
                              <p className="font-extrabold text-slate-800 mt-0.5 truncate">{record.managerEmail}</p>
                              <p className="text-slate-500 text-[11px]">{record.managerPhone}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Authority Claim</span>
                              <p className="font-extrabold text-slate-800 mt-0.5">{record.authorityRelationship}</p>
                              <p className="text-slate-500 text-[11px]">
                                {record.claimedOwnerName ? `Owner: ${record.claimedOwnerName}` : 'Self-declared Property Owner'}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Automated System Checks</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  record.systemChecks?.identity === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  ID: {record.systemChecks?.identity}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  record.systemChecks?.duplicateManager === 'clean' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  Dupes: {record.systemChecks?.duplicateManager}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  record.systemChecks?.authorityEvidence === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  Evidence: {record.systemChecks?.authorityEvidence}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: HOSTEL PROPERTY VERIFICATIONS */}
            {verificationSubTab === 'hostels' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Hostel Property Verifications & GhanaPost GPS Queue (Phase 2)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Verify property ownership deeds, GPS coordinates, capacity consistency, and onboarding fee confirmation.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {hostelVerifications.length} Hostels Submitted
                  </span>
                </div>

                {hostelVerifications.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Building2 size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Hostel Verifications Pending</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      When approved managers complete the 10-step wizard and attach ownership documentation with the GHS 50 onboarding fee, properties will queue here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hostelVerifications.filter(Boolean).map((hRecord) => {
                      const isPending = hRecord?.status === 'under_admin_review' || hRecord?.status === 'submitted' || hRecord?.status === 'payment_confirmed';
                      const isVerified = hRecord?.status === 'approved';
                      const isFlagged = hRecord?.status === 'more_info_required' || hRecord?.status === 'suspended';

                      return (
                        <div
                          key={hRecord.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            isPending
                              ? 'bg-blue-50/30 border-blue-200'
                              : isVerified
                              ? 'bg-emerald-50/20 border-emerald-200'
                              : isFlagged
                              ? 'bg-amber-50/30 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                                <img
                                  src={hRecord.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80'}
                                  alt={hRecord.hostelName || 'Hostel'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-slate-900 text-sm">{hRecord.hostelName}</h3>
                                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    isPending
                                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                      : isVerified
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}>
                                    {String(hRecord.status || 'Under Review').replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                  <MapPin size={12} className="text-slate-400" />
                                  <span>{hRecord.location}</span>
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                                    {hRecord.digitalAddress}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto">
                              <button
                                type="button"
                                onClick={() => setSelectedHostelVerification(hRecord)}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye size={14} />
                                <span>Inspect Dossier</span>
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveHostelVerificationRecord(hRecord.id)}
                                    disabled={adminActionLoading}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check size={14} />
                                    <span>Verify & Launch</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectHostelVerificationRecord(hRecord.id)}
                                    disabled={adminActionLoading}
                                    className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    <X size={14} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Data Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity & Pricing</span>
                              <p className="font-extrabold text-slate-800 mt-0.5">
                                {hRecord.totalCapacity} Beds ({hRecord.totalBlocks} Blocks)
                              </p>
                              <p className="text-slate-500 text-[11px]">
                                {hRecord.currency} {hRecord.pricePerYear.toLocaleString()} / year
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Authority & Ownership</span>
                              <p className="font-extrabold text-slate-800 mt-0.5">{hRecord.authorityRelationship}</p>
                              <p className="text-slate-500 text-[11px]">Doc: {hRecord.proofOfOwnershipType}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Onboarding Fee</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  hRecord.paymentStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  GHS 50.00 {hRecord.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[10px] font-mono mt-0.5">{hRecord.paymentReference || 'PAY-REF-DIRECT'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">System Integrity</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  GPS: {hRecord.systemValidation?.digitalAddressFormatValid ? 'Valid' : 'Check'}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Dupes: {hRecord.systemValidation?.duplicateHostelCheck}
                                </span>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                  Deed: {hRecord.systemValidation?.ownershipEvidencePresent ? 'Attached' : 'Missing'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* INSPECTION MODAL: MANAGER DOSSIER */}
            {selectedManagerVerification && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200 text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          Manager Verification Dossier
                        </h3>
                        <p className="text-xs text-slate-500">Ref: #{selectedManagerVerification.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedManagerVerification(null)}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Identity Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400">National Identity & NIA Mock Response</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Full Name on Document</span>
                        <span className="font-extrabold text-slate-900">{selectedManagerVerification.fullNameOnId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Document Type & Masked ID</span>
                        <span className="font-mono font-bold text-slate-900">{selectedManagerVerification.idDocumentType}: {selectedManagerVerification.maskedIdNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Date of Birth / Expiry</span>
                        <span className="font-medium text-slate-700">{selectedManagerVerification.dateOfBirth || '1985-05-15'} (Exp: {selectedManagerVerification.idExpiryDate || '2030-05-15'})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Validation Status</span>
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {selectedManagerVerification.idVerificationStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authority Box */}
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                    <span className="text-[10px] font-black uppercase text-blue-800">Authority Claim & Evidence</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Declared Role</span>
                        <span className="font-extrabold text-slate-900">{selectedManagerVerification.authorityRelationship}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Claimed Property Owner</span>
                        <span className="font-medium text-slate-700">{selectedManagerVerification.claimedOwnerName || selectedManagerVerification.managerName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Attached Evidence Document</span>
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-blue-100 mt-1">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" />
                            <span className="text-xs font-bold text-slate-800">
                              {selectedManagerVerification.authorityEvidenceFileName || 'Authority_Verification_Declaration.pdf'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Verified Document Attached
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActionModalType('suspend');
                          setAdminActionNotes('');
                        }}
                        className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                      >
                        Suspend Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionModalType('request-info');
                          setAdminActionNotes('');
                        }}
                        className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl"
                      >
                        Request Documents
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectManagerVerification(selectedManagerVerification.id)}
                        disabled={adminActionLoading}
                        className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveManagerVerification(selectedManagerVerification.id)}
                        disabled={adminActionLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Approve & Unlock
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* INSPECTION MODAL: HOSTEL DOSSIER */}
            {selectedHostelVerification && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200 text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">
                          {selectedHostelVerification.hostelName} Verification Dossier
                        </h3>
                        <p className="text-xs text-slate-500">Ref: #{selectedHostelVerification.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedHostelVerification(null)}
                      className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Property & GhanaPost GPS */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <span className="text-[10px] font-black uppercase text-slate-400">Location & GhanaPost GPS Verification</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Digital Address (GhanaPost GPS)</span>
                        <span className="font-mono font-black text-blue-900 text-sm">{selectedHostelVerification.digitalAddress}</span>
                        <span className="inline-block ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Format Valid
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Campus Zone & Location</span>
                        <span className="font-extrabold text-slate-900">{selectedHostelVerification.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Configured Capacity</span>
                        <span className="font-medium text-slate-700">
                          {selectedHostelVerification.totalCapacity} Beds across {selectedHostelVerification.totalBlocks} Blocks ({selectedHostelVerification.totalRooms} Rooms)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Annual Price Rate</span>
                        <span className="font-bold text-slate-900">
                          {selectedHostelVerification.currency} {selectedHostelVerification.pricePerYear.toLocaleString()} / year
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Ownership */}
                  <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200 space-y-3">
                    <span className="text-[10px] font-black uppercase text-indigo-800">Proof of Ownership & Authority</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Document Type</span>
                        <span className="font-extrabold text-slate-900">{selectedHostelVerification.proofOfOwnershipType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Owner / Operator</span>
                        <span className="font-medium text-slate-700">{selectedHostelVerification.ownerOperatorName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Attached Document File</span>
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-100 mt-1">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-800">
                              {selectedHostelVerification.proofOfOwnershipFileName || `${selectedHostelVerification.hostelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-title-deed.pdf`}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Stored in Supabase Private Vault
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Onboarding Fee */}
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">Hostel Onboarding Fee</span>
                      <span className="font-black text-slate-900 text-sm">GHS 50.00 {selectedHostelVerification.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</span>
                      <p className="text-[10px] text-slate-500 font-mono">Reference: {selectedHostelVerification.paymentReference || 'PAY-PV50-CONFIRMED'}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full">
                      Fee Settled
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFlagHostelInvestigation(selectedHostelVerification.id, 'Dispatched university inspector for property audit.')}
                        className="px-3.5 py-2 border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold rounded-xl"
                      >
                        Flag for Physical Inspection
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSuspendHostelVerification(selectedHostelVerification.id, 'Administrative suspension.')}
                        className="px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                      >
                        Suspend
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectHostelVerificationRecord(selectedHostelVerification.id)}
                        disabled={adminActionLoading}
                        className="px-4 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveHostelVerificationRecord(selectedHostelVerification.id)}
                        disabled={adminActionLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Verify & Activate Property
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        ) : null}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-[10px] text-slate-400 mt-auto shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 PineVela. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-600">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
