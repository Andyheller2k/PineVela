import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Hostel, BookingRequest, IssueReport } from './types';
import { motion, AnimatePresence } from 'motion/react';

// Component imports
import Page1Public from './components/Page1Public';
import PageUnifiedLogin from './components/PageUnifiedLogin';
import Page5StudentDashboard from './components/Page5StudentDashboard';
import Page8ManagerDashboard from './components/Page8ManagerDashboard';
import Page10HostelManagerDashboard from './components/Page10HostelManagerDashboard';
import Page11StaffDashboard from './components/Page11StaffDashboard';

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

  const handleUpdateHostelsOnServer = async (updatedList: Hostel[]) => {
    // Determine which hostel was updated or created
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
          syncedList[i] = created;
        } else if (JSON.stringify(original) !== JSON.stringify(updated)) {
          // Existing hostel: PUT to server
          const saved = await apiFetch(`/api/hostels/${updated.id}`, {
            method: 'PUT',
            body: JSON.stringify(updated)
          });
          syncedList[i] = saved;
        }
      }
      setHostels(syncedList);
    } catch (err) {
      console.error("Failed to sync hostels update on server:", err);
    }
  };

  const handleUpdateSingleHostelOnServer = async (updatedHostel: Hostel) => {
    try {
      const updated = await apiFetch(`/api/hostels/${updatedHostel.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedHostel)
      });
      setHostels(prev => prev.map(h => h.id === updated.id ? updated : h));
    } catch (err) {
      console.error("Failed to sync hostel update on server:", err);
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
                hostels={hostels.length > 0 ? hostels : []}
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

        {/* 3. PROTECTED STUDENT ROUTES */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PageWrapper noAnimation={true}>
                <Page5StudentDashboard
                  currentScreen="student-dashboard"
                  onNavigate={(screen) => {
                    if (screen === 'public-browse') {
                      logout();
                      navigate('/login');
                    } else if (screen === 'student-report-issue') {
                      navigate('/student/report-issue');
                    } else {
                      navigate('/student/dashboard');
                    }
                  }}
                  onSubmitIssue={handleCreateIssueOnServer}
                />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/report-issue"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PageWrapper noAnimation={true}>
                <Page5StudentDashboard
                  currentScreen="student-report-issue"
                  onNavigate={(screen) => {
                    if (screen === 'public-browse') {
                      logout();
                      navigate('/login');
                    } else if (screen === 'student-dashboard') {
                      navigate('/student/dashboard');
                    } else {
                      navigate('/student/report-issue');
                    }
                  }}
                  onSubmitIssue={handleCreateIssueOnServer}
                />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* 4. PROTECTED MANAGER ROUTES */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <PageWrapper noAnimation={true}>
                <Page10HostelManagerDashboard
                  // Match the logged in manager with their designated hostel (e.g. Pine Crest Residency)
                  hostel={hostels.find(h => h.id === 'hostel-1') || hostels[0] || {} as Hostel}
                  bookingRequests={bookingRequests}
                  issueReports={issueReports}
                  onLogout={() => {
                    logout();
                    navigate('/login');
                  }}
                  onUpdateHostel={handleUpdateSingleHostelOnServer}
                  onAddActivity={(text, type) => {
                    console.log(`[Activity log] ${text}`);
                  }}
                />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* PROTECTED STAFF ROUTES */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <PageWrapper noAnimation={true}>
                <Page11StaffDashboard />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        {/* 5. PROTECTED ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageWrapper noAnimation={true}>
                <Page8ManagerDashboard
                  currentScreen="manager-dashboard"
                  onNavigate={(screen) => {
                    if (screen === 'public-browse') {
                      logout();
                      navigate('/login');
                    } else if (screen === 'manager-configure') {
                      navigate('/admin/configure');
                    } else {
                      navigate('/admin/dashboard');
                    }
                  }}
                  hostels={hostels}
                  bookingRequests={bookingRequests}
                  issueReports={issueReports}
                  activities={activities}
                  onUpdateHostels={handleUpdateHostelsOnServer}
                  onUpdateBookingStatus={handleUpdateBookingStatusOnServer}
                />
              </PageWrapper>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/configure"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageWrapper noAnimation={true}>
                <Page8ManagerDashboard
                  currentScreen="manager-configure"
                  onNavigate={(screen) => {
                    if (screen === 'public-browse') {
                      logout();
                      navigate('/login');
                    } else if (screen === 'manager-dashboard') {
                      navigate('/admin/dashboard');
                    } else {
                      navigate('/admin/configure');
                    }
                  }}
                  hostels={hostels}
                  bookingRequests={bookingRequests}
                  issueReports={issueReports}
                  activities={activities}
                  onUpdateHostels={handleUpdateHostelsOnServer}
                  onUpdateBookingStatus={handleUpdateBookingStatusOnServer}
                />
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

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col relative bg-slate-50">
          <div className="flex-1">
            <AppContent />
          </div>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
