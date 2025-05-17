export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type CounsellorStatus = "Pending" | "Verified" | "Rejected";

export interface Counsellor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  registrationDate: string; // ISO Date string
  status: CounsellorStatus;
  bio?: string;
  profilePictureUrl?: string;
  verificationDocuments?: { name: string; url: string }[]; // Example
}

export interface DashboardAnalytics {
  totalUsers: number;
  totalCounsellors: number;
  pendingChatRequests: number;
  activeChats: number;
  resolvedCases: number;
}

export interface MonthlyData {
  month: string;
  users: number;
  counsellors: number;
}

export interface ChatStatusData {
  name: string;
  value: number;
  fill: string;
}

export type NotificationType = "new_counsellor" | "chat_request" | "general";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO Date string
  read: boolean;
  link?: string;
}
