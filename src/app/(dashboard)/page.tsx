import { StatCard } from "@/components/dashboard/StatCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { PendingVerificationsCard } from "@/components/dashboard/PendingVerificationsCard";
import { mockMonthlyData } from "@/lib/mockData"; // Keep this for now for the line chart
import type { Counsellor, ChatStatusData, ChatSession, AppUser } from '@/lib/types';
import { Users, UserCheck, MessageSquare, ListChecks } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, where,getCountFromServer } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const monthlyChartConfig = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  counsellors: { label: "Counsellors", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

// This config should align with the `name` property in ChatStatusData
const chatStatusChartConfig = {
  Pending: { label: "Pending", color: "hsl(var(--chart-1))" },
  Active: { label: "Active", color: "hsl(var(--chart-2))" },
  Resolved: { label: "Resolved", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;


async function getCounsellorsForDashboard(): Promise<Counsellor[]> {
  try {
    const counsellorsCol = collection(db, 'counselors');
    const q = query(counsellorsCol, orderBy("createdAt", "desc"));
    const counsellorSnapshot = await getDocs(q);
    const counsellorsList = counsellorSnapshot.docs.map(doc => {
      const data = doc.data();
      
      let status: Counsellor['status'] = 'Pending';
      if (data.status && ["Pending", "Verified", "Rejected"].includes(data.status)) {
        status = data.status as Counsellor['status'];
      } else { // Fallback to isVerified if status field is missing or invalid
        status = data.isVerified ? 'Verified' : 'Pending';
      }
      
      let createdAtString = new Date().toISOString();
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        createdAtString = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
         try {
          createdAtString = new Date(data.createdAt).toISOString();
        } catch (e) {
          // keep fallback
        }
      }

      return {
        id: doc.id,
        personalInfo: {
          fullName: data.personalInfo?.fullName || 'N/A',
          email: data.personalInfo?.email || 'N/A',
          phoneNumber: data.personalInfo?.phoneNumber,
          profilePic: data.personalInfo?.profilePic || `https://placehold.co/150x150.png?text=${(data.personalInfo?.fullName || 'N/A').charAt(0)}`,
        },
        professionalInfo: {
          occupation: data.professionalInfo?.occupation,
        },
        createdAt: createdAtString,
        isVerified: data.isVerified || false, // Ensure isVerified exists
        status: status,
      } as Counsellor;
    });
    return counsellorsList;
  } catch (error) {
    console.error("Error fetching counsellors for dashboard:", error);
    return [];
  }
}

async function getUsersCount(): Promise<number> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCol);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching users count:", error);
    return 0;
  }
}

interface ChatStats {
  pending: number;
  active: number;
  resolved: number;
}

async function getChatStats(): Promise<ChatStats> {
  const stats: ChatStats = { pending: 0, active: 0, resolved: 0 };
  try {
    const chatsCol = collection(db, 'posts'); // Assuming collection name is 'chats'
    
    const pendingQuery = query(chatsCol, where("status", "==", "pending"));
    const activeQuery = query(chatsCol, where("status", "==", "active"));
    const resolvedQuery = query(chatsCol, where("status", "==", "resolved"));

    const [pendingSnapshot, activeSnapshot, resolvedSnapshot] = await Promise.all([
      getCountFromServer(pendingQuery),
      getCountFromServer(activeQuery),
      getCountFromServer(resolvedQuery)
    ]);

    stats.pending = pendingSnapshot.data().count;
    stats.active = activeSnapshot.data().count;
    stats.resolved = resolvedSnapshot.data().count;

  } catch (error) {
    console.error("Error fetching chat stats:", error);
    // Return 0 for all if an error occurs
  }
  return stats;
}


export default async function DashboardPage() {
  const monthlyData = mockMonthlyData; // User & Counsellor Growth can still use mock for now
  
  const counsellors = await getCounsellorsForDashboard();
  const totalUsersCount = await getUsersCount();
  const chatStats = await getChatStats();

  const chatStatusForPieChart: ChatStatusData[] = [
    { name: 'Pending', value: chatStats.pending, fill: 'var(--color-chart-1)' },
    { name: 'Active', value: chatStats.active, fill: 'var(--color-chart-2)' },
    { name: 'Resolved', value: chatStats.resolved, fill: 'var(--color-chart-3)' },
  ];

  return (
    <div className="space-y-8">
      {/* Header with welcome and quick action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome, Admin</h1>
          <p className="text-muted-foreground">Here's what's happening on your platform today.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/invite">
            <Button className="bg-primary text-white">+ Invite Counsellor</Button>
          </Link>
          <Avatar>
            <AvatarImage src="/avatar.png" alt="Admin Avatar" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link href="/users" className="cursor-pointer">
          <StatCard title="Total Users" value={totalUsersCount} icon={Users} description="Registered users (from Firestore)" />
        </Link>
        <Link href="/counsellors" className="cursor-pointer">
          <StatCard title="Total Counsellors" value={counsellors.length} icon={UserCheck} description="Counsellors from Firestore" />
        </Link>
        <Link href="/counsellors?status=pending" className="cursor-pointer">
          <StatCard title="Pending Chats" value={chatStats.pending} icon={MessageSquare} description="Awaiting counsellor response" />
        </Link>
        <Link href="/counsellors?status=active" className="cursor-pointer">
          <StatCard title="Active Chats" value={chatStats.active} icon={MessageSquare} description="Ongoing conversations" className="text-primary" />
        </Link>
        <Link href="/counsellors?status=resolved" className="cursor-pointer">
          <StatCard title="Resolved Cases" value={chatStats.resolved} icon={ListChecks} description="Successfully concluded sessions" />
        </Link>
      </div>

      {/* Main analytics and activity grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <AnalyticsChart
            title="User & Counsellor Growth"
            description="Monthly registration trends (mock data)"
            data={monthlyData}
            chartType="line"
            config={monthlyChartConfig}
            dataKeys={["users", "counsellors"]}
            xAxisDataKey="month"
            className="h-full"
          />
        </div>
        <div>
          <AnalyticsChart
            title="Chat Status Overview"
            description="Distribution of chat statuses (from Firestore)"
            data={chatStatusForPieChart}
            chartType="pie"
            config={chatStatusChartConfig}
            dataKeys={[{name: "value"}]}
          />
        </div>
      </div>

      {/* Pending verifications and recent activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-2">Pending Verifications</h2>
          <PendingVerificationsCard counsellors={counsellors.filter(c => c.status === 'Pending')} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          {/* Placeholder for recent activity feed */}
          <div className="bg-muted rounded-lg p-4 text-muted-foreground text-sm">No recent activity yet.</div>
        </div>
      </div>
    </div>
  );
}
