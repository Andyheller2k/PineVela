import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  getSupabase,
  dbGetUsers,
  dbGetUserByEmailOrUsername,
  dbGetHostels,
  dbCreateHostel,
  dbUpdateHostel,
  dbGetBookingRequests,
  dbCreateBookingRequest,
  dbUpdateBookingRequest,
  dbGetIssueReports,
  dbCreateIssueReport,
  dbUpdateIssueReport,
  dbGetStaff,
  dbCreateStaff,
  dbDeleteStaff,
  dbGetMeetings,
  dbCreateMeeting,
  dbUpdateMeeting,
  dbGetNotifications,
  dbCreateNotification,
  dbMarkNotificationRead,
  dbGetRatings,
  dbCreateRating,
  dbGetActivities,
  dbCreateActivity
} from "./supabaseServer.js";

// Initial datasets for our stateful backend
const initialHostels = [
  {
    id: 'hostel-1',
    name: 'Pine Crest Residency',
    location: 'North Campus, Sector 5',
    wing: 'North Wing',
    status: 'Open',
    bedsLeft: 12,
    totalCapacity: 120,
    availableSpaces: 12,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    managerName: 'Sarah Johnson',
    managerPhone: '+23324488923',
    managerEmail: 'sarah.j@pinevela.com',
    description: 'A beautiful and serene student residential community featuring modern air-conditioned master suites, standard shared rooms, free shuttle transport, high-speed fiber-optic WiFi, and a 24/7 learning library.',
    rating: 4.8,
    registrationDate: '2026-01-15',
    subscriptionPaid: true
  },
  {
    id: 'hostel-2',
    name: 'Emerald Heights Block A',
    location: 'Main Campus, East Wing',
    wing: 'North Wing',
    status: 'Full',
    bedsLeft: 0,
    totalCapacity: 180,
    availableSpaces: 0,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    managerName: 'Maxwell Mensah',
    managerPhone: '+23350299882',
    managerEmail: 'maxwell.m@pinevela.com',
    description: 'Located in the premium core zone of the campus, Emerald Heights offers direct walking paths to major lecture halls, high-security smart access gates, indoor game arenas, and spacious study halls.',
    rating: 4.6,
    registrationDate: '2026-02-10',
    subscriptionPaid: true
  },
  {
    id: 'hostel-3',
    name: 'Sapphire Gardens',
    location: 'West Campus, Block B',
    wing: 'South Side',
    status: 'Open',
    bedsLeft: 28,
    totalCapacity: 250,
    availableSpaces: 28,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    managerName: 'David Kojo',
    managerPhone: '+23324599812',
    managerEmail: 'david.k@pinevela.com',
    description: 'Known for its scenic garden landscaping, Sapphire Gardens offers spacious single and dual-occupancy options, student kitchenettes on every floor, modern sports fields, and a standby power generator.',
    rating: 4.9,
    registrationDate: '2026-03-01',
    subscriptionPaid: true
  },
  {
    id: 'hostel-4',
    name: 'Pine Ridge Annex',
    location: 'South Campus, Sector 9',
    wing: 'South Side',
    status: 'Under Maintenance',
    bedsLeft: 4,
    totalCapacity: 80,
    availableSpaces: 4,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    managerName: 'Ebenezer Amankwah',
    managerPhone: '+23320188992',
    managerEmail: 'ebenezer.a@pinevela.com',
    description: 'An elegant cottage-style annex block providing quiet, focused living. Perfect for postgraduate students or those seeking a peaceful academic retreat away from noisy campus activities.',
    rating: 4.2,
    registrationDate: '2026-03-24',
    subscriptionPaid: false
  }
];

const initialBookingRequests = [
  {
    id: 'book-1',
    studentName: 'Sarah Connor',
    studentId: 'STU-882',
    roomType: 'Superior Suite',
    hostelName: 'Emerald Heights Block A',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    status: 'Pending'
  },
  {
    id: 'book-2',
    studentName: 'Marcus Wright',
    studentId: 'STU-102',
    roomType: 'Standard Twin',
    hostelName: 'Emerald Heights Block A',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    status: 'Pending'
  },
  {
    id: 'book-3',
    studentName: 'Kyle Reese',
    studentId: 'STU-994',
    roomType: 'Emerald Single',
    hostelName: 'Emerald Heights Block A',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    status: 'Pending'
  }
];

