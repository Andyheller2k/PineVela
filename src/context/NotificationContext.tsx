import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'info' | 'error' | string;
  date?: string;
  read?: boolean;
  studentId?: string;
  userId?: string;
  userEmail?: string;
  recipientEmail?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: number;
}

export interface RegisteredAccountsState {
  managerAccount: any | null;
  staffAccount: any | null;
  residentAccount: any | null;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  registeredAccounts: RegisteredAccountsState;
  toasts: ToastItem[];
  pushToast: (title: string, message?: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// Singleton storage tracking seen keys to guarantee zero duplicates across renders & polls
class NotificationDeduplicatorService {
  private static instance: NotificationDeduplicatorService;
  private seenKeys: Set<string> = new Set();
  private lastManagerStatus: string | null = null;
  private lastStaffStatus: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationDeduplicatorService {
    if (!NotificationDeduplicatorService.instance) {
      NotificationDeduplicatorService.instance = new NotificationDeduplicatorService();
    }
    return NotificationDeduplicatorService.instance;
  }

  public shouldFireNotification(notif: NotificationItem): boolean {
    if (!notif) return false;
    const key = `notif_${notif.id || ''}_${(notif.title || '').trim().toLowerCase()}_${(notif.message || '').trim().toLowerCase()}`;
    if (this.seenKeys.has(key)) {
      return false;
    }
    this.seenKeys.add(key);
    return true;
  }

  public checkManagerStatusTransition(status: string | null | undefined): { changed: boolean; previous: string | null; current: string | null } {
    const current = status ? String(status).toLowerCase().trim() : null;
    if (this.lastManagerStatus === null) {
      this.lastManagerStatus = current;
      return { changed: false, previous: null, current };
    }
    const changed = Boolean(current && current !== this.lastManagerStatus);
    const previous = this.lastManagerStatus;
    if (changed) {
      this.lastManagerStatus = current;
    }
    return { changed, previous, current };
  }

  public checkStaffStatusTransition(status: string | null | undefined): { changed: boolean; previous: string | null; current: string | null } {
    const current = status ? String(status).toLowerCase().trim() : null;
    if (this.lastStaffStatus === null) {
      this.lastStaffStatus = current;
      return { changed: false, previous: null, current };
    }
    const changed = Boolean(current && current !== this.lastStaffStatus);
    const previous = this.lastStaffStatus;
    if (changed) {
      this.lastStaffStatus = current;
    }
    return { changed, previous, current };
  }

  public resetSeen() {
    this.seenKeys.clear();
    this.lastManagerStatus = null;
    this.lastStaffStatus = null;
  }
}

export const notificationServiceSingleton = NotificationDeduplicatorService.getInstance();

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, apiFetch } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccountsState>({
    managerAccount: null,
    staffAccount: null,
    residentAccount: null,
  });

  const isFirstLoadRef = useRef<boolean>(true);

