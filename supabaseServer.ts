import { createClient } from "@supabase/supabase-js";

let supabaseClient: any = null;
let isSupabaseConfigured = false;

// Safe wrapper to prevent crashes when environment variables are missing
export function getSupabase() {
  if (supabaseClient) {
    return { client: supabaseClient, configured: isSupabaseConfigured };
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key);
      isSupabaseConfigured = true;
      console.log("✅ Supabase service successfully initialized on the server-side!");
    } catch (err) {
      console.error("❌ Failed to instantiate Supabase client:", err);
      isSupabaseConfigured = false;
      supabaseClient = null;
    }
  } else {
    console.warn("⚠️ SUPABASE_URL / SUPABASE_ANON_KEY is missing. Operating in-memory mode.");
    isSupabaseConfigured = false;
    supabaseClient = null;
  }

  return { client: supabaseClient, configured: isSupabaseConfigured };
}

// Map Postgres snake_case fields back to camelCase for the frontend
function mapHostel(h: any) {
  if (!h) return null;
  return {
    id: h.id,
    name: h.name,
    location: h.location,
    wing: h.wing,
    status: h.status,
    bedsLeft: h.beds_left ?? 0,
    totalCapacity: h.total_capacity ?? 0,
    availableSpaces: h.available_spaces ?? 0,
    image: h.image,
    managerName: h.manager_name,
    managerPhone: h.manager_phone,
    managerEmail: h.manager_email,
    description: h.description,
    rating: Number(h.rating ?? 5),
    registrationDate: h.registration_date,
    subscriptionPaid: !!h.subscription_paid
  };
}

function mapBookingRequest(b: any) {
  if (!b) return null;
  return {
    id: b.id,
    studentName: b.student_name,
    studentId: b.student_id,
    roomType: b.room_type,
    hostelName: b.hostel_name,
    avatar: b.avatar,
    status: b.status
  };
}

function mapIssueReport(i: any) {
  if (!i) return null;
  return {
    id: i.id,
    title: i.title,
    category: i.category,
    urgency: i.urgency,
    description: i.description,
    photos: i.photos || [],
    contactMethod: i.contact_method,
    studentName: i.student_name,
    studentId: i.student_id,
    hostelName: i.hostel_name,
    blockFloor: i.block_floor,
    roomBed: i.room_bed,
    status: i.status,
    date: i.date,
    studentAcceptedResolved: !!i.student_accepted_resolved,
    assignedStaffId: i.assigned_staff_id,
    staffCompleted: !!i.staff_completed
  };
}

function mapMeeting(m: any) {
  if (!m) return null;
  return {
    id: m.id,
    studentId: m.student_id,
    studentName: m.student_name,
    hostelName: m.hostel_name,
    type: m.type,
    date: m.date,
    time: m.time,
    reason: m.reason,
    status: m.status
  };
}

function mapNotification(n: any) {
  if (!n) return null;
  return {
    id: n.id,
    studentId: n.student_id,
    title: n.title,
    message: n.message,
    type: n.type,
    date: n.date,
    read: !!n.read
  };
}

// Database helper functions with fallback support
export async function dbGetUsers(fallbackUsers: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackUsers;

  try {
    const { data, error } = await client.from("users").select("*");
    if (error) {
      console.error("Error reading users from Supabase:", error.message);
      return fallbackUsers;
    }
    return (data && data.length > 0) ? data : fallbackUsers;
  } catch (err) {
    console.error("Failed to query users:", err);
    return fallbackUsers;
  }
}

export async function dbGetUserByEmailOrUsername(usernameOrEmail: string, fallbackUsers: any[]): Promise<any | null> {
  const { client, configured } = getSupabase();
  if (!configured || !client) {
    console.log("[Auth Debug] Supabase not configured, using fallback users.");
    return fallbackUsers.find(u => u.email === usernameOrEmail || u.username === usernameOrEmail) || null;
  }

  try {
    const { data, error } = await client
      .from("users")
      .select("*")
      .or(`email.eq.${usernameOrEmail},username.eq.${usernameOrEmail}`)
      .limit(1);

    console.log("[Auth Debug] Query results - error:", error, "data:", data);

    if (error || !data || data.length === 0) {
      console.log("[Auth Debug] No user found in Supabase or query error, falling back to local users.");
      return fallbackUsers.find(u => u.email === usernameOrEmail || u.username === usernameOrEmail) || null;
    }
    const matched = data[0];
    console.log("[Auth Debug] Matched user from DB:", matched);
    return {
      email: matched.email,
      username: matched.username,
      password: matched.password,
      user: {
        id: matched.id,
        name: matched.name,
        role: matched.role,
        token: matched.token
      }
    };
  } catch (err) {
    console.error("Failed to fetch user by identity:", err);
    return fallbackUsers.find(u => u.email === usernameOrEmail || u.username === usernameOrEmail) || null;
  }
}

