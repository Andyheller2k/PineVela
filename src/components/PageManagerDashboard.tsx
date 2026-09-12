import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import HostelRegistration from './HostelRegistration';
import ManagerProfileModal from './ManagerProfileModal';
import { ManagerMeetingsTab } from './ManagerMeetingsTab';
import { ManagerAccountSettingsModal } from './ManagerAccountSettingsModal';
import LogoutConfirmationModal from './LogoutConfirmationModal';
import { 
  Building2, Users, MapPin, DollarSign, CheckCircle2, XCircle, Clock, Plus, 
  ShieldCheck, LogOut, Search, Home, Hotel, Coffee, UserPlus, 
  AlertCircle, Check, Sparkles, ArrowRight, Layers, Wrench, Settings, Bell,
  Send, MessageSquare, Phone, Mail, Shield, Trash2, Edit3, Eye, FileText, CheckCircle, Lock, Calendar, CalendarCheck,
  Briefcase, Sliders, ExternalLink, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  shift: string;
  assignedBlock: string;
  status: 'Active' | 'On Leave' | 'Off Duty';
}

interface MaintenanceTicket {
  id: string;
  title: string;
  category: string;
  roomNumber: string;
  urgency: 'Normal' | 'High' | 'Emergency';
  status: 'Open' | 'In Progress' | 'Resolved';
  assignedTo?: string;
  reportedAt: string;
  description: string;
}

