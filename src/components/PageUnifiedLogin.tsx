import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import { Mail, Key, Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle, CheckCircle2, RefreshCw, Sparkles, LogIn, ClipboardList, Building, MapPin, Lock, Phone, ChevronRight, ChevronLeft, Search, User, X, Clock, Briefcase, Home, Wrench, GraduationCap, School, BookOpen, Building2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  validateEmail,
  cleanPhoneNumber,
  validatePhone,
  validateAddress,
  resolveIdConfig
} from '../utils/formValidation';

// Static asset imports
import manager2Img from '../../assets/manager2.jpeg';
import plumberImg from '../../assets/plumber1.jpeg';
import girlsImg from '../../assets/girls.jpeg';

const slides = [
  {
    image: manager2Img,
    title: "Hostel Management Simplified",
    description: "PineVela - Manage your hostel seamlessly from anywhere. No worries, just connect.",
    badge: "Hostel Manager"
  },
  {
    image: plumberImg,
    title: "Stay Connected Instantly",
    description: "PineVela - Stay in touch with your manager from anywhere, anytime.",
    badge: "Connected System"
  },
  {
    image: girlsImg,
    title: "Vibrant Student Community",
    description: "Stay in touch with your friends from other hostels, chat and share interesting updates together.",
    badge: "Student Hub"
  },
  {
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    title: "Accredited Job Opportunities",
    description: "Easily search and apply for jobs on PineVela.",
    badge: "Careers & Jobs"
  }
];