const initialIssueReports = [
  {
    id: 'issue-1',
    title: 'Leaking Pipe in Washroom',
    category: 'Plumbing',
    urgency: 'High',
    description: 'The main water supply pipe in the Block B washroom has a steady leak, flooding the second stall corridor.',
    photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'],
    contactMethod: 'In-app Notification',
    studentName: 'Sarah Connor',
    studentId: 'STU-882',
    hostelName: 'Pine Crest Residency',
    blockFloor: 'Block B, 4th Floor',
    roomBed: 'Room 402, Bed A',
    status: 'Pending',
    date: '2026-06-28'
  },
  {
    id: 'issue-2',
    title: 'AC Unit Not Cooling',
    category: 'Electrical',
    urgency: 'Medium',
    description: 'The air conditioner in room 302 runs but only blows warm air, making studying during daytime very difficult.',
    photos: [],
    contactMethod: 'Email',
    studentName: 'David K.',
    studentId: 'STU-2024-1024',
    hostelName: 'Sapphire Gardens',
    blockFloor: 'West Wing, 3rd Floor',
    roomBed: 'Room 302, Bed B',
    status: 'Pending',
    date: '2026-06-27'
  }
];

const initialActivities = [
  {
    id: 'act-1',
    text: 'Maintenance Task #T-992 marked as resolved.',
    time: '12 mins ago',
    type: 'success'
  },
  {
    id: 'act-2',
    text: 'New manager added to Sapphire Gardens.',
    time: '1 hour ago',
    type: 'info'
  },
  {
    id: 'act-3',
    text: "Emerald Heights Block B status changed to 'Maintenance'.",
    time: '4 hours ago',
    type: 'warning'
  },
  {
    id: 'act-4',
    text: 'Low occupancy alert triggered for Ivory Towers.',
    time: 'Yesterday',
    type: 'danger'
  }
];

// Backend state containers
let hostels = [...initialHostels];
let bookingRequests = [...initialBookingRequests];
let issueReports = [...initialIssueReports];
let activities = [...initialActivities];

const initialStaff = [
  {
    id: 'staff-1',
    name: 'John Doe',
    role: 'Plumber',
    phone: '+23324123456',
    contactMethod: 'WhatsApp',
    email: 'john.doe@pinevela.com',
    hostelId: 'hostel-1'
  },
  {
    id: 'staff-2',
    name: 'Jane Smith',
    role: 'Electrician',
    phone: '+23324123457',
    contactMethod: 'Email',
    email: 'jane.smith@pinevela.com',
    hostelId: 'hostel-1'
  }
];
let staff = [...initialStaff];

