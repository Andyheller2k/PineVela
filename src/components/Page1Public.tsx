import React, { useState, useEffect } from 'react';
import { Hostel } from '../types';
import PineLogo from './PineLogo';
import { Search, MapPin, Phone, ArrowRight, X, Sparkles, Shield, User, MessageSquare, Landmark, Layers, ChevronDown, HelpCircle, Navigation, LogOut, ShieldCheck, Wifi, Zap, BedDouble, Building2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FAQAccordion from './FAQAccordion';
import TestimonialsCarousel from './TestimonialsCarousel';
import { useAuth } from '../context/AuthContext';
import LogoutConfirmationModal from './LogoutConfirmationModal';

import welcomeBg from '../../assets/welcome_bg.jpg';
import hostelsBg from '../../assets/hostels_bg.jpg';
import testimonialsBg from '../../assets/testimonials_bg.jpg';
import faqAboutBg from '../../assets/faq_about_bg.jpg';

interface Page1PublicProps {
  hostels: Hostel[];
  onSelectHostel: (hostel: Hostel) => void;
  selectedHostel: Hostel | null;
  onCloseDrawer: () => void;
  onNavigate: (screen: 'student-login' | 'manager-login') => void;
}

export default function Page1Public({
  hostels,
  onSelectHostel,
  selectedHostel,
  onCloseDrawer,
  onNavigate
}: Page1PublicProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWing, setSelectedWing] = useState<'All' | 'North Wing' | 'South Side'>('All');
  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeSection, setActiveSection] = useState('welcome-section');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollPercent(percent);

      const sections = [
        'welcome-section',
        'hostels-section',
        'testimonials-section',
        'faq-about-section',
        'footer-section'
      ];
      let current = 'welcome-section';
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If top of section is within upper half of the screen
          if (rect.top <= window.innerHeight * 0.45) {
            current = sectionId;
          }
        }
      }

      // If we are close to the bottom, force the active section to be footer-section
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120;
      if (isAtBottom) {
        current = 'footer-section';
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter logic
  const filteredHostels = (hostels || []).filter((hostel) => {
    if (!hostel) return false;
    const query = (searchQuery || '').toLowerCase().trim();
    const name = (hostel.name || '').toLowerCase();
    const loc = (hostel.location || '').toLowerCase();
    const matchesSearch = name.includes(query) || loc.includes(query);
    
    if (selectedWing === 'All') return matchesSearch;
    return matchesSearch && hostel.wing === selectedWing;
  });

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden font-sans pb-0">
      {/* Dynamic Sidebar Scroll Tracker (Floating Indicator) */}
      <motion.div 
        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        animate={{ width: isSidebarExpanded ? 220 : 56 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden xl:flex flex-col items-center gap-5 bg-white/95 backdrop-blur-md p-4 py-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 cursor-pointer select-none overflow-hidden"
      >
        <div className="flex items-center gap-2 justify-between w-full border-b border-slate-100 pb-2">
          {isSidebarExpanded ? (
            <span className="text-[9px] font-black uppercase text-blue-900 tracking-wider">Navigation Map</span>
          ) : (
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center w-full">Nav</span>
          )}
        </div>

        <div className="relative w-[3px] h-36 bg-slate-100 rounded-full flex flex-col justify-start overflow-hidden shrink-0">
          {/* Dynamic Blue Filled Line */}
          <motion.div 
            className="absolute top-0 left-0 w-full bg-blue-900 rounded-full origin-top"
            style={{ height: `${scrollPercent}%` }}
            transition={{ type: "tween", ease: "linear" }}
          />
        </div>

        {/* Section Dots */}
        <div className="flex flex-col gap-3.5 w-full">
          {[
            { id: 'welcome-section', label: 'Welcome to PineVela' },
            { id: 'hostels-section', label: 'Available Hostels' },
            { id: 'testimonials-section', label: 'Hear from Students' },
            { id: 'faq-about-section', label: 'FAQ & About us' },
            { id: 'footer-section', label: 'Footer Section' }
          ].map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent toggling sidebar width on clicking dot
                  document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="group relative flex items-center w-full cursor-pointer focus:outline-none py-1 rounded-lg hover:bg-slate-50 transition-colors"
                title={sec.label}
              >
                {/* Outer pulsing indicator ring */}
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                  isActive 
                    ? 'border-blue-900 bg-white scale-110 shadow-sm shadow-blue-950/20' 
                    : 'border-slate-200 bg-slate-100 group-hover:border-slate-300 group-hover:bg-slate-200'
                }`}>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-900" />}
                </div>

                {/* Animated Label presentation */}
                <AnimatePresence initial={false}>
                  {isSidebarExpanded ? (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`ml-3 text-[10px] font-bold text-left whitespace-nowrap overflow-hidden ${
                        isActive ? 'text-blue-950 font-black' : 'text-slate-500'
                      }`}
                    >
                      {sec.label}
                    </motion.span>
                  ) : (
                    /* Floating tooltip label (only when collapsed) */
                    <span className="absolute right-10 bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md z-50">
                      {sec.label}
                    </span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {/* Click to expand helper */}
        {!isSidebarExpanded && (
          <span className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Tap</span>
        )}
      </motion.div>

      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

      {/* Top Section Container holding Header + Welcome Section with Welcome Background Image covering entire top */}
      <div className="relative overflow-hidden rounded-b-[4.5rem] w-full border-none shadow-none">
        {/* Background Image covering entire top section */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <img 
            src={welcomeBg} 
            alt="" 
            className="w-full h-full object-cover opacity-90 saturate-[110%]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/40 via-white/50 to-transparent" />
        </div>



        {/* Header with blue frosty transparent background */}
        <header id="public-header" className="relative z-30 px-6 md:px-12 pt-6">
          <div className="w-full bg-blue-50/80 backdrop-blur-lg border border-blue-200/50 shadow-2xl rounded-3xl px-6 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <PineLogo />
            
            {/* Global Search Bar */}
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search for hostels or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white/90 text-slate-800 text-sm transition-all shadow-inner"
              />
            </div>

            <div className="flex items-center gap-4 text-sm font-medium">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onNavigate('student-login')}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Welcome Section */}
        <section 
          id="welcome-section" 
          className="relative z-10 w-full py-12 md:py-20 px-6 md:px-12"
        >
          <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 pb-8">
            <motion.div 
              className="lg:col-span-7 bg-blue-50/80 backdrop-blur-lg p-8 md:p-10 rounded-3xl border border-blue-200/50 shadow-2xl space-y-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.15
                  }
                }
              }}
            >
            <motion.h1 
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              }}
            >
              Welcome to <br />
              <span className="text-blue-900 font-black relative">
                PineVela
                <span className="absolute bottom-1 left-0 w-full h-2 bg-amber-300 -z-10 rounded-sm opacity-60"></span>
              </span>
            </motion.h1>

            <motion.p 
              className="text-lg text-slate-700 font-medium max-w-xl leading-relaxed"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              }}
            >
              The universal global dashboard for modern student living. Find your next home or manage your property with professional efficiency.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4 pt-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
              }}
            >
              <button
                id="btn-login"
                onClick={() => onNavigate('student-login')}
                className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/35 flex items-center gap-2 text-sm cursor-pointer"
              >
                <span>Login to Portal</span>
              </button>
            </motion.div>

            <div className="pt-2" />
          </motion.div>

          <motion.div 
            className="lg:col-span-5 flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.8 },
              scale: { duration: 0.8 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Visual Pineapple Illustration from Page 1 */}
            <motion.div 
              className="relative w-72 h-72 md:w-80 md:h-80 bg-blue-50/80 backdrop-blur-lg rounded-3xl shadow-2xl flex items-center justify-center p-8 border border-blue-200/50 cursor-pointer"
              whileHover={{ 
                scale: 1.05, 
                rotate: 2,
                boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)"
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Abstract decorative circles behind logo */}
              <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-blue-100/50 rounded-full -z-10" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-amber-100/50 rounded-full -z-10" />
              <div className="text-center space-y-4">
                <PineLogo size={140} hideText={true} />
                <div className="font-extrabold text-2xl tracking-tight text-slate-900">
                  Pine<span className="text-blue-900">Vela</span>
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-mono">Premium Residences</div>
              </div>
            </motion.div>
          </motion.div>
          </div>
        </section>
      </div>

      {/* Main Container */}
      <main className="w-full pt-0 space-y-16">

        {/* Available Hostels Section */}
        <motion.section 
          id="hostels-section" 
          className="relative max-w-7xl mx-auto px-6 md:px-12 w-full mt-16 bg-transparent border-none shadow-none"
          initial={{ opacity: 0.3, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.08 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative z-10 space-y-8 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/40">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Available Hostels</h2>
                <p className="text-slate-700 font-medium text-sm mt-1">Browse high-quality student accommodations across all campus zones.</p>
                {/* Status Color Guide */}
                <div className="flex items-center gap-6 text-xs text-slate-600 font-bold mt-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    OPEN
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    FULL
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    MAINTENANCE
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-blue-50/40 backdrop-blur-md p-1.5 rounded-xl border border-blue-200/30 shadow-sm">
                  <button
                    onClick={() => setSelectedWing('All')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedWing === 'All'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-blue-100/50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedWing('North Wing')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedWing === 'North Wing'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-blue-100/50'
                    }`}
                  >
                    North Wing
                  </button>
                  <button
                    onClick={() => setSelectedWing('South Side')}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedWing === 'South Side'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-650 hover:bg-blue-100/50'
                    }`}
                  >
                    South Side
                  </button>
                </div>

                {(selectedWing !== 'All' || searchQuery.trim() !== '') && (
                  <button
                    onClick={() => {
                      setSelectedWing('All');
                      setSearchQuery('');
                    }}
                    className="bg-blue-50/40 backdrop-blur-md border border-blue-200/30 text-blue-900 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:bg-blue-50/70 transition-all cursor-pointer"
                  >
                    <X size={14} />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>
            </div>

          {/* Grid of Hostels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredHostels.map((hostel, index) => {
              const isOpen = hostel.status === 'Open' || (hostel.status as any) === 'active';
              const isMaintenance = hostel.status === 'Under Maintenance';
              const isFull = hostel.status === 'Full';

              let statusColor = 'bg-emerald-500 text-white';
              let statusText = 'Open';
              if (isMaintenance) {
                statusColor = 'bg-amber-500 text-white';
                statusText = 'Under Maintenance';
              } else if (isFull) {
                statusColor = 'bg-rose-500 text-white';
                statusText = 'Full';
              }

              return (
                <motion.div
                  key={hostel.id || index}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col group cursor-pointer hostel-radiant-glow"
                  onClick={() => onSelectHostel(hostel)}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.02,
                    boxShadow: "0 25px 40px -15px rgb(0 0 0 / 0.15)"
                  }}
                >
                  {/* Image and Status Ribbon */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={hostel?.image || hostel?.imageUrl || (hostel as any)?.exteriorPhotoUrl || (hostel as any)?.imagePreviewUrl || (hostel as any)?.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'}
                      alt={hostel?.name || 'Hostel'}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Status Pill */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${statusColor}`}>
                        {statusText}
                      </span>
                      <span className="bg-blue-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                        {hostel.bedsLeft ?? hostel.availableSpaces ?? hostel.totalCapacity ?? 0} BEDS LEFT
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base tracking-tight group-hover:text-blue-900 transition-colors">
                        {hostel.name}
                      </h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                        <MapPin size={13} className="shrink-0" />
                        <span className="truncate">{hostel.location}</span>
                      </div>
                    </div>

                    {/* Manager Details */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                      {hostel.managerPhoto || (hostel as any).managerAvatar ? (
                        <img
                          src={hostel.managerPhoto || (hostel as any).managerAvatar}
                          alt={hostel.managerName || 'Manager'}
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-900 overflow-hidden border border-blue-200 shrink-0 flex items-center justify-center font-bold text-xs">
                          {hostel.managerName?.[0] || hostel.name?.[0] || 'M'}
                        </div>
                      )}
                      <div className="text-left text-xs min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-800 truncate">{hostel.managerName || 'Resident Manager'}</p>
                          <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded shrink-0">Verified</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-medium">Hostel Manager</p>
                        <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-slate-400" />
                          <span>{hostel.managerPhone || '+233 24 123 4567'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHostel(hostel);
                      }}
                      className="w-full mt-2 py-2 px-4 rounded-xl border border-slate-200 hover:border-blue-900 hover:bg-blue-50/50 text-slate-700 hover:text-blue-900 text-xs font-bold transition-all flex items-center justify-between"
                    >
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredHostels.length === 0 && (
            <div className="text-center py-12 bg-blue-50/80 backdrop-blur-lg rounded-3xl border border-blue-200/50 shadow-xl p-8 space-y-3">
              <p className="text-slate-700 font-semibold text-sm">No hostels found matching the filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedWing('All'); }} 
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer inline-block"
              >
                Clear filters
              </button>
            </div>
          )}
          </div>
        </motion.section>

        {/* Benefits Badges Section */}
        <motion.section 
          id="benefits" 
          className="relative max-w-7xl mx-auto px-6 md:px-12 w-full mt-16 bg-transparent border-none shadow-none pb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
        >
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <motion.div 
            className="bg-blue-50/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/20 shadow-md space-y-3 cursor-pointer"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900">
              <Shield size={20} />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Verified Properties</h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Every hostel on PineVela is physically inspected for safety, hygiene, and amenity compliance.
            </p>
          </motion.div>

          <motion.div 
            className="bg-blue-50/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/20 shadow-md space-y-3 cursor-pointer"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <User size={20} />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Direct Communication</h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Connect directly with certified property managers for inquiries, viewing requests, and clarifications.
            </p>
          </motion.div>

          <motion.div 
            className="bg-blue-50/20 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/20 shadow-md space-y-3 cursor-pointer"
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.02,
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <Landmark size={20} />
            </div>
            <h4 className="font-extrabold text-slate-900 text-lg">Easy Management</h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              Property owners can track occupancy, maintenance requests, and bookings from a single powerful dashboard.
            </p>
          </motion.div>
          </div>
        </motion.section>

        {/* Testimonials Section with Horizontal Carousel */}
        <motion.section 
          id="testimonials-section" 
          className="relative max-w-7xl mx-auto px-6 md:px-12 w-full mt-24 bg-transparent border-none shadow-none"
          initial={{ opacity: 0.3, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.12 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative z-10 w-full">
            <TestimonialsCarousel />
          </div>
        </motion.section>

        {/* FAQ & About Us Side-by-Side Section */}
        <motion.section 
          id="faq-about-section" 
          className="relative max-w-7xl mx-auto px-6 md:px-12 w-full mt-28 bg-transparent border-none shadow-none pb-12"
          initial={{ opacity: 0.3, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.12 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: FAQ Accordion */}
            <div className="lg:col-span-6 space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <HelpCircle className="text-blue-900" size={12} />
                  Onboarding Support
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Frequently Asked Questions
                </h3>
                <p className="text-sm text-slate-500 max-w-xl">
                  Everything you need to know about the modern PineVela booking, management, and student residency experience.
                </p>
              </div>

              <FAQAccordion />
            </div>

            {/* Right Column: About Us */}
            <div className="lg:col-span-6 space-y-8 bg-transparent p-0 border-none shadow-none">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-blue-900 uppercase">
                  Our Identity & Purpose
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  About PineVela
                </h3>
                <h4 className="text-base md:text-lg font-bold text-blue-950 leading-relaxed border-l-4 border-blue-900 pl-4">
                  Making student accommodation simpler, safer, and easier to manage.
                </h4>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  PineVela is a digital hostel management platform built to connect students with accommodation providers while giving hostel managers and administrators the tools they need to manage accommodation efficiently.
                </p>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                  We believe finding a place to stay should not be complicated, and managing a hostel should not depend on scattered records, messages, spreadsheets, and manual processes.
                </p>
              </div>

              {/* Mission Card */}
              <div className="bg-blue-50/20 p-6 rounded-2xl border border-blue-200/25 space-y-2 shadow-sm">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">Our Mission</span>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
                  To bring the entire hostel experience into one connected platform — from discovering a hostel and submitting an application to managing rooms, beds, payments, maintenance, and communication.
                </p>
              </div>

              {/* Built for Everyone */}
              <div className="space-y-4">
                <h5 className="text-sm font-black text-slate-900 uppercase tracking-wider">Built for Everyone</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-200/25 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />
                      For Students
                    </span>
                    <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                      Discover approved hostels, compare available accommodation, apply for a room, manage payments, track allocations, and communicate with your hostel staff.
                    </p>
                  </div>

                  <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-200/25 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-900" />
                      For Managers
                    </span>
                    <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                      Manage blocks, floors, rooms, and beds, handle applications, track allocation history, manage payments, and dispatch maintenance.
                    </p>
                  </div>

                  <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-200/25 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-950" />
                      For Staff
                    </span>
                    <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                      Stay organized and respond instantly to daily hostel operations such as maintenance tickets within your assigned property wings.
                    </p>
                  </div>

                  <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-200/25 space-y-1.5 shadow-2xs">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-900" />
                      For Administrators
                    </span>
                    <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed">
                      Maintain oversight, verify managers and listed hostels, manage users, monitor transaction activity, and secure the trusted ecosystem.
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Matters */}
              <div className="space-y-2 border-t border-slate-200/80 pt-6">
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">Trust Matters</h5>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  PineVela is designed with security and accountability at its foundation. Hostel approvals, manager verification, accommodation allocations, and financial activity are handled through controlled workflows rather than relying solely on user input.
                </p>
                <p className="text-xs md:text-sm text-blue-900 font-extrabold leading-relaxed">
                  Our goal is simple: make hostel accommodation more organized, transparent, and accessible.
                </p>
              </div>

              {/* Vision Card */}
              <div className="bg-blue-950/90 backdrop-blur-sm text-white p-6 rounded-2xl space-y-2 border border-blue-900/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 block">Our Vision</span>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  We envision a future where finding, managing, and living in student accommodation is a connected digital experience — where students can make informed decisions, managers can operate efficiently, and institutions can have greater visibility.
                </p>
                <span className="text-xs font-black text-blue-300 block pt-1">
                  PineVela — accommodation, managed better.
                </span>
              </div>

            </div>

          </div>
        </motion.section>

      </main>

      {/* Footer */}
      <footer 
        id="footer-section" 
        className="border-t border-blue-200/40 bg-blue-50/80 backdrop-blur-lg mt-20 pt-16 pb-12 px-6 md:px-12 w-full"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-blue-200/20">
            <div className="space-y-4">
              <PineLogo />
              <p className="text-xs text-slate-650 leading-relaxed font-medium">
                The universal global dashboard for seamless hostel management and student accommodation experiences.
              </p>
            </div>
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 text-sm tracking-wide">Company</h5>
              <ul className="space-y-2 text-xs text-slate-600 font-semibold">
                <li><a href="#" className="hover:text-blue-900 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-900 transition-colors">Partner with Us</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 text-sm tracking-wide">Follow Us</h5>
              <div className="flex gap-4 text-slate-400">
                <span className="p-2 bg-white/60 hover:bg-white/95 rounded-lg cursor-pointer text-slate-650 shadow-xs border border-slate-200/30 transition-colors">🔍</span>
                <span className="p-2 bg-white/60 hover:bg-white/95 rounded-lg cursor-pointer text-slate-650 shadow-xs border border-slate-200/30 transition-colors">🔔</span>
                <span className="p-2 bg-white/60 hover:bg-white/95 rounded-lg cursor-pointer text-slate-650 shadow-xs border border-slate-200/30 transition-colors">❓</span>
              </div>
            </div>
          </div>

          <div className="w-full pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-medium gap-4">
            <span>© 2026 PineVela Hosting Solutions. All rights reserved.</span>
            <span>Built for the modern campus.</span>
          </div>
        </div>
      </footer>

      {/* Page 2: Enlarged Full-Screen Hostel Details View */}
      <AnimatePresence>
        {selectedHostel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100/95 backdrop-blur-3xl overflow-y-auto flex flex-col"
          >
            {/* Top Full-Width Header Bar */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-sky-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={onCloseDrawer}
                  className="px-3.5 py-2 bg-sky-100/80 hover:bg-sky-200/80 text-sky-950 font-black rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer border border-sky-200/60"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Back to All Hostels</span>
                </button>
                <div className="hidden sm:flex items-center gap-2 border-l border-sky-200/80 pl-3">
                  <span className="text-sm font-black text-slate-950">{selectedHostel.name}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md border border-emerald-200">
                    PineVela Accredited
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('student-login')}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Student Login
                </button>
                <button
                  onClick={onCloseDrawer}
                  className="w-9 h-9 rounded-full bg-sky-100/80 hover:bg-sky-200 text-sky-900 flex items-center justify-center transition-colors cursor-pointer border border-sky-200/60"
                  title="Close Full Screen View"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8 text-slate-950">
              {/* Full Screen Banner / Hero Image */}
              <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-white/80 bg-blue-50 group">
                <img
                  src={selectedHostel?.image || selectedHostel?.imageUrl || (selectedHostel as any)?.exteriorPhotoUrl || (selectedHostel as any)?.imagePreviewUrl || (selectedHostel as any)?.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'}
                  alt={selectedHostel.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-sky-950/20 to-transparent" />

                {/* Badges Floating Top Right */}
                <div className="absolute top-4 right-4 flex flex-wrap gap-2 items-center">
                  <span className="bg-emerald-500/95 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>{selectedHostel.status || 'Active Accreditation'}</span>
                  </span>
                  <span className="bg-blue-900/95 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md uppercase tracking-wider flex items-center gap-1.5">
                    <BedDouble size={14} />
                    <span>{selectedHostel.bedsLeft ?? selectedHostel.availableSpaces ?? selectedHostel.totalCapacity ?? 0} Beds Available</span>
                  </span>
                </div>

                {/* Hero Overlay Details Bottom Left */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider">
                        Premium Residence
                      </span>
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                        <MapPin size={13} className="text-amber-400" />
                        {selectedHostel.location}
                      </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                      {selectedHostel.name}
                    </h1>
                  </div>

                  {/* Pricing Badge Overlay */}
                  <div className="bg-white/15 backdrop-blur-xl border border-white/30 p-4 rounded-2xl flex flex-col items-start md:items-end shrink-0 shadow-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Annual Academic Fee</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-300">
                      GHS {(selectedHostel.price || 3500).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-200 font-medium">Includes utility, maintenance & high-speed wifi</span>
                  </div>
                </div>
              </div>

              {/* Highlighted Stat Cards Grid (Crystal Glass Tabs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/90 shadow-lg shadow-sky-900/5 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Total Capacity</span>
                  <span className="text-2xl font-black text-slate-950 mt-1">{selectedHostel.totalCapacity ?? 120} Beds</span>
                  <span className="text-xs text-slate-700 mt-1 font-bold">Fully certified beds</span>
                </div>

                <div className="bg-emerald-50/70 backdrop-blur-xl border border-emerald-200/80 p-5 rounded-2xl shadow-lg shadow-emerald-900/5 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">Available Spaces</span>
                  <span className="text-2xl font-black text-emerald-950 mt-1">
                    {selectedHostel.bedsLeft ?? selectedHostel.availableSpaces ?? 0} Beds Left
                  </span>
                  <span className="text-xs text-emerald-900 mt-1 font-bold">Immediate booking ready</span>
                </div>

                <div className="bg-blue-50/70 backdrop-blur-xl border border-blue-200/80 p-5 rounded-2xl shadow-lg shadow-blue-900/5 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">Verification Status</span>
                  <span className="text-xl font-black text-blue-950 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-5 h-5 text-blue-800" />
                    <span>Verified Hostel</span>
                  </span>
                  <span className="text-xs text-blue-900 mt-1 font-bold">Inspected & Accredited</span>
                </div>

                <div className="bg-amber-50/70 backdrop-blur-xl border border-amber-200/80 p-5 rounded-2xl shadow-lg shadow-amber-900/5 flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">Campus Proximity</span>
                  <span className="text-xl font-black text-amber-950 mt-1">
                    {selectedHostel?.campusProximity || (selectedHostel as any)?.campus_proximity || '5-10 Mins Walk'}
                  </span>
                  <span className="text-xs text-amber-900 mt-1 font-bold">
                    {selectedHostel?.campusProximityDetails || (selectedHostel as any)?.campus_proximity_details || 'Shuttle & walking routes'}
                  </span>
                </div>
              </div>

              {/* Two-Column Deep Details Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Property Overview Crystal Glass Card */}
                  <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/90 shadow-lg shadow-sky-900/5 space-y-4">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-900" />
                      <span>About {selectedHostel.name}</span>
                    </h2>
                    <p className="text-sm text-slate-800 leading-relaxed font-semibold">
                      {selectedHostel.description || `${selectedHostel.name} offers high-quality student housing tailored for university students. Designed with modern architecture, spacious rooms, and round-the-clock security, it provides an ideal environment for academic focus and community life.`}
                    </p>
                  </div>

                  {/* Highlighted Facilities & Amenities Crystal Glass Card */}
                  <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/90 shadow-lg shadow-sky-900/5 space-y-6">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span>Residence Features & Amenities</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-sky-100 flex items-start gap-3 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-extrabold shrink-0">
                          <Zap size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-950">24/7 Power Backup</h4>
                          <p className="text-[11px] text-slate-700 font-bold mt-0.5">Heavy-duty automatic generator ensuring zero power interruptions during study hours.</p>
                        </div>
                      </div>

                      <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-sky-100 flex items-start gap-3 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-extrabold shrink-0">
                          <Wifi size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-950">Campus Fiber WiFi</h4>
                          <p className="text-[11px] text-slate-700 font-bold mt-0.5">High-speed unlimited broadband access available across all blocks and study hubs.</p>
                        </div>
                      </div>

                      <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-sky-100 flex items-start gap-3 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-extrabold shrink-0">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-950">CCTV & Gate Guard</h4>
                          <p className="text-[11px] text-slate-700 font-bold mt-0.5">Electronic biometric/ID gates with 24-hour uniformed security officers on duty.</p>
                        </div>
                      </div>

                      <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-sky-100 flex items-start gap-3 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center font-extrabold shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-950">Clean Running Water</h4>
                          <p className="text-[11px] text-slate-700 font-bold mt-0.5">Treated borehole water reserve tanks providing continuous water flow to all floors.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standard Room Configuration Overview */}
                  <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/90 shadow-lg shadow-sky-900/5 space-y-4">
                    <h2 className="text-xl font-black text-slate-950 tracking-tight flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-blue-900" />
                      <span>Room Configuration Options</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl text-center space-y-2 shadow-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Option A</span>
                        <h4 className="text-sm font-black text-slate-950">1-in-a-Room Private</h4>
                        <p className="text-xs text-blue-900 font-black">GHS {(selectedHostel.price ? selectedHostel.price * 1.5 : 5200).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-700 font-bold">Private washroom & study desk</p>
                      </div>

                      <div className="p-4 bg-blue-50/80 backdrop-blur-md border border-blue-200 rounded-2xl text-center space-y-2 relative overflow-hidden shadow-xs">
                        <span className="absolute top-0 right-0 bg-blue-900 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">POPULAR</span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Option B</span>
                        <h4 className="text-sm font-black text-slate-950">2-in-a-Room Shared</h4>
                        <p className="text-xs text-blue-900 font-black">GHS {(selectedHostel.price || 3500).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-700 font-bold">En-suite washroom & dual wardrobes</p>
                      </div>

                      <div className="p-4 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl text-center space-y-2 shadow-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Option C</span>
                        <h4 className="text-sm font-black text-slate-950">4-in-a-Room Economy</h4>
                        <p className="text-xs text-blue-900 font-black">GHS {(selectedHostel.price ? selectedHostel.price * 0.75 : 2600).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-700 font-bold">Spacious layout & shared facilities</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Resident Manager Profile Card (Crystal Glass) */}
                  <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/90 shadow-lg shadow-sky-900/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <User size={14} className="text-blue-900" />
                      <span>Resident Property Manager</span>
                    </h3>

                    <div className="flex items-center gap-4">
                      {selectedHostel.managerPhoto || (selectedHostel as any).managerAvatar ? (
                        <img
                          src={selectedHostel.managerPhoto || (selectedHostel as any).managerAvatar}
                          alt={selectedHostel.managerName || 'Manager'}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-100 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                          {selectedHostel.managerName?.[0] || 'M'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-black text-slate-950 truncate">
                            {selectedHostel.managerName || 'Anthony Davis'}
                          </h4>
                          <span className="text-[9px] font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-bold truncate">{selectedHostel.managerEmail || 'manager@pinevela.com'}</p>
                        <p className="text-xs text-blue-900 font-black mt-1">{selectedHostel.managerPhone || '+233 24 123 4567'}</p>
                      </div>
                    </div>

                    <a
                      href={`tel:${selectedHostel.managerPhone || '+233241234567'}`}
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Phone size={14} />
                      <span>Call Property Manager</span>
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
        }}
        userRole={user?.role}
        userName={user?.name}
      />
    </div>
  );
}