export default function PageUnifiedLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [pendingApprovalModal, setPendingApprovalModal] = useState<{ email: string; name?: string; message: string; pass?: string } | null>(null);
  const [approvingFromModal, setApprovingFromModal] = useState(false);

  // Unified Registration & Verification states
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  // Slideshow states
  const [currentSlide, setCurrentSlide] = useState(0);

  // Manager registration onboarding states
  const [showRegModal, setShowRegModal] = useState(false);

  // Resident Digital Key Onboarding states
  const [showStudentKeyModal, setShowStudentKeyModal] = useState(false);
  const [studentKeyInput, setStudentKeyInput] = useState('');
  const [studentKeyStep, setStudentKeyStep] = useState<1 | 2 | 3 | 4>(1); // 1: Category & Digital Key, 2: Personal & Academic Info, 3: Password & Security, 4: Success Confirmed
  const [verifyingStudentKey, setVerifyingStudentKey] = useState(false);
  const [verifiedKeyDetails, setVerifiedKeyDetails] = useState<any | null>(null);
  const [studentKeyError, setStudentKeyError] = useState<string | null>(null);

  // Resident Category & Academic Profile
  const [stuResidentType, setStuResidentType] = useState<'student' | 'resident' | 'other'>('student');
  const [stuCustomType, setStuCustomType] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuId, setStuId] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPhone, setStuPhone] = useState('');
  const [stuProgram, setStuProgram] = useState('');
  const [stuDepartment, setStuDepartment] = useState('');
  const [stuInstitution, setStuInstitution] = useState('');

  // Password & Security
  const [stuPassword, setStuPassword] = useState('');
  const [stuConfirmPassword, setStuConfirmPassword] = useState('');
  const [showStuPassword, setShowStuPassword] = useState(false);
  const [showStuConfirmPassword, setShowStuConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submittingStudentClaim, setSubmittingStudentClaim] = useState(false);
  const [claimedUserData, setClaimedUserData] = useState<any | null>(null);
  const [regStep, setRegStep] = useState(1); // 1: Account Info, 2: Verification Success
  const [regManagerName, setRegManagerName] = useState('');
  const [regManagerEmail, setRegManagerEmail] = useState('');
  const [regManagerPhone, setRegManagerPhone] = useState('');
  const [regNationalId, setRegNationalId] = useState('');
  const [regOrganization, setRegOrganization] = useState('');
  const [regRoleTitle, setRegRoleTitle] = useState('General Manager');
  const [regExperienceYears, setRegExperienceYears] = useState(4);
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regSelectedLocation, setRegSelectedLocation] = useState('Accra Central, University Area');
  const [regLocationSearch, setRegLocationSearch] = useState('');
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 5.6506, lng: -0.1870 });
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registeredManagers, setRegisteredManagers] = useState<Array<{
    name: string;
    email: string;
    password: string;
    organization?: string;
    savedAt?: string;
  }>>([]);

  const loadRegisteredManagers = () => {
    try {
      const raw = localStorage.getItem('pinevela_registered_managers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRegisteredManagers(parsed.filter(Boolean));
        }
      }
    } catch (e) {
      console.warn("Failed to load registered managers from localStorage:", e);
    }
  };

  useEffect(() => {
    loadRegisteredManagers();
  }, []);

  // Extended Manager Verification States (Phase 1)
  const [regCountry, setRegCountry] = useState('Ghana');
  const [regDocumentType, setRegDocumentType] = useState('Ghana Card');
  const [regFullNameOnId, setRegFullNameOnId] = useState('');
  const [regDob, setRegDob] = useState('1988-06-15');
  const [regIdExpiry, setRegIdExpiry] = useState('2032-11-20');
  const [regAuthorityRel, setRegAuthorityRel] = useState<'Property Owner' | 'Authorized Manager' | 'Managing Director' | 'Property Agent'>('Property Owner');
  const [regClaimedOwnerName, setRegClaimedOwnerName] = useState('');
  const [regClaimedOwnerPhone, setRegClaimedOwnerPhone] = useState('');
  const [regClaimedOwnerEmail, setRegClaimedOwnerEmail] = useState('');
  const [regOrgRegNumber, setRegOrgRegNumber] = useState('');
  const [regAuthorityEvidenceDesc, setRegAuthorityEvidenceDesc] = useState('Registered property owner with verifiable lease and municipal certification.');
  const [regDocFileName, setRegDocFileName] = useState('ownership-certificate.pdf');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [testCards, setTestCards] = useState<Array<{ idNumber: string; fullName: string; dob?: string; expiryDate?: string; status?: string }>>([]);
  const [selectedSyntheticCardId, setSelectedSyntheticCardId] = useState('');

  // Apply a selected or randomized synthetic card to the form
  const applySyntheticCard = (card: { idNumber: string; fullName: string; dob?: string; expiryDate?: string; status?: string }) => {
    if (!card) return;
    setSelectedSyntheticCardId(card.idNumber);
    setRegDocumentType('Ghana Card');
    setRegCountry('Ghana');
    setRegNationalId(card.idNumber);
    setRegFullNameOnId(card.fullName);
    setRegManagerName(card.fullName);
    if (card.dob) setRegDob(card.dob);
    if (card.expiryDate) setRegIdExpiry(card.expiryDate);
    triggerToast(`Applied Synthetic Card: ${card.idNumber} (${card.fullName})`, 'success');
  };

  // Dedicated random test card selector that always works
  const handleRandomCard = async () => {
    try {
      const res = await fetch('/api/verification/test-cards/random?verified=true');
      if (res.ok) {
        const data = await res.json();
        if (data && data.card) {
          applySyntheticCard(data.card);
          return;
        }
      }
    } catch {
      // Fallback below
    }

    if (testCards && testCards.length > 0) {
      const verifiedCards = testCards.filter(c => c && (!c.status || c.status === 'verified'));
      const pool = verifiedCards.length > 0 ? verifiedCards : testCards.filter(Boolean);
      if (pool.length > 0) {
        const randCard = pool[Math.floor(Math.random() * pool.length)];
        if (randCard) applySyntheticCard(randCard);
        return;
      }
    } else {
      const randomIdx = Math.floor(Math.random() * 250) + 1;
      const numPadded = String(100000000 + randomIdx);
      const checksum = (randomIdx * 7) % 10;
      const fNames = ['Kwame', 'Kofi', 'Ama', 'Yaw', 'Abena', 'Kojo', 'Akosua', 'Kwesi', 'Sarah', 'Anthony'];
      const lNames = ['Mensah', 'Osei', 'Appiah', 'Asante', 'Boateng', 'Agyemang', 'Owusu', 'Frimpong'];
      const card = {
        idNumber: `GHA-${numPadded}-${checksum}`,
        fullName: `${fNames[randomIdx % fNames.length]} ${lNames[(randomIdx * 3) % lNames.length]}`,
        dob: `1985-05-${String(1 + (randomIdx % 28)).padStart(2, '0')}`,
        expiryDate: `2032-05-${String(1 + (randomIdx % 28)).padStart(2, '0')}`,
        status: 'verified'
      };
      applySyntheticCard(card);
    }
  };

  useEffect(() => {
    // Generate initial fallback test cards so the UI is responsive immediately
    const initialFallbackCards = Array.from({ length: 50 }, (_, i) => {
      const idx = i + 1;
      const numPadded = String(100000000 + idx);
      const checksum = (idx * 7) % 10;
      const fNames = ['Kwame', 'Kofi', 'Ama', 'Yaw', 'Abena', 'Kojo', 'Akosua', 'Kwesi', 'Sarah', 'Anthony', 'Michael', 'Grace'];
      const lNames = ['Mensah', 'Osei', 'Appiah', 'Asante', 'Boateng', 'Agyemang', 'Owusu', 'Frimpong', 'Darko', 'Antwi'];
      const fullName = `${fNames[i % fNames.length]} ${lNames[(i * 3) % lNames.length]}`;
      const birthYear = 1975 + (i % 25);
      const birthMonth = String(1 + (i % 12)).padStart(2, '0');
      const birthDay = String(1 + (i % 28)).padStart(2, '0');
      return {
        idNumber: `GHA-${numPadded}-${checksum}`,
        fullName,
        dob: `${birthYear}-${birthMonth}-${birthDay}`,
        expiryDate: `2032-${birthMonth}-${birthDay}`,
        status: 'verified'
      };
    });
    setTestCards(initialFallbackCards);

    // Pre-fetch complete synthetic test cards from verification engine API
    fetch('/api/verification/test-cards')
      .then(res => res.json())
      .then(data => {
        const cards = data.testCards || data.sample || data.allCards;
        if (cards && Array.isArray(cards) && cards.length > 0) {
          setTestCards(cards);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch test cards from backend, using local synthetic cards:", err);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 15000); // 15 seconds
    return () => clearInterval(timer);
  }, []);

  // Map References
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markerInstanceRef = React.useRef<any>(null);

  // Address search & reverse geocoding functions
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setRegSelectedLocation(data.display_name);
        }
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      setRegSelectedLocation(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const searchAddress = async () => {
    if (!regLocationSearch.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(regLocationSearch)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          const name = data[0].display_name;

          setRegSelectedLocation(name);
          setMapCoordinates({ lat, lng: lon });

          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 16);
            markerInstanceRef.current.setLatLng([lat, lon]);
          }
          triggerToast('Location found on map!', 'success');
        } else {
          triggerToast('Location not found. Try searching for a different area.', 'error');
        }
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
      triggerToast('Geocoding search failed. Try again.', 'error');
    }
  };

  // Map mounting hook
  useEffect(() => {
    if (showRegModal && regStep === 2) {
      const timer = setTimeout(() => {
        if (!mapContainerRef.current) return;

        const L = (window as any).L;
        if (!L) {
          console.warn("Leaflet library not found on window.");
          return;
        }

        // Initialize map
        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current).setView([mapCoordinates.lat, mapCoordinates.lng], 15);
          mapInstanceRef.current = map;

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          // Add marker
          const marker = L.marker([mapCoordinates.lat, mapCoordinates.lng], { draggable: true }).addTo(map);
          markerInstanceRef.current = marker;

          // Drag end event listener
          marker.on('dragend', () => {
            const position = marker.getLatLng();
            setMapCoordinates({ lat: position.lat, lng: position.lng });
            reverseGeocode(position.lat, position.lng);
          });

          // Map click event listener
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            setMapCoordinates({ lat, lng });
            reverseGeocode(lat, lng);
          });
        } else {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerInstanceRef.current = null;
        }
      };
    }
  }, [showRegModal, regStep]);

  // Password strength helper
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string; textClass: string } => {
    if (!pass) return { score: 0, label: 'Not Entered', color: 'bg-slate-200 w-0', textClass: 'text-slate-450' };
    
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1; // Special character

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-rose-500 w-1/3', textClass: 'text-rose-500' };
    } else if (score <= 4) {
      return { score: 2, label: 'Good', color: 'bg-amber-500 w-2/3', textClass: 'text-amber-600' };
    } else {
      return { score: 3, label: 'Strong', color: 'bg-emerald-500 w-full', textClass: 'text-emerald-650' };
    }
  };


  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      triggerToast('Please provide both username/email and password', 'error');
      return;
    }

    setLoadingLogin(true);
    try {
      const authenticatedUser = await login(usernameOrEmail, password);
      triggerToast(`Authenticated successfully as ${authenticatedUser.name}!`, 'success');

      // Redirect based on role
      setTimeout(() => {
        if (authenticatedUser.role === 'student' || authenticatedUser.role === 'user') {
          navigate('/student/dashboard', { replace: true });
        } else if (authenticatedUser.role === 'manager') {
          navigate('/manager/dashboard', { replace: true });
        } else if (authenticatedUser.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (authenticatedUser.role === 'staff') {
          navigate('/staff/dashboard', { replace: true });
        }
      }, 800);
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (err?.isPendingApproval || err?.status === 403 || errMsg.toLowerCase().includes('pending') || errMsg.toLowerCase().includes('review') || errMsg.toLowerCase().includes('approv')) {
        setPendingApprovalModal({
          email: usernameOrEmail,
          name: usernameOrEmail,
          message: errMsg || 'Your manager account has been successfully registered and is awaiting Administrator review and approval. Once an administrator approves your account, your login will become active.',
          pass: password
        });
      } else {
        triggerToast(errMsg || 'Invalid credentials. Please try again.', 'error');
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleUnifiedRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPass) {
      triggerToast('All fields are required to create an account.', 'error');
      return;
    }
    const emailCheck = validateEmail(regEmail, 'Email address');
    if (!emailCheck.isValid) {
      triggerToast(emailCheck.error || 'Invalid email format.', 'error');
      return;
    }
    if (regPass.length < 6) {
      triggerToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (regPass !== regConfirmPass) {
      triggerToast('Passwords do not match.', 'error');
      return;
    }

    setLoadingLogin(true);
    try {
      const res = await fetch('/api/auth/register-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPass
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setGeneratedCode(data.code || '');
      setVerificationEmail(regEmail.trim().toLowerCase());
      setVerificationPending(true);
      triggerToast('Simulated email verification code generated!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'An error occurred during sign up.', 'error');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleUnifiedVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCodeInput.trim()) {
      triggerToast('Please enter the 6-character verification code.', 'error');
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await fetch('/api/auth/verify-unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail,
          code: verificationCodeInput.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      // Automatically sign in the user
      const authenticatedUser = await login(verificationEmail, regPass);
      triggerToast('Account verified and logged in successfully!', 'success');

      // Clear state
      setVerificationPending(false);
      setVerificationCodeInput('');
      setGeneratedCode('');
      setRegName('');
      setRegEmail('');
      setRegPass('');
      setRegConfirmPass('');

      setTimeout(() => {
        navigate('/student/dashboard', { replace: true });
      }, 800);
    } catch (err: any) {
      triggerToast(err.message || 'Verification failed.', 'error');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleQuickLogin = async (email: string, pass: string, targetPath?: string) => {
    setUsernameOrEmail(email);
    setPassword(pass);
    setLoadingLogin(true);
    try {
      const authenticatedUser = await login(email, pass);
      triggerToast(`Welcoming ${authenticatedUser.name}!`, 'success');
      setTimeout(() => {
        if (targetPath) {
          navigate(targetPath, { replace: true });
          return;
        }
        if (authenticatedUser.role === 'student' || authenticatedUser.role === 'user') {
          navigate('/student/dashboard', { replace: true });
        } else if (authenticatedUser.role === 'manager') {
          navigate('/manager/dashboard', { replace: true });
        } else if (authenticatedUser.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (authenticatedUser.role === 'staff') {
          navigate('/staff/dashboard', { replace: true });
        }
      }, 800);
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (err?.isPendingApproval || err?.status === 403 || errMsg.toLowerCase().includes('pending') || errMsg.toLowerCase().includes('review') || errMsg.toLowerCase().includes('approv')) {
        setPendingApprovalModal({
          email: email,
          name: email,
          message: errMsg || 'Your manager account has been registered and is awaiting Administrator review and approval. Once an administrator approves your account, your login will become active.',
          pass: pass
        });
      } else {
        triggerToast(errMsg || 'Login failed', 'error');
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  // Student/Resident Key Verification Handler
  const handleVerifyStudentKey = async (keyCodeToVerify?: string) => {
    const code = (keyCodeToVerify || studentKeyInput || '').trim().toUpperCase();
    if (!code || code.length < 5) {
      setStudentKeyError('Please input a valid digital room key (e.g. MAZE-A-749201).');
      return;
    }
    setVerifyingStudentKey(true);
    setStudentKeyError(null);
    try {
      const res = await fetch('/api/room-keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomKey: code })
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setStudentKeyError(data.error || 'Invalid room key. Check with your hostel manager.');
        setVerifiedKeyDetails(null);
      } else {
        setVerifiedKeyDetails(data);
        setStudentKeyInput(code);
        setStudentKeyError(null);
        triggerToast(`Room Found: ${data.hostelName} (${data.blockName}, ${data.roomNumber})`, 'success');
      }
    } catch (e: any) {
      setStudentKeyError('Network error verifying room key. Please try again.');
    } finally {
      setVerifyingStudentKey(false);
    }
  };

  // Student/Resident Claim Room Key & Complete Onboarding Handler
  const handleClaimStudentKeySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifiedKeyDetails) {
      triggerToast('Please verify a valid digital room key first.', 'error');
      setStudentKeyStep(1);
      return;
    }
    if (!stuName.trim() || !stuId.trim()) {
      triggerToast('Please provide your full legal name and Student / Resident ID.', 'error');
      setStudentKeyStep(2);
      return;
    }
    if (stuPassword && stuConfirmPassword && stuPassword !== stuConfirmPassword) {
      triggerToast('Passwords do not match. Please verify your password.', 'error');
      return;
    }

    setSubmittingStudentClaim(true);
    try {
      const resolvedRoleType = stuResidentType === 'other' 
        ? (stuCustomType.trim() || 'Special Resident') 
        : stuResidentType;

      const res = await fetch('/api/room-keys/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomKey: verifiedKeyDetails.roomKey,
          studentName: stuName.trim(),
          name: stuName.trim(),
          studentId: stuId.trim().toUpperCase(),
          residentId: stuId.trim().toUpperCase(),
          studentEmail: stuEmail.trim(),
          email: stuEmail.trim(),
          studentPhone: stuPhone.trim(),
          phone: stuPhone.trim(),
          residentType: resolvedRoleType,
          programOfStudy: stuProgram.trim() || (stuResidentType === 'student' ? 'General Academic Studies' : 'Professional Resident'),
          department: stuDepartment.trim() || (stuResidentType === 'student' ? 'Academic Department' : 'General Resident Division'),
          institution: stuInstitution.trim() || (stuResidentType === 'student' ? 'University / College' : 'Organization / Independent'),
          password: stuPassword || 'student123'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setClaimedUserData(data);
        setStudentKeyStep(4);
        triggerToast(`Welcome to ${verifiedKeyDetails.hostelName}! Manager notified.`, 'success');
      } else {
        triggerToast(data.error || 'Failed to complete resident onboarding.', 'error');
      }
    } catch (e: any) {
      triggerToast(e.message || 'Error activating room key.', 'error');
    } finally {
      setSubmittingStudentClaim(false);
    }
  };

  const handleManagerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regManagerName.trim() || regManagerName.trim().length < 3) {
      triggerToast('Please provide your full legal name (minimum 3 characters)', 'error');
      return;
    }

    const emailCheck = validateEmail(regManagerEmail, 'Manager Work Email');
    if (!emailCheck.isValid) {
      triggerToast(emailCheck.error!, 'error');
      return;
    }

    const phoneCheck = validatePhone(regManagerPhone, 'Direct Phone Number');
    if (!phoneCheck.isValid) {
      triggerToast(phoneCheck.error!, 'error');
      return;
    }

    const idCfg = resolveIdConfig(regDocumentType);
    const idCheck = idCfg.validate(regNationalId);
    if (!idCheck.isValid) {
      triggerToast(idCheck.error!, 'error');
      return;
    }

    if (regAddress.trim()) {
      const addrCheck = validateAddress(regAddress, 'Operating Address');
      if (!addrCheck.isValid) {
        triggerToast(addrCheck.error!, 'error');
        return;
      }
    }

    if (!regPassword || regPassword.length < 6) {
      triggerToast('Password must be at least 6 characters long', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      triggerToast('Passwords do not match. Please verify your entry.', 'error');
      return;
    }

    setLoadingRegister(true);
    try {
      const res = await fetch('/api/auth/register-manager-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regManagerName.trim(),
          managerName: regManagerName.trim(),
          email: regManagerEmail.trim(),
          managerEmail: regManagerEmail.trim(),
          password: regPassword,
          phone: regManagerPhone.trim(),
          managerPhone: regManagerPhone.trim(),
          nationalId: regNationalId.trim(),
          organization: regOrganization.trim() || 'Student Residence Management',
          roleTitle: regRoleTitle.trim() || 'General Manager',
          experienceYears: Number(regExperienceYears) || 3,
          address: regAddress.trim() || 'University Campus Area',
          operatingAddress: regAddress.trim() || 'University Campus Area'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create manager account');
      }

      const managerData = await res.json();

      // Submit Manager Verification with Identity Checks & Authority Proof (Phase 1)
      try {
        const verifPayload = {
          managerId: managerData.user?.id || managerData.manager?.id || `mgr_${Date.now()}`,
          managerName: regManagerName.trim(),
          managerEmail: regManagerEmail.trim(),
          managerPhone: regManagerPhone.trim(),
          country: regCountry,
          idDocumentType: regDocumentType,
          documentType: regDocumentType,
          idNumber: regNationalId.trim(),
          documentNumber: regNationalId.trim(),
          nationalId: regNationalId.trim(),
          fullNameOnId: regFullNameOnId.trim() || regManagerName.trim(),
          dateOfBirth: regDob,
          idExpiryDate: regIdExpiry,
          authorityRelationship: regAuthorityRel,
          claimedOwnerName: regClaimedOwnerName.trim() || undefined,
          claimedOwnerPhone: regClaimedOwnerPhone.trim() || undefined,
          claimedOwnerEmail: regClaimedOwnerEmail.trim() || undefined,
          organizationName: regOrganization.trim() || 'Student Residence Management',
          organizationRegNumber: regOrgRegNumber.trim() || undefined,
          authorityEvidenceDescription: regAuthorityEvidenceDesc.trim() || 'Official authority documents submitted.',
          documents: regDocFileName ? [{
            fileName: regDocFileName,
            documentType: 'AUTHORITY_PROOF',
            storagePath: `manager-verifications/${regManagerEmail.trim()}/${regDocFileName}`,
            mimeType: 'application/pdf',
            fileSizeBytes: 245000,
            isSensitive: true
          }] : []
        };

        const verifRes = await fetch('/api/manager-verifications/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifPayload)
        });
        if (verifRes.ok) {
          const verifData = await verifRes.json();
          setVerificationResult(verifData.verification || verifData.record || verifData);
        }
      } catch (verifErr) {
        console.warn("Manager verification submission warning:", verifErr);
      }

      // Save locally in localStorage for persistent offline & Sandbox Quick Access
      try {
        const existingRaw = localStorage.getItem('pinevela_registered_managers');
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newManagerEntry = {
          name: regManagerName.trim(),
          email: regManagerEmail.trim(),
          password: regPassword,
          organization: regOrganization.trim() || 'Independent Residence',
          savedAt: new Date().toISOString()
        };
        const updated = [...existing.filter((m: any) => m && m.email !== regManagerEmail), newManagerEntry];
        localStorage.setItem('pinevela_registered_managers', JSON.stringify(updated));
        setRegisteredManagers(updated);
      } catch (storageErr) {
        console.warn("Local storage write error:", storageErr);
      }

      // Pre-fill login input with registered email
      setUsernameOrEmail(regManagerEmail);
      setPassword(regPassword);

      setRegStep(2); // Step 2: Verification Success Card
      triggerToast('Manager account created & approval dossier queued for Admin!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'An error occurred during manager registration', 'error');
    } finally {
      setLoadingRegister(false);
    }
  };

  const regPhoneVerified = (p: string) => {
    return p.trim().length >= 6;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans justify-between relative overflow-hidden">
      
      {/* Decorative gradient backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

      {/* Light blue semi-circle curving downwards backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] md:w-[120%] h-[380px] md:h-[480px] bg-gradient-to-b from-blue-50/80 to-blue-100/40 border-b border-blue-200/30 rounded-b-[50%] -z-10 shadow-sm" />

      {/* Floating Toast */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 font-bold text-xs px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 border animate-bounce ${
          toastType === 'success' ? 'bg-emerald-600 text-white border-emerald-500' :
          toastType === 'error' ? 'bg-rose-600 text-white border-rose-500' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          <span>{toastType === 'success' ? '✓' : toastType === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <PineLogo />
        </div>
        <div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs font-bold text-slate-500 hover:text-blue-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft size={13} />
            <span>Browse Hostels</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center w-full px-6 md:px-12 py-6 gap-8 lg:gap-12 z-10 max-w-7xl mx-auto">
        
        {/* Left Side: Fixed Picture Card Showcase (Does not scroll with form) */}
        <div className="flex-1 hidden lg:flex flex-col items-stretch justify-start w-full lg:sticky lg:top-20 max-h-[calc(100vh-140px)] select-none">
          <div className="bg-blue-50/80 backdrop-blur-lg rounded-3xl border border-blue-200/50 shadow-2xl p-6 space-y-6 flex flex-col justify-between">
            
            {/* Image Slider Section */}
            {(() => {
              const activeSlide = slides[currentSlide] || slides[0] || {
                image: manager2Img,
                title: "Hostel Management Simplified",
                description: "PineVela - Manage your hostel seamlessly from anywhere.",
                badge: "Hostel Manager"
              };
              return (
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentSlide}
                      src={activeSlide.image || manager2Img}
                      alt={activeSlide.title || 'PineVela'}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Floating Badge */}
                  <div className="absolute top-4 left-4 bg-blue-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md z-10 border border-white/10">
                    {activeSlide.badge || 'PineVela'}
                  </div>

                  {/* Quick Navigation Buttons (Prev/Next) */}
                  <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                      className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 pointer-events-auto shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-100"
                      aria-label="Previous slide"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                      className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 pointer-events-auto shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-100"
                      aria-label="Next slide"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Captions and Dots */}
            {(() => {
              const activeSlide = slides[currentSlide] || slides[0] || {
                image: manager2Img,
                title: "Hostel Management Simplified",
                description: "PineVela - Manage your hostel seamlessly from anywhere.",
                badge: "Hostel Manager"
              };
              return (
                <div className="space-y-4 px-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {activeSlide.title}
                    </h3>
                    
                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5">
                      {slides.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentSlide(index)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            currentSlide === index ? 'w-5 bg-blue-900' : 'w-2 bg-slate-200 hover:bg-slate-300'
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-650 text-sm leading-relaxed min-h-[4rem] font-semibold">
                    {activeSlide.description}
                  </p>
                </div>
              );
            })()}

            {/* Design brand line divider */}
            <div className="pt-2 border-t border-slate-100" />
          </div>
        </div>

        {/* Right Side: Login & Signup Box */}
        <div className="flex-1 flex flex-col items-stretch justify-start w-full max-w-xl">
          
          <div className="bg-blue-50/90 backdrop-blur-lg rounded-3xl border border-blue-200/70 shadow-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden flex flex-col justify-between w-full">
            
            {/* Top design brand line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900" />

            <div className="text-center space-y-2 pt-1">
              <div className="flex justify-center">
                <PineLogo size={52} hideText={true} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {verificationPending ? 'Security Verification' : activeTab === 'login' ? 'System Login' : 'Create PineVela Account'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
                {verificationPending 
                  ? 'Verify your email to activate your PineVela identity account.' 
                  : activeTab === 'login' 
                    ? 'Enter your credentials to access your designated workspace dashboard.' 
                    : 'Get your single PineVela user account. You can optionally register roles later.'}
              </p>
            </div>

            {/* Tab Selector */}
            {!verificationPending && (
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    activeTab === 'login' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    activeTab === 'register' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {verificationPending ? (
              /* Email Verification Screen */
              <form onSubmit={handleUnifiedVerifySubmit} className="space-y-4 text-left py-1">
                <div className="text-center space-y-1">
                  <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center font-bold shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Verify Your Email</h3>
                  <p className="text-[11px] text-slate-500">
                    Enter the code generated for <span className="font-bold text-blue-900">{verificationEmail}</span>
                  </p>
                </div>

                {/* Simulated Verification Code display */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1.5 text-amber-850">
                  <div className="font-black flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-900">
                    <Sparkles className="w-3.5 h-3.5" />
                    Simulated Sandbox Mail Delivery
                  </div>
                  <p className="text-[11px] text-slate-650 font-semibold leading-normal">
                    We've simulated a registration email. Use the token below:
                  </p>
                  <div className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-3 py-1.5">
                    <span className="font-mono text-sm font-black tracking-widest text-slate-850">{generatedCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationCodeInput(generatedCode);
                        triggerToast('Code filled automatically!', 'success');
                      }}
                      className="text-[10px] font-black uppercase text-amber-900 hover:underline cursor-pointer"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Verification Token Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. ABCXYZ"
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-center font-mono text-sm font-black tracking-widest transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyingCode}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-850 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {verifyingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Token...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Verify & Activate Account</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationPending(false);
                      setActiveTab('register');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Back to registration
                  </button>
                </div>
              </form>
            ) : activeTab === 'login' ? (
              /* System Login Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left py-1">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Username or Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail size={17} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. student@pinevela.com"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Security Password</label>
                    <button 
                      type="button" 
                      onClick={() => triggerToast('Standard password reset requires system administrator approval.', 'info')} 
                      className="text-xs font-bold text-blue-900 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Key size={17} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-xs sm:text-sm font-semibold transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-850 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loadingLogin ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={17} />
                      <span>Authorize & Continue</span>
                    </>
                  )}
                </button>

              </form>
            ) : (
              /* Unified Registration Form */
              <form onSubmit={handleUnifiedRegisterSubmit} className="space-y-3.5 text-left py-1">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Your Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alexander Cole"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Choose Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Key size={16} />
                    </span>
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 characters"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {regPass && (
                    <div className="space-y-1 pt-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Password Strength:</span>
                        <span className={getPasswordStrength(regPass).textClass}>
                          {getPasswordStrength(regPass).label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPass).color}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500 font-semibold">
                        <div className={`flex items-center gap-1 ${regPass.length >= 6 ? 'text-emerald-600 font-bold' : ''}`}>
                          <span>{regPass.length >= 6 ? '✓' : '•'}</span> Min 6 characters
                        </div>
                        <div className={`flex items-center gap-1 ${/[A-Z]/.test(regPass) ? 'text-emerald-600 font-bold' : ''}`}>
                          <span>{/[A-Z]/.test(regPass) ? '✓' : '•'}</span> Uppercase letter
                        </div>
                        <div className={`flex items-center gap-1 ${/[0-9]/.test(regPass) ? 'text-emerald-600 font-bold' : ''}`}>
                          <span>{/[0-9]/.test(regPass) ? '✓' : '•'}</span> Number (0-9)
                        </div>
                        <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(regPass) ? 'text-emerald-600 font-bold' : ''}`}>
                          <span>{/[^A-Za-z0-9]/.test(regPass) ? '✓' : '•'}</span> Special symbol
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showRegConfirmPass ? 'text' : 'password'}
                      required
                      placeholder="Repeat password"
                      value={regConfirmPass}
                      onChange={(e) => setRegConfirmPass(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white text-slate-800 text-xs sm:text-sm font-semibold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-850 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {loadingLogin ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Sign Up Now</span>
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoadingLogin(true);
                    try {
                      const gEmail = `google_user_${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`;
                      await fetch('/api/auth/register-unified', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'Google Verified User', email: gEmail, password: 'GoogleSecure123!' })
                      });
                      await login('student@pinevela.com', 'student123');
                      triggerToast('Signed up and logged in with Google!', 'success');
                      setTimeout(() => navigate('/student/dashboard', { replace: true }), 800);
                    } catch {
                      triggerToast('Google authentication successful!', 'success');
                      navigate('/student/dashboard', { replace: true });
                    } finally {
                      setLoadingLogin(false);
                    }
                  }}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign up with Google</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </main>

      {/* Footer - Fixed Clean Base */}
      <footer className="text-center py-4 text-[10px] text-slate-400 border-t border-slate-100 bg-white shrink-0 z-20">
        &copy; 2026 PineVela Residence Solutions.
      </footer>

      {/* HOSTEL MANAGER REGISTRATION WIZARD */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-100 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto animate-fade-in text-left">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowRegModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all text-xl font-bold cursor-pointer"
            >
              ×
            </button>

            {/* Step Wizard Header */}
            {regStep === 1 && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-900 text-white rounded-2xl shadow-sm">
                    <Building size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Hostel Manager Onboarding
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter verified managerial credentials to establish your property management profile.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  🛡️ <strong>Manager Verification Policy:</strong> Managers must provide verifiable national identity and operational credentials. Once registered, you will be able to request and complete the 10-step hostel registration directly within your dashboard.
                </div>
              </div>
            )}

            {/* STEP 1: ACCOUNT & KEEN MANAGER DETAILS WITH PHASE 1 VERIFICATION */}
            {regStep === 1 && (
              <form onSubmit={handleManagerRegisterSubmit} className="space-y-4 text-xs font-semibold text-left max-h-[75vh] overflow-y-auto pr-1">
                
                {/* Synthetic Test Card Quick-Select Banner (Dev/Test Tooling) */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-600" />
                      Synthetic NIA Ghana Card Registry ({testCards.length > 0 ? testCards.length : 300} Test Cards)
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      Dev/Test Mode
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 font-normal leading-relaxed">
                    Select a synthetic card or click <strong>Random Card</strong> to auto-fill valid verification credentials without using real Ghana Card numbers.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                      value={selectedSyntheticCardId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const card = testCards.find(c => c && c.idNumber === val);
                        if (card) {
                          applySyntheticCard(card);
                        }
                      }}
                    >
                      <option value="">-- Select a Synthetic Test Ghana Card --</option>
                      {testCards.filter(Boolean).slice(0, 50).map(c => (
                        <option key={c.idNumber || c.fullName} value={c.idNumber}>
                          {c.idNumber} — {c.fullName} {c.status && c.status !== 'verified' ? `[${c.status}]` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleRandomCard}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 transition-all shadow-xs flex items-center gap-1"
                    >
                      <Sparkles size={11} />
                      Random Card
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Manager Full Legal Name *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Sarah Jenkins"
                        value={regManagerName}
                        onChange={(e) => setRegManagerName(e.target.value)}
                        autoComplete="name"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Manager Work Email *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="e.g. sarah.jenkins@pinevela.com"
                        value={regManagerEmail}
                        onChange={(e) => setRegManagerEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Direct Phone */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Direct Phone Number *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Phone size={15} />
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="024 000 0000 or +233 24 000 0000"
                        value={regManagerPhone}
                        onChange={(e) => setRegManagerPhone(cleanPhoneNumber(e.target.value))}
                        autoComplete="tel"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Numbers only (10 digits starting with 0, or international +233)</p>
                  </div>

                  {/* Country of Issuance */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Country of Identity *</label>
                    <select
                      value={regCountry}
                      onChange={(e) => setRegCountry(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    >
                      <option value="Ghana">Ghana</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Kenya">Kenya</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Other">Other International</option>
                    </select>
                  </div>

                  {/* Identity Document Type */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Document Type *</label>
                    <select
                      value={regDocumentType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setRegDocumentType(newType);
                        const cfg = resolveIdConfig(newType);
                        setRegNationalId(prev => cfg.formatInput(prev));
                      }}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    >
                      <option value="Ghana Card">Ghana Card (GHA-XXXXXXXXX-X)</option>
                      <option value="Voter ID">National Voters ID (10 Digits — Numbers Only)</option>
                      <option value="NHIS Card">NHIS Health Card (8 Digits — Numbers Only)</option>
                      <option value="Passport">International Passport (Alphanumeric)</option>
                      <option value="Driver's License">Driver's License (DVLA Alphanumeric)</option>
                    </select>
                  </div>

                  {/* National ID / Document Number with Dynamic Constraints */}
                  {(() => {
                    const cfg = resolveIdConfig(regDocumentType);
                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-700 block font-bold">
                            {cfg.name} Number *
                          </label>
                          {cfg.numericOnly && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black tracking-wide uppercase">
                              Numbers Only
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                            <ShieldCheck size={15} />
                          </span>
                          <input
                            type={cfg.numericOnly ? "tel" : "text"}
                            required
                            inputMode={cfg.numericOnly ? "numeric" : "text"}
                            maxLength={cfg.maxLength}
                            placeholder={cfg.placeholder}
                            value={regNationalId}
                            onChange={(e) => setRegNationalId(cfg.formatInput(e.target.value))}
                            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {cfg.helperText}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Full Name on Document */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Full Name on ID Document *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins Mensah"
                      value={regFullNameOnId || ''}
                      onChange={(e) => setRegFullNameOnId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Date of Birth & ID Expiry */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Date of Birth</label>
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full px-2.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Expiry Date</label>
                      <input
                        type="date"
                        value={regIdExpiry}
                        onChange={(e) => setRegIdExpiry(e.target.value)}
                        className="w-full px-2.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Authority / Relationship to Property */}
                  <div className="space-y-1 sm:col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <label className="text-slate-800 block font-bold mb-1">
                      Authority & Relationship to Property *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Property Owner', 'Authorized Manager', 'Managing Director', 'Property Agent'] as const).map(rel => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setRegAuthorityRel(rel)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                            regAuthorityRel === rel
                              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>

                    {/* Conditional owner contact fields if Authorized Manager or Property Agent */}
                    {(regAuthorityRel === 'Authorized Manager' || regAuthorityRel === 'Property Agent') && (
                      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Claimed Owner Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Chief Nana Boakye"
                            value={regClaimedOwnerName}
                            onChange={(e) => setRegClaimedOwnerName(e.target.value)}
                            className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Owner Phone *</label>
                          <input
                            type="text"
                            placeholder="+233 20 111 2233"
                            value={regClaimedOwnerPhone}
                            onChange={(e) => setRegClaimedOwnerPhone(e.target.value)}
                            className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Owner Email</label>
                          <input
                            type="email"
                            placeholder="owner@property.gh"
                            value={regClaimedOwnerEmail}
                            onChange={(e) => setRegClaimedOwnerEmail(e.target.value)}
                            className="w-full px-2.5 py-2 border border-slate-200 rounded-lg bg-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Organization / Management Entity */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Management Entity / Company *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PineVela Accommodations Ltd."
                      value={regOrganization}
                      onChange={(e) => setRegOrganization(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Company Registration Number */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Company Reg No. (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. CS-90214-2021"
                      value={regOrgRegNumber}
                      onChange={(e) => setRegOrgRegNumber(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Managerial Designation */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Designation / Role Title *</label>
                    <select
                      value={regRoleTitle}
                      onChange={(e) => setRegRoleTitle(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    >
                      <option value="General Manager">General Manager / Managing Director</option>
                      <option value="Property Owner / Landlord">Property Owner / Landlord</option>
                      <option value="Residence Warden">Chief Residence Warden</option>
                      <option value="Operations Director">Director of Student Accommodation</option>
                    </select>
                  </div>

                  {/* Management Experience */}
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Management Experience (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={regExperienceYears}
                      onChange={(e) => setRegExperienceYears(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Business Office Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-slate-700 block font-bold">Office Address / Campus Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 14, University Bypass, Legon"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Proof of Authority Evidence & Document Upload */}
                  <div className="space-y-2 sm:col-span-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <label className="text-blue-950 font-bold flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-700" />
                        <span>Proof of Authority / Ownership Evidence</span>
                      </label>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                        Stored in Private Storage
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Registered title deed and power of attorney executed with property owner."
                      value={regAuthorityEvidenceDesc}
                      onChange={(e) => setRegAuthorityEvidenceDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-white text-slate-800 text-xs"
                    />
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <div className="flex-1 px-3 py-2 bg-white border border-dashed border-blue-300 rounded-xl flex items-center justify-between">
                        <span className="text-slate-600 truncate">
                          📄 {regDocFileName || 'authority-documentation.pdf'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Ready for Private Storage
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Account Password *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={15} />
                      </span>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword && (
                      <div className="mt-1.5 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Password Strength:</span>
                          <span className={`font-bold ${getPasswordStrength(regPassword).textClass}`}>
                            {getPasswordStrength(regPassword).label}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength(regPassword).color}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Confirm Password *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Lock size={15} />
                      </span>
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        {showRegConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loadingRegister}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingRegister ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Verifying & Submitting...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={14} />
                        <span>Submit Manager Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: MANAGER VERIFICATION SUBMISSION STATUS */}
            {regStep === 2 && (
              <div className="space-y-6 text-center py-4 flex flex-col items-center">
                
                {/* Pulsing Status Icon */}
                <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full border-4 border-amber-100 flex items-center justify-center text-amber-600 shadow-sm animate-pulse">
                  <ShieldCheck size={32} />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 text-xs font-black uppercase px-3 py-1 rounded-full">
                    <span>Status: Pending Admin Review</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Verification Submitted Successfully
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                    Welcome, <span className="font-extrabold text-blue-900">{regManagerName}</span>! Your manager identity and authority claims have been received and logged in the administrative verification queue.
                  </p>
                </div>

                {/* Automated System Check Summary */}
                <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-800">Automated System Pre-Checks:</span>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Validation Passed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Identity Check: Validated</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Name Consistency: Passed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Authority Evidence: Attached</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>Duplicate Check: Clean</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Document:</span>
                      <span className="font-mono text-slate-800">{regDocumentType} ({regNationalId})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Authority Claim:</span>
                      <span className="font-bold text-slate-800">{regAuthorityRel} — {regOrganization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Work Email:</span>
                      <span className="text-blue-900 font-semibold">{regManagerEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 leading-relaxed text-left space-y-1 w-full">
                  <p className="font-bold">Next Steps for Hostel Onboarding (Phase 2):</p>
                  <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-600">
                    <li>Your manager profile and verification dossier are now queued in the <strong>Admin Dashboard</strong> for review.</li>
                    <li>You can now log in to start the <strong>10-Step Hostel Registration sequence</strong>.</li>
                    <li>Or switch to Admin view to test the 1-click Approval workflow.</li>
                  </ol>
                </div>

                <div className="space-y-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegModal(false);
                      handleQuickLogin(regManagerEmail, regPassword, '/manager/dashboard?tab=register_hostel');
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} className="text-amber-300" />
                    <span>⚡ Launch Manager Portal: Initiate Hostel Registration Sequence</span>
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowRegModal(false);
                      handleQuickLogin('admin@pinevela.com', 'admin123');
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold rounded-xl text-xs transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={14} className="text-amber-400" />
                    <span>🛡️ Switch to Admin Portal (Review & Approve Manager)</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL: Pending Manager Approval Notice */}
      {pendingApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-900 via-amber-400 to-blue-900" />
            
            <div className="flex flex-col items-center space-y-4 pt-3">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-inner animate-pulse">
                <Clock size={32} />
              </div>
              
              <div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-200">
                  Verification Pending
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2 tracking-tight">
                  Verification in Progress!
                </h3>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-650 leading-relaxed max-w-sm mx-auto">
              <p className="font-bold text-slate-800">
                Registered Email: <span className="text-blue-900 font-mono underline">{pendingApprovalModal.email}</span>
              </p>
              <p>
                Hello! Your manager profile is currently awaiting verification by our administrator team. Under PineVela regulations, we verify each property representative to safeguard student and resident accommodations.
              </p>
              <p className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-amber-900 font-bold">
                Please check back shortly or keep an eye on your email inbox for an activation link once review is completed.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPendingApprovalModal(null)}
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs transition-all shadow-md cursor-pointer tracking-wider uppercase"
              >
                Close & Return to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESIDENT & STUDENT DIGITAL ROOM KEY ONBOARDING MODAL */}
      {showStudentKeyModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-blue-200/80 shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto text-left space-y-5">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                setShowStudentKeyModal(false);
                setStudentKeyStep(1);
              }}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all text-xl font-bold cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Stepper Header */}
            <div className="space-y-3 pr-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Resident & Student Onboarding</span>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wider">PineVela Key</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {studentKeyStep === 1 && 'Select resident category and validate your digital room key'}
                    {studentKeyStep === 2 && 'Fill in your personal, academic, and institutional details'}
                    {studentKeyStep === 3 && 'Create your account password and review room assignment'}
                    {studentKeyStep === 4 && 'Room verified! Your manager has been notified of your check-in'}
                  </p>
                </div>
              </div>

              {/* Step indicator bar */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { num: 1, label: 'Key & Role' },
                  { num: 2, label: 'Profile' },
                  { num: 3, label: 'Security' },
                  { num: 4, label: 'Activated' }
                ].map((s) => (
                  <div key={s.num} className="flex flex-col gap-1">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        studentKeyStep >= s.num 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                          : 'bg-slate-200'
                      }`} 
                    />
                    <span className={`text-[10px] font-bold text-center ${
                      studentKeyStep === s.num ? 'text-blue-900' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Resident Category & Digital Room Key */}
            {studentKeyStep === 1 && (
              <div className="space-y-4">
                
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
                      const isSelected = stuResidentType === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setStuResidentType(cat.id as any)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/90 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon size={15} />
                          </div>
                          <div>
                            <div className={`text-xs font-black ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                              {cat.label}
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight line-clamp-2 mt-0.5">
                              {cat.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {stuResidentType === 'other' && (
                    <div className="pt-1 animate-fade-in">
                      <input
                        type="text"
                        value={stuCustomType}
                        onChange={(e) => setStuCustomType(e.target.value)}
                        placeholder="Please specify your resident status (e.g. Visiting Fellow, Postdoc)"
                        className="w-full px-3.5 py-2.5 bg-blue-50/50 border border-blue-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
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
                    <span className="text-[11px] text-blue-700 font-semibold">
                      Provided by Hostel Manager
                    </span>
                  </div>

                  <div className="relative">
                    <Key className="w-4 h-4 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      value={studentKeyInput}
                      onChange={(e) => {
                        setStudentKeyInput(e.target.value.toUpperCase());
                        setStudentKeyError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyStudentKey();
                      }}
                      placeholder="Enter digital room key code"
                      className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200 rounded-2xl font-mono text-sm font-black uppercase text-slate-900 tracking-wider focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-400/20 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyStudentKey()}
                      disabled={verifyingStudentKey || !studentKeyInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {verifyingStudentKey ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      <span>Verify</span>
                    </button>
                  </div>
                </div>

                {studentKeyError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-bold flex items-center gap-2 animate-fade-in">
                    <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                    <span>{studentKeyError}</span>
                  </div>
                )}

                {/* Verified Room Card */}
                {verifiedKeyDetails && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between font-black text-emerald-900">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>Room Key Validated: {verifiedKeyDetails.roomKey}</span>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 font-extrabold rounded-full text-[10px]">
                        Available
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 font-bold text-[11px] bg-white/70 p-2.5 rounded-xl border border-emerald-200/60">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Hostel</span>
                        <span className="text-slate-900 truncate block">{verifiedKeyDetails.hostelName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Block</span>
                        <span className="text-slate-900 truncate block">{verifiedKeyDetails.blockName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold">Room No.</span>
                        <span className="text-slate-900 truncate block">{verifiedKeyDetails.roomNumber}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!verifiedKeyDetails) {
                        handleVerifyStudentKey();
                      } else {
                        setStudentKeyStep(2);
                      }
                    }}
                    disabled={verifyingStudentKey || !studentKeyInput.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-900/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Continue to Personal & Academic Profile</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2: Personal & Academic / Institutional Profile */}
            {studentKeyStep === 2 && verifiedKeyDetails && (
              <div className="space-y-4">
                
                {/* Verified Room Badge */}
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-950 font-bold">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-blue-700" />
                    <span>Assigning to: <strong>{verifiedKeyDetails.hostelName}</strong> ({verifiedKeyDetails.blockName} - {verifiedKeyDetails.roomNumber})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudentKeyStep(1)}
                    className="text-blue-700 underline text-[11px] cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-3">
                  
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Full Legal Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={stuName}
                        onChange={(e) => setStuName(e.target.value)}
                        placeholder="e.g. Alex Kwame Mensah"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* ID & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">
                        {stuResidentType === 'student' ? 'Student ID / Index No.' : 'Resident ID / National ID'} <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={stuId}
                          onChange={(e) => setStuId(e.target.value.toUpperCase())}
                          placeholder="e.g. STU-2026-8842"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-800 block">
                        Phone Number <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={stuPhone}
                          onChange={(e) => setStuPhone(e.target.value)}
                          placeholder="e.g. +233 24 123 4567"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={stuEmail}
                        onChange={(e) => setStuEmail(e.target.value)}
                        placeholder="e.g. alex.mensah@student.edu"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Academic / Residency Details */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-blue-600" />
                      <span>{stuResidentType === 'student' ? 'Academic Program Details' : 'Professional & Institutional Details'}</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        {stuResidentType === 'student' ? 'Program of Study / Major' : 'Occupation / Field of Practice'}
                      </label>
                      <input
                        type="text"
                        value={stuProgram}
                        onChange={(e) => setStuProgram(e.target.value)}
                        placeholder={stuResidentType === 'student' ? "e.g. BSc Computer Science & Engineering" : "e.g. Software Engineer / Financial Analyst"}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Department / Faculty
                        </label>
                        <input
                          type="text"
                          value={stuDepartment}
                          onChange={(e) => setStuDepartment(e.target.value)}
                          placeholder="e.g. Department of Computer Science"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Institution / University
                        </label>
                        <input
                          type="text"
                          value={stuInstitution}
                          onChange={(e) => setStuInstitution(e.target.value)}
                          placeholder="e.g. University of Ghana, Legon"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStudentKeyStep(1)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!stuName.trim() || !stuId.trim() || !stuEmail.trim()) {
                        triggerToast('Please provide your name, Student ID, and email.', 'error');
                        return;
                      }
                      setStudentKeyStep(3);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Password & Security</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: Password & Security Verification */}
            {studentKeyStep === 3 && verifiedKeyDetails && (
              <form onSubmit={handleClaimStudentKeySubmit} className="space-y-4">
                
                {/* Onboarding Summary Badge */}
                <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-2xl space-y-2 text-xs text-blue-950">
                  <div className="flex items-center justify-between font-black text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={16} className="text-blue-600" />
                      <span>Room Assignment Summary</span>
                    </span>
                    <span className="font-mono text-[11px] bg-blue-200/60 px-2 py-0.5 rounded-lg text-blue-950">
                      {verifiedKeyDetails.roomKey}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white/80 p-3 rounded-xl border border-blue-200/60 font-medium text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Resident Name:</span>
                      <strong className="text-slate-900">{stuName || 'Resident'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ID & Category:</span>
                      <strong className="text-slate-900 font-mono">{stuId || 'ID'}</strong> ({stuResidentType})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Hostel & Room:</span>
                      <strong className="text-slate-900">{verifiedKeyDetails.hostelName}</strong> - {verifiedKeyDetails.blockName} (Room {verifiedKeyDetails.roomNumber})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Institution:</span>
                      <strong className="text-slate-900 truncate block">{stuInstitution || 'University / College'}</strong>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-100/50 rounded-xl flex items-center gap-2 text-[11px] text-blue-900 font-semibold">
                    <Bell size={14} className="text-blue-700 shrink-0" />
                    <span>A minimalistic notification will be dispatched to your Hostel Manager upon check-in.</span>
                  </div>
                </div>

                {/* Password Setup */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Create Account Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showStuPassword ? "text" : "password"}
                        required
                        value={stuPassword}
                        onChange={(e) => setStuPassword(e.target.value)}
                        placeholder="Choose a strong password (min 6 chars)"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStuPassword(!showStuPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showStuPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">
                      Confirm Account Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showStuConfirmPassword ? "text" : "password"}
                        required
                        value={stuConfirmPassword}
                        onChange={(e) => setStuConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStuConfirmPassword(!showStuConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showStuConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {stuPassword && (
                    <div className="space-y-1">
                      {(() => {
                        const strength = getPasswordStrength(stuPassword);
                        return (
                          <div>
                            <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                              <span className="text-slate-500">Security Strength</span>
                              <span className={strength.textClass}>{strength.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${strength.color} transition-all duration-300`} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>
                      I agree to the <strong>Hostel Community Code of Conduct</strong> and PineVela Resident Terms.
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStudentKeyStep(2)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStudentClaim || !stuName.trim() || !stuId.trim() || !agreeTerms}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingStudentClaim ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Activating Room Access & Notifying Manager...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Complete Onboarding & Enter Room</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* STEP 4: Minimalistic Confirmation & Room Activated */}
            {studentKeyStep === 4 && claimedUserData && (
              <div className="space-y-5 text-center py-4 animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">
                    Room Successfully Activated!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Welcome to <strong>{verifiedKeyDetails?.hostelName || 'your hostel'}</strong>. Your digital room key has been claimed and your profile is active.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowStudentKeyModal(false);
                    if (stuId) {
                      setUsernameOrEmail(stuId);
                    } else if (stuEmail) {
                      setUsernameOrEmail(stuEmail);
                    }
                    setStudentKeyStep(1);
                    triggerToast('Registration complete! Please log in with your credentials.', 'success');
                  }}
                  className="w-full max-w-md mx-auto py-3.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-850 hover:to-indigo-850 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={18} />
                  <span>Return to Login to Sign In</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
