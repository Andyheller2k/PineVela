import crypto from "crypto";
import { loadPersistentStore, savePersistentStore, PersistentStore } from "./persistentDb.js";

// Helper to generate UUIDs
export function generateUUID(): string {
  return crypto.randomUUID();
}

// Memory store initialized from disk
let memoryStore: PersistentStore | null = null;

export function getStoreInstance(defaults?: { hostels: any[]; users: any[] }): PersistentStore {
  return getStore(defaults);
}

export function getStore(defaults?: { hostels: any[]; users: any[] }): PersistentStore {
  if (!memoryStore) {
    const emptyDefault: PersistentStore = {
      hostels: defaults?.hostels || [],
      bookingRequests: [],
      issueReports: [],
      activities: [],
      hostelVerifications: [],
      managerRegistrationRequests: [],
      verificationAuditLogs: [],
      users: defaults?.users || [],
      notifications: [],
      chatMessages: [],
      dmRooms: [],
      chatProfiles: [],
      boardRequests: [],
      platformSettings: {
        registrationFee: 3500,
        commission: 5,
        announcement: 'Welcome to PineVela Academic Year 2026/2027.',
        maintenanceMode: false
      }
    };
    memoryStore = loadPersistentStore(emptyDefault);
  }
  return memoryStore;
}

export function persistStore(): void {
  if (memoryStore) {
    savePersistentStore(memoryStore);
  }
}

// 0. Settings
export async function dbGetSettings(): Promise<any> {
  const store = getStore();
  return store.platformSettings;
}

export async function dbUpdateSettings(settings: any): Promise<void> {
  const store = getStore();
  store.platformSettings = settings;
  persistStore();
}

// 1. Users / Profiles
export async function dbGetUsers(fallbackUsers?: any[], ..._args: any[]): Promise<any[]> {
  const store = getStore({ hostels: [], users: fallbackUsers || [] });
  if (!store.users || store.users.length === 0) {
    if (fallbackUsers && fallbackUsers.length > 0) {
      store.users = fallbackUsers;
      persistStore();
    }
  }
  return store.users || [];
}

export async function dbGetUserByEmailOrUsername(identifier: string, fallbackUsers?: any[], ..._args: any[]): Promise<any | null> {
  const users = await dbGetUsers(fallbackUsers);
  const normalized = (identifier || '').trim().toLowerCase();
  return users.find((u: any) => 
    (u.email && u.email.toLowerCase() === normalized) || 
    (u.username && u.username.toLowerCase() === normalized) ||
    (u.id && u.id.toLowerCase() === normalized)
  ) || null;
}

// 2. Hostels
export async function dbGetHostels(fallbackHostels?: any[], ..._args: any[]): Promise<any[]> {
  const store = getStore({ hostels: fallbackHostels || [], users: [] });
  if (!store.hostels || store.hostels.length === 0) {
    if (fallbackHostels && fallbackHostels.length > 0) {
      store.hostels = fallbackHostels;
      persistStore();
    }
  }
  return store.hostels || [];
}

export async function dbCreateHostel(hostelData: any, fallbackHostels?: any[], ..._args: any[]): Promise<any> {
  const store = getStore({ hostels: fallbackHostels || [], users: [] });
  const id = hostelData.id || generateUUID();
  const newHostel = {
    ...hostelData,
    id,
    registrationDate: hostelData.registrationDate || new Date().toISOString().split('T')[0],
    subscriptionPaid: true,
    isApproved: hostelData.isApproved ?? false,
    approvalStatus: hostelData.approvalStatus || 'Pending Approval'
  };
  
  // Replace or append
  const idx = store.hostels.findIndex((h: any) => h.id === id);
  if (idx >= 0) {
    store.hostels[idx] = newHostel;
  } else {
    store.hostels.unshift(newHostel);
  }
  persistStore();
  return newHostel;
}