// Chat state containers
let chatProfiles: any[] = [
  {
    studentId: 'student_882',
    nickname: 'Sarah (Resilience)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    studentId: 'student_102',
    nickname: 'Marcus the Techie',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
  },
  {
    studentId: 'student_994',
    nickname: 'Kyle R.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  }
];

let dmRooms: any[] = [
  {
    id: 'room-marcus-sarah',
    user1Id: 'student_102', // Marcus
    user2Id: 'student_882', // Sarah
    status: 'pending', // Awaiting Sarah's acceptance
    createdAt: new Date().toISOString()
  },
  {
    id: 'room-kyle-sarah',
    user1Id: 'student_994', // Kyle
    user2Id: 'student_882', // Sarah
    status: 'accepted', // Accepted! They can chat
    createdAt: new Date().toISOString()
  }
];

let chatMessages: any[] = [
  // Global chat seeds
  {
    id: 'msg-g1',
    channelType: 'global',
    channelId: 'global',
    senderId: 'student_882',
    senderName: 'Sarah (Resilience)',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    messageType: 'text',
    content: 'Hey everyone! Welcome to the PineVela student lounge. How is the study hall in your block?',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'msg-g2',
    channelType: 'global',
    channelId: 'global',
    senderId: 'student_102',
    senderName: 'Marcus the Techie',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    messageType: 'text',
    content: 'It is pretty quiet here in Emerald Heights. The AC is working fine.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  // Hostel chat seeds (hostel-1: Pine Crest Residency)
  {
    id: 'msg-h1',
    channelType: 'hostel',
    channelId: 'hostel-1',
    senderId: 'student_882',
    senderName: 'Sarah (Resilience)',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    messageType: 'text',
    content: 'Hello neighbors! Has anyone seen the warden? Need to ask about parking slots.',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'msg-h2',
    channelType: 'hostel',
    channelId: 'hostel-1',
    senderId: 'manager_101', // Hostel Manager acts as admin
    senderName: 'Anthony Davis (Manager)',
    senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    messageType: 'text',
    content: 'Hello Sarah, parking registration can be done at the desk. I will be in my office from 9 AM.',
    createdAt: new Date(Date.now() - 3600000 * 3.8).toISOString()
  },
  // DM seeds (Kyle & Sarah)
  {
    id: 'msg-d1',
    channelType: 'dm',
    channelId: 'room-kyle-sarah',
    senderId: 'student_994',
    senderName: 'Kyle R.',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    messageType: 'text',
    content: 'Hey Sarah, do you have the notes for the Operating Systems lecture?',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg-d2',
    channelType: 'dm',
    channelId: 'room-kyle-sarah',
    senderId: 'student_882',
    senderName: 'Sarah (Resilience)',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    messageType: 'text',
    content: 'Sure! I will upload the PDF to our chat here in a second.',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

let meetings = [
  {
    id: 'meet-1',
    studentId: 'STU-2024-8842',
    studentName: 'Alex Thompson',
    hostelName: 'Pine Crest Residency',
    type: 'In-Person',
    date: '2026-06-30',
    time: '14:00',
    reason: 'Discuss room double occupancy guidelines and rules.',
    status: 'Pending'
  },
  {
    id: 'meet-2',
    studentId: 'STU-2024-8842',
    studentName: 'Alex Thompson',
    hostelName: 'Pine Crest Residency',
    type: 'Video Call',
    date: '2026-06-25',
    time: '10:30',
    reason: 'Pre-checkin query about high speed internet access.',
    status: 'Approved'
  }
];

let notifications = [
  {
    id: 'notif-1',
    studentId: 'STU-2024-8842',
    title: 'Welcome to PineVela Residencies',
    message: 'Your room assignment in Starlight Residency has been successfully activated. Use your digital key to unlock.',
    type: 'success',
    date: '2026-06-28',
    read: false
  },
  {
    id: 'notif-2',
    studentId: 'STU-2024-8842',
    title: 'Pre-checkin Meeting Approved',
    message: 'Your pre-checkin video call meeting scheduled for 2026-06-25 at 10:30 has been Approved.',
    type: 'info',
    date: '2026-06-24',
    read: true
  }
];

let ratings = [
  {
    id: 'rate-1',
    studentId: 'STU-2024-8842',
    studentName: 'Alex Thompson',
    hostelId: 'hostel-1',
    hostelName: 'Pine Crest Residency',
    score: 5,
    review: 'Clean rooms, fast WiFi, and highly responsive support staff!',
    date: '2026-06-27'
  }
];

// Predefined mock users
const MOCK_USERS = [
  {
    email: 'student@pinevela.com',
    username: 'student',
    password: 'student123',
    user: {
      id: 'student_882',
      name: 'Sarah Connor',
      role: 'student',
      token: 'token_student_882'
    }
  },
  {
    email: 'student2@pinevela.com',
    username: 'marcus',
    password: 'student123',
    user: {
      id: 'student_102',
      name: 'Marcus Wright',
      role: 'student',
      token: 'token_student_102'
    }
  },
  {
    email: 'student3@pinevela.com',
    username: 'kyle',
    password: 'student123',
    user: {
      id: 'student_994',
      name: 'Kyle Reese',
      role: 'student',
      token: 'token_student_994'
    }
  },
  {
    email: 'manager@pinevela.com',
    username: 'manager',
    password: 'manager123',
    user: {
      id: 'manager_101',
      name: 'Anthony Davis',
      role: 'manager',
      token: 'token_manager_101'
    }
  },
  {
    email: 'admin@pinevela.com',
    username: 'admin',
    password: 'admin123',
    user: {
      id: 'admin_001',
      name: 'System Administrator',
      role: 'admin',
      token: 'token_admin_001'
    }
  },
  {
    email: 'staff@pinevela.com',
    username: 'staff',
    password: 'staff123',
    user: {
      id: 'staff-1',
      name: 'John Doe (Plumber)',
      role: 'staff',
      token: 'token_staff_201'
    }
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware: Input Sanitization (XSS mitigation for request bodies)
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizeString = (str: string): string => {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#x27;")
          .replace(/\//g, "&#x2F;");
      };

      const sanitizeObject = (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      };
      
      sanitizeObject(req.body);
    }
    next();
  });

  // Middleware: Request Logger
  app.use((req, res, next) => {
    console.log(`[API ${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: "Username/Email and Password are required" });
    }

    const matched = await dbGetUserByEmailOrUsername(usernameOrEmail, MOCK_USERS);

    if (!matched || matched.password !== password) {
      return res.status(401).json({ error: "Invalid username/email or password" });
    }

    return res.json(matched.user);
  });

  // Authentication validation middleware
  function requireAuth(allowedRoles?: ("student" | "manager" | "admin" | "staff")[]) {
    return async (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access Denied: No token provided' });
      }
      const token = authHeader.split(' ')[1];
      
      const allUsers = await dbGetUsers(MOCK_USERS);
      const foundUser = allUsers.find(u => u.token === token || (u.user && u.user.token === token));
      if (!foundUser) {
        return res.status(401).json({ error: 'Access Denied: Invalid session token' });
      }

      const user = foundUser.user || {
        id: foundUser.id,
        name: foundUser.name,
        role: foundUser.role,
        token: foundUser.token
      };
      
      if (allowedRoles && !allowedRoles.includes(user.role as any)) {
        return res.status(403).json({ error: `Access Denied: Unauthorized role "${user.role}"` });
      }

      req.user = user;
      next();
    };
  }

  // Get current session profile
  app.get("/api/auth/me", requireAuth(), (req: any, res) => {
    res.json(req.user);
  });

  // --- Public/Protected Hostels Endpoints ---
  app.get("/api/hostels", async (req, res) => {
    const list = await dbGetHostels(hostels);
    res.json(list);
  });

  app.post("/api/hostels", requireAuth(["admin"]), async (req: any, res) => {
    const newHostel = {
      id: `hostel-new-${Date.now()}`,
      rating: 4.5,
      bedsLeft: Number(req.body.availableSpaces || req.body.bedsLeft || 0),
      totalCapacity: Number(req.body.totalCapacity || 100),
      availableSpaces: Number(req.body.availableSpaces || 0),
      subscriptionPaid: true,
      registrationDate: new Date().toISOString().split('T')[0],
      ...req.body
    };
    const saved = await dbCreateHostel(newHostel, hostels);
    await dbCreateActivity({
      id: `act-new-${Date.now()}`,
      text: `Admin registered new property: "${saved.name}"`,
      time: 'Just now',
      type: 'success'
    }, activities);
    res.status(201).json(saved);
  });

  app.put("/api/hostels/:id", requireAuth(["admin", "manager"]), async (req: any, res) => {
    const { id } = req.params;
    const list = await dbGetHostels(hostels);
    const index = list.findIndex(h => h.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Hostel not found" });
    }
    const updated = await dbUpdateHostel(id, req.body, hostels);
    res.json(updated);
  });

  // --- Protected Booking Requests Endpoints ---
  app.get("/api/booking-requests", requireAuth(["admin", "manager"]), async (req, res) => {
    const list = await dbGetBookingRequests(bookingRequests);
    res.json(list);
  });

  app.post("/api/booking-requests", requireAuth(["student"]), async (req: any, res) => {
    const newRequest = {
      id: `book-new-${Date.now()}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      status: 'Pending',
      ...req.body
    };
    const saved = await dbCreateBookingRequest(newRequest, bookingRequests);
    await dbCreateActivity({
      id: `act-new-${Date.now()}`,
      text: `Booking request filed by ${saved.studentName} for ${saved.hostelName}`,
      time: 'Just now',
      type: 'info'
    }, activities);
    res.status(201).json(saved);
  });

  app.put("/api/booking-requests/:id", requireAuth(["admin", "manager"]), async (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const list = await dbGetBookingRequests(bookingRequests);
    const reqIndex = list.findIndex(r => r.id === id);
    if (reqIndex === -1) {
      return res.status(404).json({ error: "Booking request not found" });
    }
    const updated = await dbUpdateBookingRequest(id, status, bookingRequests);
    res.json(updated);
  });

  // --- Protected Issue Reports Endpoints ---
  app.get("/api/issue-reports", requireAuth(), async (req, res) => {
    const list = await dbGetIssueReports(issueReports);
    res.json(list);
  });

  app.post("/api/issue-reports", requireAuth(["student"]), async (req: any, res) => {
    const newIssue = {
      id: `issue-new-${Date.now()}`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      ...req.body
    };
    const saved = await dbCreateIssueReport(newIssue, issueReports);
    await dbCreateActivity({
      id: `act-new-${Date.now()}`,
      text: `Maintenance report filed: "${saved.title}"`,
      time: 'Just now',
      type: saved.urgency === 'High' ? 'danger' : 'warning'
    }, activities);
    res.status(201).json(saved);
  });

  app.put("/api/issue-reports/:id", requireAuth(), async (req: any, res) => {
    const { id } = req.params;
    const { status, studentAcceptedResolved, assignedStaffId, staffCompleted } = req.body;
    const updated = await dbUpdateIssueReport(
      id, 
      { status, studentAcceptedResolved, assignedStaffId, staffCompleted }, 
      issueReports
    );
    if (!updated) {
      return res.status(404).json({ error: "Issue report not found" });
    }
    res.json(updated);
  });

  // --- Protected Staff Endpoints ---
  app.get("/api/staff", requireAuth(), async (req, res) => {
    const list = await dbGetStaff(staff);
    res.json(list);
  });

  app.post("/api/staff", requireAuth(["admin", "manager"]), async (req: any, res) => {
    const newStaff = {
      id: `staff-new-${Date.now()}`,
      ...req.body
    };
    const saved = await dbCreateStaff(newStaff, staff);

    // Auto-create login credentials for the staff member
    const baseUsername = saved.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff';
    const username = `${baseUsername}${saved.id.substring(saved.id.length - 3)}`;
    const password = 'staff123';
    const email = saved.email || `${username}@pinevela.com`;

    // Add to backend local MOCK_USERS state
    MOCK_USERS.push({
      email,
      username,
      password,
      user: {
        id: saved.id,
        name: saved.name,
        role: 'staff',
        token: `token_${saved.id}`
      }
    });

    console.log(`[Staff Created] Login credentials: Username: "${username}" / Password: "${password}"`);

    // If Supabase is configured, also persist the user profile in 'users' table
    const { client, configured } = getSupabase();
    if (configured && client) {
      try {
        const { error } = await client.from("users").insert([{
          id: saved.id,
          email,
          username,
          password,
          name: saved.name,
          role: 'staff',
          token: `token_${saved.id}`
        }]);
        if (error) {
          console.error("Error saving staff user to Supabase users:", error.message);
        }
      } catch (err) {
        console.error("Failed to persist staff user to Supabase:", err);
      }
    }

    res.status(201).json(saved);
  });

  app.delete("/api/staff/:id", requireAuth(["admin", "manager"]), async (req: any, res) => {
    const { id } = req.params;
    
    // Remove from in-memory MOCK_USERS state
    const userIndex = MOCK_USERS.findIndex(u => u.user && u.user.id === id);
    if (userIndex !== -1) {
      MOCK_USERS.splice(userIndex, 1);
    }
    
    const success = await dbDeleteStaff(id, staff);
    if (!success) {
      return res.status(500).json({ error: "Failed to delete staff member" });
    }
    res.status(200).json({ success: true });
  });

  // --- Meetings Endpoints ---
  app.get("/api/meetings", requireAuth(), async (req, res) => {
    const list = await dbGetMeetings(meetings);
    res.json(list);
  });

  app.post("/api/meetings", requireAuth(["student"]), async (req: any, res) => {
    const newMeeting = {
      id: `meet-new-${Date.now()}`,
      status: 'Pending',
      studentName: req.user.name,
      studentId: req.user.id,
      ...req.body
    };
    const saved = await dbCreateMeeting(newMeeting, meetings);
    await dbCreateActivity({
      id: `act-meet-${Date.now()}`,
      text: `New meeting request from ${saved.studentName} for a ${saved.type}`,
      time: 'Just now',
      type: 'info'
    }, activities);
    res.status(201).json(saved);
  });

  app.put("/api/meetings/:id", requireAuth(["admin", "manager"]), async (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const list = await dbGetMeetings(meetings);
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Meeting request not found" });
    }
    
    const updated = await dbUpdateMeeting(id, status, meetings);
    
    // Auto-create a notification when status changes!
    const notifText = `Your meeting request (${updated.type} on ${updated.date} at ${updated.time}) has been ${status}.`;
    await dbCreateNotification({
      id: `notif-${Date.now()}`,
      studentId: updated.studentId,
      title: `Meeting ${status}`,
      message: notifText,
      type: status === 'Approved' ? 'success' : 'warning',
      date: new Date().toISOString().split('T')[0],
      read: false
    }, notifications);

    await dbCreateActivity({
      id: `act-meet-upd-${Date.now()}`,
      text: `Meeting request for ${updated.studentName} was ${status}`,
      time: 'Just now',
      type: status === 'Approved' ? 'success' : 'danger'
    }, activities);

    res.json(updated);
  });

  // --- Notifications Endpoints ---
  app.get("/api/notifications", requireAuth(), async (req: any, res) => {
    const list = await dbGetNotifications(notifications);
    const filtered = list.filter((n: any) => n.studentId === req.user.id);
    res.json(filtered);
  });

  app.put("/api/notifications/:id/read", requireAuth(), async (req, res) => {
    const { id } = req.params;
    await dbMarkNotificationRead(id, notifications);
    res.json({ success: true });
  });

  // --- Ratings/Feedback Endpoints ---
  app.get("/api/ratings", async (req, res) => {
    const list = await dbGetRatings(ratings);
    res.json(list);
  });

  app.post("/api/ratings", requireAuth(["student"]), async (req: any, res) => {
    const newRating = {
      id: `rate-new-${Date.now()}`,
      studentId: req.user.id,
      studentName: req.user.name,
      date: new Date().toISOString().split('T')[0],
      ...req.body
    };
    const saved = await dbCreateRating(newRating, ratings);
    
    // Also try updating average rating for the hostel
    const currentHostels = await dbGetHostels(hostels);
    const hostelIdx = currentHostels.findIndex(h => h.id === saved.hostelId || h.name === saved.hostelName);
    if (hostelIdx !== -1) {
      const currentRatings = await dbGetRatings(ratings);
      const hostelRatings = currentRatings.filter(r => r.hostelId === currentHostels[hostelIdx].id || r.hostelName === currentHostels[hostelIdx].name);
      const totalScore = hostelRatings.reduce((sum, r) => sum + r.score, 0);
      const newScore = Number((totalScore / hostelRatings.length).toFixed(1));
      await dbUpdateHostel(currentHostels[hostelIdx].id, { rating: newScore }, hostels);
    }

    await dbCreateActivity({
      id: `act-rate-${Date.now()}`,
      text: `${saved.studentName} rated ${saved.hostelName} ${saved.score} stars`,
      time: 'Just now',
      type: 'info'
    }, activities);

    res.status(201).json(saved);
  });

  app.get("/api/activities", requireAuth(["admin"]), async (req, res) => {
    const list = await dbGetActivities(activities);
    res.json(list);
  });

  // --- Chat App Endpoints ---

  // 1. GET current user's profile
  app.get("/api/chat/profile", requireAuth(), async (req: any, res) => {
    const studentId = req.user.id;
    let profile = chatProfiles.find(p => p.studentId === studentId);
    if (!profile) {
      profile = {
        studentId,
        nickname: req.user.name,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      };
      chatProfiles.push(profile);
    }
    res.json(profile);
  });

  // 2. POST update profile
  app.post("/api/chat/profile", requireAuth(), async (req: any, res) => {
    const studentId = req.user.id;
    const { nickname, avatarUrl } = req.body;
    let profile = chatProfiles.find(p => p.studentId === studentId);
    if (!profile) {
      profile = { studentId, nickname, avatarUrl };
      chatProfiles.push(profile);
    } else {
      profile.nickname = nickname || profile.nickname;
      profile.avatarUrl = avatarUrl || profile.avatarUrl;
    }
    res.json(profile);
  });

  // 3. GET messages for a channel
  app.get("/api/chat/messages", requireAuth(), async (req: any, res) => {
    const { channelType, channelId } = req.query;
    if (!channelType || !channelId) {
      return res.status(400).json({ error: "channelType and channelId queries are required" });
    }
    const filtered = chatMessages.filter(m => m.channelType === channelType && m.channelId === channelId);
    res.json(filtered);
  });

  // 4. POST message
  app.post("/api/chat/messages", requireAuth(), async (req: any, res) => {
    const studentId = req.user.id;
    const { channelType, channelId, messageType, content } = req.body;
    if (!channelType || !channelId || !content) {
      return res.status(400).json({ error: "Missing required message fields" });
    }

    let profile = chatProfiles.find(p => p.studentId === studentId);
    const senderName = profile ? profile.nickname : req.user.name;
    const senderAvatar = profile ? profile.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

    const newMsg = {
      id: `msg-new-${Date.now()}`,
      channelType,
      channelId,
      senderId: studentId,
      senderName,
      senderAvatar,
      messageType: messageType || 'text',
      content,
      createdAt: new Date().toISOString()
    };

    chatMessages.push(newMsg);

    // Auto-create chat notifications for recipients
    try {
      const allUsers = await dbGetUsers(MOCK_USERS);
      const students = allUsers.filter(u => {
        const userObj = u.user || u;
        return userObj && userObj.role === 'student' && userObj.id !== studentId;
      });

      if (channelType === 'global') {
        for (const s of students) {
          const userObj = s.user || s;
          const newNotif = {
            id: `notif-chat-${Date.now()}-${userObj.id}`,
            studentId: userObj.id,
            title: 'Global Chat Lounge',
            message: `New message in Global Lounge from ${senderName}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
            type: 'info',
            date: new Date().toISOString().split('T')[0],
            read: false
          };
          await dbCreateNotification(newNotif, notifications);
        }
      } else if (channelType === 'hostel') {
        for (const s of students) {
          const userObj = s.user || s;
          const newNotif = {
            id: `notif-chat-${Date.now()}-${userObj.id}`,
            studentId: userObj.id,
            title: 'My Hostel Lounge',
            message: `New message in Hostel Lounge from ${senderName}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
            type: 'info',
            date: new Date().toISOString().split('T')[0],
            read: false
          };
          await dbCreateNotification(newNotif, notifications);
        }
      } else if (channelType === 'dm') {
        const room = dmRooms.find(r => r.id === channelId);
        if (room) {
          const opponentId = room.user1Id === studentId ? room.user2Id : room.user1Id;
          const newNotif = {
            id: `notif-chat-${Date.now()}-${opponentId}`,
            studentId: opponentId,
            title: 'Direct Chat',
            message: `New message from ${senderName}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
            type: 'info',
            date: new Date().toISOString().split('T')[0],
            read: false
          };
          await dbCreateNotification(newNotif, notifications);
        }
      }
    } catch (err) {
      console.error("Failed to auto-create chat notifications:", err);
    }

    res.status(201).json(newMsg);
  });

  // 4b. React to message
  app.post("/api/chat/messages/:id/react", requireAuth(), async (req: any, res) => {
    const { id } = req.params;
    const { emoji } = req.body;
    const studentId = req.user.id;

    let profile = chatProfiles.find(p => p.studentId === studentId);
    const reactorName = profile ? profile.nickname : req.user.name;

    const msg = chatMessages.find(m => m.id === id);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!msg.reactions) {
      msg.reactions = {};
    }

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }

    const index = msg.reactions[emoji].indexOf(reactorName);
    if (index > -1) {
      msg.reactions[emoji].splice(index, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(reactorName);
    }

    res.json(msg);
  });

  // 5. GET all DM rooms for current student
  app.get("/api/chat/dms", requireAuth(), async (req: any, res) => {
    const studentId = req.user.id;
    const rooms = dmRooms.filter(r => r.user1Id === studentId || r.user2Id === studentId);
    
    // Enrich DM rooms with nickname and avatar info from mock users list
    const allUsers = await dbGetUsers(MOCK_USERS);
    
    const enrichedRooms = rooms.map(room => {
      const isInitiator = room.user1Id === studentId;
      const opponentId = isInitiator ? room.user2Id : room.user1Id;
      
      const opponentUserRecord = allUsers.find(u => u.id === opponentId || (u.user && u.user.id === opponentId));
      const opponentUser = opponentUserRecord ? (opponentUserRecord.user || opponentUserRecord) : null;
      
      const opponentProfile = chatProfiles.find(p => p.studentId === opponentId);
      
      return {
        ...room,
        isInitiator,
        opponent: {
          id: opponentId,
          name: opponentUser ? opponentUser.name : 'Unknown User',
          nickname: opponentProfile ? opponentProfile.nickname : (opponentUser ? opponentUser.name : 'Unknown'),
          avatarUrl: opponentProfile ? opponentProfile.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        }
      };
    });
    
    res.json(enrichedRooms);
  });

  // 6. POST request DM room
  app.post("/api/chat/dms/request", requireAuth(), async (req: any, res) => {
    const studentId = req.user.id;
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ error: "recipientId is required" });
    }

    let existingRoom = dmRooms.find(r => 
      (r.user1Id === studentId && r.user2Id === recipientId) ||
      (r.user1Id === recipientId && r.user2Id === studentId)
    );

    if (existingRoom) {
      return res.json(existingRoom);
    }

    const newRoom = {
      id: `room-${studentId.substring(0, 5)}-${recipientId.substring(0, 5)}-${Date.now()}`,
      user1Id: studentId,
      user2Id: recipientId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    dmRooms.push(newRoom);
    res.status(201).json(newRoom);
  });

  // 7. POST accept DM room request
  app.post("/api/chat/dms/accept", requireAuth(), async (req: any, res) => {
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }
    const room = dmRooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: "DM Room not found" });
    }
    room.status = 'accepted';
    res.json(room);
  });

  // 8. GET other students list for DM start
  app.get("/api/chat/students", requireAuth(), async (req: any, res) => {
    const studentId = req.user.id;
    const allUsers = await dbGetUsers(MOCK_USERS);
    
    const studentUsers = allUsers.filter(u => {
      const uRecord = u.user || u;
      return uRecord.role === 'student' && uRecord.id !== studentId;
    }).map(u => {
      const uRecord = u.user || u;
      const profile = chatProfiles.find(p => p.studentId === uRecord.id);
      return {
        id: uRecord.id,
        name: uRecord.name,
        nickname: profile ? profile.nickname : uRecord.name,
        avatarUrl: profile ? profile.avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      };
    });
    
    res.json(studentUsers);
  });

  // Vite integration middleware (development) or serving static build assets (production)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PineVela Backend] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start fullstack server:", err);
});
