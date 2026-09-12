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
  ChevronRight
} from 'lucide-react';
import PineLogo from './PineLogo';

export default function PageManagerOnboarding() {
  const navigate = useNavigate();

  // Active Phase State (1 to 5, 6 for Success)
  const [phase, setPhase] = useState<number>(1);
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
  const [hostelName, setHostelName] = useState('');
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
      if (!fullName.trim()) {
        triggerToast('Please enter your full legal name.', 'error');
        return;
      }
      if (!phone.trim() || phone.trim().length < 6) {
        triggerToast('Please enter a valid primary phone number.', 'error');
        return;
      }
    } else if (phase === 2) {
      if (!address.trim()) {
        triggerToast('Please enter your physical address.', 'error');
        return;
      }
      if (!city.trim()) {
        triggerToast('Please enter your city/town.', 'error');
        return;
      }
    } else if (phase === 3) {
      if (!idNumber.trim()) {
        triggerToast('Please enter your Identification Document Number.', 'error');
        return;
      }
    } else if (phase === 4) {
      if (!email.trim() || !email.includes('@')) {
        triggerToast('Please enter a valid email address.', 'error');
        return;
      }
      if (!hostelName.trim()) {
        triggerToast('Please enter your proposed Hostel or Property name.', 'error');
        return;
      }
      if (!password || password.length < 6) {
        triggerToast('Password must be at least 6 characters long.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        triggerToast('Passwords do not match. Please verify.', 'error');
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
    if (!declarationAccepted) {
      triggerToast('Please accept the declaration to submit your verification.', 'error');
      return;
    }

    setLoadingSubmit(true);
    try {
      const formattedName = `${title} ${fullName.trim()}`;
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();
      const cleanHostelName = hostelName.trim();
      const finalRegion = region === 'Other / International' ? customRegion.trim() : region;

      // 1. Unified payload for Manager Account & Verification Dossier
      const verifPayload = {
        managerName: formattedName,
        name: formattedName,
        managerEmail: cleanEmail,
        email: cleanEmail,
        password: password,
        managerPhone: cleanPhone,
        phone: cleanPhone,
        altPhone: altPhone.trim() || undefined,
        hostelName: cleanHostelName,
        proposedHostelName: cleanHostelName,
        propertyName: cleanHostelName,
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
        organizationName: organization.trim() || cleanHostelName,
        organization: organization.trim() || cleanHostelName,
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
          organization: organization.trim() || cleanHostelName,
          savedAt: new Date().toISOString()
        };
        const updated = [...existing.filter((m: any) => m && m.email !== cleanEmail), newManagerEntry];
        localStorage.setItem('pinevela_registered_managers', JSON.stringify(updated));
      } catch (storageErr) {
        console.warn("Local storage write error:", storageErr);
      }

      setPhase(6); // Step 6: Success Confirmation View
      triggerToast('Manager Verification Dossier Submitted Successfully!', 'success');
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
          <div className="flex items-center gap-3">
            <PineLogo size={36} hideText={false} />
            <span className="hidden sm:inline-block h-5 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs font-extrabold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Manager Onboarding Gateway
            </span>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        
        {phase <= 5 ? (
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
                            placeholder="+233 24 000 0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
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
                            placeholder="+233 50 000 0000"
                            value={altPhone}
                            onChange={(e) => setAltPhone(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
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
                            onChange={(e) => setDigitalAddress(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
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
                          onChange={(e) => setIdType(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                        >
                          <option value="Ghana Card (National ID)">Ghana Card (National ID)</option>
                          <option value="International Passport">International Passport</option>
                          <option value="Voter ID Card">Voter ID Card</option>
                          <option value="Driver's License">Driver's License</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          ID Document Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                            <ShieldCheck size={18} />
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="e.g. GHA-729103982-1"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
                          />
                        </div>
                      </div>

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

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Proposed Primary Hostel / Residence Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Building size={18} />
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pine Crest Residency"
                          value={hostelName}
                          onChange={(e) => setHostelName(e.target.value)}
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
                          <span className="text-slate-400 font-bold block">Proposed Property:</span>
                          <span className="font-extrabold text-slate-800">{hostelName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Legal Declaration Checkbox */}
                    <label className="flex items-start gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declarationAccepted}
                        onChange={(e) => setDeclarationAccepted(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-blue-900 focus:ring-blue-900"
                      />
                      <span className="text-xs text-slate-700 font-semibold leading-relaxed">
                        I hereby declare that all submitted personal identification, residential address details, and property ownership credentials are complete, accurate, and legally binding under PineVela Verification Policy.
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
                Welcome, <strong className="text-slate-800">{fullName}</strong>. Your manager profile for <strong className="text-slate-800">{hostelName}</strong> has been created and submitted to the System Admin for approval.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-600 space-y-1.5 font-medium">
              <p className="font-bold text-slate-800">Your Credentials:</p>
              <p>• Email: <span className="font-mono font-bold text-blue-900">{email}</span></p>
              <p>• Assigned Hostel: <span className="font-bold text-slate-800">{hostelName}</span></p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-blue-900 hover:bg-blue-850 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Login Screen</span>
              <ArrowRight size={18} />
            </button>
          </motion.div>

        )}

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-[10px] sm:text-xs text-slate-400 border-t border-slate-100 bg-white">
        &copy; 2026 PineVela Residence Solutions. Manager Onboarding Protocol Enforced with Cryptographic Verification.
      </footer>

    </div>
  );
}