export async function dbUpdateHostel(id: string, updates: any, fallbackHostels?: any[], ..._args: any[]): Promise<any> {
  const store = getStore({ hostels: fallbackHostels || [], users: [] });
  const idx = store.hostels.findIndex((h: any) => h.id === id);
  if (idx >= 0) {
    store.hostels[idx] = { ...store.hostels[idx], ...updates };
    persistStore();
    return store.hostels[idx];
  }
  const updated = { id, ...updates };
  store.hostels.push(updated);
  persistStore();
  return updated;
}

// 3. Booking Requests
export async function dbGetBookingRequests(fallbackRequests?: any[], ..._args: any[]): Promise<any[]> {
  const store = getStore();
  if (!store.bookingRequests || store.bookingRequests.length === 0) {
    if (fallbackRequests && fallbackRequests.length > 0) {
      store.bookingRequests = fallbackRequests;
      persistStore();
    }
  }
  return store.bookingRequests || [];
}

export async function dbCreateBookingRequest(reqData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  const id = reqData.id || `book-${Date.now()}`;
  const newReq = { ...reqData, id, createdAt: new Date().toISOString() };
  if (!store.bookingRequests) store.bookingRequests = [];
  store.bookingRequests.unshift(newReq);
  persistStore();
  return newReq;
}

export async function dbUpdateBookingRequest(id: string, status: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.bookingRequests) store.bookingRequests = [];
  const req = store.bookingRequests.find((b: any) => b.id === id);
  if (req) {
    req.status = status;
    persistStore();
    return req;
  }
  return { id, status };
}

// 4. Issue Reports
export async function dbGetIssueReports(fallbackIssues?: any[], ..._args: any[]): Promise<any[]> {
  const store = getStore();
  if (!store.issueReports || store.issueReports.length === 0) {
    if (fallbackIssues && fallbackIssues.length > 0) {
      store.issueReports = fallbackIssues;
      persistStore();
    }
  }
  return store.issueReports || [];
}

export async function dbCreateIssueReport(issueData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  const id = issueData.id || `issue-${Date.now()}`;
  const newIssue = { ...issueData, id, createdAt: new Date().toISOString() };
  if (!store.issueReports) store.issueReports = [];
  store.issueReports.unshift(newIssue);
  persistStore();
  return newIssue;
}

export async function dbUpdateIssueReport(id: string, updates: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.issueReports) store.issueReports = [];
  const issue = store.issueReports.find((i: any) => i.id === id);
  if (issue) {
    Object.assign(issue, updates);
    persistStore();
    return issue;
  }
  return { id, ...updates };
}

// 5. Staff
export async function dbGetStaff(hostelId?: string | any[], ..._args: any[]): Promise<any[]> {
  const store = getStore();
  const staffList = (store as any).staff || [];
  if (typeof hostelId === 'string') {
    return staffList.filter((s: any) => s.hostelId === hostelId);
  }
  return staffList;
}

export async function dbCreateStaff(staffData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!(store as any).staff) (store as any).staff = [];
  const newStaff = { ...staffData, id: staffData.id || `staff-${Date.now()}` };
  (store as any).staff.push(newStaff);
  persistStore();
  return newStaff;
}

export async function dbDeleteStaff(id: string, ..._args: any[]): Promise<boolean> {
  const store = getStore();
  if ((store as any).staff) {
    (store as any).staff = (store as any).staff.filter((s: any) => s.id !== id);
    persistStore();
  }
  return true;
}

// 6. Meetings
export async function dbGetMeetings(..._args: any[]): Promise<any[]> {
  const store = getStore();
  return (store as any).meetings || [];
}

export async function dbCreateMeeting(meetingData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!(store as any).meetings) (store as any).meetings = [];
  const newMeeting = { ...meetingData, id: meetingData.id || `meet-${Date.now()}` };
  (store as any).meetings.push(newMeeting);
  persistStore();
  return newMeeting;
}

