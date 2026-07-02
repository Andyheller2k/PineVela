-- ==========================================
-- SUPABASE SCHEMA SETUP FOR PINEVELA HOSTELS
-- Copy and paste this script into your Supabase SQL Editor.
-- ==========================================

-- 1. Create USERS table to hold persistent role profiles (admin, manager, student)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'manager', 'admin', 'staff')),
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Users (password matches standard pre-configured logins)
INSERT INTO users (id, email, username, password, name, role, token) VALUES
('student_882', 'student@pinevela.com', 'student', 'student123', 'Sarah Connor', 'student', 'token_student_882'),
('manager_101', 'manager@pinevela.com', 'manager', 'manager123', 'Anthony Davis', 'manager', 'token_manager_101'),
('admin_001', 'admin@pinevela.com', 'admin', 'admin123', 'System Administrator', 'admin', 'token_admin_001'),
('staff_201', 'staff@pinevela.com', 'staff', 'staff123', 'John Doe (Plumber)', 'staff', 'token_staff_201')
ON CONFLICT (id) DO NOTHING;


-- 2. Create HOSTELS table to persist properties & occupancy
CREATE TABLE IF NOT EXISTS hostels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  wing TEXT,
  status TEXT,
  beds_left INTEGER DEFAULT 0,
  total_capacity INTEGER DEFAULT 0,
  available_spaces INTEGER DEFAULT 0,
  image TEXT,
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  description TEXT,
  rating NUMERIC DEFAULT 5.0,
  registration_date TEXT,
  subscription_paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Hostels