export async function dbGetHostels(fallbackHostels: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackHostels;

  try {
    const { data, error } = await client.from("hostels").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading hostels from Supabase:", error.message);
      return fallbackHostels;
    }
    if (data && data.length > 0) {
      return data.map(mapHostel);
    }
    return fallbackHostels;
  } catch (err) {
    console.error("Failed to query hostels:", err);
    return fallbackHostels;
  }
}

export async function dbCreateHostel(hostel: any, fallbackHostels: any[]): Promise<any> {
  fallbackHostels.push(hostel);
  const { client, configured } = getSupabase();
  if (!configured || !client) return hostel;

  try {
    const insertData = {
      id: hostel.id,
      name: hostel.name,
      location: hostel.location,
      wing: hostel.wing,
      status: hostel.status,
      beds_left: hostel.bedsLeft || 0,
      total_capacity: hostel.totalCapacity || 100,
      available_spaces: hostel.availableSpaces || 0,
      image: hostel.image,
      manager_name: hostel.managerName,
      manager_phone: hostel.managerPhone,
      manager_email: hostel.managerEmail,
      description: hostel.description,
      rating: hostel.rating || 5.0,
      registration_date: hostel.registrationDate,
      subscription_paid: hostel.subscriptionPaid
    };

    const { data, error } = await client.from("hostels").insert([insertData]).select();
    if (error) {
      console.error("Error inserting hostel in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapHostel(data[0]);
    }
  } catch (err) {
    console.error("Failed to write new hostel to database:", err);
  }
  return hostel;
}

export async function dbUpdateHostel(id: string, updates: any, fallbackHostels: any[]): Promise<any> {
  const localIndex = fallbackHostels.findIndex(h => h.id === id);
  if (localIndex !== -1) {
    fallbackHostels[localIndex] = {
      ...fallbackHostels[localIndex],
      ...updates
    };
  }

  const { client, configured } = getSupabase();
  if (!configured || !client) {
    return localIndex !== -1 ? fallbackHostels[localIndex] : null;
  }

  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.wing !== undefined) updateData.wing = updates.wing;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.bedsLeft !== undefined) updateData.beds_left = Number(updates.bedsLeft);
    if (updates.totalCapacity !== undefined) updateData.total_capacity = Number(updates.totalCapacity);
    if (updates.availableSpaces !== undefined) updateData.available_spaces = Number(updates.availableSpaces);
    if (updates.image !== undefined) updateData.image = updates.image;
    if (updates.managerName !== undefined) updateData.manager_name = updates.managerName;
    if (updates.managerPhone !== undefined) updateData.manager_phone = updates.managerPhone;
    if (updates.managerEmail !== undefined) updateData.manager_email = updates.managerEmail;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.rating !== undefined) updateData.rating = Number(updates.rating);
    if (updates.registrationDate !== undefined) updateData.registration_date = updates.registrationDate;
    if (updates.subscriptionPaid !== undefined) updateData.subscription_paid = !!updates.subscriptionPaid;

    const { data, error } = await client.from("hostels").update(updateData).eq("id", id).select();
    if (error) {
      console.error("Error updating hostel in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapHostel(data[0]);
    }
  } catch (err) {
    console.error("Failed to update hostel in database:", err);
  }

  return localIndex !== -1 ? fallbackHostels[localIndex] : null;
}

export async function dbGetBookingRequests(fallbackBookings: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackBookings;

  try {
    const { data, error } = await client.from("booking_requests").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading bookings from Supabase:", error.message);
      return fallbackBookings;
    }
    if (data && data.length > 0) {
      return data.map(mapBookingRequest);
    }
    return fallbackBookings;
  } catch (err) {
    console.error("Failed to query bookings:", err);
    return fallbackBookings;
  }
}