export async function dbUpdateMeeting(id: string, updates: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if ((store as any).meetings) {
    const m = (store as any).meetings.find((item: any) => item.id === id);
    if (m) {
      Object.assign(m, updates);
      persistStore();
      return m;
    }
  }
  return { id, ...updates };
}

export async function dbDeleteMeeting(id: string, ..._args: any[]): Promise<boolean> {
  const store = getStore();
  if ((store as any).meetings) {
    const idx = (store as any).meetings.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      (store as any).meetings.splice(idx, 1);
      persistStore();
      return true;
    }
  }
  return false;
}

export async function dbGetManagerAccountSettings(managerId: string): Promise<any> {
  const store = getStore();
  if (!store.managerAccountSettings) store.managerAccountSettings = {};
  const existing = store.managerAccountSettings[managerId];
  if (existing) return existing;

  const defaults = {
    managerId,
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      maintenanceTicketAlerts: true,
      bookingApplicationAlerts: true,
      meetingRequestAlerts: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeoutMinutes: 60,
      requirePasswordForPayouts: true
    },
    meetingAvailability: {
      allowStudentBookings: true,
      allowStaffBookings: true,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      officeHoursStart: "09:00",
      officeHoursEnd: "17:00",
      slotDurationMinutes: 30,
      meetingModes: ["In-Person (Admin Office)", "Google Meet / Video", "Phone Call"],
      autoConfirmMeetings: false,
      officeLocation: "Hostel Admin Office (Room 101)"
    },
    emergencyContact: {
      contactName: "Facility Emergency Lead",
      contactPhone: "+233 24 000 0000",
      contactRelation: "Duty Supervisor"
    }
  };
  store.managerAccountSettings[managerId] = defaults;
  persistStore();
  return defaults;
}

export async function dbUpdateManagerAccountSettings(managerId: string, updates: any): Promise<any> {
  const store = getStore();
  if (!store.managerAccountSettings) store.managerAccountSettings = {};
  const current = await dbGetManagerAccountSettings(managerId);
  const updated = {
    ...current,
    ...updates,
    managerId,
    notifications: {
      ...(current.notifications || {}),
      ...(updates.notifications || {})
    },
    security: {
      ...(current.security || {}),
      ...(updates.security || {})
    },
    meetingAvailability: {
      ...(current.meetingAvailability || {}),
      ...(updates.meetingAvailability || {})
    },
    emergencyContact: {
      ...(current.emergencyContact || {}),
      ...(updates.emergencyContact || {})
    }
  };
  store.managerAccountSettings[managerId] = updated;
  persistStore();
  return updated;
}

// 7. Notifications
export async function dbGetNotifications(userId?: string | any[], ..._args: any[]): Promise<any[]> {
  const store = getStore();
  if (!store.notifications) store.notifications = [];
  if (typeof userId === 'string') {
    return store.notifications.filter((n: any) => n.userId === userId || !n.userId);
  }
  return store.notifications;
}

export async function dbCreateNotification(notifData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.notifications) store.notifications = [];
  const newNotif = { ...notifData, id: notifData.id || `notif-${Date.now()}`, isRead: false, createdAt: new Date().toISOString() };
  store.notifications.unshift(newNotif);
  persistStore();
  return newNotif;
}

export async function dbMarkNotificationRead(id: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (store.notifications) {
    const n = store.notifications.find((item: any) => item.id === id);
    if (n) {
      n.isRead = true;
      persistStore();
      return n;
    }
  }
  return { id, isRead: true };
}

// 8. Ratings
export async function dbGetRatings(hostelId?: string | any[], ..._args: any[]): Promise<any[]> {
  const store = getStore();
  const ratings = (store as any).ratings || [];
  if (typeof hostelId === 'string') {
    return ratings.filter((r: any) => r.hostelId === hostelId);
  }
  return ratings;
}

export async function dbCreateRating(ratingData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!(store as any).ratings) (store as any).ratings = [];
  const newRating = { ...ratingData, id: ratingData.id || `rating-${Date.now()}`, createdAt: new Date().toISOString() };
  (store as any).ratings.push(newRating);
  persistStore();
  return newRating;
}