  const pushToast = (title: string, message?: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { id: toastId, title, message, type, timestamp: Date.now() };

    setToasts(prev => {
      // Prevent duplicate toasts with same title within 3 seconds
      const existsRecent = prev.some(t => t.title === title && Date.now() - t.timestamp < 3000);
      if (existsRecent) return prev;
      return [newToast, ...prev].slice(0, 5); // Keep max 5 toasts
    });

    // Auto-dismiss after 4.5s
    setTimeout(() => {
      dismissToast(toastId);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setRegisteredAccounts({ managerAccount: null, staffAccount: null, residentAccount: null });
      notificationServiceSingleton.resetSeen();
      return;
    }

    const uEmail = (user.email || '').toLowerCase().trim();
    const uId = user.id || '';

    // 1. Fetch Registered Manager/Staff Accounts
    try {
      const regRes = await fetch(`/api/users/my-registered-accounts?email=${encodeURIComponent(uEmail)}&userId=${encodeURIComponent(uId)}`);
      if (regRes.ok) {
        const regData = await regRes.json();
        const mgrAccount = regData.managerAccount || null;
        const stfAccount = regData.staffAccount || null;

        // Check for Manager Status Transition
        if (mgrAccount) {
          const mgrCheck = notificationServiceSingleton.checkManagerStatusTransition(mgrAccount.status);
          if (mgrCheck.changed && !isFirstLoadRef.current) {
            const displayStat = mgrAccount.displayStatus || mgrAccount.status;
            if (String(mgrAccount.status).toLowerCase() === 'approved') {
              pushToast(`🎉 Manager Account Approved!`, `Your manager registration for ${mgrAccount.name} was approved by Admin.`, 'success');
            } else if (String(mgrAccount.status).toLowerCase() === 'rejected') {
              pushToast(`⚠️ Manager Registration Update`, `Your manager registration status: ${displayStat}.`, 'warning');
            }
          }
        }

        // Check for Staff Status Transition
        if (stfAccount) {
          const stfCheck = notificationServiceSingleton.checkStaffStatusTransition(stfAccount.status);
          if (stfCheck.changed && !isFirstLoadRef.current) {
            const displayStat = stfAccount.displayStatus || stfAccount.status;
            if (String(stfAccount.status).toLowerCase() === 'verified' || String(stfAccount.status).toLowerCase() === 'approved') {
              pushToast(`🎉 Staff Verification Approved!`, `Your staff profile & credentials have been verified by Admin.`, 'success');
            } else if (String(stfAccount.status).toLowerCase() === 'rejected') {
              pushToast(`⚠️ Staff Verification Update`, `Your staff verification status: ${displayStat}.`, 'warning');
            }
          }
        }

        setRegisteredAccounts({
          managerAccount: mgrAccount,
          staffAccount: stfAccount,
          residentAccount: regData.residentAccount || null,
        });
      }
    } catch (e) {
      console.warn("NotificationService: Error fetching registered accounts:", e);
    }

    // 2. Fetch Notifications list
    try {
      const notifs: NotificationItem[] = await apiFetch('/api/notifications').catch(() => []);
      if (Array.isArray(notifs)) {
        // Deduplicate notifications list
        const uniqueNotifs: NotificationItem[] = [];
        const seenMap = new Set<string>();

        for (const notif of notifs) {
          const key = `id_${notif.id}_key_${(notif.title || '').toLowerCase()}_${(notif.message || '').toLowerCase()}`;
          if (!seenMap.has(key)) {
            seenMap.add(key);
            uniqueNotifs.push(notif);

            // Fire live toast for brand new unread notifications (skip initial bulk load)
            if (!isFirstLoadRef.current && !notif.read && notificationServiceSingleton.shouldFireNotification(notif)) {
              pushToast(notif.title, notif.message, notif.type === 'success' ? 'success' : notif.type === 'warning' ? 'warning' : 'info');
            }
          }
        }

        setNotifications(uniqueNotifs);
      }
    } catch (e) {
      console.warn("NotificationService: Error fetching notifications:", e);
    } finally {
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.warn("Failed to mark notification as read:", e);
    }
  };

  // Centralized background real-time polling loop (every 2.5s)
  useEffect(() => {
    isFirstLoadRef.current = true;
    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 2500);

    return () => clearInterval(interval);
  }, [user?.id, user?.email]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        registeredAccounts,
        toasts,
        pushToast,
        dismissToast,
        markAsRead,
        refreshNotifications,
      }}
    >
      {children}
      <NotificationToastContainer toasts={toasts} dismissToast={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Global Toast UI Container
function NotificationToastContainer({ toasts, dismissToast }: { toasts: ToastItem[]; dismissToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 text-xs ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-50 shadow-emerald-950/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-50 shadow-amber-950/40'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-50 shadow-rose-950/40'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-100 shadow-slate-950/40'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'info' && <Bell className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 space-y-0.5">
              <h5 className="font-extrabold text-xs tracking-tight">{toast.title}</h5>
              {toast.message && (
                <p className="opacity-90 leading-relaxed font-medium">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
