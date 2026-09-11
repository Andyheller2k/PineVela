import fs from 'fs';
import path from 'path';

export interface PersistentStore {
  hostels: any[];
  bookingRequests: any[];
  issueReports: any[];
  activities: any[];
  hostelVerifications: any[];
  managerRegistrationRequests: any[];
  verificationAuditLogs: any[];
  users: any[];
  notifications: any[];
  chatMessages: any[];
  dmRooms: any[];
  chatProfiles: any[];
  platformSettings: {
    registrationFee: number;
    commission: number;
    announcement: string;
    maintenanceMode: boolean;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'pinevela_store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load persistent store from disk or initialize with defaults
 */
export function loadPersistentStore(defaultStore: PersistentStore): PersistentStore {
  ensureDataDir();

  if (!fs.existsSync(STORE_PATH)) {
    try {
      savePersistentStore(defaultStore);
      console.log('[PineVela Database] Initialized local persistent store at:', STORE_PATH);
      return defaultStore;
    } catch (err) {
      console.error('[PineVela Database] Failed to initialize persistent store:', err);
      return defaultStore;
    }
  }

  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    
    const result: PersistentStore = {
      hostels: Array.isArray(parsed.hostels) ? parsed.hostels : defaultStore.hostels,
      bookingRequests: Array.isArray(parsed.bookingRequests) ? parsed.bookingRequests : defaultStore.bookingRequests,
      issueReports: Array.isArray(parsed.issueReports) ? parsed.issueReports : defaultStore.issueReports,
      activities: Array.isArray(parsed.activities) ? parsed.activities : defaultStore.activities,
      hostelVerifications: Array.isArray(parsed.hostelVerifications) ? parsed.hostelVerifications : defaultStore.hostelVerifications,
      managerRegistrationRequests: Array.isArray(parsed.managerRegistrationRequests) ? parsed.managerRegistrationRequests : defaultStore.managerRegistrationRequests,
      verificationAuditLogs: Array.isArray(parsed.verificationAuditLogs) ? parsed.verificationAuditLogs : defaultStore.verificationAuditLogs,
      users: Array.isArray(parsed.users) ? parsed.users : defaultStore.users,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : defaultStore.notifications,
      chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages : defaultStore.chatMessages,
      dmRooms: Array.isArray(parsed.dmRooms) ? parsed.dmRooms : defaultStore.dmRooms,
      chatProfiles: Array.isArray(parsed.chatProfiles) ? parsed.chatProfiles : defaultStore.chatProfiles,
      platformSettings: parsed.platformSettings || defaultStore.platformSettings,
    };

    console.log(`[PineVela Database] Loaded persistent store: ${result.hostels.length} hostels, ${result.users.length} users, ${result.hostelVerifications.length} verifications`);
    return result;
  } catch (err) {
    console.error('[PineVela Database] Error reading persistent store, falling back to defaults:', err);
    return defaultStore;
  }
}

/**
 * Atomically save persistent store to disk
 */
export function savePersistentStore(store: PersistentStore): void {
  ensureDataDir();
  const tmpPath = `${STORE_PATH}.tmp.${Date.now()}`;
  try {
    const jsonStr = JSON.stringify(store, null, 2);
    fs.writeFileSync(tmpPath, jsonStr, 'utf8');
    fs.renameSync(tmpPath, STORE_PATH);
  } catch (err) {
    console.error('[PineVela Database] Failed to write persistent store:', err);
    try {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    } catch {
      // ignore
    }
  }
}