// 9. Activities
export async function dbGetActivities(fallbackActivities?: any[], ..._args: any[]): Promise<any[]> {
  const store = getStore();
  if (!store.activities || store.activities.length === 0) {
    if (fallbackActivities && fallbackActivities.length > 0) {
      store.activities = fallbackActivities;
      persistStore();
    }
  }
  return store.activities || [];
}

export async function dbCreateActivity(activityData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.activities) store.activities = [];
  const newAct = { ...activityData, id: activityData.id || `act-${Date.now()}`, timestamp: activityData.timestamp || 'Just now' };
  store.activities.unshift(newAct);
  persistStore();
  return newAct;
}

// 10. Chat Profiles
export async function dbGetChatProfile(userId: string, ..._args: any[]): Promise<any | null> {
  const store = getStore();
  if (!store.chatProfiles) store.chatProfiles = [];
  return store.chatProfiles.find((p: any) => p.userId === userId) || null;
}

export async function dbUpdateChatProfile(userId: string, profileData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.chatProfiles) store.chatProfiles = [];
  const idx = store.chatProfiles.findIndex((p: any) => p.userId === userId);
  const updated = { userId, ...profileData, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    store.chatProfiles[idx] = { ...store.chatProfiles[idx], ...updated };
  } else {
    store.chatProfiles.push(updated);
  }
  persistStore();
  return updated;
}

// 11. Chat Messages
export async function dbGetChatMessages(roomId?: string, ..._args: any[]): Promise<any[]> {
  const store = getStore();
  if (!store.chatMessages) store.chatMessages = [];
  if (roomId) {
    return store.chatMessages.filter((m: any) => m.roomId === roomId);
  }
  return store.chatMessages;
}

export async function dbCreateChatMessage(msgData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.chatMessages) store.chatMessages = [];
  const newMsg = { ...msgData, id: msgData.id || `msg-${Date.now()}`, createdAt: new Date().toISOString() };
  store.chatMessages.push(newMsg);
  persistStore();
  return newMsg;
}

export async function dbReactToChatMessage(msgId: string, emoji: string, userId?: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (store.chatMessages) {
    const msg = store.chatMessages.find((m: any) => m.id === msgId);
    if (msg) {
      if (!msg.reactions) msg.reactions = [];
      msg.reactions.push({ emoji, userId, timestamp: new Date().toISOString() });
      persistStore();
      return msg;
    }
  }
  return { id: msgId, emoji, userId };
}

// 12. DM Rooms
export async function dbGetDMRooms(userId?: string, ..._args: any[]): Promise<any[]> {
  const store = getStore();
  if (!store.dmRooms) store.dmRooms = [];
  if (userId) {
    return store.dmRooms.filter((r: any) => r.senderId === userId || r.receiverId === userId);
  }
  return store.dmRooms;
}

export async function dbCreateDMRoom(roomData: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.dmRooms) store.dmRooms = [];
  const newRoom = { ...roomData, id: roomData.id || `dm-${Date.now()}`, status: roomData.status || 'pending', createdAt: new Date().toISOString() };
  store.dmRooms.push(newRoom);
  persistStore();
  return newRoom;
}

export async function dbAcceptDMRoom(roomId: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (store.dmRooms) {
    const room = store.dmRooms.find((r: any) => r.id === roomId);
    if (room) {
      room.status = 'accepted';
      persistStore();
      return room;
    }
  }
  return { id: roomId, status: 'accepted' };
}

