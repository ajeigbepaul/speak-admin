import type { Counsellor, DashboardAnalytics, MonthlyData, ChatStatusData, AppNotification } from './types';

export const mockAdminUser = {
  id: 'admin001',
  name: 'Admin User',
  email: 'admin@speak.app',
  avatarUrl: 'https://placehold.co/100x100.png',
};

export const mockCounsellors: Counsellor[] = [
  {
    id: 'coun001',
    name: 'Dr. Alice Wonderland',
    email: 'alice@example.com',
    specialization: 'Cognitive Behavioral Therapy',
    registrationDate: new Date(2023, 5, 15).toISOString(),
    status: 'Verified',
    bio: 'Experienced CBT specialist with over 10 years of practice.',
    profilePictureUrl: 'https://placehold.co/150x150.png?a=1',
    verificationDocuments: [{ name: 'License.pdf', url: '#' }, { name: 'Degree.pdf', url: '#' }],
  },
  {
    id: 'coun002',
    name: 'Bob The Builder',
    email: 'bob@example.com',
    specialization: 'Family Therapy',
    registrationDate: new Date(2023, 8, 20).toISOString(),
    status: 'Pending',
    bio: 'Focuses on family dynamics and conflict resolution.',
    profilePictureUrl: 'https://placehold.co/150x150.png?a=2',
    verificationDocuments: [{ name: 'Cert.pdf', url: '#' }],
  },
  {
    id: 'coun003',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    specialization: 'Stress Management',
    registrationDate: new Date(2024, 0, 10).toISOString(),
    status: 'Verified',
    bio: 'Helps clients develop coping mechanisms for stress and anxiety.',
    profilePictureUrl: 'https://placehold.co/150x150.png?a=3',
  },
  {
    id: 'coun004',
    name: 'Diana Prince',
    email: 'diana@example.com',
    specialization: 'Adolescent Psychology',
    registrationDate: new Date(2024, 1, 5).toISOString(),
    status: 'Pending',
    bio: 'Specializes in working with teenagers and young adults.',
    profilePictureUrl: 'https://placehold.co/150x150.png?a=4',
    verificationDocuments: [{ name: 'ID.pdf', url: '#' }, { name: 'Diploma.pdf', url: '#' }],
  },
    {
    id: 'coun005',
    name: 'Edward Scissorhands',
    email: 'edward@example.com',
    specialization: 'Art Therapy',
    registrationDate: new Date(2024, 2, 1).toISOString(),
    status: 'Rejected',
    bio: 'Uses creative methods to help clients express themselves.',
    profilePictureUrl: 'https://placehold.co/150x150.png?a=5',
  },
];

export const mockDashboardAnalytics: DashboardAnalytics = {
  totalUsers: 1250,
  totalCounsellors: 75,
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
    link: '/counsellors?highlight=coun002',
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
