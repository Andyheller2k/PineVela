import React, { useState, useEffect } from 'react';
import PineLogo from './PineLogo';
import { Hostel } from '../types';
import { Mail, Key, Eye, EyeOff, ShieldCheck, ArrowLeft, ArrowRight, ShieldAlert, Building } from 'lucide-react';

interface Page7ManagerLoginProps {
  hostels: Hostel[];
  preSelectedHostelId?: string;
  onNavigate: (screen: 'public-browse' | 'manager-dashboard' | 'manager-hostel-dashboard', hostelId?: string) => void;
}

export default function Page7ManagerLogin({ hostels, preSelectedHostelId, onNavigate }: Page7ManagerLoginProps) {
  const [activePortal, setActivePortal] = useState<'manager' | 'admin'>('manager');
  const [selectedHostelId, setSelectedHostelId] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@pinevela.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync state if preSelectedHostelId is provided
  useEffect(() => {
    if (preSelectedHostelId) {
      setSelectedHostelId(preSelectedHostelId);
      setActivePortal('manager');
    } else if (hostels && hostels.length > 0) {
      setSelectedHostelId(hostels[0].id);
    }
  }, [preSelectedHostelId, hostels]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (activePortal === 'admin') {
      if (adminEmail !== 'admin@pinevela.com') {
        triggerToast('Invalid software owner email. Try admin@pinevela.com');
        return;
      }
      triggerToast('Welcome Back, Administrator! Accessing central system...');
      setTimeout(() => {
        onNavigate('manager-dashboard');
      }, 500);
    } else {
      if (!selectedHostelId) {
        triggerToast('Please select a registered hostel to manage');
        return;
      }
      const hostel = hostels.find(h => h.id === selectedHostelId);
      if (!hostel) {
        triggerToast('Hostel not found');
        return;
      }
      triggerToast(`Authenticated successfully for ${hostel.name}!`);
      setTimeout(() => {
        onNavigate('manager-hostel-dashboard', selectedHostelId);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans justify-between relative">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-blue-600 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-xl z-50">
          {toastMessage}
        </div>
      )}

      {/* Global Nav */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
        <div className="cursor-pointer" onClick={() => onNavigate('public-browse')}>
          <PineLogo />
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <button 
            onClick={() => onNavigate('public-browse')}
            className="text-slate-500 hover:text-blue-900 flex items-center gap-1"
          >
            <ArrowLeft size={13} />
            <span>Browse Hostels</span>
          </button>
        </div>
      </header>

      {/* Content Form Container */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-6">
          
          {/* Dual Portal Switcher */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
            <button
              onClick={() => setActivePortal('manager')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activePortal === 'manager'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🏫</span> Hostel Manager Login
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activePortal === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🛡️</span> Admin Owner Portal
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 text-center relative overflow-hidden">
            
            {/* Top blue line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-600" />

            {/* Logo */}
            <div className="flex justify-center pt-2">
              <PineLogo size={44} hideText={true} />
            </div>

            {/* Header Title */}
            <div className="space-y-1.5">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {activePortal === 'admin' ? 'Software Admin Portal' : 'Hostel Manager Portal'}
              </h1>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                {activePortal === 'admin' 
                  ? 'Access master operations, view all hostels, register property managers, and configure setup settings.'
                  : 'Select your registered hostel below to authenticate and access your specific property dashboard.'
                }
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-left pt-2">
              
              {activePortal === 'admin' ? (
                /* ADMIN FORM FIELDS */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Administrator Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@pinevela.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs transition-all font-semibold"
                    />
                  </div>
                </div>
              ) : (
                /* MANAGER FORM FIELDS */
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Select Registered Hostel</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Building size={16} />
                    </span>
                    <select
                      required
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs transition-all font-bold cursor-pointer"
                    >
                      <option value="" disabled>-- Select Your Hostel --</option>
                      {hostels.map(hostel => (
                        <option key={hostel.id} value={hostel.id}>
                          {hostel.name} ({hostel.wing})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Managers are assigned credentials upon hostel registration by admin.</span>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Access Key / Password</label>
                  <a href="#" onClick={(e) => { e.preventDefault(); triggerToast('Password recovery sent to registered contact.'); }} className="text-xs font-extrabold text-blue-600 hover:underline">Forgot?</a>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Key size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-xs transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
              >
                <span>Sign In as {activePortal === 'admin' ? 'Software Owner' : 'Hostel Manager'}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Enterprise Security Lock */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 tracking-wider uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck size={12} />
                <span>Isolated Sandbox Security Active</span>
              </div>
            </div>

          </div>

          {/* Bottom helper card to explain credentials */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-left space-y-1.5">
            <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <span>💡</span> Developer Credential Guide
            </h4>
            <ul className="text-[10px] text-slate-600 space-y-1 font-medium leading-relaxed">
              <li>• <strong>Admin Login:</strong> Switch to the Admin tab and click Sign In (default: admin@pinevela.com / password123).</li>
              <li>• <strong>Manager Login:</strong> Keep Manager tab active, pick any hostel (e.g. Pine Crest Residency), and click Sign In (password: password123).</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-[11px] text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 PineVela Cloud Host Solutions. All rights reserved.</span>
          <div className="flex gap-4 font-bold">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Security Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
