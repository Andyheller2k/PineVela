import { Hostel, BookingRequest, IssueReport } from './types';

export const INITIAL_HOSTELS: Hostel[] = [
  {
    id: 'hostel-1',
    name: 'Pine Crest Residency',
    location: 'Campus North Wing, Block A',
    wing: 'North Wing',
    status: 'Open',
    bedsLeft: 12,
    totalCapacity: 250,
    availableSpaces: 42,
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    managerName: 'Sarah Johnson',
    managerPhone: '+23353836373',
    managerEmail: 'sarah.j@pinevela.com',
    description: 'A state-of-the-art accommodation facility featuring high-speed internet, 24/7 security, and modern recreational lounges designed specifically for the elite university student experience.',
    registrationDate: '2026-01-10',
    subscriptionPaid: true
  },
  {
    id: 'hostel-2',
    name: 'Vela Heights Hall',
    location: 'Main Street, West Campus',
    wing: 'West Campus',
    status: 'Full',
    bedsLeft: 0,
    totalCapacity: 180,
    availableSpaces: 0,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    managerName: 'David Miller',
    managerPhone: '+23354749393',
    managerEmail: 'david.m@pinevela.com',
    description: 'Vela Heights Hall offers excellent community living with spacious study halls, an on-site dining facility, and beautifully landscaped gardens perfect for relaxing after classes.',
    registrationDate: '2026-01-28',
    subscriptionPaid: false
  },
  {
    id: 'hostel-3',
    name: 'The Emerald Suites',
    location: 'University Gardens, East Side',
    wing: 'East Side',
    status: 'Open',
    bedsLeft: 45,
    totalCapacity: 300,
    availableSpaces: 45,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    managerName: 'Elena Rodriguez',
    managerPhone: '+23325849336',
    managerEmail: 'elena.r@pinevela.com',
    description: 'An elegant suite-style living complex offering premium private rooms, personal study desks, private bathrooms, and a quiet, distraction-free environment for serious academics.',
    registrationDate: '2026-02-14',
    subscriptionPaid: true
  },
  {
    id: 'hostel-4',
    name: 'Starlight Dormitory',
    location: 'South Gate, Perimeter Road',
    wing: 'South Side',
    status: 'Under Maintenance',
    bedsLeft: 5,
    totalCapacity: 200,
    availableSpaces: 5,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=80',
    managerName: 'Michael Chang',
    managerPhone: '+23358464833',
    managerEmail: 'michael.c@pinevela.com',
    description: 'A cozy traditional dormitory layout with a vibrant student association, fully equipped shared kitchens, and regular community social events near the sports complex.',
    registrationDate: '2026-03-01',
    subscriptionPaid: false
  },
  {
    id: 'hostel-5',
    name: 'Oakwood Common',
    location: 'Forest District, Block C',
    wing: 'North Wing',
    status: 'Open',
    bedsLeft: 28,
    totalCapacity: 150,
    availableSpaces: 28,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    managerName: 'Jessica White',
    managerPhone: '+23354748449',
    managerEmail: 'jessica.w@pinevela.com',
    description: 'Surrounded by beautiful nature trails, Oakwood Common combines rustic cabin charm with modern student conveniences like high-speed mesh WiFi and modular storage layouts.',
    registrationDate: '2026-03-20',
    subscriptionPaid: true
  },
  {
    id: 'hostel-6',
    name: 'Legacy House',
    location: 'Old Town University Quarter',
    wing: 'Other',
    status: 'Open',
    bedsLeft: 18,
    totalCapacity: 120,
    availableSpaces: 18,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    managerName: 'Robert Brown',
    managerPhone: '+23354847483',
    managerEmail: 'robert.b@pinevela.com',
    description: 'Located in the historic district, Legacy House features vintage exterior brickwork coupled with beautifully refurbished smart interiors, ideal for senior undergraduate students.',
    registrationDate: '2026-04-05',
    subscriptionPaid: true
  },
  {
    id: 'hostel-7',
    name: 'Nexus Living Lab',
    location: 'Tech Innovation Hub, Block 4',
    wing: 'North Wing',
    status: 'Open',
    bedsLeft: 3,
    totalCapacity: 80,
    availableSpaces: 3,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    managerName: 'Dr. Karen Smith',
    managerPhone: '+23324884674',
    managerEmail: 'karen.s@pinevela.com',
    description: 'Designed as a experimental smart living space in partnership with the Tech Department, featuring smart climate controls, biometric security, and dedicated collaborative workspaces.',
    registrationDate: '2026-04-18',
    subscriptionPaid: true
  },
  {
    id: 'hostel-8',
    name: 'Marigold Manor',
    location: 'South Campus, Block F',
    wing: 'South Side',
    status: 'Open',
    bedsLeft: 62,
    totalCapacity: 400,
    availableSpaces: 62,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    managerName: 'Anthony Davis',
    managerPhone: '+23326388499',
    managerEmail: 'anthony.d@pinevela.com',
    description: 'Our largest accommodation block, Marigold Manor offers premium student living facilities, a complete commercial laundry deck, multi-sport courts, and daily shuttle buses to major campus halls.',
    registrationDate: '2026-05-02',
    subscriptionPaid: false
  }
];

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