INSERT INTO hostels (id, name, location, wing, status, beds_left, total_capacity, available_spaces, image, manager_name, manager_phone, manager_email, description, rating, registration_date, subscription_paid) VALUES
('hostel-1', 'Pine Crest Residency', 'North Campus, Sector 5', 'North Wing', 'Open', 12, 120, 12, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', 'Sarah Johnson', '+23324488923', 'sarah.j@pinevela.com', 'A beautiful and serene student residential community featuring modern air-conditioned master suites, standard shared rooms, free shuttle transport, high-speed fiber-optic WiFi, and a 24/7 learning library.', 4.8, '2026-01-15', TRUE),
('hostel-2', 'Emerald Heights Block A', 'Main Campus, East Wing', 'North Wing', 'Full', 0, 180, 0, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', 'Maxwell Mensah', '+23350299882', 'maxwell.m@pinevela.com', 'Located in the premium core zone of the campus, Emerald Heights offers direct walking paths to major lecture halls, high-security smart access gates, indoor game arenas, and spacious study halls.', 4.6, '2026-02-10', TRUE),
('hostel-3', 'Sapphire Gardens', 'West Campus, Block B', 'South Side', 'Open', 28, 250, 28, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80', 'David Kojo', '+23324599812', 'david.k@pinevela.com', 'Known for its scenic garden landscaping, Sapphire Gardens offers spacious single and dual-occupancy options, student kitchenettes on every floor, modern sports fields, and a standby power generator.', 4.9, '2026-03-01', TRUE),
('hostel-4', 'Pine Ridge Annex', 'South Campus, Sector 9', 'South Side', 'Under Maintenance', 4, 80, 4, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 'Ebenezer Amankwah', '+23320188992', 'ebenezer.a@pinevela.com', 'An elegant cottage-style annex block providing quiet, focused living. Perfect for postgraduate students or those seeking a peaceful academic retreat away from noisy campus activities.', 4.2, '2026-03-24', FALSE)
ON CONFLICT (id) DO NOTHING;


-- 3. Create BOOKING REQUESTS table
CREATE TABLE IF NOT EXISTS booking_requests (
  id TEXT PRIMARY KEY,
  student_name TEXT,
  student_id TEXT,
  room_type TEXT,
  hostel_name TEXT,
  avatar TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Booking Requests
INSERT INTO booking_requests (id, student_name, student_id, room_type, hostel_name, avatar, status) VALUES
('book-1', 'Sarah Connor', 'STU-882', 'Superior Suite', 'Emerald Heights Block A', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 'Pending'),
('book-2', 'Marcus Wright', 'STU-102', 'Standard Twin', 'Emerald Heights Block A', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 'Pending'),
('book-3', 'Kyle Reese', 'STU-994', 'Emerald Single', 'Emerald Heights Block A', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 'Pending')
ON CONFLICT (id) DO NOTHING;


-- 4. Create ISSUE REPORTS table
CREATE TABLE IF NOT EXISTS issue_reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  urgency TEXT,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  contact_method TEXT,
  student_name TEXT,
  student_id TEXT,
  hostel_name TEXT,
  block_floor TEXT,
  room_bed TEXT,
  status TEXT DEFAULT 'Pending',
  date TEXT,
  student_accepted_resolved BOOLEAN DEFAULT FALSE,
  assigned_staff_id TEXT,
  staff_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Issue Reports
INSERT INTO issue_reports (id, title, category, urgency, description, contact_method, student_name, student_id, hostel_name, block_floor, room_bed, status, date) VALUES
('issue-1', 'Leaking Pipe in Washroom', 'Plumbing', 'High', 'The main water supply pipe in the Block B washroom has a steady leak, flooding the second stall corridor.', 'In-app Notification', 'Sarah Connor', 'STU-882', 'Pine Crest Residency', 'Block B, 4th Floor', 'Room 402, Bed A', 'Pending', '2026-06-28'),
('issue-2', 'AC Unit Not Cooling', 'Electrical', 'Medium', 'The air conditioner in room 302 runs but only blows warm air, making studying during daytime very difficult.', 'Email', 'David K.', 'STU-2024-1024', 'Sapphire Gardens', 'West Wing, 3rd Floor', 'Room 302, Bed B', 'Pending', '2026-06-27')
ON CONFLICT (id) DO NOTHING;


-- 5. Create MEETINGS / ADVISORY table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  student_name TEXT,
  hostel_name TEXT,
  type TEXT,
  date TEXT,
  time TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Meetings
INSERT INTO meetings (id, student_id, student_name, hostel_name, type, date, time, reason, status) VALUES
('meet-1', 'STU-2024-8842', 'Alex Thompson', 'Pine Crest Residency', 'In-Person', '2026-06-30', '14:00', 'Discuss room double occupancy guidelines and rules.', 'Pending'),
('meet-2', 'STU-2024-8842', 'Alex Thompson', 'Pine Crest Residency', 'Video Call', '2026-06-25', '10:30', 'Pre-checkin query about high speed internet access.', 'Approved')
ON CONFLICT (id) DO NOTHING;


-- 6. Create NOTIFICATIONS table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  date TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Notifications
INSERT INTO notifications (id, student_id, title, message, type, date, read) VALUES
('notif-1', 'STU-2024-8842', 'Welcome to PineVela Residencies', 'Your room assignment in Starlight Residency has been successfully activated. Use your digital key to unlock.', 'success', '2026-06-28', FALSE),
('notif-2', 'STU-2024-8842', 'Pre-checkin Meeting Approved', 'Your pre-checkin video call meeting scheduled for 2026-06-25 at 10:30 has been Approved.', 'info', '2026-06-24', TRUE)
ON CONFLICT (id) DO NOTHING;


-- 7. Create RATINGS table
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  student_name TEXT,
  hostel_id TEXT,
  hostel_name TEXT,
  score INTEGER,
  review TEXT,
  date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Ratings
INSERT INTO ratings (id, student_id, student_name, hostel_id, hostel_name, score, review, date) VALUES
('rate-1', 'STU-2024-8842', 'Alex Thompson', 'hostel-1', 'Pine Crest Residency', 5, 'Clean rooms, fast WiFi, and highly responsive support staff!', '2026-06-27')
ON CONFLICT (id) DO NOTHING;


-- 8. Create ACTIVITIES table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Activities
INSERT INTO activities (id, text, time, type) VALUES
('act-1', 'Maintenance Task #T-992 marked as resolved.', '12 mins ago', 'success'),
('act-2', 'New manager added to Sapphire Gardens.', '1 hour ago', 'info'),
('act-3', 'Emerald Heights Block B status changed to ''Maintenance''.', '4 hours ago', 'warning'),
('act-4', 'Low occupancy alert triggered for Ivory Towers.', 'Yesterday', 'danger')
ON CONFLICT (id) DO NOTHING;


-- 9. Create STAFF table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  email TEXT,
  hostel_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Staff
INSERT INTO staff (id, name, role, phone, contact_method, email, hostel_id) VALUES
('staff-1', 'John Doe', 'Plumber', '+23324123456', 'WhatsApp', 'john.doe@pinevela.com', 'hostel-1'),
('staff-2', 'Jane Smith', 'Electrician', '+23324123457', 'Email', 'jane.smith@pinevela.com', 'hostel-1')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- END OF SCHEMA SCRIPT
-- ==========================================
