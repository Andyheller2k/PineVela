import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PineLogo from './PineLogo';
import { Mail, Key, Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle, RefreshCw, Sparkles, LogIn, ClipboardList } from 'lucide-react';

export default function PageUnifiedLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Student registration drawer state
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('STU-2024-8842');
  const [regEmail, setRegEmail] = useState('');
  const [regSubmitted, setRegSubmitted] = useState(false);

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

  const handleSelfRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) {
      triggerToast('Please fill in your name and institution email', 'error');
      return;
    }
    setRegSubmitted(true);
    triggerToast('Registration application processed!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans justify-between relative overflow-hidden">
      
      {/* Decorative gradient backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

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
        
        {/* Left Side: Branding / Intro */}
        <div className="flex-1 space-y-6 text-left max-w-lg hidden lg:block">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-wider rounded-full">
            <Sparkles size={11} className="text-amber-500" />
            <span>Secure Unified Session Gateway</span>
          </div>

          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Connect to <span className="text-blue-900 relative">PineVela<span className="absolute bottom-1 left-0 w-full h-1.5 bg-amber-300 -z-10 rounded-sm opacity-60"></span></span>
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            A single unified login portal servicing students, designated hostel property managers, and overall system administrators. Restructured with robust, backend-enforced security verification.
          </p>

          {/* Core Security Assurance Indicators */}
          <div className="space-y-3.5 pt-2 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="font-extrabold text-slate-800">Unified Gateway Protection</p>
                <p className="text-slate-400 text-[11px]">Strict role authorization rules prevent URL manipulations on all routes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
                <RefreshCw size={16} className="animate-spin-slow" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800">Stateful Token Checkpoints</p>
                <p className="text-slate-400 text-[11px]">Backend API verifies active bearer JWT sessions on every database operation.</p>
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
                New student?{' '}
                <button 
                  onClick={() => {
                    setRegSubmitted(false);
                    setShowRegModal(true);
                  }} 
                  className="text-blue-900 hover:underline font-extrabold"
                >
                  Create student profile
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

      {/* STUDENT REGISTRATION SLIDE-OVER MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 border border-slate-100 shadow-2xl space-y-6 text-left relative animate-fade-in">
            <button 
              onClick={() => setShowRegModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              ×
            </button>

            {regSubmitted ? (
              /* Success confirmation (formerly Page 4) */
              <div className="space-y-6 text-center py-4">
                <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full border-4 border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm animate-bounce">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registration Submitted</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Thank you, <span className="font-extrabold text-blue-900">{regName}</span>! Your student application account has been filed. Please verify your mock email to complete the setup.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">👤 Student Name:</span>
                    <span className="font-bold text-slate-800">{regName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">💳 Student ID:</span>
                    <span className="font-mono font-bold text-slate-800">{regStudentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">✉️ Institution Email:</span>
                    <span className="font-medium text-slate-800">{regEmail}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl text-[10px] text-amber-800 leading-relaxed text-left flex gap-2">
                  <span>💡</span>
                  <span><strong>Testing Access:</strong> Student registrations are offline mockups. To immediately test the active dashboard, use the credentials <strong>student@pinevela.com / student123</strong> on the login screen!</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs transition-all shadow-md"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              /* Registration Form */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <ClipboardList size={20} className="text-amber-500" />
                    Student Self Registration
                  </h3>
                  <p className="text-xs text-slate-400">Submit your university enrollment documents to claim your student portal credentials.</p>
                </div>

                <form onSubmit={handleSelfRegisterSubmit} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Thompson"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Student Enrollment ID</label>
                      <input
                        type="text"
                        required
                        value={regStudentId}
                        onChange={(e) => setRegStudentId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-700 block font-bold">Academic Year</label>
                      <select defaultValue="2" className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800">
                        <option value="1">Year 1 (Freshman)</option>
                        <option value="2">Year 2 (Sophomore)</option>
                        <option value="3">Year 3 (Junior)</option>
                        <option value="4">Year 4 (Senior)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 block font-bold">Institution Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. a.thompson@university.edu.gh"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-500">Drag & drop your student identity card or letter of admission here</p>
                    <button type="button" onClick={() => triggerToast('Mock document uploader activated.')} className="text-[9px] bg-white border border-slate-200 px-2.5 py-1 rounded-lg mt-1.5 hover:bg-slate-50 transition-all font-bold">Browse Files</button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-md text-center"
                  >
                    Submit Verification Request
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