// 13. Atomic Hostel Registration
export async function dbRegisterHostelAtomic(registrationPayload: any, fallbackHostels?: any[], ..._args: any[]): Promise<any> {
  const store = getStore({ hostels: fallbackHostels || [], users: [] });
  const hostelId = registrationPayload.hostelId || registrationPayload.id || generateUUID();
  
  const resolvedName = registrationPayload.name || registrationPayload.hostelName || 'Registered Hostel';
  const resolvedImage = registrationPayload.imageUrl || registrationPayload.image || registrationPayload.exteriorPhotoUrl || registrationPayload.imagePreviewUrl || (Array.isArray(registrationPayload.images) && registrationPayload.images[0]) || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80';
  const resolvedLocation = registrationPayload.location || (registrationPayload.addressLine1 ? `${registrationPayload.addressLine1}, ${registrationPayload.city || 'Accra'}` : (registrationPayload.address || registrationPayload.city || 'Accra, Ghana'));
  const resolvedPrice = Number(registrationPayload.price || registrationPayload.pricing?.defaultFee || registrationPayload.pricingTiers?.[0]?.price || 3500);
  const resolvedCapacity = Number(registrationPayload.maximumCapacity || registrationPayload.totalCapacity || registrationPayload.totalBeds || 100);
  const resolvedManagerPhoto = registrationPayload.managerPhoto || registrationPayload.managerAvatar || registrationPayload.avatar || registrationPayload.photo || '';

  const hostelRecord = {
    id: hostelId,
    name: resolvedName,
    location: resolvedLocation,
    wing: registrationPayload.wing || (registrationPayload.blocksList?.[0]?.name ? registrationPayload.blocksList[0].name : 'North Wing'),
    status: registrationPayload.status || 'Pending Approval',
    bedsLeft: resolvedCapacity,
    totalCapacity: resolvedCapacity,
    availableSpaces: resolvedCapacity,
    price: resolvedPrice,
    image: resolvedImage,
    imageUrl: resolvedImage,
    exteriorPhotoUrl: resolvedImage,
    imagePreviewUrl: resolvedImage,
    managerName: registrationPayload.managerName || 'Property Manager',
    managerPhone: registrationPayload.managerPhone || '+233 24 000 0000',
    managerEmail: registrationPayload.managerEmail || '',
    managerPhoto: resolvedManagerPhoto,
    managerId: registrationPayload.managerId || registrationPayload.assignedManagerId,
    description: registrationPayload.description || 'Hostel property profile and configurations.',
    rating: 5.0,
    registrationDate: new Date().toISOString().split('T')[0],
    subscriptionPaid: true,
    isApproved: Boolean(registrationPayload.isApproved),
    approvalStatus: registrationPayload.approvalStatus || (registrationPayload.isApproved ? 'Approved' : 'Pending Approval'),
    blocksList: registrationPayload.blocksList || [],
    pricingTiers: registrationPayload.pricingTiers || [],
    facilities: registrationPayload.facilities || [],
    amenities: registrationPayload.facilities || registrationPayload.amenities || [],
    campusProximity: registrationPayload.campusProximity || '5-10 Mins Walk',
    campusProximityDetails: registrationPayload.campusProximityDetails || 'Shuttle & walking routes',
    hostel_type: registrationPayload.hostelType || registrationPayload.hostel_type || 'Hostel'
  };

  const existingIdx = store.hostels.findIndex((h: any) => h.id === hostelId || (h.managerEmail && registrationPayload.managerEmail && h.managerEmail.toLowerCase() === registrationPayload.managerEmail.toLowerCase()));
  if (existingIdx >= 0) {
    store.hostels[existingIdx] = hostelRecord;
  } else {
    store.hostels.unshift(hostelRecord);
  }

  // Create verification entry
  const verifRecord = {
    id: `verif-${hostelId}`,
    hostelId,
    hostelName: hostelRecord.name,
    managerName: hostelRecord.managerName,
    managerEmail: hostelRecord.managerEmail,
    managerPhone: hostelRecord.managerPhone,
    managerPhoto: hostelRecord.managerPhoto,
    imageUrl: hostelRecord.imageUrl,
    image: hostelRecord.image,
    price: hostelRecord.price,
    location: hostelRecord.location,
    totalCapacity: hostelRecord.totalCapacity,
    status: hostelRecord.isApproved ? 'Approved' : 'Pending Approval',
    submittedAt: new Date().toISOString()
  };
  if (!store.hostelVerifications) store.hostelVerifications = [];
  store.hostelVerifications.unshift(verifRecord);

  persistStore();
  return { hostel: hostelRecord, verification: verifRecord };
}