export async function dbCreateBookingRequest(book: any, fallbackBookings: any[]): Promise<any> {
  fallbackBookings.unshift(book);
  const { client, configured } = getSupabase();
  if (!configured || !client) return book;

  try {
    const insertData = {
      id: book.id,
      student_name: book.studentName,
      student_id: book.studentId,
      room_type: book.roomType,
      hostel_name: book.hostelName,
      avatar: book.avatar,
      status: book.status
    };

    const { data, error } = await client.from("booking_requests").insert([insertData]).select();
    if (error) {
      console.error("Error inserting booking request in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapBookingRequest(data[0]);
    }
  } catch (err) {
    console.error("Failed to write booking to database:", err);
  }
  return book;
}

export async function dbUpdateBookingRequest(id: string, status: string, fallbackBookings: any[]): Promise<any> {
  const localIndex = fallbackBookings.findIndex(b => b.id === id);
  if (localIndex !== -1) {
    fallbackBookings[localIndex].status = status;
  }

  const { client, configured } = getSupabase();
  if (!configured || !client) {
    return localIndex !== -1 ? fallbackBookings[localIndex] : null;
  }

  try {
    const { data, error } = await client.from("booking_requests").update({ status }).eq("id", id).select();
    if (error) {
      console.error("Error updating booking status in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapBookingRequest(data[0]);
    }
  } catch (err) {
    console.error("Failed to update booking status:", err);
  }
  return localIndex !== -1 ? fallbackBookings[localIndex] : null;
}

export async function dbGetIssueReports(fallbackIssues: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackIssues;

  try {
    const { data, error } = await client.from("issue_reports").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading issues from Supabase:", error.message);
      return fallbackIssues;
    }
    if (data && data.length > 0) {
      return data.map(mapIssueReport);
    }
    return fallbackIssues;
  } catch (err) {
    console.error("Failed to query issue reports:", err);
    return fallbackIssues;
  }
}

export async function dbCreateIssueReport(issue: any, fallbackIssues: any[]): Promise<any> {
  fallbackIssues.unshift(issue);
  const { client, configured } = getSupabase();
  if (!configured || !client) return issue;

  try {
    const insertData = {
      id: issue.id,
      title: issue.title,
      category: issue.category,
      urgency: issue.urgency,
      description: issue.description,
      photos: issue.photos || [],
      contact_method: issue.contactMethod,
      student_name: issue.studentName,
      student_id: issue.studentId,
      hostel_name: issue.hostelName,
      block_floor: issue.blockFloor,
      room_bed: issue.roomBed,
      status: issue.status,
      date: issue.date,
      student_accepted_resolved: !!issue.studentAcceptedResolved
    };

    const { data, error } = await client.from("issue_reports").insert([insertData]).select();
    if (error) {
      console.error("Error inserting issue report in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapIssueReport(data[0]);
    }
  } catch (err) {
    console.error("Failed to save issue report:", err);
  }
  return issue;
}

export async function dbUpdateIssueReport(id: string, updates: any, fallbackIssues: any[]): Promise<any> {
  const localIndex = fallbackIssues.findIndex(i => i.id === id);
  if (localIndex !== -1) {
    fallbackIssues[localIndex] = {
      ...fallbackIssues[localIndex],
      ...updates
    };
  }

  const { client, configured } = getSupabase();
  if (!configured || !client) {
    return localIndex !== -1 ? fallbackIssues[localIndex] : null;
  }

  try {
    const updateData: any = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.studentAcceptedResolved !== undefined) updateData.student_accepted_resolved = !!updates.studentAcceptedResolved;
    if (updates.assignedStaffId !== undefined) updateData.assigned_staff_id = updates.assignedStaffId;
    if (updates.staffCompleted !== undefined) updateData.staff_completed = !!updates.staffCompleted;

    const { data, error } = await client.from("issue_reports").update(updateData).eq("id", id).select();
    if (error) {
      console.error("Error updating issue in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapIssueReport(data[0]);
    }
  } catch (err) {
    console.error("Failed to update issue in Supabase:", err);
  }

  return localIndex !== -1 ? fallbackIssues[localIndex] : null;
}

function mapStaff(s: any) {
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    phone: s.phone,
    contactMethod: s.contact_method,
    email: s.email,
    hostelId: s.hostel_id
  };
}

export async function dbGetStaff(fallbackStaff: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackStaff;

  try {
    const { data, error } = await client.from("staff").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading staff from Supabase:", error.message);
      return fallbackStaff;
    }
    if (data && data.length > 0) {
      return data.map(mapStaff);
    }
    return fallbackStaff;
  } catch (err) {
    console.error("Failed to query staff:", err);
    return fallbackStaff;
  }
}

