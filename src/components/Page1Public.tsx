import React, { useState } from 'react';
import { Hostel } from '../types';
import PineLogo from './PineLogo';
import { Search, MapPin, Phone, ArrowRight, X, Sparkles, Shield, User, MessageSquare, Landmark, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Filter logic
  const filteredHostels = hostels.filter((hostel) => {
    const matchesSearch =
      hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hostel.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedWing === 'All') return matchesSearch;
    return matchesSearch && hostel.wing === selectedWing;
  });

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans pb-16">
      {/* Decorative background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-30 -z-10" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

      {/* Header */}
      <header id="public-header" className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 bg-slate-50 text-slate-800 text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <button
              onClick={() => onNavigate('student-login')}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-md transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Welcome Section */}
        <section id="welcome-hero" className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 pb-16 border-b border-slate-100">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Welcome to <br />
              <span className="text-blue-900 font-black relative">
                PineVela
                <span className="absolute bottom-1 left-0 w-full h-2 bg-amber-300 -z-10 rounded-sm opacity-60"></span>
              </span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              The universal global dashboard for modern student living. Find your next home or manage your property with professional efficiency.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                id="btn-login"
                onClick={() => onNavigate('student-login')}
                className="px-8 py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
              >
                <span>Login to Portal</span>
                <span>→</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 px-4 py-2 rounded-lg inline-flex">
              <span className="text-amber-500">⚠️</span>
              <span>Users can only view hostel details from this screen. Booking will be available later.</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            {/* Visual Pineapple Illustration from Page 1 */}
            <div className="relative w-72 h-72 md:w-80 md:h-80 bg-white rounded-3xl shadow-xl flex items-center justify-center p-8 border border-slate-100">
              {/* Abstract decorative circles behind logo */}
              <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-slate-100 rounded-full -z-10" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-amber-50 rounded-full -z-10" />
              <div className="text-center space-y-4">
                <PineLogo size={140} hideText={true} />
                <div className="font-extrabold text-2xl tracking-tight">
                  Pine<span className="text-blue-900">Vela</span>
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-mono">Premium Residences</div>
              </div>
            </div>
          </div>
        </section>

        {/* Available Hostels Section */}
        <section id="available-hostels" className="pt-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Available Hostels</h2>
              <p className="text-slate-500 text-sm">Browse high-quality student accommodations across all campus zones.</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 self-start md:self-auto shadow-sm">
              <button
                onClick={() => setSelectedWing('All')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedWing === 'All'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedWing('North Wing')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedWing === 'North Wing'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                North Wing
              </button>
              <button
                onClick={() => setSelectedWing('South Side')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedWing === 'South Side'
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                South Side
              </button>
            </div>
          </div>

          {/* Status Color Guide */}
          <div className="flex items-center gap-6 text-xs text-slate-500 font-semibold px-1">
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

          {/* Grid of Hostels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredHostels.map((hostel) => {
              const isOpen = hostel.status === 'Open';
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
                <div
                  key={hostel.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all flex flex-col group cursor-pointer hostel-radiant-glow"
                  onClick={() => onSelectHostel(hostel)}
                >
                  {/* Image and Status Ribbon */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={hostel.image}
                      alt={hostel.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Status Pill */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${statusColor}`}>
                        {statusText}
                      </span>
                      <span className="bg-blue-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                        {hostel.bedsLeft} BEDS LEFT
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
                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center font-bold text-xs text-blue-900">
                        {hostel.managerName[0]}
                      </div>
                      <div className="text-left text-xs min-w-0">
                        <p className="font-bold text-slate-800 truncate">{hostel.managerName}</p>
                        <p className="text-slate-400 text-[10px] font-medium">Hostel Manager</p>
                        <p className="text-slate-500 text-[10px] flex items-center gap-0.5 mt-0.5">
                          <Phone size={10} />
                          {hostel.managerPhone}
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
                </div>
              );
            })}
          </div>

          {filteredHostels.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-semibold">No hostels found matching the filters.</p>
              <button onClick={() => { setSearchQuery(''); setSelectedWing('All'); }} className="text-blue-900 text-sm font-bold underline mt-1">
                Clear filters
              </button>
            </div>
          )}

          {/* Load More Button */}
          <div className="flex justify-center pt-4">
            <button className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span>Load More Properties</span>
              <span className="text-slate-400">⚡</span>
            </button>
          </div>
        </section>

        {/* Benefits Badges Section */}
        <section id="benefits" className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 pb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-900">
              <Shield size={20} />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Verified Properties</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every hostel on PineVela is physically inspected for safety, hygiene, and amenity compliance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <User size={20} />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Direct Communication</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect directly with certified property managers for inquiries, viewing requests, and clarifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <Landmark size={20} />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Easy Management</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Property owners can track occupancy, maintenance requests, and bookings from a single powerful dashboard.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-20 pt-12 pb-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-100">
          <div className="space-y-4">
            <PineLogo />
            <p className="text-xs text-slate-500 leading-relaxed">
              The universal global dashboard for seamless hostel management and student accommodation experiences.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-sm">Resources</h5>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#" className="hover:text-blue-900">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-900">Student FAQ</a></li>
              <li><a href="#" className="hover:text-blue-900">Manager Portal</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-sm">Company</h5>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><a href="#" className="hover:text-blue-900">About Us</a></li>
              <li><a href="#" className="hover:text-blue-900">Contact</a></li>
              <li><a href="#" className="hover:text-blue-900">Partner with Us</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 text-sm">Follow Us</h5>
            <div className="flex gap-4 text-slate-400">
              <span className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors">🔍</span>
              <span className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors">🔔</span>
              <span className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-600 transition-colors">❓</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <span>© 2026 PineVela Hosting Solutions. All rights reserved.</span>
          <span>Built for the modern campus.</span>
        </div>
      </footer>

      {/* Page 2: Hostel Details Slide-out Drawer */}
      <AnimatePresence>
        {selectedHostel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseDrawer}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl z-50 flex flex-col overflow-y-auto border-l border-slate-100"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                <button
                  onClick={onCloseDrawer}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-slate-600 text-xs font-bold"
                >
                  <span>←</span>
                  <span>Hostel Details</span>
                </button>
                <button
                  onClick={onCloseDrawer}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6 flex-1">
                {/* Cover Image with Status Overlay */}
                <div className="relative h-64 w-full bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <img
                    src={selectedHostel.image}
                    alt={selectedHostel.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs uppercase font-extrabold px-3 py-1 rounded-full shadow-md">
                    {selectedHostel.status}
                  </span>
                </div>

                {/* View-only Notice */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-2.5 text-blue-900 text-xs font-semibold">
                  <span>🛡️</span>
                  <span>View-only — no room access from this screen</span>
                </div>

                {/* Info Details */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {selectedHostel.name === 'Pine Crest Residency' ? 'Pinecrest Premium Residency' : selectedHostel.name}
                  </h2>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{selectedHostel.name === 'Pine Crest Residency' ? '124 Academic Way, North Campus, Lagos' : selectedHostel.location}</span>
                  </div>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedHostel.description}
                </p>

                {/* Capacity & Spaces Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Capacity</span>
                    <span className="text-xl font-extrabold text-slate-800 block mt-1">250 Beds</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Spaces</span>
                    <span className="text-xl font-extrabold text-blue-950 block mt-1">42</span>
                  </div>
                </div>

                {/* Key Information section */}
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="text-amber-500">ℹ️</span> Key Information
                  </h3>
                  <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Electricity Availability</span>
                      <span className="text-emerald-600 font-bold">24/7 Backup</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">WiFi Speed</span>
                      <span className="text-slate-800 font-bold">Up to 150 Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Laundry Room</span>
                      <span className="text-slate-800 font-bold">Included (Bi-weekly)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Security</span>
                      <span className="text-emerald-600 font-bold">CCTV & Gate Guard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Sticky Footer with Actions */}
              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 p-6 space-y-4">
                <p className="text-[11px] text-slate-500 text-center">
                  Ready to book or manage? Log in to access specific rooms and your workspace.
                </p>
                
                <button
                  onClick={() => onNavigate('student-login')}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-850 text-white rounded-xl font-extrabold text-xs text-center shadow-lg shadow-blue-900/10 transition-all"
                >
                  Login to Continue
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
