
export type UserRole = "superadmin" | "admin";

// User type for AuthContext (simpler, focused on auth session)
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

// AppUser type for users stored in Firestore 'users' collection
export interface AppUser {
  uid: string; // Typically matches Firebase Auth UID
  email: string;
  role: UserRole;
  name?: string; // Name might not always be present initially
  createdAt: any; // Firestore Timestamp or ISO string after conversion
  // Add any other fields you store per user
}

export type CounsellorStatus = "Pending" | "Verified" | "Rejected";

export interface Counsellor {
  id: string; // Document ID from Firestore
  fullName: string; // from personalInfo.fullName
  email: string; // from personalInfo.email
  phoneNumber?: string; // from personalInfo.phoneNumber
  profilePic?: string; // from personalInfo.profilePic
  specialization?: string; // from professionalInfo.occupation
  createdAt: string; // ISO Date string, from root createdAt Firestore Timestamp
  updatedAt?: string; // ISO Date string, from root updatedAt Firestore Timestamp
  isVerified: boolean; // Root level boolean, determines status
  status: CounsellorStatus; // Derived from isVerified or a root status field
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

// For the Chat Status Pie Chart
export interface ChatStatusData {
  name: "Pending" | "Active" | "Resolved"; // Matches keys in chatStatusChartConfig
  value: number;
  fill?: string; // Optional, as ChartContainer can handle colors via config
}

export type ChatSessionStatus = "Pending" | "Active" | "Resolved" | "ClosedByUser" | "ClosedByCounsellor";

export interface ChatSession {
  id: string;
  userId: string;
  counsellorId?: string;
  status: ChatSessionStatus;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  lastMessage?: string;
  userUnreadMessages?: number;
  counsellorUnreadMessages?: number;
  // other relevant fields
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