export async function dbCreateStaff(staff: any, fallbackStaff: any[]): Promise<any> {
  fallbackStaff.push(staff);
  const { client, configured } = getSupabase();
  if (!configured || !client) return staff;

  try {
    const insertData = {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      phone: staff.phone,
      contact_method: staff.contactMethod,
      email: staff.email,
      hostel_id: staff.hostelId
    };

    const { data, error } = await client.from("staff").insert([insertData]).select();
    if (error) {
      console.error("Error inserting staff in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapStaff(data[0]);
    }
  } catch (err) {
    console.error("Failed to save staff in Supabase:", err);
  }
  return staff;
}

export async function dbDeleteStaff(id: string, fallbackStaff: any[]): Promise<boolean> {
  const localIndex = fallbackStaff.findIndex(s => s.id === id);
  if (localIndex !== -1) {
    fallbackStaff.splice(localIndex, 1);
  }

  const { client, configured } = getSupabase();
  if (!configured || !client) return true;

  try {
    const { error: staffError } = await client.from("staff").delete().eq("id", id);
    const { error: userError } = await client.from("users").delete().eq("id", id);
    
    if (staffError) console.error("Error deleting staff from Supabase:", staffError.message);
    if (userError) console.error("Error deleting staff user from Supabase:", userError.message);
    
    return true;
  } catch (err) {
    console.error("Failed to delete staff from Supabase:", err);
    return true;
  }
}

export async function dbGetMeetings(fallbackMeetings: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackMeetings;

  try {
    const { data, error } = await client.from("meetings").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading meetings from Supabase:", error.message);
      return fallbackMeetings;
    }
    if (data && data.length > 0) {
      return data.map(mapMeeting);
    }
    return fallbackMeetings;
  } catch (err) {
    console.error("Failed to query meetings:", err);
    return fallbackMeetings;
  }
}

export async function dbCreateMeeting(meet: any, fallbackMeetings: any[]): Promise<any> {
  fallbackMeetings.unshift(meet);
  const { client, configured } = getSupabase();
  if (!configured || !client) return meet;

  try {
    const insertData = {
      id: meet.id,
      student_id: meet.studentId,
      student_name: meet.studentName,
      hostel_name: meet.hostelName,
      type: meet.type,
      date: meet.date,
      time: meet.time,
      reason: meet.reason,
      status: meet.status
    };

    const { data, error } = await client.from("meetings").insert([insertData]).select();
    if (error) {
      console.error("Error inserting meeting in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapMeeting(data[0]);
    }
  } catch (err) {
    console.error("Failed to save meeting in Supabase:", err);
  }
  return meet;
}

export async function dbUpdateMeeting(id: string, status: string, fallbackMeetings: any[]): Promise<any> {
  const localIndex = fallbackMeetings.findIndex(m => m.id === id);
  if (localIndex !== -1) {
    fallbackMeetings[localIndex].status = status;
  }

  const { client, configured } = getSupabase();
  if (!configured || !client) {
    return localIndex !== -1 ? fallbackMeetings[localIndex] : null;
  }

  try {
    const { data, error } = await client.from("meetings").update({ status }).eq("id", id).select();
    if (error) {
      console.error("Error updating meeting in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapMeeting(data[0]);
    }
  } catch (err) {
    console.error("Failed to update meeting status:", err);
  }
  return localIndex !== -1 ? fallbackMeetings[localIndex] : null;
}

export async function dbGetNotifications(fallbackNotifications: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackNotifications;

  try {
    const { data, error } = await client.from("notifications").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading notifications from Supabase:", error.message);
      return fallbackNotifications;
    }
    if (data && data.length > 0) {
      return data.map(mapNotification);
    }
    return fallbackNotifications;
  } catch (err) {
    console.error("Failed to query notifications:", err);
    return fallbackNotifications;
  }
}

export async function dbCreateNotification(notif: any, fallbackNotifications: any[]): Promise<any> {
  fallbackNotifications.unshift(notif);
  const { client, configured } = getSupabase();
  if (!configured || !client) return notif;

  try {
    const insertData = {
      id: notif.id,
      student_id: notif.studentId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      date: notif.date,
      read: !!notif.read
    };

    const { data, error } = await client.from("notifications").insert([insertData]).select();
    if (error) {
      console.error("Error inserting notification in Supabase:", error.message);
    } else if (data && data[0]) {
      return mapNotification(data[0]);
    }
  } catch (err) {
    console.error("Failed to save notification in Supabase:", err);
  }
  return notif;
}

export async function dbMarkNotificationRead(id: string, fallbackNotifications: any[]): Promise<void> {
  const idx = fallbackNotifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    fallbackNotifications[idx].read = true;
  }

  const { client, configured } = getSupabase();
  if (!configured || !client) return;

  try {
    await client.from("notifications").update({ read: true }).eq("id", id);
  } catch (err) {
    console.error("Failed to mark notification read in Supabase:", err);
  }
}

