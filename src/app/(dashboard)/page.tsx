
import { StatCard } from "@/components/dashboard/StatCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { PendingVerificationsCard } from "@/components/dashboard/PendingVerificationsCard";
import { mockDashboardAnalytics, mockMonthlyData, mockChatStatusData, mockCounsellors } from "@/lib/mockData";
import { Users, UserCheck, MessageSquare, ListChecks, ShieldCheck, BarChart3, PieChartIcon } from "lucide-react";
import type { ChartConfig } from "@/components/ui/chart";

const monthlyChartConfig = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  counsellors: { label: "Counsellors", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const chatStatusChartConfig = {
  Pending: { label: "Pending", color: "hsl(var(--chart-1))" },
  Active: { label: "Active", color: "hsl(var(--chart-2))" },
  Resolved: { label: "Resolved", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;


export default async function DashboardPage() {
  // In a real app, fetch data here
  const analytics = mockDashboardAnalytics;
  const monthlyData = mockMonthlyData;
  const chatStatusData = mockChatStatusData;
  const counsellors = mockCounsellors;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Users" value={analytics.totalUsers} icon={Users} description="Registered users on the platform" />
        <StatCard title="Total Counsellors" value={analytics.totalCounsellors} icon={UserCheck} description="Verified counsellors" />
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
