import { StatCard } from "@/components/dashboard/StatCard";
import { PendingVerificationsCard } from "@/components/dashboard/PendingVerificationsCard";
import { RealTimeAnalytics } from "@/components/dashboard/RealTimeAnalytics";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import type { Counsellor } from '@/lib/types';
import { Users, UserCheck, MessageSquare, ListChecks } from "lucide-react";
import { adminDb } from '@/lib/firebase-admin';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Welcome from "@/components/dashboard/Welcome";

export const dynamic = 'force-dynamic';

async function getCounsellorsForDashboard(): Promise<Counsellor[]> {
  try {
    const snapshot = await adminDb.collection('counselors').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();

      let status: Counsellor['status'] = 'Pending';
      if (data.status && ["Pending", "Verified", "Rejected", "Invited"].includes(data.status)) {
        status = data.status as Counsellor['status'];
      } else {
        status = data.isVerified ? 'Verified' : 'Pending';
      }

      let createdAtString = new Date().toISOString();
      if (data.createdAt?.toDate) createdAtString = data.createdAt.toDate().toISOString();

      return {
        id: doc.id,
        personalInfo: {
          fullName: data.personalInfo?.fullName || 'N/A',
          email: data.personalInfo?.email || 'N/A',
          phoneNumber: data.personalInfo?.phoneNumber,
          profilePic: data.personalInfo?.profilePic ||
            `https://placehold.co/150x150.png?text=${(data.personalInfo?.fullName || 'N').charAt(0)}`,
        },
        professionalInfo: { occupation: data.professionalInfo?.occupation },
        createdAt: createdAtString,
        isVerified: data.isVerified || false,
        status,
      } as Counsellor;
    });
  } catch (error) {
    console.error("Error fetching counsellors for dashboard:", error);
    return [];
  }
}

async function getUsersCount(): Promise<number> {
  try {
    const snapshot = await adminDb.collection('users').count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

async function getChatStats(): Promise<{ pending: number; active: number; resolved: number }> {
  try {
    const [pending, active, resolved] = await Promise.all([
      adminDb.collection('posts').where('status', '==', 'pending').count().get(),
      adminDb.collection('posts').where('status', '==', 'accepted').count().get(),
      adminDb.collection('posts').where('status', '==', 'completed').count().get(),
    ]);
    return {
      pending:  pending.data().count,
      active:   active.data().count,
      resolved: resolved.data().count,
    };
  } catch {
    return { pending: 0, active: 0, resolved: 0 };
  }
}

export default async function DashboardPage() {
  const [counsellors, totalUsersCount, chatStats] = await Promise.all([
    getCounsellorsForDashboard(),
    getUsersCount(),
    getChatStats(),
  ]);

  return (
    <div className="space-y-10 p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Welcome />
        <Link href="/invite?userType=counselor">
          <Button className="bg-primary text-white px-6 py-5 text-base">+ Invite Counsellor</Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Link href="/admins" className="block">
          <StatCard title="Total Users" value={totalUsersCount} icon={Users} description="Registered users" />
        </Link>
        <Link href="/counsellors" className="block">
          <StatCard title="Total Counsellors" value={counsellors.length} icon={UserCheck} description="Counsellors on platform" />
        </Link>
        <Link href="/counsellors?status=pending" className="block">
          <StatCard title="Pending Chats" value={chatStats.pending} icon={MessageSquare} description="Awaiting response" />
        </Link>
        <Link href="/counsellors?status=active" className="block">
          <StatCard title="Active Chats" value={chatStats.active} icon={MessageSquare} description="Ongoing conversations" className="text-primary" />
        </Link>
        <Link href="/counsellors?status=resolved" className="block col-span-2 lg:col-span-1">
          <StatCard title="Resolved Cases" value={chatStats.resolved} icon={ListChecks} description="Successfully concluded" />
        </Link>
      </div>

      {/* Real-time analytics — full width */}
      <RealTimeAnalytics />

      {/* Bottom row — cards stretch to equal height */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        <PendingVerificationsCard counsellors={counsellors} className="h-full" />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
