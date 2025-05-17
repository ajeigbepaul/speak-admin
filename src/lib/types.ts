
export type UserRole = "superadmin" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole; // Added role
}

export type CounsellorStatus = "Pending" | "Verified" | "Rejected";

export interface Counsellor {
  id: string;
  fullName: string; // from personalInfo.fullName
  email: string; // from personalInfo.email
  phoneNumber?: string; // from personalInfo.phoneNumber
  profilePic?: string; // from personalInfo.profilePic
  specialization?: string; // from professionalInfo.occupation
  createdAt: string; // ISO Date string, from root createdAt
  status: CounsellorStatus; // Derived from root isVerified or root status
  // address might be added later if needed: data.personalInfo.address
  // verificationDocuments are no longer in the primary structure shown
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
