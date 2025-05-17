
import type { Counsellor, DashboardAnalytics, MonthlyData, ChatStatusData, AppNotification, User } from './types';

export const mockAdminUser: User = {
  id: 'admin001',
  name: 'Admin User',
  email: 'pdave4krist@gmail.com',
  avatarUrl: 'https://placehold.co/100x100.png',
  role: 'superadmin',
};

// Mock counsellors are less relevant now as data is fetched from Firestore
// but can be kept for reference or testing if Firestore is unavailable.
export const mockCounsellors: Counsellor[] = [
  {
    id: 'coun001',
    fullName: 'Dr. Alice Wonderland',
    email: 'alice@example.com',
    specialization: 'Cognitive Behavioral Therapy',
    createdAt: new Date(2023, 5, 15).toISOString(),
    status: 'Verified',
    profilePic: 'https://placehold.co/150x150.png?a=1',
    // verificationDocuments: [{ name: 'License.pdf', url: '#' }, { name: 'Degree.pdf', url: '#' }],
    // bio: 'Experienced CBT specialist with over 10 years of practice.',
  },
  {
    id: 'coun002',
    fullName: 'Bob The Builder',
    email: 'bob@example.com',
    specialization: 'Family Therapy',
    createdAt: new Date(2023, 8, 20).toISOString(),
    status: 'Pending',
    profilePic: 'https://placehold.co/150x150.png?a=2',
    // verificationDocuments: [{ name: 'Cert.pdf', url: '#' }],
    // bio: 'Focuses on family dynamics and conflict resolution.',
  },
];

export const mockDashboardAnalytics: DashboardAnalytics = {
  totalUsers: 1250,
  totalCounsellors: 75, // This will be overridden by live data
  pendingChatRequests: 15,
  activeChats: 30,
  resolvedCases: 890,
};

export const mockMonthlyData: MonthlyData[] = [
  { month: 'Jan', users: 100, counsellors: 5 },
  { month: 'Feb', users: 150, counsellors: 8 },
  { month: 'Mar', users: 220, counsellors: 12 },
  { month: 'Apr', users: 300, counsellors: 15 },
  { month: 'May', users: 280, counsellors: 18 },
  { month: 'Jun', users: 350, counsellors: 20 },
];

export const mockChatStatusData: ChatStatusData[] = [
  { name: 'Pending', value: 15, fill: 'var(--color-chart-1)' },
  { name: 'Active', value: 30, fill: 'var(--color-chart-2)' },
  { name: 'Resolved', value: 890, fill: 'var(--color-chart-3)' },
];

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif001',
    type: 'new_counsellor',
    title: 'New Counsellor Registration',
    message: 'Bob The Builder has registered and is awaiting verification.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    read: false,
    link: '/counsellors?action=verify&id=coun002', // Ensure ID matches a potential counsellor
  },
  {
    id: 'notif002',
    type: 'chat_request',
    title: 'Urgent Chat Request',
    message: 'A user has initiated an urgent chat request.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: true,
  },
  {
    id: 'notif003',
    type: 'general',
    title: 'System Update Scheduled',
    message: 'A system update is scheduled for tomorrow at 2 AM.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
];