export default function PageManagerDashboard() {
  const { user, logout, apiFetch, setSessionUser } = useAuth();
  const navigate = useNavigate();

  // Prioritize onboarding flow/tabs immediately if manager is pending approval
  const isPendingOnboarding = user && user.role === 'manager' && user.hasApprovedHostel === false;

  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'blocks' | 'staff' | 'maintenance' | 'meetings' | 'notifications'>(
    isPendingOnboarding ? 'notifications' : 'overview'
  );
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Manager specific states
  const [properties, setProperties] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceTicket[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffApplications, setStaffApplications] = useState<any[]>([]);
  const [staffSubTab, setStaffSubTab] = useState<'roster' | 'applications' | 'recruitment'>('roster');
  const [selectedCvApp, setSelectedCvApp] = useState<any | null>(null);
  const [approveModalApp, setApproveModalApp] = useState<any | null>(null);
  const [approveShift, setApproveShift] = useState('Day Shift (8 AM - 5 PM)');
  const [approveBlock, setApproveBlock] = useState('All Blocks');
  const [hiringOpen, setHiringOpen] = useState(true);
  const [recruitmentRoles, setRecruitmentRoles] = useState<any[]>([
    { role: 'Facilities & Maintenance Technician', vacancies: 2, shift: 'Day Shift' },
    { role: 'Security Officer (Night Shift)', vacancies: 1, shift: 'Night Shift' },
    { role: 'Plumber & Water Systems Lead', vacancies: 1, shift: 'Day Shift' }
  ]);
  const [newRecruitRole, setNewRecruitRole] = useState('Facilities & Maintenance Technician');
  const [newRecruitVacancies, setNewRecruitVacancies] = useState(1);
  const [newRecruitShift, setNewRecruitShift] = useState('Day Shift (8 AM - 5 PM)');
  const [savingRecruitment, setSavingRecruitment] = useState(false);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Front Desk Operations Lead');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffShift, setNewStaffShift] = useState('Day Shift (8 AM - 5 PM)');
  const [newStaffBlock, setNewStaffBlock] = useState('All Blocks');

  // Maintenance state
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueCategory, setNewIssueCategory] = useState('Plumbing & Water');
  const [newIssueRoom, setNewIssueRoom] = useState('Room A104');
  const [newIssueUrgency, setNewIssueUrgency] = useState<'Normal' | 'High' | 'Emergency'>('Normal');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'Open' | 'In Progress' | 'Resolved'>('all');

  // Board requests state
  const [boardRequests, setBoardRequests] = useState<any[]>([]);
  const [newRequestSubject, setNewRequestSubject] = useState('');
  const [newRequestCategory, setNewRequestCategory] = useState('Room Capacity Adjustment');
  const [newRequestPriority, setNewRequestPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [newRequestMessage, setNewRequestMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Check if manager has approved properties
  const isPropertyApproved = (p: any) => 
    Boolean(
      p && (
        p.isApproved === true || 
        p.isApproved === 'true' ||
        p.approvalStatus === 'Approved' || 
        p.approvalStatus === 'approved' ||
        p.status === 'Approved' || 
        p.status === 'approved' ||
        p.status === 'Active' || 
        p.status === 'active' || 
        p.status === 'Open' ||
        p.status === 'open'
      )
    );

  const primaryProperty = properties[0] || null;
  const hasApprovedProperty = 
    properties.some(isPropertyApproved) || 
    Boolean(primaryProperty && isPropertyApproved(primaryProperty));
  const hasAnyProperty = properties.length > 0;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch properties from backend
      const resProperties = await apiFetch('/api/hostels').catch(() => []);
      const myHostelRes = await apiFetch('/api/manager/my-hostel').catch(() => null);
      
      const cleanEmail = (user?.email || '').toLowerCase().trim();
      const userId = user?.id;
      const cleanName = (user?.name || '').toLowerCase().trim();

      let managerProperties: any[] = [];
      if (Array.isArray(resProperties)) {
        managerProperties = resProperties.filter((p: any) => {
          if (!p) return false;
          const matchEmail = p.managerEmail && cleanEmail && p.managerEmail.toLowerCase().trim() === cleanEmail;
          const matchId = (p.managerId && userId && p.managerId === userId) || (p.assignedManagerId && userId && p.assignedManagerId === userId);
          const matchName = p.managerName && cleanName && p.managerName.toLowerCase().trim() === cleanName;
          return matchEmail || matchId || matchName;
        });
      }

      if (managerProperties.length === 0 && myHostelRes?.hostel) {
        managerProperties = [myHostelRes.hostel];
      } else if (myHostelRes?.hostel && managerProperties.length > 0) {
        managerProperties = managerProperties.map(p => 
          p.id === myHostelRes.hostel.id ? { ...p, ...myHostelRes.hostel } : p
        );
      }
      
      setProperties(managerProperties);

      // 2. Fetch booking requests / applications
      const resApps = await apiFetch('/api/booking-requests').catch(() => []);
      const managerApps = Array.isArray(resApps)
        ? resApps.filter((a: any) => managerProperties.some(p => p.name === a.hostelName))
        : [];
      setApplications(managerApps);

      // 3. Fetch issue reports / maintenance from backend (NO MOCK DATA)
      const resIssues = await apiFetch('/api/issue-reports').catch(() => []);
      if (Array.isArray(resIssues)) {
        const relevantIssues = managerProperties.length > 0
          ? resIssues.filter((i: any) => 
              !i.hostelName || managerProperties.some(p => p.name?.toLowerCase() === i.hostelName?.toLowerCase()) ||
              (i.hostelId && managerProperties.some(p => p.id === i.hostelId))
            )
          : resIssues;

        setMaintenanceIssues(relevantIssues.map((i: any) => ({
          id: i.id || `issue-${Date.now()}`,
          title: i.title || i.issue || 'Maintenance Request',
          category: i.category || 'General',
          roomNumber: i.roomNumber || i.room || 'General Area',
          urgency: i.urgency || i.priority || 'Normal',
          status: i.status === 'Resolved' ? 'Resolved' : i.status === 'In Progress' ? 'In Progress' : 'Open',
          reportedAt: i.reportedAt || i.createdAt || 'Recent',
          description: i.description || i.details || 'Maintenance requested by resident'
        })));
      } else {
        setMaintenanceIssues([]);
      }

      // 4. Fetch staff members from backend (NO MOCK DATA)
      const resStaff = await apiFetch('/api/staff').catch(() => []);
      if (Array.isArray(resStaff)) {
        setStaffList(resStaff);
      } else {
        setStaffList([]);
      }

      // 4b. Fetch staff applications & CV submissions
      const resStaffApps = await apiFetch('/api/staff-applications').catch(() => []);
      if (Array.isArray(resStaffApps)) {
        setStaffApplications(resStaffApps);
      } else {
        setStaffApplications([]);
      }

      // Load recruitment settings from primary property if present
      if (managerProperties[0]) {
        if (managerProperties[0].staffHiringOpen !== undefined) {
          setHiringOpen(managerProperties[0].staffHiringOpen);
        }
        if (Array.isArray(managerProperties[0].openStaffRoles) && managerProperties[0].openStaffRoles.length > 0) {
          setRecruitmentRoles(managerProperties[0].openStaffRoles);
        }
      }

      // 5. Fetch manager's board requests
      const resBoard = await apiFetch('/api/board-requests').catch(() => []);
      setBoardRequests(Array.isArray(resBoard) ? resBoard : []);

      // 6. Activities
      const resActivities = await apiFetch('/api/activities').catch(() => []);
      if (Array.isArray(resActivities) && resActivities.length > 0) {
        setActivities(resActivities.slice(0, 10));
      } else {
        setActivities([
          {
            id: 'act-1',
            text: `Hostel "${managerProperties[0]?.name || 'Residence'}" verified and active on PineVela`,
            time: 'Today',
            type: 'success'
          }
        ]);
      }
      
      // Determine initial tab and popup after fetching properties
      if (managerProperties.some(isPropertyApproved)) {
        setActiveTab('overview');
        setShowWelcomePopup(false);
      } else {
        setActiveTab('notifications');
        // Only show welcome popup if the manager has NOT registered any hostel yet
        if (managerProperties.length === 0) {
          setShowWelcomePopup(true);
        } else {
          setShowWelcomePopup(false);
        }
      }
    } catch (err) {
      console.error("Error loading manager data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract normalized blocks from registered hostel
  const getNormalizedBlocks = (property: any) => {
    if (!property) return [];
    if (Array.isArray(property.blocksList) && property.blocksList.length > 0) {
      return property.blocksList.map((b: any, idx: number) => {
        const totalRooms = b.totalRooms || 20;
        const floors = b.floors || 4;
        const bedsPerRoom = b.bedsPerRoom || 3;
        const roomsPerFloor = Math.ceil(totalRooms / floors);
        const blockPrice = b.pricePerBlock !== undefined && b.pricePerBlock !== null ? b.pricePerBlock : (b.price || property.price || 3500);
        return {
          id: b.id || `block-${idx + 1}`,
          blockName: b.name || `Block ${String.fromCharCode(65 + idx)} (${idx === 0 ? 'Alpha' : 'Beta'})`,
          floors,
          totalRooms,
          roomsPerFloor,
          bedsPerRoom,
          pricePerBlock: blockPrice,
          totalBeds: totalRooms * bedsPerRoom,
          roomPrefix: b.roomPrefix || String.fromCharCode(65 + idx),
          startNum: b.startNum || (idx + 1) * 100 + 1,
          genderCategory: idx === 0 ? 'Male & Female (Co-Ed Wing)' : 'Female Wing & Executive',
          roomTypes: [
            { type: `${bedsPerRoom} in a Room (Standard)`, priceGHS: blockPrice, spaces: Math.round(totalRooms * bedsPerRoom * 0.7) },
            { type: '2 in a Room (Deluxe Ensuite)', priceGHS: Math.round(blockPrice * 1.2), spaces: Math.round(totalRooms * bedsPerRoom * 0.2) },
            { type: '1 in a Room (Executive Private)', priceGHS: Math.round(blockPrice * 1.5), spaces: Math.round(totalRooms * bedsPerRoom * 0.1) }
          ],
          amenities: property.facilities || property.amenities || [
            'Fiber-Optic Wi-Fi', 'Standby Generator', '24/7 Uniformed Security', 'Borehole Water', 'Study Hall'
          ]
        };
      });
    }
    
    if (Array.isArray(property.blocks) && property.blocks.length > 0) {
      return property.blocks.map((b: any, idx: number) => {
        const blockPrice = b.pricePerBlock !== undefined && b.pricePerBlock !== null ? b.pricePerBlock : (b.price || property.price || 3500);
        const bedsPerRoom = b.bedsPerRoom || 3;
        const totalRooms = b.totalRooms || 20;
        return {
          id: b.id || `block-${idx + 1}`,
          blockName: b.blockName || b.name || `Block ${String.fromCharCode(65 + idx)}`,
          floors: b.floors || 4,
          totalRooms,
          roomsPerFloor: b.roomsPerFloor || Math.ceil(totalRooms / (b.floors || 4)),
          bedsPerRoom,
          pricePerBlock: blockPrice,
          totalBeds: b.totalBeds || (totalRooms * bedsPerRoom),
          roomPrefix: b.roomPrefix || String.fromCharCode(65 + idx),
          startNum: b.startNum || (idx + 1) * 100 + 1,
          genderCategory: b.genderCategory || 'Mixed Community',
          roomTypes: b.roomTypes || [
            { type: `${bedsPerRoom} in a Room (Standard)`, priceGHS: blockPrice, spaces: totalRooms * bedsPerRoom }
          ],
          amenities: b.amenities || property.facilities || []
        };
      });
    }

    const cap = property.totalCapacity || property.capacity || 1200;
    const defaultPrice = property.price || 3500;
    return [
      {
        id: 'block-1',
        blockName: 'Block A (Alpha)',
        floors: 4,
        totalRooms: Math.ceil(cap / 6),
        roomsPerFloor: Math.ceil(cap / 24),
        bedsPerRoom: 3,
        pricePerBlock: defaultPrice,
        totalBeds: Math.ceil(cap / 2),
        roomPrefix: 'A',
        startNum: 101,
        genderCategory: 'Male & Female (Co-Ed)',
        roomTypes: [
          { type: '3 in a Room (Standard)', priceGHS: defaultPrice, spaces: Math.ceil(cap / 2) }
        ],
        amenities: property.facilities || property.amenities || ['Fiber-Optic Wi-Fi', 'Standby Generator', 'Security']
      },
      {
        id: 'block-2',
        blockName: 'Block B (Beta)',
        floors: 4,
        totalRooms: Math.ceil(cap / 6),
        roomsPerFloor: Math.ceil(cap / 24),
        bedsPerRoom: 3,
        pricePerBlock: defaultPrice,
        totalBeds: Math.ceil(cap / 2),
        roomPrefix: 'B',
        startNum: 201,
        genderCategory: 'Executive & Quiet Wing',
        roomTypes: [
          { type: '3 in a Room (Standard)', priceGHS: defaultPrice, spaces: Math.ceil(cap / 2) }
        ],
        amenities: property.facilities || property.amenities || ['Fiber-Optic Wi-Fi', 'Standby Generator', 'Security']
      }
    ];
  };

  const propertyBlocks = getNormalizedBlocks(primaryProperty);

  const handleSendBoardRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestSubject.trim() || !newRequestMessage.trim()) {
      triggerToast('Please provide both a subject and message.');
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const primaryProp = primaryProperty?.name || 'Registered Residence';
      const created = await apiFetch('/api/board-requests', {
        method: 'POST',
        body: JSON.stringify({
          subject: newRequestSubject.trim(),
          category: newRequestCategory,
          priority: newRequestPriority,
          message: newRequestMessage.trim(),
          hostelName: primaryProp
        })
      });
      setBoardRequests(prev => [created, ...prev]);
      setNewRequestSubject('');
      setNewRequestMessage('');
      triggerToast('Request transmitted to PineVela Admin Board successfully!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to submit request to admin board.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: any) => {
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedProfile)
      });
      if (res && res.user) {
        setSessionUser(res.user);
      }
      triggerToast('Manager profile updated across PineVela!');
      setShowEditProfileModal(false);
      await fetchManagerData();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update manager profile.');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPhone.trim()) {
      triggerToast('Please enter both staff name and phone number.');
      return;
    }
    try {
      const createdStaff = await apiFetch('/api/staff', {
        method: 'POST',
        body: JSON.stringify({
          name: newStaffName.trim(),
          role: newStaffRole,
          phone: newStaffPhone.trim(),
          email: newStaffEmail.trim() || `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@pinevela-team.com`,
          shift: newStaffShift,
          assignedBlock: newStaffBlock,
          status: 'Active',
          hostelId: primaryProperty?.id,
          hostelName: primaryProperty?.name
        })
      });
      setStaffList(prev => [createdStaff, ...prev]);
      setShowAddStaffModal(false);
      setNewStaffName('');
      setNewStaffPhone('');
      setNewStaffEmail('');
      triggerToast(`Enrolled ${createdStaff.name} to the property team!`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to enroll staff member.');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await apiFetch(`/api/staff/${staffId}`, {
        method: 'DELETE'
      });
      setStaffList(prev => prev.filter(s => s.id !== staffId));
      triggerToast('Staff member record removed.');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete staff record.');
    }
  };

  const handleStaffAppDecision = async (appId: string, status: 'Approved' | 'Rejected', shift?: string, block?: string) => {
    try {
      await apiFetch(`/api/staff-applications/${appId}/decision`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          shift: shift || 'Day Shift (8 AM - 5 PM)',
          assignedBlock: block || 'All Blocks',
          reviewNotes: status === 'Approved' ? 'Application reviewed and approved.' : 'Application reviewed. Position filled or criteria not met.'
        })
      });
      setStaffApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      setApproveModalApp(null);
      // If approved, refresh the staff list
      if (status === 'Approved') {
        const resStaff = await apiFetch('/api/staff').catch(() => []);
        if (Array.isArray(resStaff)) setStaffList(resStaff);
      }
      triggerToast(`Application ${status.toLowerCase()} successfully!`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update application decision.');
    }
  };

  const handleSaveRecruitment = async () => {
    if (!primaryProperty) {
      triggerToast('Please ensure a hostel is registered to update recruitment settings.');
      return;
    }
    setSavingRecruitment(true);
    try {
      await apiFetch(`/api/hostels/${primaryProperty.id}/recruitment`, {
        method: 'PUT',
        body: JSON.stringify({
          staffHiringOpen: hiringOpen,
          openStaffRoles: recruitmentRoles
        })
      });
      triggerToast('Staff recruitment settings published to accredited hostel listings!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save recruitment settings.');
    } finally {
      setSavingRecruitment(false);
    }
  };

  const handleAddRecruitmentRole = () => {
    if (!newRecruitRole) return;
    setRecruitmentRoles(prev => [
      ...prev,
      { role: newRecruitRole, vacancies: Number(newRecruitVacancies) || 1, shift: newRecruitShift }
    ]);
  };

  const handleRemoveRecruitmentRole = (idx: number) => {
    setRecruitmentRoles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) {
      triggerToast('Please provide an issue title.');
      return;
    }
    try {
      const createdTicket = await apiFetch('/api/issue-reports', {
        method: 'POST',
        body: JSON.stringify({
          title: newIssueTitle.trim(),
          category: newIssueCategory,
          roomNumber: newIssueRoom.trim() || 'General Facility',
          urgency: newIssueUrgency,
          status: 'Open',
          reportedAt: new Date().toISOString().split('T')[0],
          description: newIssueDescription.trim() || 'Logged via Manager Operations Center.',
          hostelName: primaryProperty?.name,
          hostelId: primaryProperty?.id
        })
      });
      
      const normalizedTicket: MaintenanceTicket = {
        id: createdTicket.id || `m-${Date.now().toString().slice(-4)}`,
        title: createdTicket.title || newIssueTitle.trim(),
        category: createdTicket.category || newIssueCategory,
        roomNumber: createdTicket.roomNumber || newIssueRoom.trim() || 'General Facility',
        urgency: createdTicket.urgency || newIssueUrgency,
        status: createdTicket.status || 'Open',
        reportedAt: createdTicket.reportedAt || new Date().toISOString().split('T')[0],
        description: createdTicket.description || newIssueDescription.trim()
      };

      setMaintenanceIssues(prev => [normalizedTicket, ...prev]);
      setShowAddIssueModal(false);
      setNewIssueTitle('');
      setNewIssueDescription('');
      triggerToast('Maintenance ticket dispatched successfully!');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to dispatch work order.');
    }
  };

  const handleToggleIssueStatus = async (ticketId: string) => {
    const targetTicket = maintenanceIssues.find(t => t.id === ticketId);
    if (!targetTicket) return;

    const nextStatus: MaintenanceTicket['status'] = 
      targetTicket.status === 'Open' ? 'In Progress' :
      targetTicket.status === 'In Progress' ? 'Resolved' : 'Open';

    try {
      await apiFetch(`/api/issue-reports/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      setMaintenanceIssues(prev => prev.map(t => t.id === ticketId ? { ...t, status: nextStatus } : t));
      triggerToast(`Ticket updated to ${nextStatus}.`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update ticket status.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchManagerData();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && user) {
      const isPropApproved = (p: any) => 
        Boolean(
          p && (
            p.isApproved === true || 
            p.isApproved === 'true' ||
            p.approvalStatus === 'Approved' || 
            p.approvalStatus === 'approved' ||
            p.status === 'Approved' || 
            p.status === 'approved' ||
            p.status === 'Active' || 
            p.status === 'active' || 
            p.status === 'Open' ||
            p.status === 'open'
          )
        );
      const hasApprovedProp = 
        properties.some(isPropApproved) || 
        Boolean(properties[0] && isPropApproved(properties[0]));

      const hasAnyHostel = properties.length > 0;

      if (!hasApprovedProp) {
        setActiveTab('notifications');
        // Welcoming onboarding popup remains persistent on login until manager has registered an approved hostel
        if (!hasAnyHostel) {
          setShowWelcomePopup(true);
        }
      } else {
        setShowWelcomePopup(false);
      }
    }
  }, [loading, properties, user]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    navigate('/', { replace: true });
    setTimeout(() => {
      logout();
    }, 50);
  };

  // Derived stats
  const totalProperties = properties.length;
  const totalCapacity = properties.reduce((acc, p) => acc + (p.totalCapacity || p.capacity || 0), 0);
  const totalOccupied = properties.reduce((acc, p) => acc + (p.occupied || 0), 0);
  const availableBeds = totalCapacity > 0 ? (totalCapacity - totalOccupied) : 0;
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const activeIssues = maintenanceIssues.filter(i => i.status !== 'Resolved').length;

  const filteredIssues = maintenanceIssues.filter(i => {
    if (maintenanceFilter === 'all') return true;
    return i.status === maintenanceFilter;
  });

  if (loading) {
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
            <span className="text-sm font-black tracking-tight">Syncing Operational State...</span>
          </div>
        </div>
      </div>
    );
  }

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
      <aside className="w-full lg:w-72 m-4 lg:my-6 lg:ml-6 h-auto lg:h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto z-20">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center space-x-3 px-2">
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                PineVela Manager
              </h1>
              <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">Property Operations</p>
            </div>
          </div>

          {/* Manager Profile Pill */}
          <div className="p-3 bg-white/70 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={user?.photo || user?.avatar || (user as any)?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'} 
                alt="Manager Avatar" 
                className="w-10 h-10 rounded-xl object-cover border border-blue-200 shadow-sm shrink-0"
              />
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Property Manager'}</div>
                <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                  <span className="truncate">Verified Manager</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowAccountSettingsModal(true)}
                title="Manager Account Settings"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowEditProfileModal(true)}
                title="Edit Manager Profile"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Operations Center</p>
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: ShieldCheck, sub: 'Live metrics & activity', locked: !hasApprovedProperty },
              { id: 'properties', label: 'My Properties', icon: Building2, sub: 'Registered residence space', locked: !hasApprovedProperty },
              { id: 'blocks', label: 'Blocks & Rooms', icon: Layers, sub: 'Interactive 3D structure', locked: !hasApprovedProperty },
              { id: 'staff', label: 'Staff Management', icon: Users, badge: staffList.length > 0 ? staffList.length : null, sub: 'Security, desk & team', locked: !hasApprovedProperty },
              { id: 'maintenance', label: 'Maintenance Hub', icon: Wrench, badge: activeIssues > 0 ? activeIssues : null, sub: 'Dispatch & tickets', locked: !hasApprovedProperty },
              { id: 'meetings', label: 'Meeting Requests', icon: CalendarCheck, sub: 'Student & staff appointments', locked: !hasApprovedProperty },
              { id: 'notifications', label: 'Notifications & Board', icon: Bell, badge: boardRequests.length > 0 ? boardRequests.length : null, sub: 'Alerts & Admin direct line', locked: false }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isLocked = tab.locked;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isLocked && setActiveTab(tab.id as any)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium transition-all duration-300 text-left group relative ${
                    isLocked ? 'opacity-40 cursor-not-allowed text-slate-400' : 'cursor-pointer'
                  } ${
                    isActive && !isLocked
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 border border-blue-400/50 ring-2 ring-blue-400/20'
                      : !isLocked ? 'text-slate-700 hover:text-slate-900 hover:bg-blue-200/50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isActive && !isLocked ? 'bg-white/20 text-white' : 
                      isLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-200/70 text-blue-700 group-hover:bg-blue-300/80'
                    }`}>
                      {isLocked ? <AlertCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                        {tab.label}
                      </div>
                      <div className={`text-[10px] font-normal ${isActive && !isLocked ? 'text-blue-100' : 'text-slate-500'}`}>{tab.sub}</div>
                    </div>
                  </div>
                  {tab.badge && !isLocked ? (
                    <span className="px-2 py-0.5 text-[10px] bg-rose-500 text-white font-bold rounded-full shadow-sm">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button Box */}
        <div className="pt-4 border-t border-sky-200/80 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-sm cursor-pointer"
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
          <div className="transform scale-[4.5] opacity-[0.14] blur-[0.4px]">
            <PineLogo size={180} hideText={true} />
          </div>
        </div>

        {/* TAB CONTENT OR REGISTRATION */}
        {showRegistration ? (
          <div className="animate-fadeIn relative z-10 h-full">
            <div className="bg-white border border-blue-200/50 rounded-3xl shadow-2xl p-0 md:p-2 overflow-y-auto h-full max-h-[calc(100vh-4rem)]">
              <HostelRegistration 
                onSuccess={(h) => {
                  setProperties([h]);
                  setShowWelcomePopup(false);
                  triggerToast('Hostel Registration Submitted to Admin for Review!');
                  setShowRegistration(false);
                  setActiveTab('notifications');
                }} 
                onCancel={() => setShowRegistration(false)} 
                currentUserId={user?.id}
              />
            </div>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fadeIn relative z-10">
                {/* Welcome banner with verified property spotlight */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Official Accredited Residence • Live & Active</span>
                      </div>
                      <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                        {primaryProperty?.name || 'Premuim PineVela'}
                      </h2>
                      <p className="text-sm text-blue-200/90 font-medium flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-300 shrink-0" />
                        <span>{primaryProperty?.location || 'Oxford street,Osu, OX-9834, Accra'}</span>
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
                      >
                        <Edit3 className="w-4 h-4 text-cyan-200" />
                        <span>Edit Manager Profile</span>
                      </button>

                      <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl text-center shrink-0 min-w-[180px]">
                        <span className="text-[10px] uppercase tracking-wider text-cyan-200 font-bold">Standard Student Fee</span>
                        <div className="text-2xl font-black text-white mt-0.5">
                          GHS {(primaryProperty?.price || 35000).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-blue-200">Per Academic Year</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Capacity', value: `${(primaryProperty?.totalCapacity || 1200).toLocaleString()} Beds`, sub: `${propertyBlocks.length} Physical Blocks • Verified Wings`, icon: Building2, color: 'bg-blue-600 text-white' },
                    { label: 'Available Beds', value: `${(availableBeds || primaryProperty?.totalCapacity || 1200).toLocaleString()} Available`, sub: 'Ready for student bookings', icon: Users, color: 'bg-emerald-600 text-white' },
                    { label: 'Staff On Duty', value: `${staffList.filter(s => s.status === 'Active').length} Personnel`, sub: `${staffList.length} Total Enrolled Staff`, icon: UserPlus, color: 'bg-indigo-600 text-white' },
                    { label: 'Active Tickets', value: `${activeIssues} Requests`, sub: `${maintenanceIssues.filter(i => i.status === 'Resolved').length} Resolved to date`, icon: AlertCircle, color: activeIssues > 0 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white' }
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="bg-white/70 border border-blue-200/50 p-6 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-slate-700 tracking-wider uppercase">{stat.label}</span>
                          <div className={`w-10 h-10 rounded-2xl ${stat.color} flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-slate-800 mb-1">{stat.value}</div>
                          <div className="text-xs text-slate-500 font-medium">{stat.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Operations Quick Actions & Property Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Property Spotlight Card */}
                  <div className="lg:col-span-2 bg-white/70 border border-blue-200/60 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-lg space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          <span>Residence Architecture & Facilities</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">High-level overview of physical infrastructure and amenities.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('blocks')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View 3D Blocks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {propertyBlocks.map((block: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/60 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-blue-900 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-blue-100">
                              {block.blockName}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{block.genderCategory}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 bg-white/80 rounded-xl">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Floors</span>
                              <span className="font-extrabold text-slate-800">{block.floors}</span>
                            </div>
                            <div className="p-2 bg-white/80 rounded-xl">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Rooms</span>
                              <span className="font-extrabold text-slate-800">{block.totalRooms}</span>
                            </div>
                            <div className="p-2 bg-white/80 rounded-xl">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Beds</span>
                              <span className="font-extrabold text-blue-600">{block.totalBeds}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Amenities pills */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Facilities</span>
                      <div className="flex flex-wrap gap-2">
                        {(primaryProperty?.facilities || primaryProperty?.amenities || [
                          'Fiber-Optic Wi-Fi', 'Standby Generator / Plant', '24/7 Uniformed Security', 'Borehole & Mechanized Water', 'Quiet Study Hall', 'Smart Biometric Access'
                        ]).map((facility: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-white text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{facility}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Operations Actions & Activity Feed */}
                  <div className="bg-white/70 border border-blue-200/60 p-6 rounded-3xl backdrop-blur-xl shadow-lg space-y-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>Live Operations Audit</span>
                      </h3>

                      <div className="space-y-3">
                        {activities.slice(0, 4).map((act, i) => (
                          <div key={i} className="flex items-start space-x-3 p-3 rounded-2xl bg-blue-50/50 border border-blue-100/60 text-xs">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <div>
                              <p className="text-slate-800 font-medium">{act.text}</p>
                              <span className="text-[10px] text-slate-400 font-semibold">{act.time || act.timestamp || 'Recent'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick navigation buttons */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setActiveTab('staff')}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Staff Directory ({staffList.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setActiveTab('maintenance')}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2"><Wrench className="w-3.5 h-3.5" /> Maintenance Tickets ({maintenanceIssues.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROPERTIES */}
            {activeTab === 'properties' && (
              <div className="animate-fadeIn relative z-10 space-y-6">
                <div className="bg-white/70 border border-blue-200/50 p-8 rounded-3xl backdrop-blur-xl shadow-lg space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registered Property Dossier</h3>
                      <p className="text-xs text-slate-500 mt-1">Official listing records and infrastructure specifications on PineVela.</p>
                    </div>
                    <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 self-start md:self-auto flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Approved & Live on Platform</span>
                    </span>
                  </div>

                  {/* Approved Residence Integrity Protection Banner */}
                  <div className="bg-amber-50/90 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-amber-950">Accredited Property Lock Active</p>
                        <p className="text-amber-800 mt-0.5">
                          Direct editing of live residence specs (blocks, amenities, rules, fees) is restricted to maintain platform booking integrity. To request updates, submit a change request to the PineVela Admin Board.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNewRequestCategory('General Hostel Inquiry');
                        setNewRequestSubject(`Request update to residence details: ${primaryProperty?.name || 'My Hostel'}`);
                        setActiveTab('notifications');
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Admin Change</span>
                    </button>
                  </div>

                  {properties.map(p => (
                    <div key={p.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: Property Image & Identity */}
                      <div className="space-y-4">
                        <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                          <img 
                            src={p.image || p.imageUrl || p.exteriorPhotoUrl || p.imagePreviewUrl || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'} 
                            alt={p.name} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold">
                            {p.hostel_type || 'Student Accommodation'}
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2 text-xs">
                          <span className="text-[10px] font-bold text-blue-900 uppercase">Assigned Property Manager</span>
                          <div className="flex items-center gap-3">
                            <img 
                              src={p.managerPhoto || user?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'} 
                              alt="Manager" 
                              className="w-10 h-10 rounded-xl object-cover border border-blue-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{p.managerName || user?.name}</p>
                              <p className="text-slate-500">{p.managerPhone || user?.phone || '0509690121'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Technical specifications & details */}
                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <h4 className="text-2xl font-black text-slate-900">{p.name}</h4>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{p.location}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Total Beds</span>
                            <span className="block text-xl font-black text-slate-900 mt-0.5">{(p.totalCapacity || 1200).toLocaleString()}</span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Annual Fee</span>
                            <span className="block text-xl font-black text-blue-600 mt-0.5">GHS {(p.price || 35000).toLocaleString()}</span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Total Blocks</span>
                            <span className="block text-xl font-black text-slate-900 mt-0.5">{propertyBlocks.length} Blocks</span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Digital GPS</span>
                            <span className="block text-sm font-black text-indigo-700 mt-1">GA-183-9022</span>
                          </div>
                        </div>

                        {/* Facilities */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Accredited Facilities & Infrastructure</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(p.facilities || p.amenities || [
                              'Fiber-Optic Wi-Fi', 'Standby Generator / Plant', '24/7 Uniformed Security', 'Borehole & Mechanized Water', 'Quiet Study Hall', 'Smart Biometric Access'
                            ]).map((facility: string, idx: number) => (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-800">
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{facility}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Rules & Operational Policies */}
                        <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Standard Residence Policies</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                            <div><strong className="text-slate-800">Curfew:</strong> 10:00 PM (Main Gate Security Lock)</div>
                            <div><strong className="text-slate-800">Min Stay:</strong> 1 Academic Semester</div>
                            <div><strong className="text-slate-800">Visitors:</strong> Permitted in lobby until 8:00 PM</div>
                            <div><strong className="text-slate-800">Smoking:</strong> Strictly Non-Smoking Campus</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: BLOCKS & ROOMS (GLASSMORPHIC MODEL) */}
            {activeTab === 'blocks' && (
              <div className="animate-fadeIn relative z-10 space-y-6">
                <div className="bg-sky-50/20 border border-sky-200/50 p-6 rounded-3xl backdrop-blur-2xl shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Physical Property Structure & Blocks</h2>
                      <p className="text-xs text-slate-600">Interactive 3D model of your approved residence wings and room capacity.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white text-blue-900 px-3 py-1.5 rounded-xl border border-blue-200 shadow-sm">
                    {propertyBlocks.length} Verified Wings
                  </span>
                </div>

                {/* Approved Residence Integrity Protection Banner */}
                <div className="bg-amber-50/90 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-950">Block Architecture Locked</p>
                      <p className="text-amber-800 mt-0.5">
                        Room numbers and bed counts are verified for active student bookings. Submit a request to the Admin Board to adjust wings or capacity.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewRequestCategory('Room Capacity Adjustment');
                      setNewRequestSubject(`Request block adjustment for ${primaryProperty?.name || 'Hostel'}`);
                      setActiveTab('notifications');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Block Change</span>
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Blocks Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {propertyBlocks.map((block: any, idx: number) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedBlock(block)}
                        className="relative cursor-pointer group"
                      >
                        {/* Glassmorphic 3D-ish Block Representation */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-300/30 to-indigo-400/10 rounded-[2rem] transform translate-y-3 translate-x-2 group-hover:translate-y-5 group-hover:translate-x-3 transition-transform duration-300 blur-sm"></div>
                        <div className={`relative p-6 rounded-[2rem] border backdrop-blur-3xl shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 ${
                          selectedBlock?.blockName === block.blockName 
                            ? 'bg-blue-500/20 border-blue-400/60 scale-[1.02]' 
                            : 'bg-white/60 border-white/80 hover:bg-white/80'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md flex items-center justify-center">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 bg-white/80 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                              {block.genderCategory}
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{block.blockName}</h3>
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                              {block.floors} Floors • {block.totalRooms} Rooms • {block.bedsPerRoom} Beds/Room
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                            <div className="p-3 bg-white/70 rounded-xl border border-slate-100">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Beds</span>
                              <span className="text-lg font-black text-blue-600">{block.totalBeds}</span>
                            </div>
                            <div className="p-3 bg-white/70 rounded-xl border border-slate-100">
                              <span className="block text-[10px] text-slate-400 font-bold uppercase">Room Prefix</span>
                              <span className="text-lg font-black text-slate-800">Rooms {block.roomPrefix}{block.startNum}+</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Block Details Pane */}
                  {selectedBlock ? (
                    <div className="w-full lg:w-96 shrink-0 bg-white/80 border border-blue-200/60 rounded-[2rem] p-6 backdrop-blur-2xl shadow-xl h-fit animate-fadeIn space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{selectedBlock.blockName}</h4>
                          <span className="text-[10px] font-semibold text-blue-600 uppercase">{selectedBlock.genderCategory}</span>
                        </div>
                        <button onClick={() => setSelectedBlock(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Block Capacity</p>
                          <p className="text-3xl font-black text-blue-900">{selectedBlock.totalBeds} Beds</p>
                          <p className="text-xs text-slate-600 font-medium mt-0.5">{selectedBlock.floors} Floors ({selectedBlock.roomsPerFloor} rooms per floor)</p>
                        </div>

                        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 space-y-3">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Room Tier Pricing</p>
                          <div className="space-y-2">
                            {selectedBlock.roomTypes?.map((rt: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                                <div>
                                  <span className="block text-slate-900">{rt.type}</span>
                                  <span className="text-[10px] text-slate-400">{rt.spaces} spaces total</span>
                                </div>
                                <span className="font-bold text-blue-600">GHS {rt.priceGHS.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Block Specific Amenities</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedBlock.amenities?.map((amenity: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-white text-[10px] font-bold text-indigo-900 rounded-lg shadow-sm border border-indigo-100">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full lg:w-96 shrink-0 bg-white/40 border border-dashed border-slate-300 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center space-y-3 text-slate-400">
                      <Layers className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-semibold">Select any block card to inspect room numbering, floor configurations, and pricing.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: STAFF MANAGEMENT */}
            {activeTab === 'staff' && (
              <div className="animate-fadeIn relative z-10 space-y-6">
                <div className="bg-white/70 border border-blue-200/50 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-lg space-y-6">
                  
                  {/* Top Header & Sub-tabs */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        <span>Property Staff & Recruitment Operations</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Manage active hostel employees, review candidate applications & CVs, and publish open positions to accredited hostel listings.
                      </p>
                    </div>

                    {/* Sub-Navigation Buttons */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setStaffSubTab('roster')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          staffSubTab === 'roster'
                            ? 'bg-white text-blue-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Staff Roster ({staffList.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('applications')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 relative ${
                          staffSubTab === 'applications'
                            ? 'bg-white text-blue-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Applications & CVs</span>
                        {staffApplications.filter(a => a.status === 'pending').length > 0 && (
                          <span className="w-5 h-5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center">
                            {staffApplications.filter(a => a.status === 'pending').length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffSubTab('recruitment')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          staffSubTab === 'recruitment'
                            ? 'bg-white text-blue-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Recruitment Settings</span>
                      </button>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* SUBTAB 1: STAFF ROSTER                                   */}
                  {/* ======================================================== */}
                  {staffSubTab === 'roster' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">
                          {staffList.length} Active Personnel Assigned to Property
                        </span>
                        <button 
                          onClick={() => setShowAddStaffModal(true)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Staff Member</span>
                        </button>
                      </div>

                      {staffList.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No staff members enrolled yet</p>
                          <p className="text-[11px] text-slate-400 mt-1">Review applicant CVs or add staff manually using the button above.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                          {staffList.map(staff => (
                            <div key={staff.id} className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4 hover:shadow-md transition-all">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  {(staff as any).avatarUrl ? (
                                    <img 
                                      src={(staff as any).avatarUrl} 
                                      alt={staff.name} 
                                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                                      {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">{staff.name}</h4>
                                    {(staff as any).username && (
                                      <p className="text-[11px] text-slate-400 font-semibold">@{(staff as any).username}</p>
                                    )}
                                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{staff.role}</p>
                                  </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  staff.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {staff.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div><span className="text-slate-400 font-medium">Shift:</span> <span className="font-semibold text-slate-800">{staff.shift}</span></div>
                                <div><span className="text-slate-400 font-medium">Block:</span> <span className="font-semibold text-slate-800">{staff.assignedBlock}</span></div>
                                <div className="col-span-2"><span className="text-slate-400 font-medium">Phone:</span> <span className="font-semibold text-slate-800">{staff.phone}</span></div>
                                {(staff as any).nationalId && (
                                  <div className="col-span-2"><span className="text-slate-400 font-medium">ID / Ghana Card:</span> <span className="font-semibold text-slate-800">{(staff as any).nationalId}</span></div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                                <div className="flex gap-2">
                                  <a 
                                    href={`tel:${staff.phone}`}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>Call</span>
                                  </a>
                                  <a 
                                    href={`mailto:${staff.email}`}
                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-all"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Email</span>
                                  </a>
                                </div>

                                <button 
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Remove staff record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* SUBTAB 2: APPLICATIONS & CV REVIEWS                      */}
                  {/* ======================================================== */}
                  {staffSubTab === 'applications' && (
                    <div className="space-y-6">
                      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                        <Briefcase className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">Candidate Application Portal</h4>
                          <p className="text-xs text-amber-900 mt-0.5 font-medium">
                            Candidates who apply via the accredited hostel page or staff portal appear here. You can read their full CV, review their ID, and choose to <strong>Approve & Enrol</strong> them directly into your staff roster or <strong>Reject</strong>.
                          </p>
                        </div>
                      </div>

                      {staffApplications.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No candidate applications received yet</p>
                          <p className="text-[11px] text-slate-400 mt-1">Applications submitted by candidates on your hostel listing will appear here in real time.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {staffApplications.map(app => (
                            <div 
                              key={app.id}
                              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4 hover:border-blue-200 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                                    {app.applicantName?.slice(0, 2)?.toUpperCase() || 'ST'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-black text-slate-900">{app.applicantName}</h4>
                                      <span className="text-[10px] font-bold text-slate-400">({app.appliedAt || 'Recent'})</span>
                                    </div>
                                    <p className="text-xs font-bold text-blue-700">{app.role}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    app.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                    app.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-900'
                                  }`}>
                                    {app.status === 'pending' ? 'Pending Review' : app.status}
                                  </span>
                                </div>
                              </div>

                              {/* Candidate Contact & ID Details */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Phone:</span>
                                  <a href={`tel:${app.phone}`} className="font-semibold text-blue-700 hover:underline">{app.phone}</a>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Email:</span>
                                  <a href={`mailto:${app.email}`} className="font-semibold text-slate-800 hover:underline truncate block">{app.email}</a>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Ghana Card / ID:</span>
                                  <span className="font-semibold text-slate-800">{app.nationalId || 'Provided in Document'}</span>
                                </div>
                              </div>

                              {/* Brief cover note / experience */}
                              {app.coverLetter && (
                                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-slate-700">
                                  <span className="font-bold text-blue-900 block text-[10px] uppercase mb-0.5">Candidate Note:</span>
                                  <p className="italic">"{app.coverLetter}"</p>
                                </div>
                              )}

                              {/* Action Buttons: Read CV, View ID, Approve, Reject */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <div className="flex items-center gap-2">
                                  {/* Read CV Button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCvApp(app)}
                                    className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Read CV Document</span>
                                  </button>

                                  {/* ID Attachment preview if present */}
                                  {app.idDocumentUrl && (
                                    <a
                                      href={app.idDocumentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Inspect National ID</span>
                                    </a>
                                  )}
                                </div>

                                {/* Decision Controls for Pending Applications */}
                                {app.status === 'pending' ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStaffAppDecision(app.id, 'Rejected')}
                                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setApproveModalApp(app);
                                        setApproveShift('Day Shift (8 AM - 5 PM)');
                                        setApproveBlock('All Blocks');
                                      }}
                                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Approve & Enrol</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-xs font-bold text-slate-500">
                                    Decision recorded: <span className="font-black text-slate-800">{app.status}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* SUBTAB 3: RECRUITMENT SETTINGS                            */}
                  {/* ======================================================== */}
                  {staffSubTab === 'recruitment' && (
                    <div className="space-y-6">
                      <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl text-white space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-amber-400" />
                            <span>Public Staff Recruitment & Vacancy Broadcaster</span>
                          </h4>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            hiringOpen ? 'bg-emerald-400 text-slate-950' : 'bg-slate-400 text-slate-900'
                          }`}>
                            {hiringOpen ? 'Hiring Open' : 'Hiring Paused'}
                          </span>
                        </div>
                        <p className="text-xs text-blue-100">
                          These roles are broadcast directly on your hostel's public page. Interested candidates can apply and attach their CVs for you to review.
                        </p>
                      </div>

                      {/* Hiring Switch */}
                      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Accept Staff Applications</span>
                          <span className="text-[11px] text-slate-500">Allow job seekers to submit CVs and applications for this hostel</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHiringOpen(!hiringOpen)}
                          className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            hiringOpen ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <div className="bg-white w-5 h-5 rounded-full shadow-md transform" />
                        </button>
                      </div>

                      {/* Open Roles List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Open Roles Broadcasted</h4>
                        
                        <div className="space-y-2">
                          {recruitmentRoles.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl text-xs">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <div>
                                  <span className="font-bold text-slate-900">{r.role}</span>
                                  <span className="text-[11px] text-slate-500 block">
                                    Vacancies: {r.vacancies || 1} &bull; Shift: {r.shift || 'Day Shift'}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRecruitmentRole(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add Role Form */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <span className="text-xs font-bold text-slate-900 block">Add Needed Role</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Role Title</label>
                              <select
                                value={newRecruitRole}
                                onChange={(e) => setNewRecruitRole(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                              >
                                <option value="Facilities & Maintenance Technician">Facilities & Maintenance Technician</option>
                                <option value="Plumber & Water Systems Lead">Plumber & Water Systems Lead</option>
                                <option value="Electrician & Backup Power Specialist">Electrician & Backup Power Specialist</option>
                                <option value="Head of Security & Gate Operations">Head of Security & Gate Operations</option>
                                <option value="Security Officer (Night Shift)">Security Officer (Night Shift)</option>
                                <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                                <option value="Front Desk Operations Lead">Front Desk Operations Lead</option>
                                <option value="Hostel Warden / Residential Assistant">Hostel Warden / Residential Assistant</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Number of Vacancies</label>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={newRecruitVacancies}
                                onChange={(e) => setNewRecruitVacancies(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 block mb-1">Preferred Shift</label>
                              <select
                                value={newRecruitShift}
                                onChange={(e) => setNewRecruitShift(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                              >
                                <option value="Day Shift (8 AM - 5 PM)">Day Shift (8 AM - 5 PM)</option>
                                <option value="Night Shift (6 PM - 6 AM)">Night Shift (6 PM - 6 AM)</option>
                                <option value="Morning Shift (6 AM - 2 PM)">Morning Shift (6 AM - 2 PM)</option>
                                <option value="Flexible / Rotating">Flexible / Rotating</option>
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddRecruitmentRole}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            + Add Role to List
                          </button>
                        </div>

                        {/* Save Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSaveRecruitment}
                            disabled={savingRecruitment}
                            className="w-full sm:w-auto px-8 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            {savingRecruitment ? (
                              <span>Saving Recruitment Settings...</span>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Save & Publish Open Roles to Hostel Info</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* ADD STAFF MODAL */}
                {showAddStaffModal && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-blue-200/80 space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
                        <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleAddStaff} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                          <input 
                            type="text" 
                            value={newStaffName} 
                            onChange={(e) => setNewStaffName(e.target.value)} 
                            placeholder="e.g. Kwame Mensah" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Role & Department</label>
                            <select 
                              value={newStaffRole} 
                              onChange={(e) => setNewStaffRole(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                            >
                              <option value="Front Desk Operations Lead">Front Desk Operations Lead</option>
                              <option value="Head of Security & Biometrics">Head of Security & Biometrics</option>
                              <option value="Security Officer">Security Officer</option>
                              <option value="Facilities & Maintenance Technician">Facilities & Maintenance Technician</option>
                              <option value="Plumber & Water Systems Lead">Plumber & Water Systems Lead</option>
                              <option value="Electrical & Power Lead">Electrical & Power Lead</option>
                              <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                            <input 
                              type="text" 
                              value={newStaffPhone} 
                              onChange={(e) => setNewStaffPhone(e.target.value)} 
                              placeholder="+233 24 000 0000" 
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                          <input 
                            type="email" 
                            value={newStaffEmail} 
                            onChange={(e) => setNewStaffEmail(e.target.value)} 
                            placeholder="staff@pinevela.com" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Work Shift</label>
                            <select 
                              value={newStaffShift} 
                              onChange={(e) => setNewStaffShift(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                            >
                              <option value="Day Shift (8 AM - 5 PM)">Day Shift (8 AM - 5 PM)</option>
                              <option value="Night Shift (6 PM - 6 AM)">Night Shift (6 PM - 6 AM)</option>
                              <option value="Morning Shift (6 AM - 2 PM)">Morning Shift (6 AM - 2 PM)</option>
                              <option value="On-Call 24/7">On-Call 24/7</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Wing</label>
                            <select 
                              value={newStaffBlock} 
                              onChange={(e) => setNewStaffBlock(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                            >
                              <option value="All Blocks">All Blocks</option>
                              <option value="Block A (Alpha)">Block A (Alpha)</option>
                              <option value="Block B (Beta)">Block B (Beta)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                          <button 
                            type="button" 
                            onClick={() => setShowAddStaffModal(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                          >
                            Save Staff Record
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* CV VIEWER MODAL */}
                {selectedCvApp && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-blue-200/80 space-y-4 max-h-[90vh] flex flex-col">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span>Curriculum Vitae (CV) — {selectedCvApp.applicantName}</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">Role: <strong>{selectedCvApp.role}</strong> &bull; File: {selectedCvApp.cvFileName || 'CV Document'}</p>
                        </div>
                        <button onClick={() => setSelectedCvApp(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                          <XCircle className="w-5 h-5 text-slate-500" />
                        </button>
                      </div>

                      {/* CV Display Content */}
                      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                        {selectedCvApp.cvData && selectedCvApp.cvData.startsWith('data:image/') ? (
                          <img 
                            src={selectedCvApp.cvData} 
                            alt="CV Document" 
                            className="max-w-full rounded-xl shadow-sm border border-slate-200 mx-auto"
                          />
                        ) : selectedCvApp.cvData && selectedCvApp.cvData.startsWith('data:application/pdf') ? (
                          <iframe
                            src={selectedCvApp.cvData}
                            title="CV PDF"
                            className="w-full h-96 rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
                            <div className="border-b pb-2">
                              <h4 className="text-lg font-black text-slate-900">{selectedCvApp.applicantName}</h4>
                              <p className="text-xs text-blue-700 font-bold">{selectedCvApp.role}</p>
                              <p className="text-xs text-slate-500">Phone: {selectedCvApp.phone} | Email: {selectedCvApp.email}</p>
                            </div>
                            <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                              <p className="font-bold text-slate-900">National ID: <span className="font-normal">{selectedCvApp.nationalId || 'Verified on application'}</span></p>
                              <p className="font-bold text-slate-900">Professional Summary:</p>
                              <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                {selectedCvApp.coverLetter || 'Experienced technician/supervisor seeking full-time assignment at an accredited university hostel.'}
                              </p>
                              <p className="font-bold text-slate-900">Attached File:</p>
                              <p className="text-[11px] text-slate-500 font-mono">{selectedCvApp.cvFileName || 'Document delivered to manager'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          Applicant Phone: <strong className="text-slate-900">{selectedCvApp.phone}</strong>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCvApp(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Close
                          </button>
                          {selectedCvApp.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => {
                                setApproveModalApp(selectedCvApp);
                                setSelectedCvApp(null);
                              }}
                              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve & Enrol</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APPROVE & ENROL MODAL */}
                {approveModalApp && (
                  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-emerald-200 space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                            <span>Enrol Candidate into Staff Roster</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">{approveModalApp.applicantName} &bull; {approveModalApp.role}</p>
                        </div>
                        <button onClick={() => setApproveModalApp(null)} className="text-slate-400 hover:text-slate-600">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Assign Shift</label>
                          <select
                            value={approveShift}
                            onChange={(e) => setApproveShift(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                          >
                            <option value="Day Shift (8 AM - 5 PM)">Day Shift (8 AM - 5 PM)</option>
                            <option value="Night Shift (6 PM - 6 AM)">Night Shift (6 PM - 6 AM)</option>
                            <option value="Morning Shift (6 AM - 2 PM)">Morning Shift (6 AM - 2 PM)</option>
                            <option value="On-Call 24/7">On-Call 24/7</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Assign Wing / Block</label>
                          <select
                            value={approveBlock}
                            onChange={(e) => setApproveBlock(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                          >
                            <option value="All Blocks">All Blocks</option>
                            <option value="Block A (Alpha)">Block A (Alpha)</option>
                            <option value="Block B (Beta)">Block B (Beta)</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                        Approving this candidate will automatically notify them and add their active profile to your staff directory.
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setApproveModalApp(null)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStaffAppDecision(approveModalApp.id, 'Approved', approveShift, approveBlock)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirm & Enrol Staff</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: MAINTENANCE */}
            {activeTab === 'maintenance' && (
              <div className="animate-fadeIn relative z-10 space-y-6">
                <div className="bg-white/70 border border-blue-200/50 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-lg space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-blue-600" />
                        <span>Maintenance Dispatch & Work Orders</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Track and resolve plumbing, electrical, Wi-Fi, and structural work orders across all residence wings.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddIssueModal(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start md:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Log Maintenance Ticket</span>
                    </button>
                  </div>

                  {/* Filter chips */}
                  <div className="flex gap-2">
                    {(['all', 'Open', 'In Progress', 'Resolved'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setMaintenanceFilter(filter)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                          maintenanceFilter === filter 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {filter} {filter === 'all' ? `(${maintenanceIssues.length})` : ''}
                      </button>
                    ))}
                  </div>

                  {/* Tickets List */}
                  <div className="space-y-4">
                    {filteredIssues.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                        No maintenance tickets matching current filter.
                      </div>
                    ) : (
                      filteredIssues.map(ticket => (
                        <div key={ticket.id} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {ticket.status}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                ticket.urgency === 'Emergency' ? 'bg-rose-100 text-rose-700' :
                                ticket.urgency === 'High' ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {ticket.urgency} Urgency
                              </span>
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {ticket.category}
                              </span>
                              <span className="text-[10px] text-slate-400">Location: {ticket.roomNumber}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>
                            <p className="text-xs text-slate-600">{ticket.description}</p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <button 
                              onClick={() => handleToggleIssueStatus(ticket.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                ticket.status === 'Resolved'
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : ticket.status === 'In Progress'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                              }`}
                            >
                              {ticket.status === 'Open' ? 'Mark In Progress' :
                               ticket.status === 'In Progress' ? 'Mark Resolved' : 'Reopen Ticket'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* LOG MAINTENANCE MODAL */}
                {showAddIssueModal && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-blue-200/80 space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h3 className="text-lg font-bold text-slate-900">Log Maintenance Work Order</h3>
                        <button onClick={() => setShowAddIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleAddMaintenance} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Issue Title</label>
                          <input 
                            type="text" 
                            value={newIssueTitle} 
                            onChange={(e) => setNewIssueTitle(e.target.value)} 
                            placeholder="e.g. Water leak in Room A104 bathroom" 
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                            <select 
                              value={newIssueCategory} 
                              onChange={(e) => setNewIssueCategory(e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                            >
                              <option value="Plumbing & Water">Plumbing & Water</option>
                              <option value="Electrical & Power">Electrical & Power</option>
                              <option value="Wi-Fi & Telecom">Wi-Fi & Telecom</option>
                              <option value="Doors & Biometric Locks">Doors & Biometric Locks</option>
                              <option value="Structural & Air Conditioning">Structural & Air Conditioning</option>
                              <option value="Sanitation & Housekeeping">Sanitation & Housekeeping</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Location / Room Number</label>
                            <input 
                              type="text" 
                              value={newIssueRoom} 
                              onChange={(e) => setNewIssueRoom(e.target.value)} 
                              placeholder="e.g. Room A104" 
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Urgency</label>
                          <select 
                            value={newIssueUrgency} 
                            onChange={(e) => setNewIssueUrgency(e.target.value as any)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                          >
                            <option value="Normal">Normal Priority</option>
                            <option value="High">High Priority</option>
                            <option value="Emergency">Emergency Priority</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                          <textarea 
                            rows={3} 
                            value={newIssueDescription} 
                            onChange={(e) => setNewIssueDescription(e.target.value)} 
                            placeholder="Provide any additional technical notes or technician directions..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                          <button 
                            type="button" 
                            onClick={() => setShowAddIssueModal(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                          >
                            Dispatch Work Order
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: MEETINGS & CONSULTATION LOGS */}
            {activeTab === 'meetings' && (
              <div className="animate-fadeIn relative z-10 max-w-5xl mx-auto space-y-6 pt-2">
                <ManagerMeetingsTab 
                  currentUser={user} 
                  primaryHostel={primaryProperty} 
                />
              </div>
            )}

            {/* TAB 7: NOTIFICATIONS & ADMIN BOARD */}
            {activeTab === 'notifications' && (
              <div className="animate-fadeIn relative z-10 max-w-4xl mx-auto space-y-6 pt-2">
                {!hasAnyProperty && (
                  <div className="bg-gradient-to-br from-blue-600 to-cyan-700 border border-blue-400/50 p-8 md:p-10 rounded-3xl shadow-xl shadow-blue-900/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl mix-blend-overlay"></div>
                    <div className="relative z-10 space-y-4">
                      <h2 className="text-3xl font-black tracking-tight">Welcome to PineVela, {user?.name || 'Manager'}!</h2>
                      <p className="text-sm font-medium text-blue-100 max-w-2xl leading-relaxed">
                        Your manager account has been successfully verified. To unlock your dashboard and begin accepting students, you need to register your official residence property.
                      </p>
                      <button
                        onClick={() => setShowRegistration(true)}
                        className="mt-6 px-6 py-3.5 bg-white text-blue-800 font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <Building2 className="w-5 h-5" />
                        <span>Register a Hostel to Start Onboarding</span>
                      </button>
                    </div>
                  </div>
                )}

                {hasAnyProperty && !hasApprovedProperty && (
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 border border-amber-400/50 p-8 md:p-10 rounded-3xl shadow-xl shadow-amber-900/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div>
                    <div className="relative z-10 space-y-4">
                      <h2 className="text-3xl font-black tracking-tight">Property Registration Pending Review</h2>
                      <p className="text-sm font-medium text-amber-50 max-w-2xl leading-relaxed">
                        Your property <strong>"{properties[0]?.name}"</strong> is currently under review by the administration. Once approved, your operational dashboard will be fully unlocked.
                      </p>
                    </div>
                  </div>
                )}

                {hasApprovedProperty && (
                  <>
                    {/* OFFICIAL WELCOME BANNER FOR APPROVED MANAGERS */}
                    <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-blue-950 border border-emerald-400/40 p-8 md:p-10 rounded-3xl shadow-2xl shadow-emerald-950/20 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
                      
                      <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 border border-white/25 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Accredited Community Partner</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                          Welcome to the PineVela Community, {user?.name || 'Manager'}!
                        </h2>

                        <p className="text-sm font-medium text-emerald-50 max-w-2xl leading-relaxed">
                          Congratulations on successfully registering your residence with the PineVela community! Your property <strong>"{primaryProperty?.name || 'Your Residence'}"</strong> has been approved by the housing administration. All operational tabs are now fully unlocked — you can manage room capacity, view bookings, assign staff, and coordinate student services.
                        </p>

                        <div className="pt-2 flex flex-wrap gap-3">
                          <button
                            onClick={() => setActiveTab('overview')}
                            className="px-5 py-2.5 bg-white text-emerald-950 font-black text-xs rounded-xl shadow-lg hover:bg-emerald-50 hover:scale-[1.02] transition-all cursor-pointer inline-flex items-center gap-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Go to Operations Overview</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('blocks')}
                            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
                          >
                            <Layers className="w-4 h-4" />
                            <span>Explore Blocks & Room Rates</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Alerts & Admin Board Direct Line</h2>

                    {/* MANAGER TO ADMIN BOARD REQUESTS */}
                    <div className="bg-white/90 border border-blue-200/70 p-6 md:p-8 rounded-3xl backdrop-blur-xl shadow-lg space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-blue-100 pb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            <span>Send Operational Request to Admin Board</span>
                          </h3>
                          <p className="text-xs text-slate-500">Submit official requests, capacity updates, inquiries, or urgent alerts directly to the PineVela administrative board.</p>
                        </div>
                        <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full self-start md:self-auto">
                          Direct Line to Admin
                        </span>
                      </div>

                      <form onSubmit={handleSendBoardRequest} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Request Category</label>
                        <select
                          value={newRequestCategory}
                          onChange={(e) => setNewRequestCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                        >
                          <option value="Room Capacity Adjustment">Room Capacity Adjustment</option>
                          <option value="Fee Rate & Pricing Update">Fee Rate & Pricing Update</option>
                          <option value="Property Details Revision">Property Details Revision</option>
                          <option value="Verification & Compliance">Verification & Compliance</option>
                          <option value="Urgent Maintenance / Inspection">Urgent Maintenance / Inspection</option>
                          <option value="General Inquiry">General Inquiry</option>
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Priority Level</label>
                        <select
                          value={newRequestPriority}
                          onChange={(e) => setNewRequestPriority(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                        >
                          <option value="Normal">Normal Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Urgent">Urgent Priority</option>
                        </select>
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Request Subject</label>
                        <input
                          type="text"
                          value={newRequestSubject}
                          onChange={(e) => setNewRequestSubject(e.target.value)}
                          placeholder="e.g., Request to add 10 beds to North Wing"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation / Justification</label>
                      <textarea
                        rows={3}
                        value={newRequestMessage}
                        onChange={(e) => setNewRequestMessage(e.target.value)}
                        placeholder="Provide relevant details or documentation regarding your operational request..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingRequest ? 'Transmitting...' : 'Send Request to Admin Board'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Sent Requests Audit */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                      <span>Your Sent Requests to Admin Board</span>
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full">{boardRequests.length} Total</span>
                    </h4>

                    {boardRequests.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-400">No requests sent to the Admin Board yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {boardRequests.map((req: any, i: number) => (
                          <div key={`${req.id || 'board'}-${i}`} className="bg-slate-50/80 border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  req.status === 'Acknowledged' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  Status: {req.status || 'Pending'}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                  {req.category}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  req.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                  req.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                  'bg-slate-200 text-slate-700'
                                }`}>
                                  {req.priority} Priority
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recent'}
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-slate-900">{req.subject}</h5>
                              <p className="text-xs text-slate-600 leading-relaxed">{req.message}</p>

                              {req.adminNotes && (
                                <div className="mt-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Admin Board Response:</p>
                                  <p className="text-xs text-emerald-900 mt-0.5">{req.adminNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* MANAGER PROFILE EDIT MODAL */}
      <ManagerProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        currentUser={user}
        onSave={handleSaveProfile}
      />

      {/* MANAGER ACCOUNT SETTINGS MODAL */}
      <ManagerAccountSettingsModal
        isOpen={showAccountSettingsModal}
        onClose={() => setShowAccountSettingsModal(false)}
        currentUser={user}
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      <LogoutConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        userRole="Hostel Manager"
        userName={user?.name || 'Manager'}
      />

      {/* WELCOME ONBOARDING POPUP */}
      <AnimatePresence>
        {showWelcomePopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative max-w-md w-full bg-blue-50/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/80 shadow-2xl shadow-blue-950/30 text-center space-y-6"
            >
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-white/50 transition-colors cursor-pointer"
                title="Dismiss dialog"
              >
                <XCircle size={20} />
              </button>

              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                <Building2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-blue-950 tracking-tight">
                  Welcome to PineVela!
                </h3>
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Onboarding Initiated</span>
                </p>
              </div>

              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Hello, <strong>{user?.name || 'Manager'}</strong>! Your manager profile is successfully verified. 
                To unlock your operational dashboard and start accepting students, tap the button below to register your official residence property.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowWelcomePopup(false);
                    setShowRegistration(true);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black rounded-2xl text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Register a Hostel to Start</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
