
import { StatCard } from "@/components/dashboard/StatCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { PendingVerificationsCard } from "@/components/dashboard/PendingVerificationsCard";
import { mockDashboardAnalytics, mockMonthlyData, mockChatStatusData } from "@/lib/mockData"; // Removed mockCounsellors
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

// Function to fetch counsellors (similar to the one in counsellors/page.tsx)
async function getCounsellorsForDashboard(): Promise<Counsellor[]> {
  try {
    const counsellorsCol = collection(db, 'counsellors');
    const q = query(counsellorsCol, orderBy("registrationDate", "desc"));
    const counsellorSnapshot = await getDocs(q);
    const counsellorsList = counsellorSnapshot.docs.map(doc => {
      const data = doc.data();
      let status: Counsellor['status'] = 'Pending';

      if (data.status) {
        status = data.status as Counsellor['status'];
      } else if (typeof data.isVerified === 'boolean') {
        status = data.isVerified ? 'Verified' : 'Pending';
      }
      
      let registrationDateString = new Date().toISOString();
      if (data.registrationDate && data.registrationDate instanceof Timestamp) {
        registrationDateString = data.registrationDate.toDate().toISOString();
      } else if (typeof data.registrationDate === 'string') {
        registrationDateString = data.registrationDate;
      }

      return {
        id: doc.id,
        name: data.name || 'N/A',
        email: data.email || 'N/A',
        specialization: data.specialization || 'N/A',
        registrationDate: registrationDateString,
        status: status,
        bio: data.bio || undefined,
        profilePictureUrl: data.profilePictureUrl || `https://placehold.co/150x150.png?text=${(data.name || 'N/A').charAt(0)}`,
        verificationDocuments: data.verificationDocuments || [],
      } as Counsellor;
    });
    return counsellorsList;
  } catch (error) {
    console.error("Error fetching counsellors for dashboard:", error);
    return [];
  }
}


export default async function DashboardPage() {
  const analytics = mockDashboardAnalytics; // Still using mock for some stats
  const monthlyData = mockMonthlyData;
  const chatStatusData = mockChatStatusData;
  const counsellors = await getCounsellorsForDashboard(); // Fetch live counsellor data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Users" value={analytics.totalUsers} icon={Users} description="Registered users on the platform" />
        <StatCard title="Total Counsellors" value={counsellors.length} icon={UserCheck} description="Counsellors from Firestore" /> {/* Updated to live count */}
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
         <PendingVerificationsCard counsellors={counsellors} /> {/* Pass live data */}
      </div>
    </div>
  );
}
