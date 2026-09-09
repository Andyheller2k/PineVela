import { Hostel, BookingRequest, IssueReport } from './types';

// Clean dataset - static placeholder hostels removed as requested
export const INITIAL_HOSTELS: Hostel[] = [];

export const INITIAL_BOOKING_REQUESTS: BookingRequest[] = [
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

export const INITIAL_ISSUE_REPORTS: IssueReport[] = [
  {
    id: 'issue-1',
    title: 'Leaking Pipe in Washroom',
    category: 'Plumbing',
    urgency: 'High',
    description: 'The main water supply pipe in the Block B washroom has a steady leak, flooding the second stall corridor.',
    photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'],
    contactMethod: 'In-app Notification',
    studentName: 'Alex Henderson',
    studentId: 'STU-2024-8842',
    hostelName: 'PineView International',
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

export const PORTFOLIO_ACTIVITIES = [
  {
    id: 'act-1',
    text: 'Maintenance Task #T-992 marked as resolved.',
    time: '12 mins ago',
    type: 'success'
  },
  {
    id: 'act-2',
    text: 'New manager (David K.) added to Sapphire Gardens.',
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

export const MANAGER_NOTIFICATIONS = [
  {
    id: 'not-1',
    title: 'Water Maintenance',
    time: '2h ago',
    description: 'Scheduled maintenance for Block C water lines today between 2 PM - 4 PM.',
    type: 'warning'
  },
  {
    id: 'not-2',
    title: 'Issue Resolved',
    time: '5h ago',
    description: "Your report regarding 'AC Leakage' has been marked as resolved by Maintenance.",
    type: 'success'
  },
  {
    id: 'not-3',
    title: 'Laundry Schedule',
    time: 'Yesterday',
    description: 'New laundry slots for the weekend are now available for booking in the portal.',
    type: 'info'
  },
  {
    id: 'not-4',
    title: 'Hostel Fee Reminder',
    time: '2 days ago',
    description: 'Please ensure your monthly amenities fee is cleared by the 5th of next month.',
    type: 'info'
  }
];
