import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hostel, BookingRequest, IssueReport, Staff } from '../types';
import PineLogo from './PineLogo';
import {
  LayoutDashboard,
  CalendarCheck,
  Wrench,
  Building,
  LogOut,
  Bell,
  Search,
  Check,
  X,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Save,
  CheckCircle,
  Activity,
  Calendar,
  Video,
  MessageCircle,
  Users,
  MessageSquare,
  Trash2
} from 'lucide-react';

interface Page10HostelManagerDashboardProps {
  hostel: Hostel;
  bookingRequests: BookingRequest[];
  issueReports: IssueReport[];
  onLogout: () => void;
  onUpdateHostel: (updatedHostel: Hostel) => void;
  onAddActivity: (text: string, type: 'success' | 'warning' | 'info' | 'danger') => void;
}

export default function Page10HostelManagerDashboard({
  hostel,
  bookingRequests,
  issueReports,
  onLogout,
  onUpdateHostel,
  onAddActivity
}: Page10HostelManagerDashboardProps) {
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'maintenance' | 'details' | 'meetings' | 'staff'>('dashboard');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Staff registration form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Technician');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffContactMethod, setNewStaffContactMethod] = useState<'WhatsApp' | 'Email'>('WhatsApp');
  const [newStaffEmail, setNewStaffEmail] = useState('');

  // Editable fields for Hostel Details
  const [description, setDescription] = useState(hostel.description || '');
  const [managerPhone, setManagerPhone] = useState(hostel.managerPhone || '');
  const [managerEmail, setManagerEmail] = useState(hostel.managerEmail || '');
  const [hostelStatus, setHostelStatus] = useState(hostel.status || 'Open');
  const [bedsLeft, setBedsLeft] = useState(hostel.bedsLeft || 0);

  // Synchronize local states when the hostel prop loads asynchronously
  useEffect(() => {
    if (hostel && hostel.id) {
      setDescription(hostel.description || '');
      setManagerPhone(hostel.managerPhone || '');
      setManagerEmail(hostel.managerEmail || '');
      setHostelStatus(hostel.status || 'Open');
      setBedsLeft(hostel.bedsLeft || 0);
    }
  }, [hostel]);

  const fetchMeetings = async () => {
    try {
      const data = await apiFetch('/api/meetings');
      setMeetings(data);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await apiFetch('/api/staff');
      setStaffList(data);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchStaff();
  }, []);

  const handleUpdateMeetingStatus = async (meetingId: string, status: 'Approved' | 'Declined') => {
    try {
      await apiFetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      triggerToast(`Meeting has been successfully ${status.toLowerCase()}!`);
      fetchMeetings();
      const targetMeeting = meetings.find(m => m.id === meetingId);
      const studentName = targetMeeting?.studentName || 'Student';
      onAddActivity(`Updated meeting status to ${status} for ${studentName}`, status === 'Approved' ? 'success' : 'danger');
    } catch (err: any) {
      triggerToast(`Failed to update meeting: ${err.message}`);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter lists to only show items belonging to THIS hostel
  // (Fuzzy match in case some descriptions have block letters)
  const isMatch = (name: string, target: string) => {
    return name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(name.toLowerCase());
  };

  // Handle local states to make page highly reactive
  const [localBookings, setLocalBookings] = useState<BookingRequest[]>(() => {
    // Return bookings for this hostel or generate 2 realistic initial ones if none match
    const filtered = bookingRequests.filter(req => isMatch(req.hostelName, hostel.name));
    if (filtered.length === 0) {
      return [
        {
          id: `book-m1-${hostel.id}`,
          studentName: 'Julian Alvarez',
          studentId: 'STU-4819',
          roomType: 'Premium Single Bed',
          hostelName: hostel.name,
          avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
          status: 'Pending'
        },
        {
          id: `book-m2-${hostel.id}`,
          studentName: 'Maya Angelou',
          studentId: 'STU-2940',
          roomType: 'Standard Double Shared',
          hostelName: hostel.name,
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
          status: 'Pending'
        }
      ];
    }
    return filtered;
  });

  const [localIssues, setLocalIssues] = useState<IssueReport[]>(() => {
    const filtered = issueReports.filter(issue => isMatch(issue.hostelName, hostel.name));
    if (filtered.length === 0) {
      return [
        {
          id: `issue-m1-${hostel.id}`,
          title: 'Ceiling Fan Controller Broken',
          category: 'Electrical',
          urgency: 'Medium',
          description: 'The fan controller in Room 204 only operates at maximum speed or turns off completely.',
          photos: [],
          contactMethod: 'In-app Notification',
          studentName: 'Marcus Aurelius',
          studentId: 'STU-1001',
          hostelName: hostel.name,
          blockFloor: 'Block A, 2nd Floor',
          roomBed: 'Room 204, Bed B',
          status: 'Pending',
          date: '2026-06-28'
        }
      ];
    }
    return filtered;
  });

  // Action: Approve booking
  const handleApproveBooking = async (id: string, studentName: string) => {
    try {
      const updated = await apiFetch(`/api/booking-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved' })
      });
      setLocalBookings(prev =>
        prev.map(b => (b.id === id ? updated : b))
      );
      // Decrease beds left automatically
      if (bedsLeft > 0) {
        const newBeds = bedsLeft - 1;
        setBedsLeft(newBeds);
        onUpdateHostel({ ...hostel, bedsLeft: newBeds });
      }
      triggerToast(`Booking approved for ${studentName}! Space allocated.`);
      onAddActivity(`Approved booking for ${studentName} at ${hostel.name}`, 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to approve booking: ${err.message}`);
    }
  };

  // Action: Reject booking
  const handleRejectBooking = async (id: string, studentName: string) => {
    try {
      const updated = await apiFetch(`/api/booking-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Ignored' })
      });
      setLocalBookings(prev =>
        prev.map(b => (b.id === id ? updated : b))
      );
      triggerToast(`Booking request ignored for ${studentName}.`);
      onAddActivity(`Rejected booking for ${studentName} at ${hostel.name}`, 'warning');
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to reject booking: ${err.message}`);
    }
  };

  // Action: Update maintenance status
  const handleUpdateIssueStatus = async (id: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    const issue = localIssues.find(i => i.id === id);
    if (!issue) return;

    if (newStatus === 'Resolved' && !issue.studentAcceptedResolved) {
      triggerToast(`⚠️ Student confirmation required before resolving!`);
      return;
    }

    try {
      const updated = await apiFetch(`/api/issue-reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setLocalIssues(prev =>
        prev.map(i => (i.id === id ? updated : i))
      );
      triggerToast(`Maintenance report status changed to: ${newStatus}`);
      onAddActivity(`Updated maintenance status to ${newStatus} for report #${id.substring(0, 5)}`, 'info');
    } catch (err: any) {
      console.error("Failed to update issue status:", err);
      triggerToast("Failed to update issue status on server.");
    }
  };

  const handleAssignStaff = async (issueId: string, staffId: string) => {
    if (!staffId) return;
    try {
      const updated = await apiFetch(`/api/issue-reports/${issueId}`, {
        method: 'PUT',
        body: JSON.stringify({ assignedStaffId: staffId, status: 'In Progress' })
      });
      setLocalIssues(prev => prev.map(issue => issue.id === issueId ? updated : issue));
      triggerToast('Staff assigned successfully! Job is now In Progress.');
      onAddActivity(`Assigned staff member to maintenance ticket #${issueId.substring(0, 5)}`, 'info');
    } catch (err) {
      console.error("Failed to assign staff:", err);
      triggerToast('Failed to assign staff member.');
    }
  };

  const handleRegisterStaff = async (staffData: { name: string, role: string, phone: string, contactMethod: 'WhatsApp' | 'Email', email?: string }) => {
    try {
      const created = await apiFetch('/api/staff', {
        method: 'POST',
        body: JSON.stringify({
          ...staffData,
          hostelId: hostel.id
        })
      });
      setStaffList(prev => [...prev, created]);
      triggerToast(`Staff "${staffData.name}" registered successfully!`);
      onAddActivity(`Registered new staff member: ${staffData.name} (${staffData.role})`, 'success');
      return true;
    } catch (err) {
      console.error("Failed to register staff:", err);
      triggerToast('Failed to register staff.');
      return false;
    }
  };

  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${name}"?`)) return;
    try {
      await apiFetch(`/api/staff/${staffId}`, {
        method: 'DELETE'
      });
      setStaffList(prev => prev.filter(s => s.id !== staffId));
      triggerToast(`Staff "${name}" removed successfully.`);
      onAddActivity(`Removed staff member: ${name}`, 'warning');
    } catch (err) {
      console.error("Failed to delete staff:", err);
      triggerToast('Failed to delete staff.');
    }
  };

  // Action: Save Details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Hostel = {
      ...hostel,
      description,
      managerPhone,
      managerEmail,
      status: hostelStatus,
      bedsLeft
    };
    onUpdateHostel(updated);
    triggerToast('Hostel configurations saved successfully!');
    onAddActivity(`Hostel manager updated details for ${hostel.name}`, 'success');
  };

  // Stats Counters
  const pendingBookingsCount = localBookings.filter(b => b.status === 'Pending').length;
  const pendingIssuesCount = localIssues.filter(i => i.status !== 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in flex items-center gap-2">
          <CheckCircle size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <PineLogo />
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Hostel Portal: {hostel.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900">{hostel.managerName}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Property Manager</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <aside className="w-full lg:w-64 bg-slate-900 text-slate-400 p-4 lg:py-6 flex flex-col justify-between shrink-0 gap-4 border-r border-slate-800">
          <div className="space-y-6">
            {/* Tiny mini-card */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🏫</span>
                <span className="text-white text-xs font-black truncate">{hostel.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin size={10} className="text-slate-400 shrink-0" />
                <span className="truncate">{hostel.location}</span>
              </p>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </div>
                {pendingBookingsCount + pendingIssuesCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {pendingBookingsCount + pendingIssuesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'bookings'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck size={16} />
                  <span>Booking Requests</span>
                </div>
                {pendingBookingsCount > 0 && (
                  <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {pendingBookingsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('maintenance')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'maintenance'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wrench size={16} />
                  <span>Maintenance Logs</span>
                </div>
                {pendingIssuesCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-red-400 sos-glow flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-ping"></span>
                    <span>{pendingIssuesCount} SOS</span>
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('details')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'details'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Building size={16} />
                <span>Configure Hostel</span>
              </button>

              <button
                onClick={() => setActiveTab('meetings')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'meetings'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={16} />
                  <span>Meeting Requests</span>
                </div>
                {meetings.filter(m => m.status === 'Pending').length > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {meetings.filter(m => m.status === 'Pending').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all ${
                  activeTab === 'staff'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users size={16} />
                <span>Staff Directory</span>
              </button>
            </nav>
          </div>

          {/* Secure Badge */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Isolated Manager Session</span>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all text-left"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Dashboard Main Content Area */}
        <main className="flex-grow p-6 lg:p-8 overflow-y-auto space-y-8 max-w-7xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' && 'Operations Dashboard'}
                {activeTab === 'bookings' && 'Booking Requests Directory'}
                {activeTab === 'maintenance' && 'Maintenance Log Control'}
                {activeTab === 'details' && 'Configure Hostel Properties'}
                {activeTab === 'meetings' && 'Student Meeting Advisory'}
                {activeTab === 'staff' && 'Staff Directory & Management'}
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                {activeTab === 'dashboard' && 'Live performance metric analysis and pending work reviews'}
                {activeTab === 'bookings' && 'Approve student reservation requests and allocate bed spaces'}
                {activeTab === 'maintenance' && 'Track physical room repairs, update status, and manage tasks'}
                {activeTab === 'details' && 'Update hostel descriptions, public status indicators, and contact points'}
                {activeTab === 'meetings' && 'Approve, schedule, and review advisory, online or physical meeting requests'}
                {activeTab === 'staff' && 'Register and manage designated maintenance staff, plumbers, technicians, and wardens'}
              </p>
            </div>

            {/* Quick Status indicators */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                hostelStatus === 'Open' ? 'bg-emerald-100 text-emerald-800' :
                hostelStatus === 'Full' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                STATUS: {hostelStatus}
              </span>
              <span className="bg-slate-200 text-slate-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                {bedsLeft} / {hostel.totalCapacity} BEDS FREE
              </span>
            </div>
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* BIG SOS MAINTENANCE ALERTS BOARD */}
              {localIssues.filter(i => i.status !== 'Resolved').length > 0 && (
                <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-6 shadow-xl space-y-6 sos-glow relative overflow-hidden text-left">
                  {/* Decorative glowing background elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/40 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-red-200 pb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl animate-bounce">🚨</span>
                      <div>
                        <h2 className="text-lg font-black text-red-700 tracking-tight flex items-center gap-2 uppercase">
                          Emergency Maintenance SOS Panel
                        </h2>
                        <p className="text-xs text-red-600 font-semibold sos-text-pulse">
                          Immediate response required. {localIssues.filter(i => i.status !== 'Resolved').length} active issues reported.
                        </p>
                      </div>
                    </div>
                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                      <span>CRITICAL</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    {localIssues.filter(i => i.status !== 'Resolved').map((issue) => (
                      <div key={issue.id} className="bg-white rounded-xl border border-red-100 p-5 shadow-sm space-y-4 hover:border-red-300 transition-all">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                issue.urgency === 'High' ? 'bg-red-100 text-red-800' :
                                issue.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {issue.urgency} Urgency
                              </span>
                              <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                {issue.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">{issue.date}</span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 mt-1">{issue.title}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {issue.studentAcceptedResolved ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                ✓ Student Confirmed Resolved
                              </span>
                            ) : (
                              <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                                ⚠️ Awaiting Student Confirmation
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-2">
                            <p className="text-slate-700">
                              <span className="font-bold text-slate-900 block">Description:</span>
                              <span className="text-slate-600 italic">
                                {issue.description || 'No description provided.'}
                              </span>
                            </p>

                            {issue.photos && issue.photos.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-slate-900 block">Attachments:</span>
                                <div className="flex gap-2">
                                  {issue.photos.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                                      <img src={url} alt="maintenance proof" className="w-16 h-16 object-cover" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Reporter & Location Details</span>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Student Name</p>
                                <p className="font-bold text-slate-950">{issue.studentName}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Student ID</p>
                                <p className="font-mono text-slate-700">{issue.studentId}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Block & Floor</p>
                                <p className="font-semibold text-slate-950">{issue.blockFloor}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Room & Bed</p>
                                <p className="font-semibold text-slate-950">{issue.roomBed}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-2">Staff Assignment</span>
                              {issue.assignedStaffId ? (
                                (() => {
                                  const assignedStaff = staffList.find(s => s.id === issue.assignedStaffId);
                                  if (!assignedStaff) return <p className="text-[11px] text-slate-500 italic">Assigned to staff (ID: {issue.assignedStaffId})</p>;
                                  return (
                                    <div className="space-y-2">
                                      <div>
                                        <p className="font-bold text-slate-900">{assignedStaff.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{assignedStaff.role}</p>
                                      </div>
                                      
                                      <div className="pt-1">
                                        {issue.staffCompleted ? (
                                          <span className="bg-emerald-105 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-200 block text-center uppercase tracking-wide bg-emerald-100">
                                            ✓ Job Done by Staff
                                          </span>
                                        ) : (
                                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded border border-amber-200 block text-center uppercase tracking-wide animate-pulse">
                                            ⚡ Work In Progress
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-slate-500 italic">No staff assigned to this issue yet.</p>
                                  <select
                                    className="bg-white border border-slate-200 text-xs py-1 px-2 rounded-lg text-slate-800 focus:outline-none w-full font-semibold cursor-pointer"
                                    defaultValue=""
                                    onChange={(e) => handleAssignStaff(issue.id, e.target.value)}
                                  >
                                    <option value="" disabled>Select Staff Member...</option>
                                    {staffList.map(s => (
                                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            {issue.assignedStaffId && (() => {
                              const assignedStaff = staffList.find(s => s.id === issue.assignedStaffId);
                              if (!assignedStaff) return null;
                              return (
                                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                                  <a
                                    href={`tel:${assignedStaff.phone}`}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-bold transition-colors"
                                  >
                                    <Phone size={11} /> Call
                                  </a>
                                  
                                  {assignedStaff.contactMethod === 'WhatsApp' ? (
                                    <a
                                      href={`https://wa.me/${assignedStaff.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${assignedStaff.name}, regarding the maintenance job "${issue.title}" at ${issue.hostelName} (${issue.blockFloor}, room ${issue.roomBed}). Please attend to it.`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-705 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-colors bg-emerald-100 text-emerald-800"
                                    >
                                      <MessageSquare size={11} /> WhatsApp
                                    </a>
                                  ) : (
                                    <a
                                      href={`mailto:${assignedStaff.email || ''}?subject=${encodeURIComponent(`Job Assignment: ${issue.title}`)}&body=${encodeURIComponent(`Hello ${assignedStaff.name},\n\nYou have been assigned to: "${issue.title}"\nLocation: ${issue.blockFloor}, ${issue.roomBed}\nDescription: ${issue.description || 'N/A'}\n\nPlease update status when completed.`)}`}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-bold transition-colors"
                                    >
                                      <Mail size={11} /> Email
                                    </a>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          {issue.studentAcceptedResolved ? (
                            <button
                              onClick={() => handleUpdateIssueStatus(issue.id, 'Resolved')}
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer font-bold"
                            >
                              <span>Resolve and Close</span>
                            </button>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                              <span className="text-[10px] text-amber-600 font-bold italic">
                                Disabled: The student must confirm the issue as resolved on their end first.
                              </span>
                              <button
                                disabled
                                className="px-6 py-2.5 bg-slate-200 text-slate-400 font-black text-xs rounded-xl cursor-not-allowed border border-slate-300 font-bold"
                              >
                                Resolve (Locked)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stat cards row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bed Capacity</p>
                  <p className="text-3xl font-black text-slate-900">{hostel.totalCapacity}</p>
                  <p className="text-[11px] text-slate-500">Fixed institutional baseline</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available Beds Left</p>
                  <p className="text-3xl font-black text-blue-600">{bedsLeft}</p>
                  <p className="text-[11px] text-slate-500">Ready for instant allocation</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Occupancy Rate</p>
                  <p className="text-3xl font-black text-emerald-600">
                    {Math.round(((hostel.totalCapacity - bedsLeft) / hostel.totalCapacity) * 100)}%
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {hostel.totalCapacity - bedsLeft} residents currently checked in
                  </p>
                </div>

                <div className={`p-5 rounded-xl border transition-all space-y-2 ${
                  pendingIssuesCount > 0 
                    ? 'bg-red-50 border-red-400 shadow-lg sos-glow' 
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <p className={`text-[10px] font-black uppercase tracking-wider ${pendingIssuesCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    Active Issues {pendingIssuesCount > 0 && '🚨'}
                  </p>
                  <p className={`text-3xl font-black ${pendingIssuesCount > 0 ? 'text-red-600' : 'text-slate-950'}`}>
                    {pendingIssuesCount}
                  </p>
                  <p className={`text-[11px] ${pendingIssuesCount > 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                    {pendingIssuesCount > 0 ? 'Action Required: SOS Alert Triggered' : 'Unresolved maintenance items'}
                  </p>
                </div>
              </div>

              {/* Two column lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Urgent Bookings Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span className="text-blue-500">📌</span> Urgent Booking Requests
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingBookingsCount} Pending
                    </span>
                  </div>

                  <div className="p-4 divide-y divide-slate-100 flex-1">
                    {localBookings.filter(b => b.status === 'Pending').length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <span className="text-2xl">✨</span>
                        <p className="text-xs text-slate-500 font-semibold">All booking requests approved or cleared!</p>
                      </div>
                    ) : (
                      localBookings
                        .filter(b => b.status === 'Pending')
                        .slice(0, 3)
                        .map(b => (
                          <div key={b.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <img src={b.avatar} alt="" className="w-9 h-9 rounded-full object-cover border" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{b.studentName}</h4>
                                <p className="text-[10px] text-slate-500">{b.studentId} • Room Type: <span className="font-semibold text-slate-700">{b.roomType}</span></p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApproveBooking(b.id, b.studentName)}
                                className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-colors"
                                title="Approve Booking"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleRejectBooking(b.id, b.studentName)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-colors"
                                title="Ignore Request"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Maintenance Quick Review */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <span className="text-amber-500">🛠️</span> Pending Maintenance issues
                    </h3>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingIssuesCount} Open
                    </span>
                  </div>

                  <div className="p-4 divide-y divide-slate-100 flex-1">
                    {localIssues.filter(i => i.status !== 'Resolved').length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <span className="text-2xl">🌱</span>
                        <p className="text-xs text-slate-500 font-semibold">No pending maintenance concerns in your hostel!</p>
                      </div>
                    ) : (
                      localIssues
                        .filter(i => i.status !== 'Resolved')
                        .slice(0, 3)
                        .map(i => (
                          <div key={i.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  i.urgency === 'High' ? 'bg-red-100 text-red-800' :
                                  i.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                                }`}>
                                  {i.urgency} Priority
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">{i.date}</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900">{i.title}</h4>
                              <p className="text-[10px] text-slate-500 font-semibold">{i.blockFloor} • {i.roomBed}</p>
                            </div>

                            {i.studentAcceptedResolved ? (
                              <button
                                onClick={() => handleUpdateIssueStatus(i.id, 'Resolved')}
                                className="px-2.5 py-1 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                              >
                                Resolve
                              </button>
                            ) : (
                              <button
                                disabled
                                title="Awaiting student confirmation"
                                className="px-2.5 py-1 border border-slate-200 bg-slate-100 text-slate-400 font-bold text-[10px] rounded-lg cursor-not-allowed"
                              >
                                Locked
                              </button>
                            )}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS DIRECTORY */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {/* Filter tools */}
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm max-w-md">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search reservations by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs focus:outline-none bg-transparent"
                />
              </div>

              {/* Reservations table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6">ID & Room Category</th>
                      <th className="py-4 px-6">Allocated Hostel</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {localBookings
                      .filter(b => b.studentName.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <img src={b.avatar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                              <span>{b.studentName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-medium">
                            <p className="font-bold text-slate-800">{b.studentId}</p>
                            <p className="text-[10px] text-slate-500">{b.roomType}</p>
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-medium">
                            {b.hostelName}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {b.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveBooking(b.id, b.studentName)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Check size={12} /> Approve
                                </button>
                                <button
                                  onClick={() => handleRejectBooking(b.id, b.studentName)}
                                  className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-colors"
                                >
                                  Ignore
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold italic">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    {localBookings.filter(b => b.studentName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                          No reservation requests matching search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE LOGS */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              {/* Logs table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-4 px-6">Issue & Date</th>
                      <th className="py-4 px-6">Student Filer</th>
                      <th className="py-4 px-6">Location Specs</th>
                      <th className="py-4 px-6">Urgency</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Status Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {localIssues.map(issue => (
                      <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 space-y-1">
                          <p className="font-bold text-slate-900">{issue.title}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock size={11} /> {issue.date}
                          </p>
                          {issue.description && (
                            <p className="text-[11px] text-slate-400 max-w-sm truncate italic">
                              "{issue.description}"
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700">
                          <p>{issue.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{issue.studentId}</p>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">
                          <p>{issue.blockFloor}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{issue.roomBed}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            issue.urgency === 'High' ? 'bg-red-100 text-red-800' :
                            issue.urgency === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {issue.urgency}
                          </span>
                        </td>
                        <td className="py-4 px-6 space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {issue.status}
                          </span>
                          <div className="pt-0.5">
                            {issue.studentAcceptedResolved ? (
                              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">
                                ✓ Student Confirmed
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-600 font-medium bg-amber-50 px-1 py-0.5 rounded border border-amber-100">
                                ⏳ Pending Student
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {issue.status !== 'Resolved' ? (
                            <div className="flex flex-col items-end gap-1">
                              <select
                                value={issue.status}
                                onChange={(e) => handleUpdateIssueStatus(issue.id, e.target.value as any)}
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold py-1 px-2 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved" disabled={!issue.studentAcceptedResolved}>
                                  Resolved {!issue.studentAcceptedResolved ? "(Locked)" : ""}
                                </option>
                              </select>
                              {!issue.studentAcceptedResolved && (
                                <span className="text-[9px] text-slate-400 italic">
                                  Student confirmation required
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-extrabold flex items-center justify-end gap-1">
                              <CheckCircle size={12} /> Resolved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {localIssues.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                          No registered maintenance reports found for this property.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CONFIGURE HOSTEL DETAILS */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
              <form onSubmit={handleSaveDetails} className="space-y-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Hostel Public Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-3 bg-slate-50 text-slate-800 text-xs leading-relaxed"
                    placeholder="Describe your hostel amenities..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Property Manager Phone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        value={managerPhone}
                        onChange={(e) => setManagerPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Property Manager Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        value={managerEmail}
                        onChange={(e) => setManagerEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Public Availability Status</label>
                    <select
                      value={hostelStatus}
                      onChange={(e) => setHostelStatus(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2.5 bg-slate-50 text-slate-800 text-xs transition-all cursor-pointer font-semibold"
                    >
                      <option value="Open">Open (Accepting Bookings)</option>
                      <option value="Full">Full (At Maximum Capacity)</option>
                      <option value="Under Maintenance">Under Maintenance (Offline)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Available Bed Spaces</label>
                    <input
                      type="number"
                      min={0}
                      max={hostel.totalCapacity}
                      value={bedsLeft}
                      onChange={(e) => setBedsLeft(parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2 bg-slate-50 text-slate-800 text-xs transition-all font-semibold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    <Save size={14} />
                    <span>Save Hostel Configurations</span>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 5: MEETING ADVISORY MANAGEMENT */}
          {activeTab === 'meetings' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Student Advisory Appointments</h3>
                  <p className="text-xs text-slate-500 mt-1">Pending and historical student appointment requests for guidance, issues, and inquiries</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    {meetings.filter(m => m.status === 'Pending').length} Pending Requests
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    {meetings.length} Total Registered
                  </span>
                </div>
              </div>

              {meetings.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Calendar size={20} />
                  </div>
                  <p className="text-slate-900 text-xs font-bold">No meeting requests found</p>
                  <p className="text-slate-400 text-[11px] max-w-sm mx-auto">Student advisory meetings will appear here once booked via the student portal dashboard.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/20">
                        <th className="py-4 px-6">Student Information</th>
                        <th className="py-4 px-6">Appointment Type</th>
                        <th className="py-4 px-6">Date & Schedule</th>
                        <th className="py-4 px-6">Agenda Reason</th>
                        <th className="py-4 px-6">Current Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {meetings.map((meet) => {
                        return (
                          <tr key={meet.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-blue-700 uppercase">
                                  {meet.studentName ? meet.studentName.charAt(0) : 'S'}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900">{meet.studentName || 'Alex Thompson'}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">ID: {meet.studentId || 'STU-2024-8842'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                {(() => {
                                  const normalizedType = meet.type ? meet.type.toLowerCase().replace('-', ' ') : '';
                                  if (normalizedType.includes('video') || normalizedType.includes('call')) {
                                    return (
                                      <span className="flex items-center gap-1 text-sky-600 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                                        <Video size={12} />
                                        <span className="capitalize text-[10px]">Video Call</span>
                                      </span>
                                    );
                                  }
                                  if (normalizedType.includes('chat')) {
                                    return (
                                      <span className="flex items-center gap-1 text-teal-600 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                                        <MessageCircle size={12} />
                                        <span className="capitalize text-[10px]">Instant Chat</span>
                                      </span>
                                    );
                                  }
                                  if (normalizedType.includes('person')) {
                                    return (
                                      <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                                        <User size={12} />
                                        <span className="capitalize text-[10px]">In Person</span>
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[10px] text-slate-500 font-medium">{meet.type}</span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-800">{meet.date}</p>
                                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                  <Clock size={10} />
                                  <span>{meet.time}</span>
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-slate-600 max-w-xs truncate font-medium" title={meet.reason}>
                                {meet.reason || 'Academic schedule query and space details'}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                meet.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                meet.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {meet.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {meet.status === 'Pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleUpdateMeetingStatus(meet.id, 'Approved')}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                                    title="Approve Meeting"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateMeetingStatus(meet.id, 'Declined')}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors border border-rose-200"
                                    title="Decline Meeting"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: STAFF DIRECTORY & REGISTRATION */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Registered Staff List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Registered Maintenance Staff</h3>
                  <p className="text-xs text-slate-500 mt-1">Designated staff members handling maintenance and repairs for this property</p>
                </div>

                {staffList.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Users size={20} />
                    </div>
                    <p className="text-slate-900 text-xs font-bold">No registered staff found</p>
                    <p className="text-slate-400 text-[11px] max-w-sm mx-auto">Use the registration form on the right to register technicians, plumbers, and wardens.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/20">
                          <th className="py-4 px-6">Staff Member</th>
                          <th className="py-4 px-6">Designation/Role</th>
                          <th className="py-4 px-6">Contact Preference</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {staffList.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-slate-950">{member.name}</p>
                              <div className="text-[10px] text-slate-400 font-mono space-y-0.5 mt-0.5">
                                <p>ID: {member.id}</p>
                                <p className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded border border-blue-100 inline-block">
                                  User: {member.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff'}{member.id.substring(member.id.length - 3)} / staff123
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                                {member.role}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold">
                              <p className="text-slate-800">{member.phone}</p>
                              <p className="text-[10px] text-slate-400 font-medium">via {member.contactMethod}</p>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`tel:${member.phone}`}
                                  className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                  title="Call Staff"
                                >
                                  <Phone size={13} />
                                </a>

                                {member.contactMethod === 'WhatsApp' ? (
                                  <a
                                    href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, this is the PineVela Hostel Manager.')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                    title="WhatsApp Message"
                                  >
                                    <MessageSquare size={13} />
                                  </a>
                                ) : (
                                  <a
                                    href={`mailto:${member.email || ''}?subject=PineVela%20Maintenance`}
                                    className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                                    title="Send Email"
                                  >
                                    <Mail size={13} />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteStaff(member.id, member.name)}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                                  title="Remove Staff"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Registration Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between max-h-[550px] text-left">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newStaffName.trim() || !newStaffPhone.trim()) {
                      triggerToast('Please provide name and phone number');
                      return;
                    }
                    const success = await handleRegisterStaff({
                      name: newStaffName,
                      role: newStaffRole,
                      phone: newStaffPhone,
                      contactMethod: newStaffContactMethod,
                      email: newStaffEmail
                    });
                    if (success) {
                      setNewStaffName('');
                      setNewStaffPhone('');
                      setNewStaffEmail('');
                    }
                  }}
                  className="space-y-4 text-left"
                >
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Register Staff Member</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add technicians or plumbers to dispatch for physical complaints</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Full Name</label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2.5 bg-slate-50 text-slate-800 text-xs transition-all font-semibold"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Designation/Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2.5 bg-slate-50 text-slate-800 text-xs transition-all font-semibold cursor-pointer"
                    >
                      <option value="Technician">General Technician</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="Warden">Hostel Warden</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Phone Number</label>
                    <input
                      type="text"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2.5 bg-slate-50 text-slate-800 text-xs transition-all font-semibold"
                      placeholder="e.g. +23324123456"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">Preferred Contact Method</label>
                    <select
                      value={newStaffContactMethod}
                      onChange={(e) => setNewStaffContactMethod(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2.5 bg-slate-50 text-slate-800 text-xs transition-all font-semibold cursor-pointer"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  {newStaffContactMethod === 'Email' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">Email Address</label>
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 p-2.5 bg-slate-50 text-slate-800 text-xs transition-all font-semibold"
                        placeholder="e.g. email@pinevela.com"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer font-bold"
                    >
                      Register Staff Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
