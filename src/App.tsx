import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Hostel, BookingRequest, IssueReport } from './types';
import { motion, AnimatePresence } from 'motion/react';

// Component imports
import Page1Public from './components/Page1Public';
import PageUnifiedLogin from './components/PageUnifiedLogin';
import PageManagerOnboarding from './components/PageManagerOnboarding';
import PageAdminDashboard from './components/PageAdminDashboard';
import PageManagerDashboard from './components/PageManagerDashboard';

// Elegant wrapper for transition animations
function PageWrapper({ children, noAnimation = false }: { children: React.ReactNode; noAnimation?: boolean }) {
  if (noAnimation) {
    return (
      <div className="flex-1 flex flex-col w-full min-h-screen">
        {children}
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="flex-1 flex flex-col w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}

// Inner component to handle router-aware states and logic
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, apiFetch } = useAuth();

  // Stateful datasets synchronized with the secure Express API
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [selectedPublicHostel, setSelectedPublicHostel] = useState<Hostel | null>(null);

  // Refetch hostels on every route change (e.g., when returning to landing page after admin approval)
  useEffect(() => {
    const refreshHostels = async () => {
      try {
        const response = await fetch('/api/hostels');
        if (response.ok) {
          const hostelsList = await response.json();
          if (Array.isArray(hostelsList)) {
            setHostels(hostelsList);
          }
        }
      } catch (err) {
        console.warn("Notice refreshing hostels on route change:", err);
      }
    };
    refreshHostels();
  }, [location.pathname]);

  // Synchronize data from the backend
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch hostels (publicly accessible now)
        const response = await fetch('/api/hostels');
        if (response.ok) {
          const hostelsList = await response.json();
          setHostels(hostelsList);
        }
      } catch (err) {
        console.error("Failed to fetch public hostels:", err);
      }

      if (!user) {
        setLoadingData(false);
        return;
      }

      try {
        // Fetch issues reports (available to all authenticated roles)
        const issuesList = await apiFetch('/api/issue-reports');
        setIssueReports(issuesList);

        // Role specific data fetches
        if (user.role === 'admin' || user.role === 'manager') {
          const bookingsList = await apiFetch('/api/booking-requests');
          setBookingRequests(bookingsList);
        }

        if (user.role === 'admin') {
          const actsList = await apiFetch('/api/activities');
          setActivities(actsList);
        }
      } catch (err) {
        console.error("Failed to sync backend data on app mount:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  // Actions connecting frontend interactions to secure backend routes
  const handleCreateIssueOnServer = async (newIssue: Partial<IssueReport>) => {
    try {
      const created = await apiFetch('/api/issue-reports', {
        method: 'POST',
        body: JSON.stringify({
          ...newIssue,
          studentName: user?.name || 'Alex Thompson',
          studentId: user?.id || 'STU-882'
        })
      });

      // Update local state
      setIssueReports(prev => [created, ...prev]);
    } catch (err) {
      console.error("Failed to report issue on server:", err);
    }
  };

  const handleHostelRegistered = async (newHostel: Hostel) => {
    setHostels(prev => [newHostel, ...prev.filter(h => h.id !== newHostel.id)]);
    try {
      const res = await fetch('/api/hostels');
      if (res.ok) {
        const freshList = await res.json();
        if (Array.isArray(freshList) && freshList.length > 0) {
          setHostels(freshList);
        }
      }
    } catch (err) {
      console.warn("Notice syncing hostels from server:", err);
    }
  };

  const handleUpdateHostelsOnServer = async (updatedList: Hostel[]) => {
    // Optimistically update React state immediately
    setHostels(updatedList);
    try {
      const syncedList = [...updatedList];
      for (let i = 0; i < syncedList.length; i++) {
        const updated = syncedList[i];
        const original = hostels.find(h => h.id === updated.id);
        
        if (!original) {
          // New hostel property: POST to server
          const created = await apiFetch('/api/hostels', {
            method: 'POST',
            body: JSON.stringify(updated)
          });
          if (created && created.id) syncedList[i] = created;
        } else if (JSON.stringify(original) !== JSON.stringify(updated)) {
          // Existing hostel: PUT to server
          const saved = await apiFetch(`/api/hostels/${updated.id}`, {
            method: 'PUT',
            body: JSON.stringify(updated)
          });
          if (saved && saved.id) syncedList[i] = saved;
        }
      }
      setHostels(syncedList);
    } catch (err) {
      console.warn("Notice syncing hostels update on server:", err);
    }
  };

  const handleUpdateSingleHostelOnServer = async (updatedHostel: Hostel) => {
    // Optimistically update React state immediately
    setHostels(prev => {
      const exists = prev.some(h => h.id === updatedHostel.id);
      if (exists) {
        return prev.map(h => h.id === updatedHostel.id ? { ...h, ...updatedHostel } : h);
      }
      return [updatedHostel, ...prev];
    });

    try {
      const updated = await apiFetch(`/api/hostels/${updatedHostel.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedHostel)
      });
      if (updated && updated.id) {
        setHostels(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h));
      }
    } catch (err) {
      console.warn("Notice syncing hostel update on server:", err);
    }
  };

  const handleUpdateBookingStatusOnServer = async (bookingId: string, status: 'Pending' | 'Approved' | 'Ignored') => {
    try {
      const updated = await apiFetch(`/api/booking-requests/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setBookingRequests(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch (err) {
      console.error("Failed to update booking status on server:", err);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 1. PUBLIC ROUTE */}
        <Route
          path="/"
          element={
            <PageWrapper>
              <Page1Public
                hostels={hostels.filter(h => {
                  if (h.isDeleted) return false;
                  const isApproved = h.isApproved === true || h.approvalStatus === 'Approved' || (h as any).status === 'Approved';
                  const isExplicitPending = (h.approvalStatus === 'Pending Approval' || (h as any).status === 'Pending Approval') && h.isApproved !== true;
                  return isApproved && !isExplicitPending;
                })}
                selectedHostel={selectedPublicHostel}
                onSelectHostel={(hostel) => setSelectedPublicHostel(hostel)}
                onCloseDrawer={() => setSelectedPublicHostel(null)}
                onNavigate={(screen) => {
                  navigate('/login');
                }}
              />
            </PageWrapper>
          }
        />

        {/* 2. UNIFIED LOGIN ROUTE */}
        <Route
          path="/login"
          element={
            <PageWrapper>
              <PageUnifiedLogin />
            </PageWrapper>
          }
        />

        {/* 2B. MANAGER ONBOARDING PAGE */}
        <Route
          path="/register-manager"
          element={
            <PageWrapper>
              <PageManagerOnboarding />
            </PageWrapper>
          }
        />

        {/* 2C. ADMIN DASHBOARD ROUTE */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageWrapper>
                <PageAdminDashboard />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* 2D. MANAGER DASHBOARD ROUTE */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <PageWrapper>
                <PageManagerDashboard />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* FALLBACK REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function BubbleBackground() {
  const bubbles = [
    { id: 1, size: 'w-72 h-72 md:w-96 md:h-96', color: 'bg-blue-400/35', left: '5%', top: '15%', x: [0, 80, -40, 0], y: [0, 100, 50, 0], duration: 25 },
    { id: 2, size: 'w-96 h-96 md:w-[450px] md:h-[450px]', color: 'bg-indigo-300/30', left: '60%', top: '10%', x: [0, -100, 50, 0], y: [0, 120, -60, 0], duration: 32 },
    { id: 3, size: 'w-64 h-64 md:w-80 md:h-80', color: 'bg-sky-400/40', left: '15%', top: '55%', x: [0, 120, -50, 0], y: [0, -110, 40, 0], duration: 28 },
    { id: 4, size: 'w-80 h-80 md:w-96 md:h-96', color: 'bg-blue-400/30', left: '65%', top: '60%', x: [0, -80, 80, 0], y: [0, -100, -50, 0], duration: 30 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className={`absolute rounded-full blur-[100px] ${b.size} ${b.color}`}
          animate={{
            x: b.x,
            y: b.y,
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            left: b.left,
            top: b.top,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
          <BubbleBackground />
          <div className="flex-1 z-10 flex flex-col">
            <AppContent />
          </div>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
