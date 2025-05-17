
import { StatCard } from "@/components/dashboard/StatCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { PendingVerificationsCard } from "@/components/dashboard/PendingVerificationsCard";
import { mockDashboardAnalytics, mockMonthlyData, mockChatStatusData } from "@/lib/mockData";
import type { Counsellor } from '@/lib/types';
import { Users, UserCheck, MessageSquare, ListChecks } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

const monthlyChartConfig = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  counsellors: { label: "Counsellors", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const chatStatusChartConfig = {
  Pending: { label: "Pending", color: "hsl(var(--chart-1))" },
  Active: { label: "Active", color: "hsl(var(--chart-2))" },
  Resolved: { label: "Resolved", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

async function getCounsellorsForDashboard(): Promise<Counsellor[]> {
  try {
    const counsellorsCol = collection(db, 'counsellors'); // Changed back to "counsellors"
    const q = query(counsellorsCol, orderBy("createdAt", "desc"));
    const counsellorSnapshot = await getDocs(q);
    const counsellorsList = counsellorSnapshot.docs.map(doc => {
      const data = doc.data();
      
      let status: Counsellor['status'] = 'Pending';
      // Prioritize 'status' field if it exists
      if (data.status && ["Pending", "Verified", "Rejected"].includes(data.status)) {
        status = data.status as Counsellor['status'];
      } else if (typeof data.isVerified === 'boolean') {
        // Fallback to 'isVerified' if 'status' is not present or invalid
        status = data.isVerified ? 'Verified' : 'Pending';
      }
      
      let createdAtString = new Date().toISOString();
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        createdAtString = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
         try {
          createdAtString = new Date(data.createdAt).toISOString();
        } catch (e) {
          // keep fallback if string is not a valid date
        }
      }

      return {
        id: doc.id,
        fullName: data.personalInfo?.fullName || 'N/A',
        email: data.personalInfo?.email || 'N/A',
        phoneNumber: data.personalInfo?.phoneNumber,
        profilePic: data.personalInfo?.profilePic || `https://placehold.co/150x150.png?text=${(data.personalInfo?.fullName || 'N/A').charAt(0)}`,
        specialization: data.professionalInfo?.occupation,
        createdAt: createdAtString,
        status: status,
      } as Counsellor;
    });
    return counsellorsList;
  } catch (error) {
    console.error("Error fetching counsellors for dashboard:", error);
    return [];
  }
}


export default async function DashboardPage() {
  const analytics = mockDashboardAnalytics; 
  const monthlyData = mockMonthlyData;
  const chatStatusData = mockChatStatusData;
  const counsellors = await getCounsellorsForDashboard(); 

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Users" value={analytics.totalUsers} icon={Users} description="Registered users on the platform" />
        <StatCard title="Total Counsellors" value={counsellors.length} icon={UserCheck} description="Counsellors from Firestore" />
        <StatCard title="Pending Chats" value={analytics.pendingChatRequests} icon={MessageSquare} description="Awaiting counsellor response" />
        <StatCard title="Active Chats" value={analytics.activeChats} icon={MessageSquare} description="Ongoing conversations" className="text-primary" />
        <StatCard title="Resolved Cases" value={analytics.resolvedCases} icon={ListChecks} description="Successfully concluded sessions" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsChart
          title="User & Counsellor Growth"
          description="Monthly registration trends"
          data={monthlyData}
          chartType="line"
          config={monthlyChartConfig}
          dataKeys={["users", "counsellors"]}
          xAxisDataKey="month"
          className="lg:col-span-2"
        />
        <AnalyticsChart
          title="Chat Status Overview"
          description="Distribution of chat statuses"
          data={chatStatusData}
          chartType="pie"
          config={chatStatusChartConfig}
          dataKeys={[{name: "value"}]}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-1">
         <PendingVerificationsCard counsellors={counsellors} />
      </div>
    </div>
  );
}
