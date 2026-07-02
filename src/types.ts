export interface Hostel {
  id: string;
  name: string;
  location: string;
  wing: 'North Wing' | 'South Side' | 'East Side' | 'West Campus' | 'Other';
  status: 'Open' | 'Full' | 'Under Maintenance';
  bedsLeft: number;
  totalCapacity: number;
  availableSpaces: number;
  image: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  description: string;
  rating?: number;
  registrationDate?: string;
  subscriptionPaid?: boolean;
}

export interface IssueReport {
  id: string;
  title: string;
  category: string;
  urgency: 'Low' | 'Medium' | 'High';
  description: string;
  photos: string[];
  contactMethod: 'In-app Notification' | 'Phone Call' | 'Email';
  studentName: string;
  studentId: string;
  hostelName: string;
  blockFloor: string;
  roomBed: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  date: string;
  studentAcceptedResolved?: boolean;
  assignedStaffId?: string;
  staffCompleted?: boolean;
}

export interface MeetingRequest {
  id: string;
  studentId: string;
  studentName: string;
  hostelName: string;
  type: 'Video Call' | 'Chat' | 'In-Person';
  date: string;
  time: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Declined';
  roomNumber?: string;
}

export interface Notification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
}

export interface HostelRating {
  id: string;
  studentId: string;
  studentName: string;
  hostelId: string;
  hostelName: string;
  score: number; // 1-5
  review: string;
  date: string;
}

export interface BookingRequest {
  id: string;
  studentName: string;
  studentId: string;
  roomType: string;
  hostelName: string;
  avatar: string;
  status: 'Pending' | 'Approved' | 'Ignored';
}

export interface MaintenanceStatus {
  electricity: 'Stable' | 'Intermittent' | 'Critical';
  wifi: 'Stable' | 'Intermittent' | 'Critical';
  water: 'Active' | 'Intermittent' | 'Critical';
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  contactMethod: 'WhatsApp' | 'Email';
  email?: string;
  hostelId: string;
}

export type ActiveScreen =
  | 'public-browse'        // Page 1
  | 'student-login'        // Page 3
  | 'student-submitted'    // Page 4
  | 'student-dashboard'    // Page 5
  | 'student-report-issue' // Page 6
  | 'manager-login'        // Page 7
  | 'manager-dashboard'    // Page 8
  | 'manager-configure'    // Page 9
  | 'manager-hostel-dashboard' // Page 10 (Single Hostel Manager Dashboard)
  | 'staff-dashboard' // New Staff Dashboard Screen
;