export async function dbGetRatings(fallbackRatings: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackRatings;

  try {
    const { data, error } = await client.from("ratings").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading ratings from Supabase:", error.message);
      return fallbackRatings;
    }
    if (data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        hostelId: r.hostel_id,
        hostelName: r.hostel_name,
        score: Number(r.score),
        review: r.review,
        date: r.date
      }));
    }
    return fallbackRatings;
  } catch (err) {
    console.error("Failed to query ratings:", err);
    return fallbackRatings;
  }
}

export async function dbCreateRating(rating: any, fallbackRatings: any[]): Promise<any> {
  fallbackRatings.unshift(rating);
  const { client, configured } = getSupabase();
  if (!configured || !client) return rating;

  try {
    const insertData = {
      id: rating.id,
      student_id: rating.studentId,
      student_name: rating.studentName,
      hostel_id: rating.hostelId,
      hostel_name: rating.hostelName,
      score: rating.score,
      review: rating.review,
      date: rating.date
    };

    const { data, error } = await client.from("ratings").insert([insertData]).select();
    if (error) {
      console.error("Error inserting rating in Supabase:", error.message);
    } else if (data && data[0]) {
      return {
        id: data[0].id,
        studentId: data[0].student_id,
        studentName: data[0].student_name,
        hostelId: data[0].hostel_id,
        hostelName: data[0].hostel_name,
        score: Number(data[0].score),
        review: data[0].review,
        date: data[0].date
      };
    }
  } catch (err) {
    console.error("Failed to save rating in Supabase:", err);
  }
  return rating;
}

export async function dbGetActivities(fallbackActivities: any[]): Promise<any[]> {
  const { client, configured } = getSupabase();
  if (!configured || !client) return fallbackActivities;

  try {
    const { data, error } = await client.from("activities").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error reading activities from Supabase:", error.message);
      return fallbackActivities;
    }
    if (data && data.length > 0) {
      return data.map((a: any) => ({
        id: a.id,
        text: a.text,
        time: a.time,
        type: a.type
      }));
    }
    return fallbackActivities;
  } catch (err) {
    console.error("Failed to query activities:", err);
    return fallbackActivities;
  }
}

export async function dbCreateActivity(activity: any, fallbackActivities: any[]): Promise<any> {
  fallbackActivities.unshift(activity);
  const { client, configured } = getSupabase();
  if (!configured || !client) return activity;

  try {
    const insertData = {
      id: activity.id,
      text: activity.text,
      time: activity.time,
      type: activity.type
    };

    const { data, error } = await client.from("activities").insert([insertData]).select();
    if (error) {
      console.error("Error inserting activity in Supabase:", error.message);
    }
  } catch (err) {
    console.error("Failed to save activity in Supabase:", err);
  }
  return activity;
}

// ==========================================
// CHAT SCHEMA DB FUNCTIONS
// ==========================================

let chatSupabaseClient: any = null;

export function getChatSupabase() {
  if (chatSupabaseClient) {
    return { client: chatSupabaseClient, configured: isSupabaseConfigured };
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      chatSupabaseClient = createClient(url, key, {
        db: { schema: 'chat' }
      });
      console.log("✅ Supabase chat service (schema: chat) successfully initialized!");
    } catch (err) {
      console.error("❌ Failed to instantiate Supabase chat client:", err);
      chatSupabaseClient = null;
    }
  }

  return { client: chatSupabaseClient, configured: !!chatSupabaseClient };
}