export async function dbCleanupPlaceholderHostels(fallbackHostels?: any[], ..._args: any[]): Promise<void> {
  const store = getStore({ hostels: fallbackHostels || [], users: [] });
  // Ensure invalid or blank entries are pruned
  if (Array.isArray(store.hostels)) {
    store.hostels = store.hostels.filter((h: any) => h && h.name);
    persistStore();
  }
}

// 14. Manager Requests & Profiles
export async function dbSaveManagerProfile(profile: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!(store as any).managerProfiles) (store as any).managerProfiles = [];
  const idx = (store as any).managerProfiles.findIndex((p: any) => p.email === profile.email);
  if (idx >= 0) {
    (store as any).managerProfiles[idx] = { ...(store as any).managerProfiles[idx], ...profile };
  } else {
    (store as any).managerProfiles.push(profile);
  }
  persistStore();
  return profile;
}

export async function dbGetManagerRequests(..._args: any[]): Promise<any[]> {
  const store = getStore();
  const list = store.managerRegistrationRequests || [];
  const seenIds = new Set<string>();
  const uniqueList: any[] = [];
  for (const item of list) {
    if (item && item.id) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        uniqueList.push(item);
      }
    }
  }
  return uniqueList;
}

export async function dbCreateManagerRequest(req: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.managerRegistrationRequests) store.managerRegistrationRequests = [];
  const id = req.id || `mreq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newReq = { ...req, id, submittedAt: req.submittedAt || new Date().toISOString() };
  
  // Replace if exists, else unshift
  const existingIdx = store.managerRegistrationRequests.findIndex((m: any) => m.id === id || (req.managerId && m.managerId === req.managerId));
  if (existingIdx >= 0) {
    store.managerRegistrationRequests[existingIdx] = { ...store.managerRegistrationRequests[existingIdx], ...newReq };
  } else {
    store.managerRegistrationRequests.unshift(newReq);
  }
  persistStore();
  return newReq;
}

export async function dbUpdateManagerRequestStatus(id: string, status: string, notes?: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  const req = store.managerRegistrationRequests.find((m: any) => m.id === id);
  if (req) {
    req.status = status;
    req.adminNotes = notes;
    persistStore();
    return req;
  }
  return { id, status, notes };
}

// 15. Manager & Hostel Verifications
export async function dbGetManagerVerifications(..._args: any[]): Promise<any[]> {
  const store = getStore();
  return (store as any).managerVerifications || [];
}

export async function dbCreateManagerVerification(verif: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!(store as any).managerVerifications) (store as any).managerVerifications = [];
  const newVerif = { ...verif, id: verif.id || `mverif-${Date.now()}`, createdAt: new Date().toISOString() };
  (store as any).managerVerifications.unshift(newVerif);
  persistStore();
  return newVerif;
}

export async function dbUpdateManagerVerificationStatus(id: string, status: string, notes?: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  const list = (store as any).managerVerifications || [];
  const rec = list.find((m: any) => m.id === id);
  if (rec) {
    rec.status = status;
    rec.adminNotes = notes;
    persistStore();
    return rec;
  }
  return { id, status, notes };
}

export async function dbGetHostelVerifications(..._args: any[]): Promise<any[]> {
  const store = getStore();
  return store.hostelVerifications || [];
}

export async function dbCreateHostelVerification(verif: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.hostelVerifications) store.hostelVerifications = [];
  const newVerif = { ...verif, id: verif.id || `hverif-${Date.now()}`, submittedAt: new Date().toISOString() };
  store.hostelVerifications.unshift(newVerif);
  persistStore();
  return newVerif;
}

export async function dbUpdateHostelVerificationStatus(id: string, status: string, notes?: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  const rec = store.hostelVerifications.find((h: any) => h.id === id || h.hostelId === id);
  if (rec) {
    rec.status = status;
    rec.adminNotes = notes;
    persistStore();
    return rec;
  }
  return { id, status, notes };
}

// Helper for users array saving
export async function dbSaveUsers(users: any[]): Promise<any[]> {
  const store = getStore();
  store.users = users;
  persistStore();
  return store.users;
}

export async function dbCreateVerificationAuditLog(log: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!store.verificationAuditLogs) store.verificationAuditLogs = [];
  const newLog = { ...log, id: log.id || `audit-${Date.now()}`, createdAt: new Date().toISOString() };
  store.verificationAuditLogs.unshift(newLog);
  persistStore();
  return newLog;
}

export async function dbGetVerificationAuditLogs(..._args: any[]): Promise<any[]> {
  const store = getStore();
  return store.verificationAuditLogs || [];
}

export async function dbCreateOnboardingPayment(payment: any, ..._args: any[]): Promise<any> {
  const store = getStore();
  if (!(store as any).onboardingPayments) (store as any).onboardingPayments = [];
  const newPayment = { ...payment, id: payment.id || `pay-${Date.now()}`, timestamp: new Date().toISOString() };
  (store as any).onboardingPayments.unshift(newPayment);
  persistStore();
  return newPayment;
}

export async function dbAssignHostelManager(hostelId: string, managerId: string, managerName?: string, managerEmail?: string, managerPhone?: string, ..._args: any[]): Promise<any> {
  const store = getStore();
  const hostel = store.hostels.find((h: any) => h.id === hostelId);
  if (hostel) {
    hostel.managerId = managerId;
    if (managerName) hostel.managerName = managerName;
    if (managerEmail) hostel.managerEmail = managerEmail;
    if (managerPhone) hostel.managerPhone = managerPhone;
    persistStore();
    return hostel;
  }
  return { id: hostelId, managerId };
}

export async function dbDeleteHostel(id: string): Promise<boolean> {
  const store = getStore();
  const initialLen = store.hostels.length;
  store.hostels = store.hostels.filter((h: any) => h.id !== id);
  persistStore();
  return store.hostels.length < initialLen;
}

export async function dbGetBoardRequests(): Promise<any[]> {
  const store = getStore();
  if (!store.boardRequests) store.boardRequests = [];
  return store.boardRequests;
}

export async function dbCreateBoardRequest(requestData: any): Promise<any> {
  const store = getStore();
  if (!store.boardRequests) store.boardRequests = [];
  const newReq = {
    id: requestData.id || `req-board-${Date.now()}`,
    managerId: requestData.managerId || '',
    managerName: requestData.managerName || 'Resident Manager',
    managerEmail: requestData.managerEmail || '',
    managerPhone: requestData.managerPhone || '+233 24 123 4567',
    managerPhoto: requestData.managerPhoto || '',
    hostelName: requestData.hostelName || 'Registered Property',
    category: requestData.category || 'General Inquiry',
    priority: requestData.priority || 'Normal',
    subject: requestData.subject || 'Manager Operational Request',
    message: requestData.message || '',
    status: requestData.status || 'Pending',
    adminNotes: requestData.adminNotes || '',
    createdAt: new Date().toISOString()
  };
  store.boardRequests.unshift(newReq);
  persistStore();
  return newReq;
}

export async function dbUpdateBoardRequest(id: string, updates: any): Promise<any> {
  const store = getStore();
  if (!store.boardRequests) store.boardRequests = [];
  const idx = store.boardRequests.findIndex((r: any) => r.id === id);
  if (idx >= 0) {
    store.boardRequests[idx] = {
      ...store.boardRequests[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    persistStore();
    return store.boardRequests[idx];
  }
  return null;
}

