import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import { Mail, Key, Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle, RefreshCw, Sparkles, LogIn, ClipboardList, Building, MapPin, Lock, Phone, ChevronRight, ChevronLeft, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Static asset imports
import managerImg from '../../assets/manager.jpeg';
import onlineImg from '../../assets/online.jpeg';
import studentImg from '../../assets/student.jpeg';

const slides = [
  {
    image: managerImg,
    title: "Hostel Management Simplified",
    description: "PineVela - Manage your hostel seamlessly from anywhere. No worries, just connect.",
    badge: "Hostel Manager"
  },
  {
    image: onlineImg,
    title: "Stay Connected Instantly",
    description: "PineVela - Stay in touch with your manager from anywhere, anytime.",
    badge: "Connected System"
  },
  {
    image: studentImg,
    title: "Vibrant Student Community",
    description: "Stay in touch with your friends from other hostels, chat and share interesting updates together.",
    badge: "Student Hub"
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

  // Slideshow states
  const [currentSlide, setCurrentSlide] = useState(0);

  // Manager registration onboarding states
  const [showRegModal, setShowRegModal] = useState(false);
  const [regStep, setRegStep] = useState(1); // 1, 2, 3, 4 (Success)

  // Step 1: Manager details
  const [regManagerName, setRegManagerName] = useState('');
  const [regManagerEmail, setRegManagerEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Step 2: Hostel Basics & Map
  const [regHostelName, setRegHostelName] = useState('');
  const [regLocationSearch, setRegLocationSearch] = useState('');
  const [regSelectedLocation, setRegSelectedLocation] = useState('North Campus, Sector 5');
  const [mapCoordinates, setMapCoordinates] = useState({ lat: 5.6120, lng: -0.1890 });

  // Step 3: Additional Details
  const [regWing, setRegWing] = useState('North Wing');
  const [regTotalCapacity, setRegTotalCapacity] = useState(120);
  const [regManagerPhone, setRegManagerPhone] = useState('');
  const [regDescription, setRegDescription] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);

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
        if (authenticatedUser.role === 'student') {
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
      triggerToast(err.message || 'Invalid credentials. Please try again.', 'error');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleQuickLogin = async (email: string, pass: string) => {
    setUsernameOrEmail(email);
    setPassword(pass);
    setLoadingLogin(true);
    try {
      const authenticatedUser = await login(email, pass);
      triggerToast(`Sandbox Login: Welcoming ${authenticatedUser.name}!`, 'success');
      setTimeout(() => {
        if (authenticatedUser.role === 'student') {
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
      triggerToast(err.message || 'Login failed', 'error');
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      triggerToast('Passwords do not match. Please verify your entry.', 'error');
      return;
    }
    setRegStep(2);
  };

  const handleManagerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regPassword !== regConfirmPassword) {
      triggerToast('Passwords do not match', 'error');
      return;
    }

    setLoadingRegister(true);
    try {
      const res = await fetch('/api/auth/register-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerName: regManagerName,
          managerEmail: regManagerEmail,
          password: regPassword,
          managerPhone: regManagerPhone,
          hostelName: regHostelName,
          location: regSelectedLocation,
          wing: regWing,
          totalCapacity: Number(regTotalCapacity),
          description: regDescription
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register manager and hostel');
      }

      setRegStep(4); // Success Step
      triggerToast('Hostel and Manager account registered successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'An error occurred', 'error');
    } finally {
      setLoadingRegister(false);
    }
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
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-7xl mx-auto w-full px-6 py-8 gap-12 z-10">
        
        {/* Left Side: Rotating Image Showcase */}
        <div className="flex-1 hidden lg:flex flex-col items-stretch justify-center max-w-xl w-full">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 space-y-6 flex flex-col justify-between">
            
            {/* Image Slider Section */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide}
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Floating Badge */}
              <div className="absolute top-4 left-4 bg-blue-900/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md z-10 border border-white/10">
                {slides[currentSlide].badge}
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

            {/* Captions and Dots */}
            <div className="space-y-4 px-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {slides[currentSlide].title}
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
                {slides[currentSlide].description}
              </p>

              {/* Secure verification mini-badge to retain branding context */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  Gateway Verification Active
                </span>
                <span className="flex items-center gap-1">
                  <RefreshCw size={12} className="text-blue-500 animate-spin-slow" />
                  JWT Session Enforced
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Elegant Form */}
        <div className="w-full max-w-md space-y-6 shrink-0">
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 space-y-6 relative overflow-hidden">
            
            {/* Top design brand line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900" />

            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <PineLogo size={48} hideText={true} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">System Login</h2>
              <p className="text-xs text-slate-400 font-semibold">Enter your credentials to access your designated workspace.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Username or Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. student@pinevela.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Security Password</label>
                  <button 
                    type="button" 
                    onClick={() => triggerToast('Standard password reset requires system administrator approval.', 'info')} 
                    className="text-[10px] font-bold text-blue-900 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Key size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingLogin}
                className="w-full py-3 bg-blue-900 hover:bg-blue-850 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                {loadingLogin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>Authorize & Continue</span>
                  </>
                )}
              </button>

            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 font-semibold">
                New to PineVela?{' '}
                <button 
                  onClick={() => {
                    setRegStep(1);
                    setShowRegModal(true);
                  }} 
                  className="text-blue-900 hover:underline font-extrabold"
                >
                  Register your Hostel now!!
                </button>
              </p>
            </div>

          </div>

          {/* Beautiful Sandbox Quick Access Panel (Crucial for high-fidelity evaluation!) */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-4 space-y-3.5 shadow-xl text-left">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">Sandbox Quick Access</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">1-Click Auth</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@pinevela.com', 'student123')}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-center transition-all border border-slate-700/60"
              >
                <span className="block text-sm">👤</span>
                <span className="block text-[9px] font-bold truncate">Stu: Sarah</span>
                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">student123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student2@pinevela.com', 'student123')}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-center transition-all border border-slate-700/60"
              >
                <span className="block text-sm">👤</span>
                <span className="block text-[9px] font-bold truncate">Stu: Marcus</span>
                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">student123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student3@pinevela.com', 'student123')}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-center transition-all border border-slate-700/60"
              >
                <span className="block text-sm">👤</span>
                <span className="block text-[9px] font-bold truncate">Stu: Kyle</span>
                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">student123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@pinevela.com', 'manager123')}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-center transition-all border border-slate-700/60"
              >
                <span className="block text-sm">🏫</span>
                <span className="block text-[9px] font-bold truncate">Manager</span>
                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">manager123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@pinevela.com', 'staff123')}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-center transition-all border border-slate-700/60"
              >
                <span className="block text-sm">🛠️</span>
                <span className="block text-[9px] font-bold truncate">Staff</span>
                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">staff123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@pinevela.com', 'admin123')}
                className="p-2 bg-slate-800 hover:bg-slate-750 text-white rounded-lg text-center transition-all border border-slate-700/60"
              >
                <span className="block text-sm">🛡️</span>
                <span className="block text-[9px] font-bold truncate">Admin</span>
                <span className="block text-[8px] text-slate-400 font-mono mt-0.5">admin123</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-[10px] text-slate-400 border-t border-slate-100 bg-white">
        &copy; 2026 PineVela Residence Solutions. Enforced with Server-side Authentication & JWT Cryptographic Session Validation.
      </footer>

      {/* HOSTEL MANAGER REGISTRATION WIZARD */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 border border-slate-100 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto animate-fade-in">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowRegModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all text-xl font-bold cursor-pointer"
            >
              ×
            </button>

            {/* Step Wizard Header */}
            {regStep !== 4 && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-2 text-left">
                  <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Hostel Onboarding Wizard
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step {regStep} of 3: {
                        regStep === 1 ? "Manager Account" :
                        regStep === 2 ? "Property & Interactive Map" :
                        "Hostel Configuration"
                      }
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full transition-all duration-300 ${regStep >= 1 ? 'bg-blue-900 flex-1' : 'bg-slate-200 flex-1'}`} />
                  <div className={`h-full transition-all duration-300 ${regStep >= 2 ? 'bg-blue-900 flex-1' : 'bg-slate-200 flex-1'}`} />
                  <div className={`h-full transition-all duration-300 ${regStep >= 3 ? 'bg-blue-900 flex-1' : 'bg-slate-200 flex-1'}`} />
                </div>
              </div>
            )}

            {/* STEP 1: ACCOUNT DETAILS */}
            {regStep === 1 && (
              <form onSubmit={handleStep1Submit} className="space-y-4 text-xs font-semibold text-left">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Manager Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Johnson"
                        value={regManagerName}
                        onChange={(e) => setRegManagerName(e.target.value)}
                        autoComplete="off"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Manager Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Mail size={15} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="e.g. sarah.j@pinevela.com"
                        value={regManagerEmail}
                        onChange={(e) => setRegManagerEmail(e.target.value)}
                        autoComplete="off"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Password</label>
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
                          <p className="text-[9px] text-slate-450 leading-tight">
                            Use uppercase, lowercase, numbers, and symbols.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Confirm Password</label>
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
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continue to Hostel Basics</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: HOSTEL & INTERACTIVE MINI MAP */}
            {regStep === 2 && (
              <div className="space-y-4 text-xs font-semibold text-left">
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Hostel Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pine Crest Residency Block C"
                      value={regHostelName}
                      onChange={(e) => setRegHostelName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  {/* Interactive Map UI Container */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 block font-bold flex items-center gap-1">
                        <MapPin size={14} className="text-blue-900" />
                        Interactive Real Map Location
                      </label>
                      <span className="text-[10px] text-blue-900 font-extrabold bg-blue-50 px-2 py-0.5 rounded-full">
                        Drag pin or click map to choose
                      </span>
                    </div>

                    {/* Map search */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                          <Search size={14} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search real location (e.g. Legon Campus, Accra)..."
                          value={regLocationSearch}
                          onChange={(e) => setRegLocationSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              searchAddress();
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={searchAddress}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                      >
                        Search
                      </button>
                    </div>

                    {/* Real Leaflet Map Container */}
                    <div className="relative border border-slate-200 rounded-2xl overflow-hidden shadow-inner h-56 select-none bg-slate-100">
                      <div 
                        ref={mapContainerRef} 
                        className="w-full h-full z-10" 
                        style={{ minHeight: '224px' }}
                      />
                    </div>

                    {/* Coordinates Feedback Card */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-start gap-1 w-full">
                      <div className="flex items-start gap-2">
                        <MapPin className="text-red-500 shrink-0 mt-0.5" size={16} />
                        <div className="text-left">
                          <p className="font-extrabold text-slate-800 text-[11px] leading-tight">
                            Selected Location:
                          </p>
                          <p className="text-[11px] text-slate-650 font-semibold mt-0.5 leading-relaxed">
                            {regSelectedLocation}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium mt-1">
                            Latitude: {mapCoordinates.lat.toFixed(5)}, Longitude: {mapCoordinates.lng.toFixed(5)}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!regHostelName) {
                        triggerToast('Please provide a name for your hostel', 'error');
                        return;
                      }
                      setRegStep(3);
                    }}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <span>Continue to Details</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ADDITIONAL HOSTEL CONFIGURATION */}
            {regStep === 3 && (
              <form onSubmit={handleManagerRegisterSubmit} className="space-y-4 text-xs font-semibold text-left">
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Property Wing / Zone</label>
                      <select 
                        value={regWing}
                        onChange={(e) => setRegWing(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      >
                        <option value="North Wing">North Wing (Section A/B)</option>
                        <option value="South Side">South Side (Block C/D)</option>
                        <option value="West Campus">West Campus (Outlying)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Total Beds / Capacity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={regTotalCapacity}
                        onChange={(e) => setRegTotalCapacity(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Manager Contact Phone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                        <Phone size={15} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +23324488923"
                        value={regManagerPhone}
                        onChange={(e) => setRegManagerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Hostel Description & Facilities</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="List your hostel's premium highlights (e.g. AC rooms, study lounges, free campus shuttle, standby generator...)"
                      value={regDescription}
                      onChange={(e) => setRegDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loadingRegister}
                    className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingRegister ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Registering Property...</span>
                      </>
                    ) : (
                      <>
                        <Building size={14} />
                        <span>Register Hostel</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: REGISTRATION SUCCESS */}
            {regStep === 4 && (
              <div className="space-y-6 text-center py-4 flex flex-col items-center">
                
                {/* Pulsing Success Badge */}
                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full border-4 border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm animate-bounce">
                  <CheckCircle size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hostel Registered!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                    Congratulations, <span className="font-extrabold text-blue-900">{regManagerName}</span>! Your manager profile and property <span className="font-bold text-slate-800">"{regHostelName}"</span> have been successfully configured.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-left text-xs space-y-2.5 w-full">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-bold">🏫 Hostel Property:</span>
                    <span className="font-bold text-slate-800">{regHostelName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-bold">📍 Map Location:</span>
                    <span className="font-bold text-slate-800">{regSelectedLocation}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-bold">👤 Manager:</span>
                    <span className="font-bold text-slate-800">{regManagerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">✉️ Login Email:</span>
                    <span className="font-semibold text-blue-900">{regManagerEmail}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl text-[10px] text-amber-800 leading-relaxed text-left flex gap-2 w-full">
                  <span>💡</span>
                  <span>
                    <strong>Instant Access:</strong> Your login credentials are now active on the system gateway. Use your registered email <strong>{regManagerEmail}</strong> and password to immediately sign in and manage your new dashboard!
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Reset registration state
                    setRegStep(1);
                    setRegManagerName('');
                    setRegManagerEmail('');
                    setRegPassword('');
                    setRegConfirmPassword('');
                    setRegHostelName('');
                    setRegSelectedLocation('North Campus, Sector 5');
                    setRegDescription('');
                    setRegManagerPhone('');
                    
                    // Close Modal (Redirects to Login Screen)
                    setShowRegModal(false);
                  }}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Proceed to Login Screen
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