export async function dbGetChatProfile(studentId: string, fallbackProfiles: any[]): Promise<any> {
  const { client, configured } = getChatSupabase();
  const localProfile = fallbackProfiles.find(p => p.studentId === studentId);
  if (!configured || !client) return localProfile;

  try {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Error reading chat profile from Supabase:", error.message);
      return localProfile;
    }
    if (data) {
      return {
        studentId: data.student_id,
        nickname: data.nickname,
        avatarUrl: data.avatar_url
      };
    }
  } catch (err) {
    console.error("Failed to query chat profile:", err);
  }
  return localProfile;
}

export async function dbUpdateChatProfile(studentId: string, nickname: string, avatarUrl: string, fallbackProfiles: any[]): Promise<any> {
  const localIdx = fallbackProfiles.findIndex(p => p.studentId === studentId);
  const updatedProfile = { studentId, nickname, avatarUrl };
  if (localIdx !== -1) {
    fallbackProfiles[localIdx] = updatedProfile;
  } else {
    fallbackProfiles.push(updatedProfile);
  }

  const { client, configured } = getChatSupabase();
  if (!configured || !client) return updatedProfile;

  try {
    const upsertData = {
      student_id: studentId,
      nickname,
      avatar_url: avatarUrl
    };
    const { data, error } = await client
      .from("profiles")
      .upsert(upsertData)
      .select()
      .single();

    if (error) {
      console.error("Error upserting chat profile in Supabase:", error.message);
    } else if (data) {
      return {
        studentId: data.student_id,
        nickname: data.nickname,
        avatarUrl: data.avatar_url
      };
    }
  } catch (err) {
    console.error("Failed to update chat profile in Supabase:", err);
  }
  return updatedProfile;
}

export async function dbGetChatMessages(channelType: string, channelId: string, fallbackMessages: any[]): Promise<any[]> {
  const { client, configured } = getChatSupabase();
  const localMsgs = fallbackMessages.filter(m => m.channelType === channelType && m.channelId === channelId);
  if (!configured || !client) return localMsgs;

  try {
    const { data, error } = await client
      .from("messages")
      .select("*")
      .eq("channel_type", channelType)
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error reading chat messages from Supabase:", error.message);
      return localMsgs;
    }
    if (data) {
      return data.map((m: any) => ({
        id: m.id,
        channelType: m.channel_type,
        channelId: m.channel_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderAvatar: m.sender_avatar,
        messageType: m.message_type,
        content: m.content,
        reactions: m.reactions || {},
        createdAt: m.created_at
      }));
    }
  } catch (err) {
    console.error("Failed to query chat messages:", err);
  }
  return localMsgs;
}

export async function dbCreateChatMessage(msg: any, fallbackMessages: any[]): Promise<any> {
  fallbackMessages.push(msg);
  const { client, configured } = getChatSupabase();
  if (!configured || !client) return msg;

  try {
    const insertData = {
      id: msg.id,
      channel_type: msg.channelType,
      channel_id: msg.channelId,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_avatar: msg.senderAvatar,
      message_type: msg.messageType,
      content: msg.content,
      reactions: msg.reactions || {}
    };

    const { data, error } = await client.from("messages").insert([insertData]).select().single();
    if (error) {
      console.error("Error inserting chat message in Supabase:", error.message);
    } else if (data) {
      return {
        id: data.id,
        channelType: data.channel_type,
        channelId: data.channel_id,
        senderId: data.sender_id,
        senderName: data.sender_name,
        senderAvatar: data.sender_avatar,
        messageType: data.message_type,
        content: data.content,
        reactions: data.reactions || {},
        createdAt: data.created_at
      };
    }
  } catch (err) {
    console.error("Failed to save chat message in Supabase:", err);
  }
  return msg;
}

