import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Clock,
  Building, 
  FileText, 
  UploadCloud, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Check, 
  Award, 
  FileCheck, 
  Compass, 
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import PineLogo from './PineLogo';
import { useAuth } from '../context/AuthContext';
import {
  validateEmail,
  cleanPhoneNumber,
  validatePhone,
  validateAddress,
  formatDigitalAddress,
  validateDigitalAddress,
  resolveIdConfig
} from '../utils/formValidation';

export default function PageManagerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Phase State (1 to 5, 6 for Success)
  const [phase, setPhase] = useState<number>(1);

  // Existing Registered Manager Account State
  const [existingManagerRecord, setExistingManagerRecord] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [delEmail, setDelEmail] = useState<string>('');
  const [delPassword, setDelPassword] = useState<string>('');
  const [delLoading, setDelLoading] = useState<boolean>(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [showDelPassword, setShowDelPassword] = useState<boolean>(false);

  // Fetch and check if user already has a recorded Manager account
  const fetchMyManagerAccount = async (isSilent = false) => {
    try {
      if (!isSilent) setCheckingExisting(true);
      const queryEmail = user?.email || '';
      const queryId = user?.id || '';
      const token = localStorage.getItem('pinevela_auth_token') || (user as any)?.token;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/users/my-registered-accounts?email=${encodeURIComponent(queryEmail)}&userId=${encodeURIComponent(queryId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.managerAccount) {
          setExistingManagerRecord((prev: any) => {
            if (prev && prev.status !== data.managerAccount.status) {
              triggerToast(`Manager approval status updated: ${data.managerAccount.displayStatus || data.managerAccount.status}`, 'info');
            }
            return data.managerAccount;
          });
          setDelEmail(data.managerAccount.email || queryEmail);
        } else {
          setExistingManagerRecord(null);
        }
      }
    } catch (err) {
      console.warn("Could not check registered manager account status:", err);
    } finally {
      if (!isSilent) setCheckingExisting(false);
    }
  };

  React.useEffect(() => {
    fetchMyManagerAccount();

    const interval = setInterval(() => {
      fetchMyManagerAccount(true);
    }, 2500);

    const onFocus = () => fetchMyManagerAccount(true);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user?.email, user?.id]);

  // Pre-populate fields from logged-in user if available
  React.useEffect(() => {
    if (user) {
      if (user.name) setFullName(user.name);
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  // Account Deletion Handler
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delEmail || !delPassword) {
      setDelError('Email and password are required.');
      return;
    }
    setDelLoading(true);
    setDelError(null);
    try {
      const res = await fetch('/api/users/delete-registered-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'manager',
          email: delEmail.trim(),
          password: delPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }
      setToastType('success');
      setToastMessage(data.message || 'Manager account deleted successfully.');
      setExistingManagerRecord(null);
      setShowDeleteModal(false);
      setDelPassword('');
      setPhase(1);
    } catch (err: any) {
      setDelError(err.message || 'Invalid email or password.');
    } finally {
      setDelLoading(false);
    }
  };

  // Ensure every phase and page view starts strictly from the top
  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
  }, [phase]);

  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Phase 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('Mr.');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [roleTitle, setRoleTitle] = useState('Residence Director');

  // Phase 2: Address & Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Accra');
  const [region, setRegion] = useState('Greater Accra');
  const [customRegion, setCustomRegion] = useState('');
  const [digitalAddress, setDigitalAddress] = useState('');
  const [landmark, setLandmark] = useState('');

  // Phase 3: Identification & Authority
  const [idType, setIdType] = useState('Ghana Card (National ID)');
  const [idNumber, setIdNumber] = useState('');
  const [authorityRole, setAuthorityRole] = useState('Sole Property Owner');
  const [organization, setOrganization] = useState('');
  const [docFileName, setDocFileName] = useState<string | null>(null);

  // Phase 4: Account Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phase 5: Review & Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Password Strength Analyzer Helper
  const analyzePasswordStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^a-zA-Z0-9]/.test(pwd)
    };

    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 10;
    if (checks.hasLower && checks.hasUpper) score += 25;
    if (checks.hasNumber) score += 20;
    if (checks.hasSpecial) score += 20;

    score = Math.min(score, 100);

    let label = 'Very Weak';
    let color = 'bg-rose-500';
    let textColor = 'text-rose-600';
    let badgeBg = 'bg-rose-50';

    if (score >= 80) {
      label = 'Strong / Excellent';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-600';
      badgeBg = 'bg-emerald-50';
    } else if (score >= 55) {
      label = 'Good';
      color = 'bg-lime-500';
      textColor = 'text-lime-600';
      badgeBg = 'bg-lime-50';
    } else if (score >= 25) {
      label = 'Weak';
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
      badgeBg = 'bg-amber-50';
    }

    return { score, label, color, textColor, badgeBg, checks };
  };

  const pwdStrength = analyzePasswordStrength(password);

  // Trigger Toast Notification
  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Phase Navigation Validation Handlers
  const handleNextPhase = () => {
    if (phase === 1) {
      if (!fullName.trim() || fullName.trim().length < 3) {
        triggerToast('Please enter your full legal name (minimum 3 characters).', 'error');
        return;
      }
      const phoneCheck = validatePhone(phone, 'Primary phone number');
      if (!phoneCheck.isValid) {
        triggerToast(phoneCheck.error!, 'error');
        return;
      }
      if (altPhone.trim()) {
        const altCheck = validatePhone(altPhone, 'Alternative contact phone');
        if (!altCheck.isValid) {
          triggerToast(altCheck.error!, 'error');
          return;
        }
      }
    } else if (phase === 2) {
      const addrCheck = validateAddress(address, 'Physical address');
      if (!addrCheck.isValid) {
        triggerToast(addrCheck.error!, 'error');
        return;
      }
      if (!city.trim() || city.trim().length < 2) {
        triggerToast('Please enter your city/town (min 2 characters).', 'error');
        return;
      }
      if (digitalAddress.trim()) {
        const gpsCheck = validateDigitalAddress(digitalAddress);
        if (!gpsCheck.isValid) {
          triggerToast(gpsCheck.error!, 'error');
          return;
        }
      }
    } else if (phase === 3) {
      const idCfg = resolveIdConfig(idType);
      const idCheck = idCfg.validate(idNumber);
      if (!idCheck.isValid) {
        triggerToast(idCheck.error!, 'error');
        return;
      }
    } else if (phase === 4) {
      const emailCheck = validateEmail(email, 'Manager email address');
      if (!emailCheck.isValid) {
        triggerToast(emailCheck.error!, 'error');
        return;
      }
      if (!password || password.length < 6) {
        triggerToast('Password must be at least 6 characters long.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        triggerToast('Passwords do not match. Please verify your entries.', 'error');
        return;
      }
    }

    setPhase((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevPhase = () => {
    setPhase((prev) => Math.max(prev - 1, 1));
  };

  // Simulated File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      triggerToast(`Attached document: ${file.name}`, 'success');
    }
  };

  // Final Submit Handler
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailCheck = validateEmail(email, 'Manager email address');
    if (!emailCheck.isValid) {
      triggerToast(emailCheck.error!, 'error');
      return;
    }
    const phoneCheck = validatePhone(phone, 'Primary phone number');
    if (!phoneCheck.isValid) {
      triggerToast(phoneCheck.error!, 'error');
      return;
    }
    const addrCheck = validateAddress(address, 'Physical address');
    if (!addrCheck.isValid) {
      triggerToast(addrCheck.error!, 'error');
      return;
    }
    const idCfg = resolveIdConfig(idType);
    const idCheck = idCfg.validate(idNumber);
    if (!idCheck.isValid) {
      triggerToast(idCheck.error!, 'error');
      return;
    }

    if (!declarationAccepted) {
      triggerToast('Please accept the declaration to submit your verification.', 'error');
      return;
    }

    setLoadingSubmit(true);
    try {
      const formattedName = `${title} ${fullName.trim()}`;
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();
      const finalRegion = region === 'Other / International' ? customRegion.trim() : region;
      const orgName = organization.trim() || 'PineVela Operations';

      // 1. Unified payload for Manager Account & Verification Dossier
      const verifPayload = {
        managerName: formattedName,
        name: formattedName,
        managerEmail: cleanEmail,
        email: cleanEmail,
        parentUserId: user?.id || undefined,
        parentUserEmail: user?.email || undefined,
        userId: user?.id || undefined,
        userEmail: user?.email || undefined,
        password: password,
        managerPhone: cleanPhone,
        phone: cleanPhone,
        altPhone: altPhone.trim() || undefined,
        hostelName: orgName,
        proposedHostelName: orgName,
        propertyName: orgName,
        physicalAddress: `${address.trim()}, ${city.trim()}, ${finalRegion}`,
        address: `${address.trim()}, ${city.trim()}, ${finalRegion}`,
        operatingAddress: `${address.trim()}, ${city.trim()}, ${finalRegion}`,
        digitalAddress: digitalAddress.trim() || undefined,
        landmark: landmark.trim() || undefined,
        idType,
        idDocumentType: idType,
        idNumber: idNumber.trim(),
        nationalId: idNumber.trim(),
        authorityRole,
        authorityRelationship: authorityRole,
        organizationName: orgName,
        organization: orgName,
        roleTitle: roleTitle,
        authorityEvidenceDescription: docFileName ? `Attached document: ${docFileName}` : 'Manager verification details provided.',
        authorityEvidenceFileName: docFileName || undefined,
        documents: docFileName ? [{
          fileName: docFileName,
          documentType: 'AUTHORITY_PROOF',
          storagePath: `manager-verifications/${cleanEmail}/${docFileName}`,
          mimeType: 'application/pdf',
          fileSizeBytes: 245000,
          isSensitive: true
        }] : []
      };

      // 2. Submit user account registration
      let regRes = await fetch('/api/auth/register-manager-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifPayload)
      });

      if (!regRes.ok) {
        regRes = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifPayload)
        });
      }

      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => ({ error: 'Failed to create manager account' }));
        // If account already exists, we log warning and still submit verification dossier
        if (!errData.error?.includes('already exists')) {
          throw new Error(errData.error || errData.message || 'Registration error');
        }
      }

      // 3. Submit Verification Dossier to Admin Queue
      try {
        await fetch('/api/manager-verifications/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifPayload)
        });
      } catch (vErr) {
        console.warn('Verification submission note:', vErr);
      }

      // 4. Save locally in localStorage for persistent offline & Quick Access
      try {
        const existingRaw = localStorage.getItem('pinevela_registered_managers');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newManagerEntry = {
          name: formattedName,
          email: cleanEmail,
          password: password,
          organization: organization.trim() || 'Independent Management',
          savedAt: new Date().toISOString()
        };
        const updated = [...existing.filter((m: any) => m && m.email !== cleanEmail), newManagerEntry];
        localStorage.setItem('pinevela_registered_managers', JSON.stringify(updated));
      } catch (storageErr) {
        console.warn("Local storage write error:", storageErr);
      }

      setPhase(6); // Step 6: Success Confirmation View
      triggerToast('Manager Verification Dossier Submitted Successfully!', 'success');
      setTimeout(() => {
        fetchMyManagerAccount(false);
      }, 300);
    } catch (err: any) {
      console.error("Submission error:", err);
      triggerToast(err.message || 'An error occurred during manager verification submission.', 'error');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const phaseTitles = [
    { num: 1, title: 'Personal Info', sub: 'Legal Identity & Contact', icon: User },
    { num: 2, title: 'Address & Location', sub: 'Physical Residence Details', icon: MapPin },
    { num: 3, title: 'Identification', sub: 'ID Card & Ownership Authority', icon: ShieldCheck },
    { num: 4, title: 'Credentials', sub: 'Account Security & Hostel Name', icon: Mail },
    { num: 5, title: 'Verification', sub: 'Review & Submit Dossier', icon: FileCheck }
  ];

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans relative overflow-hidden text-slate-800">
      
      {/* Decorative gradient backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

      {/* Light blue semi-circle curving downwards backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] md:w-[120%] h-[380px] md:h-[480px] bg-gradient-to-b from-blue-50/80 to-blue-100/40 border-b border-blue-200/30 rounded-b-[50%] -z-10 shadow-sm" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 border animate-bounce ${
          toastType === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
          toastType === 'error' ? 'bg-rose-600 text-white border-rose-500' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          <span className="text-base">{toastType === 'success' ? '✓' : toastType === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100/50 sticky top-0 z-30 px-6 py-4 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => navigate('/student/dashboard')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <PineLogo size={36} hideText={false} />
            <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Manager Onboarding Gateway
            </span>
          </div>

          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all cursor-pointer border border-slate-200"
            title="Close and return to account"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        
        {checkingExisting ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600">Checking Registered Manager Account Status...</p>
          </div>
        ) : existingManagerRecord ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative animate-fadeIn">
            {/* Top Brand Line */}
            <div className="h-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 w-full" />
            
            <div className="p-6 sm:p-10 space-y-8">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-sm">
                    <Building className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">Recorded Registered Account</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        Hostel Manager Gateway
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                      {existingManagerRecord.name}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Registered Manager Account under <strong className="text-slate-700">{existingManagerRecord.email}</strong>
                    </p>
                  </div>
                </div>

                {/* Verification Status Badge */}
                <div className="flex items-center gap-2">
                  {existingManagerRecord.status === 'Approved' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Status: Approved & Active</span>
                    </div>
                  ) : existingManagerRecord.status === 'Rejected' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 font-extrabold text-xs">
                      <X className="w-4 h-4 text-rose-600" />
                      <span>Status: Registration Rejected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 font-extrabold text-xs">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>Status: Pending Admin Approval</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Details Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Organization / Business</span>
                  <p className="text-sm font-black text-slate-800">{existingManagerRecord.organizationName}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Authority Designation</span>
                  <p className="text-sm font-black text-slate-800">{existingManagerRecord.authorityRole || existingManagerRecord.organizationName || 'Property Manager'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">National ID Document</span>
                  <p className="text-sm font-black text-slate-800">{existingManagerRecord.idType} ({existingManagerRecord.idNumber})</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Contact Phone Number</span>
                  <p className="text-sm font-black text-slate-800">{existingManagerRecord.phone}</p>
                </div>
              </div>

              {/* Account Notice Box */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 leading-relaxed font-medium">
                  <strong>Single Account Policy Active:</strong> Your manager registration is recorded in our system. You cannot create another manager account while this registration exists. To update or start over with a new account, you can delete your current record below.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDelEmail(existingManagerRecord.email || user?.email || '');
                    setShowDeleteModal(true);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <X className="w-4 h-4" />
                  <span>Delete Account & Re-Register</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate('/manager/dashboard')}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Go to Manager Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : phase <= 5 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden relative">
            
            {/* Top Brand Line */}
            <div className="h-1.5 bg-blue-900 w-full" />

            {/* Stepper Header */}
            <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-100">
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-500 tracking-wider">Phase {phase} of 5</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Step {phase}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {phaseTitles[phase - 1].title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {phaseTitles[phase - 1].sub}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-1">
                  {phaseTitles.map((p) => {
                    const Icon = p.icon;
                    const isActive = phase === p.num;
                    const isPassed = phase > p.num;
                    return (
                      <div
                        key={p.num}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                          isPassed
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : isActive
                            ? 'bg-blue-900 text-white shadow-md scale-105'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                        title={p.title}
                      >
                        {isPassed ? <Check size={16} /> : <Icon size={16} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="bg-blue-900 h-full rounded-full"
                  initial={{ width: `${((phase - 1) / 5) * 100}%` }}
                  animate={{ width: `${(phase / 5) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Mobile Phase Pill Strip */}
              <div className="flex sm:hidden justify-between items-center mt-3 text-[10px] text-slate-400 font-bold">
                {phaseTitles.map((p) => (
                  <span
                    key={p.num}
                    className={phase === p.num ? 'text-blue-900 font-black' : phase > p.num ? 'text-emerald-600' : ''}
                  >
                    {p.num}. {p.title.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Form Content Body with Animations */}
            <div className="p-6 sm:p-10">
              <AnimatePresence mode="wait">
                
                {/* PHASE 1: Personal Info */}
                {phase === 1 && (
                  <motion.div
                    key="phase1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      
                      <div className="sm:col-span-1 space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Title</label>
                        <select
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full py-3 px-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Rev.">Rev.</option>
                          <option value="Prof.">Prof.</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3 space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Full Legal Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <User size={18} />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Samuel Kojo Addo"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Primary Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <Phone size={18} />
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="024 000 0000 or +233 24 000 0000"
                            value={phone}
                            onChange={(e) => setPhone(cleanPhoneNumber(e.target.value))}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Numbers only (10 digits starting with 0, or international +233)</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Alternative Contact / WhatsApp
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <Phone size={18} />
                          </span>
                          <input
                            type="tel"
                            placeholder="050 000 0000 or +233 50 000 0000"
                            value={altPhone}
                            onChange={(e) => setAltPhone(cleanPhoneNumber(e.target.value))}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Numbers only (optional)</p>
                      </div>

                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Position / Role Title in Residence Management
                      </label>
                      <select
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                      >
                        <option value="Residence Director">Residence Director</option>
                        <option value="General Property Manager">General Property Manager</option>
                        <option value="Hostel Operations Lead">Hostel Operations Lead</option>
                        <option value="Managing Proprietor">Managing Proprietor</option>
                        <option value="Authorized Student Housing Representative">Authorized Student Housing Representative</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 2: Address & Location */}
                {phase === 2 && (
                  <motion.div
                    key="phase2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Physical Office / Residential Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
                          <MapPin size={18} />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. House No. 14, Ring Road Central"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          City / Town <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Accra"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Region</label>
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          <option value="Greater Accra">Greater Accra</option>
                          <option value="Ashanti">Ashanti</option>
                          <option value="Central">Central</option>
                          <option value="Western">Western</option>
                          <option value="Eastern">Eastern</option>
                          <option value="Volta">Volta</option>
                          <option value="Northern">Northern</option>
                          <option value="Bono">Bono</option>
                          <option value="Upper East">Upper East</option>
                          <option value="Upper West">Upper West</option>
                          <option value="Other / International">Other / International</option>
                        </select>
                        {region === 'Other / International' && (
                          <div className="mt-2 space-y-1 animate-fadeIn">
                            <label className="text-[10px] font-bold text-slate-500 block">Specify Region / State *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. London / California"
                              value={customRegion}
                              onChange={(e) => setCustomRegion(e.target.value)}
                              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                            />
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          GhanaPost GPS Digital Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <Compass size={18} />
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. GA-183-9021"
                            value={digitalAddress}
                            onChange={(e) => setDigitalAddress(formatDigitalAddress(e.target.value))}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Format: XX-XXX-XXXX (GhanaPost GPS)</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Nearest Landmark / Directions
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Opposite University Gate 2"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* PHASE 3: Identification & Authority */}
                {phase === 3 && (
                  <motion.div
                    key="phase3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          National ID Document Type
                        </label>
                        <select
                          value={idType}
                          onChange={(e) => {
                            const newType = e.target.value;
                            setIdType(newType);
                            const cfg = resolveIdConfig(newType);
                            setIdNumber(prev => cfg.formatInput(prev));
                          }}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          <option value="Ghana Card (National ID)">Ghana Card (GHA-XXXXXXXXX-X)</option>
                          <option value="Voter ID Card">Voter ID Card (10 Digits — Numbers Only)</option>
                          <option value="NHIS Card (Health Insurance)">NHIS Card (8 Digits — Numbers Only)</option>
                          <option value="International Passport">International Passport (e.g. G1234567)</option>
                          <option value="Driver's License">Driver's License (DVLA Alphanumeric)</option>
                        </select>
                      </div>

                      {(() => {
                        const cfg = resolveIdConfig(idType);
                        return (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 block">
                                {cfg.name} Number <span className="text-rose-500">*</span>
                              </label>
                              {cfg.numericOnly && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black tracking-wide uppercase">
                                  Numbers Only (No Alphabets)
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                                <ShieldCheck size={18} />
                              </span>
                              <input
                                type={cfg.numericOnly ? "tel" : "text"}
                                required
                                inputMode={cfg.numericOnly ? "numeric" : "text"}
                                maxLength={cfg.maxLength}
                                placeholder={cfg.placeholder}
                                value={idNumber}
                                onChange={(e) => setIdNumber(cfg.formatInput(e.target.value))}
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono tracking-wide"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {cfg.helperText}
                            </p>
                          </div>
                        );
                      })()}

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Manager Authority Relationship
                        </label>
                        <select
                          value={authorityRole}
                          onChange={(e) => setAuthorityRole(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          <option value="Sole Property Owner">Sole Property Owner</option>
                          <option value="Co-Owner / Partner">Co-Owner / Partner</option>
                          <option value="Employed Residence Director">Employed Residence Director</option>
                          <option value="Authorized Management Agent">Authorized Management Agent</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Management Company / Company Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. PineVela Properties Ghana"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>

                    </div>

                    {/* Proof Document Upload */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        Proof of Ownership or Management Authorization (PDF or Image)
                      </label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-blue-900 rounded-2xl p-6 text-center bg-slate-50/50 transition-all">
                        {docFileName ? (
                          <div className="flex items-center justify-between bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-2">
                              <FileCheck size={20} className="text-emerald-600" />
                              <span className="text-xs font-bold truncate max-w-xs">{docFileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDocFileName(null)}
                              className="text-xs text-rose-600 hover:underline font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer space-y-2 block">
                            <UploadCloud size={32} className="mx-auto text-blue-900" />
                            <div className="text-xs font-bold text-slate-700">
                              Click to attach document or drag and drop
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Supports Title Deeds, Land Commission Permits, or Management Consent Certificates
                            </p>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHASE 4: Email & Password Credentials */}
                {phase === 4 && (
                  <motion.div
                    key="phase4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Manager Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Mail size={18} />
                        </span>
                        <input
                          type="email"
                          required
                          placeholder="e.g. manager@pinevela.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        />
                      </div>
                    </div>



                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Security Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <Key size={18} />
                          </span>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <Lock size={18} />
                          </span>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Password Strength Analyzer Widget */}
                    {password.length > 0 && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 transition-all animate-fade-in">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className={pwdStrength.textColor} />
                            <span className="text-xs font-extrabold text-slate-800">
                              Password Strength:
                            </span>
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${pwdStrength.badgeBg} ${pwdStrength.textColor}`}>
                              {pwdStrength.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-500">
                            {pwdStrength.score}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${pwdStrength.color}`}
                            initial={{ width: '0%' }}
                            animate={{ width: `${pwdStrength.score}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>

                        {/* Strength Rule Checklist */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                          <div className={`flex items-center gap-1.5 font-semibold ${pwdStrength.checks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span>{pwdStrength.checks.length ? '✓' : '○'}</span>
                            <span>8+ Characters</span>
                          </div>

                          <div className={`flex items-center gap-1.5 font-semibold ${pwdStrength.checks.hasLower && pwdStrength.checks.hasUpper ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span>{pwdStrength.checks.hasLower && pwdStrength.checks.hasUpper ? '✓' : '○'}</span>
                            <span>Aa Case Mix</span>
                          </div>

                          <div className={`flex items-center gap-1.5 font-semibold ${pwdStrength.checks.hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span>{pwdStrength.checks.hasNumber ? '✓' : '○'}</span>
                            <span>0-9 Numbers</span>
                          </div>

                          <div className={`flex items-center gap-1.5 font-semibold ${pwdStrength.checks.hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                            <span>{pwdStrength.checks.hasSpecial ? '✓' : '○'}</span>
                            <span>!@# Special</span>
                          </div>
                        </div>

                      </div>
                    )}
                  </motion.div>
                )}

                {/* PHASE 5: Review & Submit Verification */}
                {phase === 5 && (
                  <motion.div
                    key="phase5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6 text-left"
                  >
                    <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
                      <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        Summary Verification Dossier
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block">Manager Name:</span>
                          <span className="font-extrabold text-slate-800">{title} {fullName}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block">Phone Number:</span>
                          <span className="font-extrabold text-slate-800">{phone}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block">Physical Location:</span>
                          <span className="font-extrabold text-slate-800">{address}, {city}, {region}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block">Identification:</span>
                          <span className="font-extrabold text-slate-800">{idType} ({idNumber})</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block">Email Account:</span>
                          <span className="font-extrabold text-slate-800">{email}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold block">Organization / Authority:</span>
                          <span className="font-extrabold text-slate-800">{organization || 'Independent Management'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Legal Declaration Checkbox - Blue and Highly Visible */}
                    <label className="flex items-start gap-3.5 p-4 sm:p-5 bg-blue-50/90 rounded-2xl border-2 border-blue-400 shadow-md cursor-pointer hover:bg-blue-100/90 transition-all">
                      <input
                        type="checkbox"
                        checked={declarationAccepted}
                        onChange={(e) => setDeclarationAccepted(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded-lg border-2 border-blue-600 text-blue-700 focus:ring-blue-600 cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs sm:text-sm text-blue-950 font-bold leading-relaxed">
                        I hereby declare that all submitted personal identification, residential address details, and property management credentials are complete, accurate, and legally binding under PineVela Verification Policy.
                      </span>
                    </label>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation Button Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                {phase > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevPhase}
                    disabled={loadingSubmit}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>Previous Phase</span>
                  </button>
                ) : <div />}

                {phase < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextPhase}
                    className="px-6 py-3.5 bg-blue-900 hover:bg-blue-850 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 ml-auto cursor-pointer"
                  >
                    <span>Continue to Phase {phase + 1}</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitVerification}
                    disabled={loadingSubmit || !declarationAccepted}
                    className={`px-8 py-3.5 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center gap-2 ml-auto cursor-pointer ${
                      declarationAccepted && !loadingSubmit
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {loadingSubmit ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Submitting Verification...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Submit Manager Verification</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>

          </div>
        ) : (
          
          /* SUCCESS STATE: Complete & Redirect */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={48} />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                Registration Complete
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Verification Dossier Submitted!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                Welcome, <strong className="text-slate-800">{fullName}</strong>. Your manager verification profile has been created and submitted to the System Admin for approval.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-600 space-y-1.5 font-medium">
              <p className="font-bold text-slate-800">Your Credentials:</p>
              <p>• Email: <span className="font-mono font-bold text-blue-900">{email}</span></p>
              <p>• Organization: <span className="font-bold text-slate-800">{organization || 'Independent Management'}</span></p>
            </div>

            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full py-4 bg-blue-900 hover:bg-blue-850 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to User Account Home</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>

        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-[10px] sm:text-xs text-slate-400 border-t border-slate-100 bg-white">
        &copy; 2026 PineVela Residence Solutions. Manager Onboarding Protocol Enforced with Cryptographic Verification.
      </footer>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Authenticate Account Deletion</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Enter the email address and password for this Manager account to permanently delete it from our database and allow fresh registration.
              </p>
            </div>

            {delError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{delError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Account Email</label>
                <input
                  type="email"
                  value={delEmail}
                  onChange={(e) => setDelEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="e.g. manager@hostel.com"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">Account Password</label>
                <div className="relative">
                  <input
                    type={showDelPassword ? 'text' : 'password'}
                    value={delPassword}
                    onChange={(e) => setDelPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 pr-10"
                    placeholder="Enter your account password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDelPassword(!showDelPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showDelPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={delLoading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {delLoading ? (
                    <span>Deleting...</span>
                  ) : (
                    <span>Confirm & Delete Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
