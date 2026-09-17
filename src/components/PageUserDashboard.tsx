import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { safeJson, hashPassword } from '../lib/api';
import PineLogo from './PineLogo';
import UserAvatarSelector, { renderAvatarGraphic } from './UserAvatarSelector';
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
  AlertTriangle,
  Landmark,
  Users,
  Star,
  Briefcase,
  Trash2,
  KeyRound,
  Lock,
  ShieldAlert,
  GraduationCap,
  School,
  Building,
  User,
  BookOpen,
  CheckCircle,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IssueReport, HostelRoomKey, StudentDirectMessage } from '../types';

export default function PageUserDashboard() {
  const { user, logout, apiFetch, updateUser, setSessionUser } = useAuth();
  const { notifications, unreadCount, registeredAccounts, markAsRead, pushToast } = useNotifications();
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'notifications' | 'options' | 'overview' | 'issues' | 'messages' | 'announcements' | 'settings' | 'register-resident' | 'become-staff' | 'login-room'>('home');

  // Data states
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [messages, setMessages] = useState<StudentDirectMessage[]>([]);
  const [roomKeyDetails, setRoomKeyDetails] = useState<HostelRoomKey | null>(null);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [studentUser, setStudentUser] = useState<any>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [accreditedStaff, setAccreditedStaff] = useState<any[]>([]);
  const [registeredResidents, setRegisteredResidents] = useState<any[]>([]);
  const [availableHostels, setAvailableHostels] = useState<any[]>([]);
  const [viewingHostelModal, setViewingHostelModal] = useState<any | null>(null);

  // Add Room Modal states (Up to 5 rooms)
  const [showAddRoomModal, setShowAddRoomModal] = useState<boolean>(false);
  const [addRoomKeyInput, setAddRoomKeyInput] = useState<string>('');
  const [verifyingAddKey, setVerifyingAddKey] = useState<boolean>(false);
  const [verifiedAddKeyInfo, setVerifiedAddKeyInfo] = useState<any | null>(null);
  const [addRoomError, setAddRoomError] = useState<string | null>(null);
  const [submittingAddRoom, setSubmittingAddRoom] = useState<boolean>(false);

  // Delete Room Modal state
  const [deletingRoomTarget, setDeletingRoomTarget] = useState<any | null>(null);
  const [submittingDeleteRoom, setSubmittingDeleteRoom] = useState<boolean>(false);
  const [delRoomEmailInput, setDelRoomEmailInput] = useState<string>('');
  const [delRoomPasswordInput, setDelRoomPasswordInput] = useState<string>('');
  const [delRoomError, setDelRoomError] = useState<string | null>(null);

  const currentUser = studentUser || user;

  // Room key display states
  const [showRoomKey, setShowRoomKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [showSignoutConfirmModal, setShowSignoutConfirmModal] = useState<boolean>(false);

  // New Issue Modal states
  const [showNewIssueModal, setShowNewIssueModal] = useState<boolean>(false);
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [issueCategory, setIssueCategory] = useState<string>('Plumbing');
  const [issueUrgency, setIssueUrgency] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [issueSubArea, setIssueSubArea] = useState<string>('Bathroom / Shower / WC');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [issuePhotos, setIssuePhotos] = useState<string[]>([]);
  const [issueVisitWindow, setIssueVisitWindow] = useState<string>('Morning (8:00 AM - 12:00 PM)');
  const [issueContactPhone, setIssueContactPhone] = useState<string>('');
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

  // Room Key Claim Modal & Resident Account Creation states
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(false);
  const [claimRoomKeyInput, setClaimRoomKeyInput] = useState<string>('');
  const [verifyingKey, setVerifyingKey] = useState<boolean>(false);
  const [verifiedKeyInfo, setVerifiedKeyInfo] = useState<any | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [claimStep, setClaimStep] = useState<1 | 2 | 3 | 4>(1); // 1: Category & Digital Key, 2: Personal & Academic Info, 3: Password & Security, 4: Success Confirmed
  const [claimCustomType, setClaimCustomType] = useState<string>('');
  const [claimDepartment, setClaimDepartment] = useState<string>('');
  const [claimConfirmPassword, setClaimConfirmPassword] = useState<string>('');
  const [showClaimPassword, setShowClaimPassword] = useState<boolean>(false);
  const [showClaimConfirmPassword, setShowClaimConfirmPassword] = useState<boolean>(false);
  const [claimAgreeTerms, setClaimAgreeTerms] = useState<boolean>(true);

  // Resident Account Creation fields on key claim
  const [claimStudentName, setClaimStudentName] = useState<string>('');
  const [claimStudentId, setClaimStudentId] = useState<string>('');
  const [claimResidentType, setClaimResidentType] = useState<'student' | 'resident' | 'other'>('student');
  const [claimInstitution, setClaimInstitution] = useState<string>('');
  const [claimProgram, setClaimProgram] = useState<string>('');
  const [claimStudentPhone, setClaimStudentPhone] = useState<string>('');
  const [claimEmail, setClaimEmail] = useState<string>('');
  const [claimEmailChoice, setClaimEmailChoice] = useState<'custom' | 'same'>('custom');
  const [claimPassword, setClaimPassword] = useState<string>('');
  const [quickLoggingInRoomKey, setQuickLoggingInRoomKey] = useState<string | null>(null);

  // Reset Password Modal states
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<boolean>(false);
  const [resetTargetRole, setResetTargetRole] = useState<'manager' | 'staff' | 'resident'>('manager');
  const [resetTargetEmail, setResetTargetEmail] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState<boolean>(false);

  // Delete Account Modal states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [deleteTargetRole, setDeleteTargetRole] = useState<'manager' | 'staff' | 'resident'>('manager');
  const [deleteTargetEmail, setDeleteTargetEmail] = useState<string>('');
  const [deletePasswordInput, setDeletePasswordInput] = useState<string>('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);

  useEffect(() => {
    if (user && user.id) {
      const shown = localStorage.getItem(`pinevela_welcome_shown_${user.id}`);
      if (!shown) {
        setShowWelcomePopup(true);
        localStorage.setItem(`pinevela_welcome_shown_${user.id}`, 'true');
      }
    }
  }, [user]);

  // Image zoom viewer modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    pushToast(msg, undefined, type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Fetch student & users portal data on mount
  const loadStudentData = async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    try {
      // Fetch user registered Manager/Staff/Resident accounts
      try {
        const token = localStorage.getItem('pinevela_auth_token') || (currentUser as any)?.token;
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const uEmail = (currentUser?.email || '').toLowerCase().trim();
        const uId = currentUser?.id || '';
        const regRes = await fetch(`/api/users/my-registered-accounts?email=${encodeURIComponent(uEmail)}&userId=${encodeURIComponent(uId)}`, { headers });
        if (regRes.ok) {
          const regData = await safeJson(regRes);
          
          if (regData.managerAccount && uEmail) {
            try {
              const localMgrs = JSON.parse(localStorage.getItem('pinevela_registered_managers') || '[]');
              let updated = false;
              const syncedMgrs = localMgrs.map((m: any) => {
                const mEmail = (m.email || '').toLowerCase().trim();
                const mParentEmail = (m.parentUserEmail || '').toLowerCase().trim();
                if ((mEmail !== '' && mEmail === uEmail) || (mParentEmail !== '' && mParentEmail === uEmail)) {
                  updated = true;
                  return {
                    ...m,
                    status: regData.managerAccount.status,
                    isApproved: regData.managerAccount.isApproved,
                    isVerified: regData.managerAccount.isVerified
                  };
                }
                return m;
              });
              if (updated) {
                localStorage.setItem('pinevela_registered_managers', JSON.stringify(syncedMgrs));
              }
            } catch (storageErr) {
              console.warn("Storage sync error:", storageErr);
            }
          }

          if (regData.staffAccount && uEmail) {
            try {
              const localStaff = JSON.parse(localStorage.getItem('pinevela_registered_staff') || '[]');
              let updated = false;
              const syncedStaff = localStaff.map((s: any) => {
                const sEmail = (s.email || '').toLowerCase().trim();
                const sParentEmail = (s.parentUserEmail || '').toLowerCase().trim();
                if ((sEmail !== '' && sEmail === uEmail) || (sParentEmail !== '' && sParentEmail === uEmail)) {
                  updated = true;
                  return {
                    ...s,
                    status: regData.staffAccount.status,
                    isApproved: regData.staffAccount.isApproved,
                    isVerified: regData.staffAccount.isVerified
                  };
                }
                return s;
              });
              if (updated) {
                localStorage.setItem('pinevela_registered_staff', JSON.stringify(syncedStaff));
              }
            } catch (storageErr) {
              console.warn("Staff storage sync error:", storageErr);
            }
          }

          // Check local fallbacks if server is still indexing
          if (!regData.managerAccount && uEmail) {
            try {
              const localMgrs = JSON.parse(localStorage.getItem('pinevela_registered_managers') || '[]');
              const matchedLocalMgr = localMgrs.find((m: any) => {
                const mEmail = (m.email || '').toLowerCase().trim();
                const mParentEmail = (m.parentUserEmail || '').toLowerCase().trim();
                return Boolean(uEmail) && ((mEmail !== '' && mEmail === uEmail) || (mParentEmail !== '' && mParentEmail === uEmail));
              });
              if (matchedLocalMgr) {
                const isAppr = matchedLocalMgr.status === 'approved' || matchedLocalMgr.isApproved === true;
                const isRej = matchedLocalMgr.status === 'rejected' || matchedLocalMgr.isRejected === true;
                regData.managerAccount = {
                  id: `local-mgr-${Date.now()}`,
                  name: matchedLocalMgr.name || 'Hostel Manager',
                  email: matchedLocalMgr.email || uEmail,
                  organizationName: matchedLocalMgr.organization || 'PineVela Operations',
                  status: isAppr ? 'approved' : (isRej ? 'rejected' : 'pending'),
                  displayStatus: isAppr ? 'Approved' : (isRej ? 'Rejected' : 'Pending Admin Approval'),
                  isApproved: isAppr,
                  isVerified: isAppr,
                  isRejected: isRej,
                  submittedAt: matchedLocalMgr.savedAt || new Date().toISOString()
                };
              }
            } catch (storageErr) {
              console.warn("Storage fallback error:", storageErr);
            }
          }

          if (!regData.staffAccount && uEmail) {
            try {
              const localStaff = JSON.parse(localStorage.getItem('pinevela_registered_staff') || '[]');
              const matchedLocalStaff = localStaff.find((s: any) => {
                const sEmail = (s.email || '').toLowerCase().trim();
                const sParentEmail = (s.parentUserEmail || '').toLowerCase().trim();
                return Boolean(uEmail) && ((sEmail !== '' && sEmail === uEmail) || (sParentEmail !== '' && sParentEmail === uEmail));
              });
              if (matchedLocalStaff) {
                const isVer = matchedLocalStaff.status === 'Verified' || matchedLocalStaff.status === 'approved' || matchedLocalStaff.isVerified === true;
                const isRej = matchedLocalStaff.status === 'rejected' || matchedLocalStaff.isRejected === true;
                regData.staffAccount = {
                  id: `local-stf-${Date.now()}`,
                  name: matchedLocalStaff.name || 'Accredited Staff Member',
                  email: matchedLocalStaff.email || uEmail,
                  specialization: matchedLocalStaff.specialization || 'Maintenance Specialist',
                  status: isVer ? 'Verified' : (isRej ? 'Rejected' : 'Pending'),
                  displayStatus: isVer ? 'Verified & Accredited Staff' : (isRej ? 'Rejected' : 'Pending Admin Verification'),
                  isVerified: isVer,
                  isApproved: isVer,
                  isRejected: isRej,
                  submittedAt: matchedLocalStaff.savedAt || new Date().toISOString()
                };
              }
            } catch (storageErr) {
              console.warn("Staff storage fallback error:", storageErr);
            }
          }

          if (regData.residentRooms && Array.isArray(regData.residentRooms) && regData.residentRooms.length > 0) {
            const mappedRooms: HostelRoomKey[] = regData.residentRooms.map((rk: any) => ({
              id: rk.roomKey || rk.id,
              hostelId: rk.hostelId || '',
              hostelName: rk.hostelName || 'PineVela Student Residence',
              blockName: rk.blockName || 'Block A',
              blockInitial: ((rk.blockName || 'A')[0] || 'A').toUpperCase(),
              roomNumber: rk.roomNumber || '101',
              roomKey: rk.roomKey || rk.id,
              status: 'Occupied' as const,
              isAssigned: true,
              assignedStudentId: rk.assignedStudentId || rk.studentId || rk.residentId,
              assignedStudentName: rk.assignedStudentName || rk.studentName || rk.name,
              assignedStudentEmail: rk.assignedStudentEmail || rk.studentEmail || rk.email,
              assignedStudentPhone: rk.assignedStudentPhone || rk.studentPhone || rk.phone,
              assignedResidentType: rk.assignedResidentType || rk.residentType,
              assignedProgram: rk.assignedProgram || rk.programOfStudy,
              assignedDepartment: rk.assignedDepartment || rk.department,
              assignedInstitution: rk.assignedInstitution || rk.institution,
              managerName: rk.managerName,
              managerPhone: rk.managerPhone,
              assignedAt: rk.assignedAt || rk.submittedAt || rk.claimedAt || new Date().toISOString(),
              createdAt: rk.assignedAt || rk.submittedAt || rk.claimedAt || new Date().toISOString()
            }));
            setUserRooms(mappedRooms);
            if (mappedRooms[0]) {
              setRoomKeyDetails(mappedRooms[0]);
            }
          } else if (regData.residentAccount) {
            const defaultRoom: HostelRoomKey = {
              id: regData.residentAccount.roomKey,
              hostelId: regData.residentAccount.hostelId || '',
              hostelName: regData.residentAccount.hostelName || 'PineVela Student Residence',
              blockName: regData.residentAccount.blockName || 'Block A',
              blockInitial: ((regData.residentAccount.blockName || 'A')[0] || 'A').toUpperCase(),
              roomNumber: regData.residentAccount.roomNumber || '101',
              roomKey: regData.residentAccount.roomKey,
              status: 'Occupied' as const,
              isAssigned: true,
              assignedStudentId: regData.residentAccount.studentId,
              assignedStudentName: regData.residentAccount.name,
              assignedStudentEmail: regData.residentAccount.email,
              assignedStudentPhone: regData.residentAccount.phone,
              assignedResidentType: regData.residentAccount.residentType,
              assignedProgram: regData.residentAccount.programOfStudy,
              assignedDepartment: regData.residentAccount.department,
              assignedInstitution: regData.residentAccount.institution,
              managerName: regData.residentAccount.managerName,
              managerPhone: regData.residentAccount.managerPhone,
              assignedAt: regData.residentAccount.submittedAt || regData.residentAccount.claimedAt || new Date().toISOString(),
              createdAt: regData.residentAccount.submittedAt || regData.residentAccount.claimedAt || new Date().toISOString()
            };
            setRoomKeyDetails(defaultRoom);
            setUserRooms(prev => prev.length > 0 ? prev : [defaultRoom]);
          }
        }
      } catch (e) {
        console.warn("Notice loading registered accounts status:", e);
      }

      // 1. Fetch accredited staff
      try {
        const staffRes = await apiFetch('/api/accredited-staff').catch(() => []);
        if (Array.isArray(staffRes) && staffRes.length > 0) {
          setAccreditedStaff(staffRes);
        }
      } catch (e) {
        console.warn("Notice loading accredited staff:", e);
      }

      // 2. Fetch available hostels
      try {
        const hostelsList = await apiFetch('/api/hostels').catch(() => []);
        if (Array.isArray(hostelsList)) {
          setAvailableHostels(hostelsList);
        }
      } catch (e) {
        console.warn("Notice loading available hostels:", e);
      }

      // 4. Fetch room key record and profile details
      try {
        const profileData = await apiFetch('/api/student/my-profile').catch(() => null);
        if (profileData && profileData.roomKeyDetails) {
          setRoomKeyDetails(profileData.roomKeyDetails);
        }
        if (profileData && profileData.user) {
          setStudentUser(profileData.user);
        }
        if (profileData && Array.isArray(profileData.rooms)) {
          setUserRooms(profileData.rooms);
        } else if (profileData && profileData.roomKeyDetails) {
          setUserRooms([profileData.roomKeyDetails]);
        }
      } catch (e) {
        console.warn("Notice loading student profile:", e);
      }

      if (currentUser?.role === 'user') {
        if (!isSilent) setLoadingData(false);
        return;
      }

      // 5. Fetch student's issue reports
      const issues = await apiFetch('/api/issue-reports').catch(() => []);
      if (Array.isArray(issues)) {
        setIssueReports(issues);
      }

      // 6. Fetch direct messages with manager
      const msgs = await apiFetch('/api/student-messages').catch(() => []);
      if (Array.isArray(msgs)) {
        setMessages(msgs);
      }
    } catch (err) {
      console.error("Error loading student dashboard data:", err);
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  };

  useEffect(() => {
    loadStudentData(false);
    const interval = setInterval(() => loadStudentData(true), 2500);

    const onFocus = () => loadStudentData(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
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
        subArea: issueSubArea,
        locationTag: issueSubArea,
        description: issueDescription.trim(),
        photos: issuePhotos,
        visitWindow: issueVisitWindow,
        contactPhone: issueContactPhone || currentUser?.phone || '',
        contactMethod: issueContactMethod,
        studentId: currentUser?.studentId || currentUser?.id,
        studentName: currentUser?.name || 'Student Resident',
        studentEmail: currentUser?.email || '',
        studentPhone: issueContactPhone || currentUser?.phone || '',
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
      const data = await safeJson(res);
      if (!res.ok || !data.valid) {
        setClaimError(data.error || "Invalid room key. Check with your manager.");
        setVerifiedKeyInfo(null);
      } else {
        setVerifiedKeyInfo(data);
        setClaimError(null);
        setClaimStudentName(data.assignedStudentName || '');
        setClaimStudentId(data.assignedStudentId || '');
        setClaimStudentPhone(data.assignedStudentPhone || '');
        if (data.assignedStudentEmail && currentUser?.email && data.assignedStudentEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
          setClaimEmail(data.assignedStudentEmail);
          setClaimEmailChoice('custom');
        } else if (data.assignedStudentEmail) {
          setClaimEmail(data.assignedStudentEmail);
        }
        setClaimInstitution(data.assignedInstitution || '');
        setClaimProgram(data.assignedProgram || '');
        setClaimDepartment(data.assignedDepartment || '');
        setClaimStep(2); // Progress to profile step
      }
    } catch (err: any) {
      setClaimError("Could not verify key. Check network connection.");
    } finally {
      setVerifyingKey(false);
    }
  };

  // Confirm claim room key & initiate resident/student account creation
  const handleClaimRoomKey = async () => {
    if (!verifiedKeyInfo) return;
    if (!claimStudentName.trim()) {
      setClaimError("Please enter your full legal name for your resident account.");
      return;
    }

    const resolvedEmail = (claimEmailChoice === 'same' ? (currentUser?.email || '') : (claimEmail.trim() || currentUser?.email || '')).toLowerCase().trim();
    if (!resolvedEmail) {
      setClaimError("Please provide a valid email address for your resident account.");
      return;
    }

    const isSameEmailAsUser = currentUser?.email && resolvedEmail === currentUser.email.toLowerCase().trim();
    if (isSameEmailAsUser) {
      const userPlainPass = currentUser?.plainPassword || '';
      const userHashPass = currentUser?.password || '';
      const inputPass = claimPassword.trim();
      const inputPassHash = await hashPassword(inputPass);
      if (
        (userPlainPass && inputPass === userPlainPass) ||
        (userHashPass && (inputPass === userHashPass || inputPassHash === userHashPass))
      ) {
        setClaimError("Because you are using the same email as your primary User account, your resident account password cannot be identical to your User account password. Please choose a different password.");
        return;
      }
    }

    if (claimPassword.trim() && claimConfirmPassword.trim() && claimPassword.trim() !== claimConfirmPassword.trim()) {
      setClaimError("Passwords do not match. Please verify and repeat your password.");
      return;
    }

    const resolvedRoleType = claimResidentType === 'other' ? (claimCustomType.trim() || 'Special Resident') : claimResidentType;
    const rawPassword = claimPassword.trim() || 'student123';
    const hashedPassword = await hashPassword(rawPassword);

    setSubmittingClaim(true);
    try {
      const res = await fetch('/api/room-keys/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomKey: verifiedKeyInfo.roomKey,
          studentId: claimStudentId.trim() || currentUser?.studentId || currentUser?.id || `STU-${Date.now().toString().slice(-4)}`,
          residentId: claimStudentId.trim() || currentUser?.studentId || currentUser?.id || `STU-${Date.now().toString().slice(-4)}`,
          studentName: claimStudentName.trim() || currentUser?.name || 'Student Resident',
          name: claimStudentName.trim() || currentUser?.name || 'Student Resident',
          studentEmail: resolvedEmail,
          email: resolvedEmail,
          parentUserEmail: currentUser?.email || '',
          studentPhone: claimStudentPhone.trim() || currentUser?.phone || '',
          phone: claimStudentPhone.trim() || currentUser?.phone || '',
          institution: claimInstitution.trim() || (claimResidentType === 'student' ? 'University / College' : 'Organization / Independent'),
          programOfStudy: claimProgram.trim() || (claimResidentType === 'student' ? 'General Academic Studies' : 'Professional Resident'),
          department: claimDepartment.trim() || (claimResidentType === 'student' ? 'Academic Department' : 'Resident Division'),
          residentType: resolvedRoleType,
          password: hashedPassword,
          plainPassword: rawPassword,
          userId: currentUser?.id
        })
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setRoomKeyDetails(verifiedKeyInfo);
        triggerToast(`Resident Account Created & Room Key Activated! Connected to ${verifiedKeyInfo.hostelName} (${verifiedKeyInfo.blockName}, Room ${verifiedKeyInfo.roomNumber})`, 'success');
        
        if (updateUser) {
          const newRoomRecord = {
            email: resolvedEmail,
            name: claimStudentName.trim() || currentUser?.name,
            roomKey: verifiedKeyInfo.roomKey,
            roomNumber: verifiedKeyInfo.roomNumber,
            blockName: verifiedKeyInfo.blockName,
            hostelName: verifiedKeyInfo.hostelName,
            hostelId: verifiedKeyInfo.hostelId,
            residentId: claimStudentId.trim() || currentUser?.studentId,
            studentId: claimStudentId.trim() || currentUser?.studentId,
            phone: claimStudentPhone.trim() || currentUser?.phone,
            institution: claimInstitution.trim(),
            program: claimProgram.trim(),
            department: claimDepartment.trim(),
            residentType: resolvedRoleType,
            active: true
          };

          const existingRoomsList = Array.isArray(currentUser?.registeredAccounts?.residentRooms)
            ? currentUser.registeredAccounts.residentRooms
            : (currentUser?.registeredAccounts?.residentAccount ? [currentUser.registeredAccounts.residentAccount] : []);
          
          const updatedRoomsList = [
            ...existingRoomsList.filter((r: any) => (r.roomKey || r.id)?.toUpperCase() !== verifiedKeyInfo.roomKey.toUpperCase()),
            newRoomRecord
          ];

          updateUser({
            registeredAccounts: {
              ...(currentUser?.registeredAccounts || {}),
              residentAccount: newRoomRecord,
              residentRooms: updatedRoomsList
            },
            roomKey: verifiedKeyInfo.roomKey,
            hostelId: verifiedKeyInfo.hostelId,
            hostelName: verifiedKeyInfo.hostelName,
            blockName: verifiedKeyInfo.blockName,
            roomNumber: verifiedKeyInfo.roomNumber
          });
        }
        await loadStudentData();
        setClaimStep(4); // Advance to final success step
      } else {
        setClaimError(data.error || "Failed to link room key and create resident account");
      }
    } catch (err: any) {
      setClaimError("Failed to claim room key and create resident account");
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Quick Log In to Digital Room & switch session to Resident Portal
  const handleQuickLoginToRoom = async (roomData?: any) => {
    const targetRoomKey = roomData?.roomKey || roomData?.id || roomKeyDetails?.roomKey || (userRooms[0] && (userRooms[0].roomKey || userRooms[0].id));
    const targetEmail = (claimEmailChoice === 'same' ? currentUser?.email : (claimEmail.trim() || registeredAccounts?.residentAccount?.email || currentUser?.email || ''));
    const targetStudentId = claimStudentId.trim() || currentUser?.studentId || registeredAccounts?.residentAccount?.studentId || '';

    setQuickLoggingInRoomKey(targetRoomKey || 'default');
    try {
      const res = await fetch('/api/auth/quick-resident-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          studentId: targetStudentId,
          roomKey: targetRoomKey,
          userId: currentUser?.id
        })
      });
      const data = await safeJson(res);
      if (res.ok && data && (data.token || data.id)) {
        if (setSessionUser) {
          setSessionUser(data);
        }
        triggerToast(`Quick Login Successful! Welcome to ${data.hostelName || 'Resident Portal'}.`, 'success');
        navigate('/student/dashboard');
      } else {
        triggerToast(data?.error || "Unable to quick-login to resident account. Please check credentials.", 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || "Failed to perform quick login.", 'error');
    } finally {
      setQuickLoggingInRoomKey(null);
    }
  };

  // Open reset password modal
  const openResetPasswordModal = (role: 'manager' | 'staff' | 'resident', email: string) => {
    setResetTargetRole(role);
    setResetTargetEmail(email);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setResetPasswordError(null);
    setShowResetPasswordModal(true);
  };

  // Submit password reset
  const handleResetRegisteredAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setResetPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setResetPasswordError("Passwords do not match. Please verify.");
      return;
    }

    setResettingPassword(true);
    setResetPasswordError(null);
    try {
      const res = await fetch('/api/users/reset-registered-account-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: resetTargetRole,
          email: resetTargetEmail,
          newPassword: newPasswordInput
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        setResetPasswordError(data.error || "Failed to reset password.");
      } else {
        setShowResetPasswordModal(false);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        triggerToast(`Password reset successfully for your registered ${resetTargetRole} account!`);
      }
    } catch (err: any) {
      setResetPasswordError(err.message || "Failed to reset password. Check connection.");
    } finally {
      setResettingPassword(false);
    }
  };

  // Open delete account modal
  const openDeleteAccountModal = (role: 'manager' | 'staff' | 'resident', email: string) => {
    setDeleteTargetRole(role);
    setDeleteTargetEmail(email);
    setDeletePasswordInput('');
    setDeleteAccountError(null);
    setShowDeleteAccountModal(true);
  };

  // Submit account deletion (unlocks registration)
  const handleDeleteRegisteredAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      const res = await fetch('/api/users/delete-registered-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: deleteTargetRole,
          email: deleteTargetEmail,
          password: deletePasswordInput
        })
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        setDeleteAccountError(data.error || "Failed to delete account.");
      } else {
        setShowDeleteAccountModal(false);
        setDeletePasswordInput('');
        triggerToast(`${deleteTargetRole.toUpperCase()} account deleted. You can now start the registration process again.`);
        
        const tEmail = (deleteTargetEmail || currentUser?.email || '').toLowerCase().trim();
        if (deleteTargetRole === 'staff') {
          try {
            const localStaff = JSON.parse(localStorage.getItem('pinevela_registered_staff') || '[]');
            const filteredStaff = localStaff.filter((s: any) => {
              const sEmail = (s.email || '').toLowerCase().trim();
              const sParentEmail = (s.parentUserEmail || '').toLowerCase().trim();
              return sEmail !== tEmail && sParentEmail !== tEmail;
            });
            localStorage.setItem('pinevela_registered_staff', JSON.stringify(filteredStaff));
          } catch (e) {
            console.warn(e);
          }
        } else if (deleteTargetRole === 'manager') {
          try {
            const localMgrs = JSON.parse(localStorage.getItem('pinevela_registered_managers') || '[]');
            const filteredMgrs = localMgrs.filter((m: any) => {
              const mEmail = (m.email || '').toLowerCase().trim();
              const mParentEmail = (m.parentUserEmail || '').toLowerCase().trim();
              return mEmail !== tEmail && mParentEmail !== tEmail;
            });
            localStorage.setItem('pinevela_registered_managers', JSON.stringify(filteredMgrs));
          } catch (e) {
            console.warn(e);
          }
        } else if (deleteTargetRole === 'resident') {
          setRoomKeyDetails(null);
          if (updateUser) {
            updateUser({
              role: 'user',
              roomKey: '',
              hostelId: '',
              hostelName: '',
              blockName: '',
              roomNumber: ''
            });
          }
        }
        await loadStudentData();
      }
    } catch (err: any) {
      setDeleteAccountError(err.message || "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
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

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'home', label: 'Home Tab', sub: 'Residents & Staff Hire', icon: Home },
    { id: 'notifications', label: 'Notifications Tab', sub: `${unreadNotificationsCount > 0 ? `${unreadNotificationsCount} New Alert${unreadNotificationsCount > 1 ? 's' : ''}` : 'Bulletins & Alerts'}`, icon: Bell },
    { id: 'options', label: 'Options Tab', sub: 'Profile & Settings', icon: Settings },
    { 
      id: 'register-resident', 
      label: registeredAccounts.managerAccount ? 'Hostel Manager' : 'Register Your Resident', 
      sub: registeredAccounts.managerAccount 
        ? ((registeredAccounts.managerAccount.status?.toLowerCase() === 'approved') ? 'Verified Account' : (registeredAccounts.managerAccount.status?.toLowerCase() === 'rejected') ? 'Rejected' : 'Pending Approval') 
        : 'Hostel Manager Gateway', 
      icon: Building2 
    },
    { 
      id: 'become-staff', 
      label: registeredAccounts.staffAccount ? 'Staff & Artisan' : 'Become a Staff', 
      sub: registeredAccounts.staffAccount 
        ? ((registeredAccounts.staffAccount.status?.toLowerCase() === 'verified' || registeredAccounts.staffAccount.status?.toLowerCase() === 'approved') ? 'Verified Account' : 'Pending Verification') 
        : 'Staff & Artisan Gateway', 
      icon: Wrench 
    },
    { 
      id: 'login-room', 
      label: (roomKeyDetails || currentUser?.roomKey) ? 'Resident Room' : 'Log Into Your Room', 
      sub: (roomKeyDetails || currentUser?.roomKey) ? `${roomKeyDetails?.blockName || 'Block'} - Room ${roomKeyDetails?.roomNumber || currentUser?.roomNumber || ''}` : 'Activate Digital Room Key', 
      icon: Key 
    }
  ];

  const handleNavClick = (tabId: string) => {
    if (tabId === 'register-resident') {
      setActiveTab('register-resident' as any);
    } else if (tabId === 'become-staff') {
      setActiveTab('become-staff' as any);
    } else if (tabId === 'login-room') {
      setActiveTab('login-room' as any);
    } else {
      setActiveTab(tabId as any);
    }
  };

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

  if (false && currentUser?.role === 'user') {
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

         {/* Sidebar for Base User */}
         <aside className="hidden lg:flex w-72 my-6 ml-6 h-[calc(100vh-3rem)] bg-gradient-to-br from-sky-100/90 via-blue-100/85 to-amber-50/40 backdrop-blur-3xl border border-sky-200/80 shadow-2xl rounded-3xl p-6 flex flex-col justify-between shrink-0 overflow-y-auto z-20">
           <div className="space-y-6">
             <div className="flex items-center space-x-3 px-2">
               <PineLogo size={36} />
               <div>
                 <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                   PineVela Center
                 </h1>
                 <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">Onboarding & Setup</p>
               </div>
             </div>

             <div className="p-3 bg-white/70 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-xs">
               <div className="flex items-center gap-3 overflow-hidden">
                 {renderAvatarGraphic(currentUser?.avatar, "w-10 h-10 text-xs")}
                 <div className="overflow-hidden">
                   <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'PineVela User'}</div>
                   <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md">Generic Identity</span>
                 </div>
               </div>
             </div>
           </div>

           <button
             onClick={() => setShowSignoutConfirmModal(true)}
             className="w-full flex items-center justify-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all shadow-xs cursor-pointer"
           >
             <LogOut className="w-4 h-4" />
             <span>Sign Out Session</span>
           </button>
         </aside>

         {/* Onboarding Dashboard Area */}
         <main className="flex-1 p-6 pb-28 lg:p-10 lg:pb-10 space-y-8 overflow-y-auto h-full relative z-10 flex flex-col justify-start">
           
           {/* Top greeting bar */}
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-sky-100">
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome to PineVela, {currentUser?.name}!</h2>
               <p className="text-xs text-slate-500 font-semibold mt-1">
                 You are currently signed in with a unified generic user profile. Activate your PineVela capabilities below:
               </p>
             </div>
             
             {/* Mobile Sign out button */}
             <button
               onClick={() => setShowSignoutConfirmModal(true)}
               className="lg:hidden w-fit flex items-center space-x-2 bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer"
             >
               <LogOut className="w-4 h-4" />
               <span>Sign Out</span>
             </button>
           </div>

           {/* Capabilities Selection Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
             
             {/* 1. Student / Resident capability card */}
             <div className="bg-white hover:bg-blue-50/20 border border-sky-150 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
               <div className="space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shadow-sm">
                   <Key className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-slate-900 text-base">Resident & Student</h3>
                     <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black uppercase tracking-wider rounded-md">Activate</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Onboard into your designated student room using a digital room key code issued by your hostel manager.
                   </p>
                 </div>
               </div>
               
               <button
                 type="button"
                 onClick={() => {
                   setClaimRoomKeyInput('');
                   setVerifiedKeyInfo(null);
                   setClaimError(null);
                   setShowClaimModal(true);
                 }}
                 className="mt-6 w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>Activate Room Key</span>
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>

             {/* 2. Staff / Artisan capability card */}
             <div className="bg-white hover:bg-amber-50/20 border border-amber-150 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
               <div className="space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shadow-sm">
                   <Wrench className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-slate-900 text-base">Staff & Artisan</h3>
                     <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-md">Register</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Register your professional service skills, set up working credentials, and apply for verified jobs around residences.
                   </p>
                 </div>
               </div>

               <button
                 type="button"
                 onClick={() => {
                   sessionStorage.setItem('navigated_to_staff_register', 'true');
                   navigate('/staff/register');
                 }}
                 className="mt-6 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>Register as Staff</span>
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>

             {/* 3. Hostel / Residence Manager capability card */}
             <div className="bg-white hover:bg-emerald-50/20 border border-emerald-150 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
               <div className="space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shadow-sm">
                   <Home className="w-6 h-6" />
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <h3 className="font-black text-slate-900 text-base">Hostel Manager</h3>
                     <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-md">Manager Setup</span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">
                     Register your hostel properties, manage active student room keys, track bookings, and respond to maintenance reports.
                   </p>
                 </div>
               </div>

               <button
                 type="button"
                 onClick={() => {
                   navigate('/register-manager');
                 }}
                 className="mt-6 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
               >
                 <span>Register Property</span>
                 <ArrowRight className="w-3.5 h-3.5" />
               </button>
             </div>

           </div>

           {/* Guidance Note */}
           <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl max-w-5xl flex items-start gap-4">
             <div className="p-2.5 bg-blue-100 text-blue-900 rounded-xl shrink-0">
               <Sparkles className="w-5 h-5" />
             </div>
             <div className="space-y-1">
               <h4 className="text-sm font-black text-slate-800">Need help onboarding?</h4>
               <p className="text-xs text-slate-650 leading-relaxed font-medium">
                 PineVela uses a Unified User Account. Your single email credentials protect your entire identity. If you are a student, your hostel manager has already generated a Digital Room Key for you. Activating your Room Key will automatically configure your Student Residence Desk.
               </p>
             </div>
           </div>

         </main>

         {/* MODALS */}
         {showClaimModal && (
           <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-200 space-y-5">
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
                   className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
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
                   <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950 animate-in fade-in slide-in-from-bottom-2 duration-150">
                     <div className="font-black flex items-center gap-1.5 text-emerald-850">
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

         {/* SIGN OUT CONFIRMATION MODAL */}
         {showSignoutConfirmModal && (
           <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 border border-slate-100 shadow-2xl">
               <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-xs mx-auto">
                 <PineLogo size={36} hideText={true} />
               </div>
               <div className="space-y-1.5">
                 <h3 className="text-lg font-black text-slate-900 tracking-tight">Sign Out Confirmation</h3>
                 <p className="text-xs text-slate-500 leading-relaxed">
                   Are you sure you want to sign out of your PineVela account?
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
                   className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
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
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('home'); navigate('/student/dashboard'); }}>
          <PineLogo size={24} />
          <div>
            <h1 className="text-xs font-black tracking-tight text-blue-950 leading-tight">PineVela Portal</h1>
            <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{user?.hostelName || 'PineVela Resident'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('options')}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Account Options & Profile"
          >
            {renderAvatarGraphic(currentUser?.avatar, "w-7 h-7 text-[10px]")}
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
              onClick={() => handleNavClick(tab.id)}
              className={`snap-center shrink-0 flex flex-col items-center justify-center w-[64px] h-12 rounded-xl transition-all relative ${
                activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === tab.id ? 'bg-blue-100/50' : ''}`}>
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110 transition-transform' : ''}`} />
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
          <div className="flex items-center space-x-3 px-2 cursor-pointer" onClick={() => { setActiveTab('home'); navigate('/student/dashboard'); }}>
            <PineLogo size={36} />
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-900 to-cyan-800 bg-clip-text text-transparent">
                PineVela Resident
              </h1>
              <p className="text-[10px] font-medium text-blue-600/70 uppercase tracking-widest">User Account</p>
            </div>
          </div>

          {/* Student Profile Pill */}
          <div className="p-3 bg-white/70 border border-blue-200/60 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              {renderAvatarGraphic(currentUser?.avatar, "w-10 h-10 text-xs")}
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'PineVela User'}</div>
                <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                  <span className="truncate">Verified Account</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('options')}
                title="Account Options"
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Footer */}
        <div className="space-y-2 pt-4 border-t border-sky-200/80 mt-4">
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

        {/* TOP USERS BAR: Profile Picture Avatar + Name + Role + Quick Status + Alerts & Settings */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/85 backdrop-blur-xl border border-sky-200/80 p-4 sm:px-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3.5">
            <div 
              className="relative cursor-pointer group shrink-0" 
              onClick={() => setActiveTab('options')}
              title="Click to view Account Options & Profile"
            >
              {renderAvatarGraphic(currentUser?.avatar, "w-12 h-12 text-sm ring-2 ring-blue-500/20 shadow-xs")}
              <div className="absolute -bottom-0.5 -right-0.5 p-1 bg-emerald-500 text-white rounded-full border-2 border-white shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {currentUser?.name || 'PineVela User'}
                </h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {currentUser?.role === 'student' ? 'Resident Account' : currentUser?.role === 'manager' ? 'Hostel Manager' : currentUser?.role === 'staff' ? 'Staff Specialist' : 'PineVela User'}
                </span>
                {(roomKeyDetails || currentUser?.roomKey) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-full text-[10px] font-bold">
                    <Key className="w-2.5 h-2.5" />
                    <span>Room: {roomKeyDetails?.blockName || 'Block'} {roomKeyDetails?.roomNumber || currentUser?.roomNumber || ''}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md mt-0.5">
                {currentUser?.email || 'Logged In Account'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-2 ${activeTab === 'notifications' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'} border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerts</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full leading-none">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`px-3 py-2 ${activeTab === 'options' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'} border rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Options</span>
            </button>
          </div>
        </div>

        {/* TAB 0: HOME TAB (Residents View, Staff View & Gateways) */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-fadeIn relative z-10">
            {/* Available Hostels Section */}
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-700" />
                    Available Hostels & Student Accommodations
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Explore verified student hostels and accommodations available across PineVela.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-900 font-black text-xs rounded-full">
                  {availableHostels.length} Available Hostels
                </span>
              </div>

              {availableHostels.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No available hostels listed yet</div>
                  <p className="text-xs text-slate-500 font-medium">Verified hostel accommodations listed by property managers will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableHostels.map((hostel: any, idx: number) => {
                    const coverImg = hostel?.image || hostel?.imageUrl || hostel?.exteriorPhotoUrl || hostel?.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                    const capacity = hostel.availableSpaces ?? hostel.bedsLeft ?? hostel.totalCapacity ?? 'Available';
                    const managerName = hostel.managerName || hostel.managerEmail || 'Verified Manager';

                    return (
                      <div key={hostel.id || idx} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
                            <img
                              src={coverImg}
                              alt={hostel.name || 'Hostel'}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 bg-blue-900/90 backdrop-blur-sm text-white text-[10px] font-extrabold rounded-full">
                                {capacity} Spaces
                              </span>
                              {hostel.hostelType && (
                                <span className="px-2.5 py-0.5 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black rounded-full shadow-xs">
                                  {hostel.hostelType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 space-y-2.5">
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{hostel.name || 'PineVela Hostel'}</h4>
                              <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                                <MapPin size={12} className="shrink-0 text-slate-400" />
                                <span className="truncate">{hostel.location || 'PineVela Campus Zone'}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                              <span className="text-slate-400 font-medium">Manager:</span>
                              <span className="font-bold text-slate-800 truncate max-w-[150px]">{managerName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            onClick={() => setViewingHostelModal(hostel)}
                            className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 text-slate-800 hover:text-blue-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>View Accommodation</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff & Hire Staff Section (Staff View) */}
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-700" />
                    Staff View: Accredited Staff & Hire Directory
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Verified accredited artisans and maintenance professionals available for job hire on PineVela.
                  </p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-full">
                  {accreditedStaff.length} Accredited Staff
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accreditedStaff.map((staff: any, idx: number) => (
                  <div key={staff.id || idx} className="p-4 bg-amber-50/30 border border-amber-200/80 rounded-2xl space-y-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white font-black text-xs flex items-center justify-center">
                            {staff.name ? staff.name.slice(0, 2).toUpperCase() : 'ST'}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">{staff.name || 'Verified Artisan'}</div>
                            <div className="text-[10px] text-amber-800 font-bold">{staff.role || 'Facilities Technician'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{staff.rating || '4.9'}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {staff.bio || 'Accredited professional specializing in rapid hostel maintenance and repair solutions.'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        triggerToast(`Job offer dispatch interface opened for ${staff.name}`);
                        setActiveTab('issues');
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Hire Staff Member</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-700" />
                    Notifications & Bulletins
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Official notices, digital room key clearances, and maintenance updates.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-900 font-black text-xs rounded-full">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">Welcome to PineVela, {user?.name || 'Resident'}!</h4>
                      <span className="text-[10px] text-slate-400">Account created</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Your account is ready. You can now discover hostels, activate your room key, and access maintenance tools.
                    </p>
                  </div>
                </div>

                {notifications.map((notif, index) => (
                  <div key={`${notif.id}-${index}`} className={`p-4 ${notif.read ? 'bg-slate-50/70' : 'bg-white'} border ${notif.read ? 'border-slate-200/80' : 'border-blue-200/80 shadow-sm'} rounded-2xl flex items-start gap-3.5`}>
                    <div className={`p-2.5 rounded-xl ${notif.type === 'success' ? 'bg-emerald-600' : notif.type === 'warning' ? 'bg-amber-600' : 'bg-slate-800'} text-white shrink-0`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400">{notif.date || 'Recently'}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER RESIDENT / MANAGER TAB */}
        {activeTab === 'register-resident' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            {registeredAccounts.managerAccount ? (
              <div className="bg-white/95 border border-emerald-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shadow-xs">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {registeredAccounts.managerAccount.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {registeredAccounts.managerAccount.organizationName || 'PineVela Property Manager'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {(registeredAccounts.managerAccount.status?.toLowerCase() === 'approved') ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Approved & Verified Manager</span>
                      </span>
                    ) : (registeredAccounts.managerAccount.status?.toLowerCase() === 'rejected') ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-black">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Registration Rejected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span>Pending Admin Approval</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Official Manager Credentials & Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Full Name</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.managerAccount.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Organization / Property</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.managerAccount.organizationName || 'PineVela'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Official Contact Email</span>
                      <span className="font-bold text-slate-800 break-all">{registeredAccounts.managerAccount.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Phone Number</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.managerAccount.phone || 'Provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">National / Org ID</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {registeredAccounts.managerAccount.idNumber ? `••••${registeredAccounts.managerAccount.idNumber.slice(-4)}` : 'Verified Document'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Registration Date</span>
                      <span className="font-bold text-slate-800">
                        {registeredAccounts.managerAccount.createdAt ? new Date(registeredAccounts.managerAccount.createdAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {registeredAccounts.managerAccount.adminNotes && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium space-y-1">
                    <span className="font-black text-amber-900 block">Administrator Review Feedback:</span>
                    <p>{registeredAccounts.managerAccount.adminNotes}</p>
                  </div>
                )}

                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Real-time status updates are sent directly to your Alerts feed. You cannot create a duplicate manager account while this registration is active.</span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openResetPasswordModal('manager', registeredAccounts.managerAccount.email)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteAccountModal('manager', registeredAccounts.managerAccount.email)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account & Restart Registration</span>
                    </button>
                  </div>

                  {(registeredAccounts.managerAccount.status?.toLowerCase() === 'approved') && (
                    <button
                      type="button"
                      onClick={() => navigate('/manager/dashboard')}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Enter Manager Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/90 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Register Your Resident
                    </h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mt-1">
                      Initiate the hostel manager creation account flow to list and manage student residences on PineVela. Register your property securely and gain access to the powerful Manager Console.
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => navigate('/register-manager')}
                    className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start Registration Process</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: BECOME A STAFF TAB */}
        {activeTab === 'become-staff' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            {registeredAccounts.staffAccount ? (
              <div className="bg-white/95 border border-amber-300 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shadow-xs">
                      <Wrench className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {registeredAccounts.staffAccount.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {registeredAccounts.staffAccount.specialization || 'Accredited Maintenance Specialist'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {(registeredAccounts.staffAccount.status?.toLowerCase() === 'verified' || registeredAccounts.staffAccount.status?.toLowerCase() === 'approved' || registeredAccounts.staffAccount.isVerified) ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verified & Accredited Staff</span>
                      </span>
                    ) : (registeredAccounts.staffAccount.status?.toLowerCase() === 'rejected' || registeredAccounts.staffAccount.isRejected) ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-black">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Verification Rejected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span>Pending Admin Verification</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Accredited Staff Profile & Credentials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Full Name</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.staffAccount.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Specialization & Trade</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.staffAccount.specialization || 'General Maintenance'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Years of Experience</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.staffAccount.experienceYears || registeredAccounts.staffAccount.yearsExperience || '1'} Years</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Contact Email</span>
                      <span className="font-bold text-slate-800 break-all">{registeredAccounts.staffAccount.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Phone Number</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.staffAccount.phone || 'Provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Commute Availability</span>
                      <span className="font-bold text-slate-800">{registeredAccounts.staffAccount.commutePreference || 'All Campuses'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Real-time verification alerts will update your account. You cannot create a duplicate staff account while this registration is active.</span>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openResetPasswordModal('staff', registeredAccounts.staffAccount.email)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteAccountModal('staff', registeredAccounts.staffAccount.email)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account & Restart Registration</span>
                    </button>
                  </div>

                  {(registeredAccounts.staffAccount.status?.toLowerCase() === 'verified' || registeredAccounts.staffAccount.status?.toLowerCase() === 'approved' || registeredAccounts.staffAccount.isVerified) && (
                    <button
                      type="button"
                      onClick={() => navigate('/staff/dashboard')}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Open Staff Operations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/90 border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Become a Staff
                    </h3>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed mt-1">
                      Initiate the staff creation account flow to offer accredited maintenance and artisan services across residences. Join our network of verified professionals.
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => navigate('/staff/register')}
                    className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start Registration Process</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

                {/* TAB 5: RESIDENT ROOM TAB (SUPPORTS UP TO 5 REGISTERED ROOMS & DELETION) */}
        {activeTab === 'login-room' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-5xl">
            {/* TOP BAR / ACTION HEADER */}
            <div className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold shadow-xs">
                  <Key className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    Resident Room Management
                    <span className="text-xs font-black px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-full">
                      {userRooms.length} / 5 Registered Rooms
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    View your active digital room keys, manage hostel rooms, delete unneeded rooms, or register additional rooms (up to 5 max).
                  </p>
                </div>
              </div>

              <div>
                {userRooms.length < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowClaimModal(true);
                      setClaimRoomKeyInput('');
                      setVerifiedKeyInfo(null);
                      setClaimError(null);
                      setClaimStep(1);
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-850 hover:to-indigo-850 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Register Additional Room</span>
                  </button>
                ) : (
                  <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Max Capacity (5 Rooms) Reached</span>
                  </div>
                )}
              </div>
            </div>

            {/* ROOM CARDS LIST */}
            {userRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userRooms.map((roomItem: any, idx: number) => {
                  const rKey = roomItem.roomKey || roomItem.id;
                  const hostelName = roomItem.hostelName || registeredAccounts.residentAccount?.hostelName || currentUser?.hostelName || 'PineVela Residence';
                  const blockName = roomItem.blockName || currentUser?.blockName || 'Block A';
                  const roomNum = roomItem.roomNumber || currentUser?.roomNumber || '101';
                  const resName = roomItem.assignedStudentName || registeredAccounts.residentAccount?.name || currentUser?.name || 'Resident';
                  const resId = roomItem.assignedStudentId || registeredAccounts.residentAccount?.studentId || currentUser?.studentId || 'N/A';
                  const prog = roomItem.assignedProgram || registeredAccounts.residentAccount?.programOfStudy || currentUser?.programOfStudy || 'General Studies';
                  const managerName = roomItem.managerName || 'Hostel Operations Manager';
                  const managerPhone = roomItem.managerPhone || '+233 24 000 0000';

                  return (
                    <div
                      key={rKey || idx}
                      className="bg-white/95 border border-blue-200/90 hover:border-blue-400 rounded-3xl p-6 shadow-xl space-y-5 backdrop-blur-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="text-base font-black text-slate-900 leading-tight">
                                {hostelName}
                              </h4>
                              <span className="text-xs font-bold text-blue-700">
                                {blockName} • Room {roomNum}
                              </span>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        </div>

                        {/* DOSSIER DETAILS */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Digital Room Key:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {rKey}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(rKey);
                                  triggerToast(`Copied Room Key ${rKey}`, 'success');
                                }}
                                className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                                title="Copy Key"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-slate-400 block font-medium text-[10px]">Resident Name</span>
                              <span className="font-bold text-slate-800">{resName}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium text-[10px]">Student / Resident ID</span>
                              <span className="font-bold text-slate-800 font-mono">{resId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium text-[10px]">Program / Role</span>
                              <span className="font-bold text-slate-800 truncate block">{prog}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium text-[10px]">Hostel Manager</span>
                              <span className="font-bold text-slate-800 truncate block">{managerName} ({managerPhone})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CARD ACTIONS */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingRoomTarget(roomItem);
                            setDelRoomEmailInput(roomItem.assignedStudentEmail || roomItem.email || registeredAccounts.residentAccount?.email || currentUser?.email || '');
                            setDelRoomPasswordInput('');
                            setDelRoomError(null);
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Room</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuickLoginToRoom(roomItem)}
                            disabled={quickLoggingInRoomKey === rKey}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {quickLoggingInRoomKey === rKey ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span>Quick Log In</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab('home')}
                            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Overview</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/95 border border-blue-200/80 rounded-3xl p-8 shadow-xl space-y-6 text-center backdrop-blur-md max-w-2xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold mx-auto">
                  <Key className="w-8 h-8 text-blue-700" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-black text-slate-900">
                    Have a Digital Room Key?
                  </h3>
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    If your hostel manager issued you a Digital Room Key, click below to verify your room and complete your resident account setup.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowClaimModal(true);
                    setClaimRoomKeyInput('');
                    setVerifiedKeyInfo(null);
                    setClaimError(null);
                    setClaimStep(1);
                  }}
                  className="px-8 py-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-850 hover:to-indigo-850 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Verify Room Key & Start Onboarding</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OPTIONS TAB */}
        {activeTab === 'options' && (
          <div className="space-y-6 animate-fadeIn relative z-10 max-w-4xl">
            <div className="bg-white/90 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-slate-800" />
                    User Options & Account Preferences
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Manage your resident profile, avatar, registered accounts, security credentials, and session options.
                  </p>
                </div>
              </div>

              {/* USER AVATAR SELECTOR & DISPLAY COMPONENT */}
              <UserAvatarSelector />

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {renderAvatarGraphic(currentUser?.avatar, "w-10 h-10 text-xs")}
                    <div>
                      <div className="text-xs font-black text-slate-900">{currentUser?.name || 'PineVela Resident'}</div>
                      <div className="text-[10px] text-slate-500">{currentUser?.email || 'resident@pinevela.com'}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-lg">Verified Account</span>
                </div>

                {/* REGISTERED RESIDENT ACCOUNT MANAGEMENT */}
                {(roomKeyDetails || currentUser?.roomKey || registeredAccounts.residentAccount) && (
                  <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-600 text-white">
                          <Key className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">Registered Resident Account</h4>
                          <p className="text-[10px] text-blue-700 font-bold">
                            {roomKeyDetails?.hostelName || registeredAccounts.residentAccount?.hostelName || 'PineVela Student Residence'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black">
                        Room Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white/70 p-3 rounded-xl border border-blue-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Room & Block</span>
                        <span className="font-bold text-slate-800">{roomKeyDetails?.blockName || 'Block A'}, Room {roomKeyDetails?.roomNumber || '101'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Digital Room Key</span>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">{roomKeyDetails?.roomKey || currentUser?.roomKey}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Student / Resident ID</span>
                        <span className="font-bold text-slate-800">{roomKeyDetails?.assignedStudentId || currentUser?.studentId || 'Resident'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-blue-100">
                      <button
                        type="button"
                        onClick={() => openResetPasswordModal('resident', registeredAccounts.residentAccount?.email || currentUser?.email || '')}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Resident Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteAccountModal('resident', registeredAccounts.residentAccount?.email || currentUser?.email || '')}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Unlink & Delete Resident Account</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black text-slate-900">Digital Room Key Activation</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {roomKeyDetails ? `${roomKeyDetails.hostelName} (${roomKeyDetails.blockName}, ${roomKeyDetails.roomNumber})` : 'Not linked to a room key yet.'}
                    </p>
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      {roomKeyDetails ? 'Switch Room Key' : 'Activate Room Key Now'}
                    </button>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black text-slate-900">Session Management</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Securely sign out of your PineVela resident session across devices.
                    </p>
                    <button
                      onClick={() => setShowSignoutConfirmModal(true)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black rounded-xl cursor-pointer"
                    >
                      Sign Out Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: NOTIFICATIONS TAB */}
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
      {/* MODAL 2.5: WELCOME POPUP */}
      {/* ========================================================================= */}
      {showWelcomePopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                <Sparkles className="w-7 h-7" />
              </div>
              <button
                type="button"
                onClick={() => setShowWelcomePopup(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome to the PineVela Community!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                We're excited to have you here. PineVela is your unified platform to discover available student accommodations, report and track maintenance issues seamlessly, and connect with other residents. 
              </p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                You can also use this same account to list your own properties as a Hostel Manager or offer your professional services as an Artisan or Staff member.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWelcomePopup(false)}
                className="px-6 py-2.5 rounded-xl hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWelcomePopup(false);
                  // We'll create a learn more page later, for now just close it
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>Learn More</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: LINK / CLAIM DIGITAL ROOM KEY */}
      {/* ========================================================================= */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-blue-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Resident & Student Onboarding</span>
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wider">PineVela Key</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                    {claimStep === 1 && 'Select resident category and validate your digital room key'}
                    {claimStep === 2 && 'Fill in your personal, academic, and institutional details'}
                    {claimStep === 3 && 'Create your account password and review room assignment'}
                    {claimStep === 4 && 'Room verified! Your manager has been notified of your check-in'}
                  </p>
                </div>
              </div>
              {claimStep !== 4 && (
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Step indicator bar */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { num: 1, label: 'Key & Role' },
                { num: 2, label: 'Profile' },
                { num: 3, label: 'Security' },
                { num: 4, label: 'Activated' }
              ].map((s) => (
                <div key={s.num} className="flex flex-col gap-1">
                  <div 
                    className={`h-1 rounded-full transition-all ${
                      claimStep >= s.num 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                        : 'bg-slate-200'
                    }`} 
                  />
                  <span className={`text-[9px] font-bold text-center ${
                    claimStep === s.num ? 'text-blue-900' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Resident Category & Digital Room Key */}
            {claimStep === 1 && (
              <div className="space-y-4 pt-1">
                
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    1. Choose Your Residency Category <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'student', label: 'Student', desc: 'Enrolled in university / college', icon: GraduationCap },
                      { id: 'resident', label: 'Resident', desc: 'Working professional / intern', icon: Briefcase },
                      { id: 'other', label: 'Other', desc: 'Visiting scholar / guest', icon: School }
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = claimResidentType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setClaimResidentType(cat.id as any)}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-1.5 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon size={14} />
                          </div>
                          <div>
                            <div className={`text-[11px] font-black ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                              {cat.label}
                            </div>
                            <div className="text-[9px] text-slate-500 leading-tight line-clamp-2 mt-0.5 font-medium">
                              {cat.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {claimResidentType === 'other' && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={claimCustomType}
                        onChange={(e) => setClaimCustomType(e.target.value)}
                        placeholder="Please specify your resident status (e.g. Visiting Fellow, Postdoc)"
                        className="w-full px-3 py-2 bg-blue-50/50 border border-blue-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  )}
                </div>

                {/* Digital Key Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 block">
                      2. Enter Digital Room Key <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] text-blue-750 font-bold">
                      Provided by Hostel Manager
                    </span>
                  </div>

                  <div className="relative">
                    <Key className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={claimRoomKeyInput}
                      onChange={(e) => {
                        setClaimRoomKeyInput(e.target.value.toUpperCase());
                        setClaimError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyClaimKey();
                      }}
                      placeholder="Enter digital room key code"
                      className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200 rounded-2xl font-mono text-sm font-black uppercase text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyClaimKey()}
                      disabled={verifyingKey || !claimRoomKeyInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {verifyingKey ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck size={13} />
                      )}
                      <span>Verify</span>
                    </button>
                  </div>
                </div>

                {claimError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-bold flex items-center gap-2 animate-fade-in">
                    <ShieldAlert size={15} className="text-rose-600 shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}

                {/* Verified Room Card & Progression Button */}
                {verifiedKeyInfo && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1.5 text-xs text-emerald-950 shadow-xs">
                      <div className="flex items-center justify-between font-black text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Room Key Validated: {verifiedKeyInfo.roomKey}</span>
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-200/85 text-emerald-900 font-extrabold rounded-full text-[9px]">
                          Available
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 font-bold text-[10px] bg-white/75 p-2 rounded-xl border border-emerald-200/50">
                        <div>
                          <span className="text-slate-400 block text-[9px] font-semibold">Hostel</span>
                          <span className="text-slate-900 truncate block font-bold">{verifiedKeyInfo.hostelName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] font-semibold">Block</span>
                          <span className="text-slate-900 truncate block font-bold">{verifiedKeyInfo.blockName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] font-semibold">Room No.</span>
                          <span className="text-slate-900 truncate block font-bold">{verifiedKeyInfo.roomNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setClaimStep(2)}
                        className="w-full py-3 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Personal & Academic Profile</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Personal & Academic Profile */}
            {claimStep === 2 && verifiedKeyInfo && (
              <div className="space-y-4 pt-1">
                <div className="space-y-3">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Full Legal Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={claimStudentName}
                        onChange={(e) => setClaimStudentName(e.target.value)}
                        placeholder="e.g. Kwesi Mensah"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* ID & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">
                        {claimResidentType === 'student' ? 'Student ID / Index No.' : 'Resident ID / National ID'} <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={claimStudentId}
                          onChange={(e) => setClaimStudentId(e.target.value.toUpperCase())}
                          placeholder="e.g. STU-2026-904"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">
                        Phone Number <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={claimStudentPhone}
                          onChange={(e) => setClaimStudentPhone(e.target.value)}
                          placeholder="e.g. +233 24 000 0000"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Institution, Program & Department */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <BookOpen size={13} className="text-blue-600" />
                      <span>{claimResidentType === 'student' ? 'Academic Program Details' : 'Professional & Institutional Details'}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-700 block">
                        {claimResidentType === 'student' ? 'Program of Study / Major' : 'Occupation / Field of Practice'}
                      </label>
                      <input
                        type="text"
                        value={claimProgram}
                        onChange={(e) => setClaimProgram(e.target.value)}
                        placeholder={claimResidentType === 'student' ? "e.g. Computer Science" : "e.g. Software Engineer"}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 block">
                          Department / Faculty
                        </label>
                        <input
                          type="text"
                          value={claimDepartment}
                          onChange={(e) => setClaimDepartment(e.target.value)}
                          placeholder="e.g. Department of Computer Science"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 block">
                          Institution / University
                        </label>
                        <input
                          type="text"
                          value={claimInstitution}
                          onChange={(e) => setClaimInstitution(e.target.value)}
                          placeholder="e.g. University of Ghana"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimStep(1)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!claimStudentName.trim() || !claimStudentId.trim() || !claimStudentPhone.trim()) {
                        triggerToast('Please provide your name, ID, and phone number.', 'error');
                        return;
                      }
                      setClaimStep(3);
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Password & Security</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Password & Security Setup */}
            {claimStep === 3 && verifiedKeyInfo && (
              <div className="space-y-4 pt-1">
                
                {/* Onboarding Summary Badge */}
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-1.5 text-xs text-blue-950">
                  <div className="flex items-center justify-between font-black text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={15} className="text-blue-600" />
                      <span>Room Assignment Summary</span>
                    </span>
                    <span className="font-mono text-[10px] bg-blue-200/60 px-1.5 py-0.5 rounded-lg text-blue-950">
                      {verifiedKeyInfo.roomKey}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 bg-white/80 p-2.5 rounded-xl border border-blue-200/50 font-medium text-[10px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Resident Name:</span>
                      <strong className="text-slate-900">{claimStudentName || 'Resident'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">ID & Category:</span>
                      <strong className="text-slate-900 font-mono">{claimStudentId || 'ID'}</strong> ({claimResidentType})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Hostel & Room:</span>
                      <strong className="text-slate-900">{verifiedKeyInfo.hostelName}</strong> - {verifiedKeyInfo.blockName} (Room {verifiedKeyInfo.roomNumber})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Institution:</span>
                      <strong className="text-slate-900 truncate block">{claimInstitution || 'University / College'}</strong>
                    </div>
                  </div>

                  <div className="p-2 bg-blue-100/50 rounded-xl flex items-center gap-1.5 text-[10px] text-blue-900 font-semibold leading-tight">
                    <Bell size={13} className="text-blue-700 shrink-0" />
                    <span>A minimalistic notification will be dispatched to your Hostel Manager upon check-in.</span>
                  </div>
                </div>

                {/* Email Choice & Password Setup */}
                <div className="space-y-3">
                  <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-900 block">
                        Resident Account Email Selection <span className="text-rose-600">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Multi-Account Support
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setClaimEmailChoice('custom')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          claimEmailChoice === 'custom'
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <Mail size={13} className={claimEmailChoice === 'custom' ? 'text-blue-600' : 'text-slate-400'} />
                          <span>Use a Different Email</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                          Register resident account under a separate email address
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setClaimEmailChoice('same');
                          if (currentUser?.email) {
                            setClaimEmail(currentUser.email);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          claimEmailChoice === 'same'
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <CheckCircle2 size={13} className={claimEmailChoice === 'same' ? 'text-blue-600' : 'text-slate-400'} />
                          <span>Use Primary Account Email</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight truncate">
                          {currentUser?.email || 'Same email as User account'}
                        </p>
                      </button>
                    </div>

                    {claimEmailChoice === 'custom' ? (
                      <div className="space-y-1 pt-1.5">
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            required
                            value={claimEmail}
                            onChange={(e) => setClaimEmail(e.target.value)}
                            placeholder="e.g. resident.favour@gmail.com"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          You can log directly into your resident dashboard with this email address.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1 text-amber-950 text-[11px] font-medium leading-tight">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <ShieldAlert size={13} className="text-amber-700 shrink-0" />
                          <span>Password Differentiation Requirement</span>
                        </div>
                        <p>
                          Using <strong>{currentUser?.email}</strong> for both accounts. Because the email is shared, your resident account password <strong>cannot be identical</strong> to your User account password so that both accounts authenticate independently.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Create Digital Room Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showClaimPassword ? "text" : "password"}
                        required
                        value={claimPassword}
                        onChange={(e) => setClaimPassword(e.target.value)}
                        placeholder="Choose a strong password (min 6 chars)"
                        className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClaimPassword(!showClaimPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showClaimPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Confirm Digital Room Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showClaimConfirmPassword ? "text" : "password"}
                        required
                        value={claimConfirmPassword}
                        onChange={(e) => setClaimConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClaimConfirmPassword(!showClaimConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showClaimConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {claimPassword && (
                    <div className="space-y-1.5">
                      {(() => {
                        const score = claimPassword.length;
                        let strengthLabel = 'Weak';
                        let strengthColor = 'bg-rose-500';
                        let strengthText = 'text-rose-600';
                        if (score >= 8) {
                          strengthLabel = 'Strong';
                          strengthColor = 'bg-emerald-500';
                          strengthText = 'text-emerald-600';
                        } else if (score >= 5) {
                          strengthLabel = 'Good';
                          strengthColor = 'bg-amber-500';
                          strengthText = 'text-amber-600';
                        }
                        return (
                          <div>
                            <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                              <span className="text-slate-500">Security Strength</span>
                              <span className={strengthText}>{strengthLabel}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${Math.min(100, score * 10)}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <label className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 cursor-pointer font-medium leading-normal">
                    <input
                      type="checkbox"
                      checked={claimAgreeTerms}
                      onChange={(e) => setClaimAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>
                      I agree to the <strong>Hostel Community Code of Conduct</strong> and PineVela Resident Terms.
                    </span>
                  </label>
                </div>

                {claimError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-bold flex items-center gap-2 animate-fade-in">
                    <ShieldAlert size={15} className="text-rose-600 shrink-0" />
                    <span>{claimError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setClaimStep(2)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleClaimRoomKey}
                    disabled={submittingClaim || !claimPassword.trim() || claimPassword !== claimConfirmPassword || !claimAgreeTerms}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingClaim ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={15} />
                        <span>Complete Onboarding & Enter Room</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Minimalistic Confirmation & Room Activated */}
            {claimStep === 4 && verifiedKeyInfo && (
              <div className="space-y-5 text-center py-4 animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    Room Successfully Activated!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto font-medium">
                    Welcome to <strong>{verifiedKeyInfo.hostelName}</strong>. Your digital room credentials have been created and all details are synchronized.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Digital Room Key:</span>
                    <strong className="font-mono text-blue-900 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">{verifiedKeyInfo.roomKey}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Login Email:</span>
                    <strong className="text-slate-800">{claimEmail || currentUser?.email}</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Room Location:</span>
                    <strong className="text-slate-800">{verifiedKeyInfo.blockName} • Room {verifiedKeyInfo.roomNumber}</strong>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLoginToRoom(verifiedKeyInfo)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn size={16} />
                    <span>Quick Log In & Launch Resident Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowClaimModal(false);
                      setActiveTab('login-room');
                    }}
                    className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    View Room in Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET REGISTERED ACCOUNT PASSWORD */}
      {/* ========================================================================= */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Reset {resetTargetRole === 'manager' ? 'Manager' : resetTargetRole === 'staff' ? 'Staff' : 'Resident'} Password
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{resetTargetEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetRegisteredAccountPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">New Password</label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (at least 6 characters)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              {resetPasswordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetPasswordError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {resettingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE REGISTERED ACCOUNT (ALLOWS RE-REGISTRATION) */}
      {/* ========================================================================= */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-rose-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Delete {deleteTargetRole === 'manager' ? 'Hostel Manager' : deleteTargetRole === 'staff' ? 'Staff Specialist' : 'Resident'} Account
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{deleteTargetEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-950 space-y-1 leading-relaxed">
              <span className="font-black text-rose-900 block">Are you sure you want to delete this account?</span>
              <p>
                This will delete your registered credentials and status from the system, giving you the option to start the registration process again from scratch.
              </p>
            </div>

            <form onSubmit={handleDeleteRegisteredAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  {deleteTargetRole === 'manager' ? 'Manager Account Email' : 'Account Email'}
                </label>
                <input
                  type="email"
                  value={deleteTargetEmail}
                  onChange={(e) => setDeleteTargetEmail(e.target.value)}
                  placeholder="Enter registered manager account email"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">
                  {deleteTargetRole === 'manager' ? 'Manager Account Password' : 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={deletePasswordInput}
                  onChange={(e) => setDeletePasswordInput(e.target.value)}
                  placeholder={deleteTargetRole === 'manager' ? "Enter password used when creating manager account" : "Enter account password to confirm"}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-600"
                  required
                />
              </div>

              {deleteAccountError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteAccountError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deletingAccount}
                  className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deletingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Delete & Restart</span>
                </button>
              </div>
            </form>
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
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-xs mx-auto">
              <PineLogo size={36} hideText={true} />
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
      {/* ========================================================================= */}
      {/* MODAL 6: HOSTEL ACCOMMODATION DETAILS MODAL */}
      {/* ========================================================================= */}
      {viewingHostelModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <img
                src={viewingHostelModal?.image || viewingHostelModal?.imageUrl || viewingHostelModal?.exteriorPhotoUrl || viewingHostelModal?.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                alt={viewingHostelModal?.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewingHostelModal(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3 bg-blue-900/90 text-white text-xs font-black px-3 py-1 rounded-full backdrop-blur-sm">
                {viewingHostelModal?.availableSpaces ?? viewingHostelModal?.bedsLeft ?? viewingHostelModal?.totalCapacity ?? 'Available'} Spaces Open
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  {viewingHostelModal?.hostelType || 'Student Hostel'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{viewingHostelModal?.name}</h3>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {viewingHostelModal?.location || 'PineVela Campus Zone'}
                </p>
              </div>

              {viewingHostelModal?.description && (
                <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewingHostelModal.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px]">Manager</span>
                  <span className="font-bold text-slate-800">{viewingHostelModal?.managerName || 'Verified Manager'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Contact</span>
                  <span className="font-bold text-slate-800">{viewingHostelModal?.managerPhone || viewingHostelModal?.managerEmail || '+233 24 123 4567'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setViewingHostelModal(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingHostelModal(null);
                    setShowClaimModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Claim Digital Room Key</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD ADDITIONAL ROOM MODAL */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-900 font-bold">
                  <Plus className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Register Additional Room</h3>
                  <p className="text-xs text-slate-500 font-medium">Add up to 5 rooms under your resident account.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!addRoomKeyInput.trim()) return;
                setSubmittingAddRoom(true);
                setAddRoomError(null);
                try {
                  const res = await apiFetch('/api/student/add-room', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomKey: addRoomKeyInput.trim() })
                  });
                  if (res && res.success) {
                    triggerToast(res.message || "Room added successfully!", 'success');
                    setUserRooms(res.rooms || []);
                    setShowAddRoomModal(false);
                    setAddRoomKeyInput('');
                    setVerifiedAddKeyInfo(null);
                  } else {
                    setAddRoomError(res?.error || "Failed to register room key.");
                  }
                } catch (err: any) {
                  setAddRoomError(err.message || "Error adding room key.");
                } finally {
                  setSubmittingAddRoom(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                  Digital Room Key Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={addRoomKeyInput}
                    onChange={(e) => {
                      setAddRoomKeyInput(e.target.value.toUpperCase());
                      setAddRoomError(null);
                      setVerifiedAddKeyInfo(null);
                    }}
                    placeholder="e.g. MAZE-B-204123"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
                  />
                  <button
                    type="button"
                    disabled={verifyingAddKey || !addRoomKeyInput.trim()}
                    onClick={async () => {
                      if (!addRoomKeyInput.trim() || addRoomKeyInput.trim().length < 5) {
                        setAddRoomError("Please enter a valid digital room key format.");
                        return;
                      }
                      setVerifyingAddKey(true);
                      setAddRoomError(null);
                      try {
                        const res = await apiFetch('/api/room-keys/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ roomKey: addRoomKeyInput.trim() })
                        });
                        if (res && res.valid) {
                          setVerifiedAddKeyInfo(res);
                          setAddRoomError(null);
                          triggerToast(`Room Found: ${res.hostelName} (${res.blockName}, Room ${res.roomNumber})`, 'success');
                        } else {
                          setVerifiedAddKeyInfo(null);
                          setAddRoomError(res?.error || "Invalid room key or already used.");
                        }
                      } catch (err: any) {
                        setVerifiedAddKeyInfo(null);
                        setAddRoomError(err.message || "Failed to verify key.");
                      } finally {
                        setVerifyingAddKey(false);
                      }
                    }}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {verifyingAddKey ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Verify</span>
                  </button>
                </div>
              </div>

              {addRoomError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{addRoomError}</span>
                </div>
              )}

              {verifiedAddKeyInfo && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Digital Room Key Verified!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hostel</span>
                      <span className="font-bold text-slate-900">{verifiedAddKeyInfo.hostelName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Room & Block</span>
                      <span className="font-bold text-slate-900">{verifiedAddKeyInfo.blockName}, Room {verifiedAddKeyInfo.roomNumber}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddRoom || !addRoomKeyInput.trim()}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-850 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingAddRoom ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Claim & Register Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / UNLINK ROOM CONFIRMATION MODAL */}
      {deletingRoomTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 font-bold">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Delete Resident Room</h3>
                <p className="text-xs text-slate-500 font-medium">Confirm account details to release digital room key.</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 font-medium">
              <p>
                Deleting <strong className="text-slate-900">{deletingRoomTarget.hostelName || 'Hostel Room'} ({deletingRoomTarget.blockName || 'Block'}, Room {deletingRoomTarget.roomNumber || 'Room'})</strong> with key <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">{deletingRoomTarget.roomKey}</code>.
              </p>

              {delRoomError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{delRoomError}</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Resident Account Email
                  </label>
                  <input
                    type="email"
                    value={delRoomEmailInput}
                    onChange={(e) => {
                      setDelRoomEmailInput(e.target.value);
                      setDelRoomError(null);
                    }}
                    placeholder="e.g. resident@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                    Resident Account Password
                  </label>
                  <input
                    type="password"
                    value={delRoomPasswordInput}
                    onChange={(e) => {
                      setDelRoomPasswordInput(e.target.value);
                      setDelRoomError(null);
                    }}
                    placeholder="Enter password for this resident account"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Enter the secure password used when creating this resident account.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeletingRoomTarget(null);
                  setDelRoomError(null);
                  setDelRoomPasswordInput('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDeleteRoom}
                onClick={async () => {
                  if (!deletingRoomTarget) return;
                  if (!delRoomEmailInput.trim()) {
                    setDelRoomError("Please enter the resident account email.");
                    return;
                  }
                  if (!delRoomPasswordInput.trim()) {
                    setDelRoomError("Please enter the resident account password to confirm deletion.");
                    return;
                  }
                  setSubmittingDeleteRoom(true);
                  setDelRoomError(null);
                  try {
                    const res = await apiFetch('/api/student/delete-room', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        roomKey: deletingRoomTarget.roomKey,
                        email: delRoomEmailInput.trim(),
                        password: delRoomPasswordInput.trim()
                      })
                    });
                    if (res && res.success) {
                      triggerToast(res.message || "Room deleted successfully!", 'success');
                      setUserRooms(res.rooms || []);
                      setDeletingRoomTarget(null);
                      setDelRoomPasswordInput('');
                    } else {
                      setDelRoomError(res?.error || "Failed to delete room. Please check your credentials.");
                    }
                  } catch (err: any) {
                    setDelRoomError(err.message || "Error unlinking room. Verify credentials.");
                  } finally {
                    setSubmittingDeleteRoom(false);
                  }
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingDeleteRoom ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Verify & Delete Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