export async function dbReactToChatMessage(id: string, emoji: string, reactorName: string, fallbackMessages: any[]): Promise<any> {
  const localMsg = fallbackMessages.find(m => m.id === id);
  if (localMsg) {
    if (!localMsg.reactions) localMsg.reactions = {};
    if (!localMsg.reactions[emoji]) localMsg.reactions[emoji] = [];
    const index = localMsg.reactions[emoji].indexOf(reactorName);
    if (index > -1) {
      localMsg.reactions[emoji].splice(index, 1);
      if (localMsg.reactions[emoji].length === 0) {
        delete localMsg.reactions[emoji];
      }
    } else {
      localMsg.reactions[emoji].push(reactorName);
    }
  }

  const { client, configured } = getChatSupabase();
  if (!configured || !client) return localMsg;

  try {
    // We first read the message reactions to toggle it safely
    const { data: readData, error: readError } = await client.from("messages").select("reactions").eq("id", id).maybeSingle();
    if (readError) {
      console.error("Error reading message for reaction in Supabase:", readError.message);
      return localMsg;
    }
    
    let reactions = (readData && readData.reactions) || {};
    if (!reactions[emoji]) reactions[emoji] = [];
    const idx = reactions[emoji].indexOf(reactorName);
    if (idx > -1) {
      reactions[emoji].splice(idx, 1);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(reactorName);
    }

    const { data: updateData, error: updateError } = await client
      .from("messages")
      .update({ reactions })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating reactions in Supabase:", updateError.message);
    } else if (updateData) {
      return {
        id: updateData.id,
        channelType: updateData.channel_type,
        channelId: updateData.channel_id,
        senderId: updateData.sender_id,
        senderName: updateData.sender_name,
        senderAvatar: updateData.sender_avatar,
        messageType: updateData.message_type,
        content: updateData.content,
        reactions: updateData.reactions || {},
        createdAt: updateData.created_at
      };
    }
  } catch (err) {
    console.error("Failed to save reaction in Supabase:", err);
  }
  return localMsg;
}

export async function dbGetDMRooms(studentId: string, fallbackRooms: any[]): Promise<any[]> {
  const { client, configured } = getChatSupabase();
  const localRooms = fallbackRooms.filter(r => r.user1Id === studentId || r.user2Id === studentId);
  if (!configured || !client) return localRooms;

  try {
    const { data, error } = await client
      .from("dm_rooms")
      .select("*")
      .or(`user1_id.eq.${studentId},user2_id.eq.${studentId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error reading DM rooms from Supabase:", error.message);
      return localRooms;
    }
    if (data) {
      return data.map((r: any) => ({
        id: r.id,
        user1Id: r.user1_id,
        user2Id: r.user2_id,
        status: r.status,
        createdAt: r.created_at
      }));
    }
  } catch (err) {
    console.error("Failed to query DM rooms:", err);
  }
  return localRooms;
}

export async function dbCreateDMRoom(room: any, fallbackRooms: any[]): Promise<any> {
  fallbackRooms.push(room);
  const { client, configured } = getChatSupabase();
  if (!configured || !client) return room;

  try {
    const insertData = {
      id: room.id,
      user1_id: room.user1Id,
      user2_id: room.user2Id,
      status: room.status
    };

    const { data, error } = await client.from("dm_rooms").insert([insertData]).select().single();
    if (error) {
      console.error("Error inserting DM room in Supabase:", error.message);
    } else if (data) {
      return {
        id: data.id,
        user1Id: data.user1_id,
        user2Id: data.user2_id,
        status: data.status,
        createdAt: data.created_at
      };
    }
  } catch (err) {
    console.error("Failed to save DM room in Supabase:", err);
  }
  return room;
}

export async function dbAcceptDMRoom(roomId: string, fallbackRooms: any[]): Promise<any> {
  const localIdx = fallbackRooms.findIndex(r => r.id === roomId);
  if (localIdx !== -1) {
    fallbackRooms[localIdx].status = 'accepted';
  }

  const { client, configured } = getChatSupabase();
  if (!configured || !client) return localIdx !== -1 ? fallbackRooms[localIdx] : null;

  try {
    const { data, error } = await client
      .from("dm_rooms")
      .update({ status: 'accepted' })
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      console.error("Error accepting DM room in Supabase:", error.message);
    } else if (data) {
      return {
        id: data.id,
        user1Id: data.user1_id,
        user2Id: data.user2_id,
        status: data.status,
        createdAt: data.created_at
      };
    }
  } catch (err) {
    console.error("Failed to accept DM room in Supabase:", err);
  }
  return localIdx !== -1 ? fallbackRooms[localIdx] : null;
}

