import { CounsellorTable } from '@/components/counsellors/CounsellorTable';
import type { Counsellor } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { CounsellorStatsCards } from "@/components/dashboard/CounsellorStatsCards";

export const dynamic = 'force-dynamic';

async function getCounsellors(): Promise<Counsellor[]> {
  try {
    const snapshot = await adminDb.collection('counselors').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();

      let status: Counsellor['status'] = 'Pending';
      if (data.status && ["Pending", "Verified", "Rejected", "Invited"].includes(data.status)) {
        status = data.status as Counsellor['status'];
      } else if (typeof data.isVerified === 'boolean') {
        status = data.isVerified ? 'Verified' : 'Pending';
      }

      let createdAtString = new Date().toISOString();
      if (data.createdAt?.toDate) {
        createdAtString = data.createdAt.toDate().toISOString();
      }

      return {
        id:          doc.id,
        fullName:    data.personalInfo?.fullName || 'N/A',
        email:       data.personalInfo?.email || 'N/A',
        phoneNumber: data.personalInfo?.phoneNumber,
        profilePic:  data.personalInfo?.profilePic ||
          `https://placehold.co/150x150.png?text=${(data.personalInfo?.fullName || 'N').charAt(0)}`,
        specialization: data.professionalInfo?.occupation,
        createdAt:   createdAtString,
        isVerified:  data.isVerified || false,
        status,
        accountDeactivated: data.accountStatus === "deactivated",
        deactivatedAt: data.deactivatedAt?.toDate ? data.deactivatedAt.toDate().toISOString() : undefined,
      } as unknown as Counsellor;
    });
  } catch (error) {
    console.error("Error fetching counsellors:", error);
    return [];
  }
}

export default async function CounsellorsPage() {
  const counsellors = await getCounsellors();

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Counsellor Management</h1>
          <p className="text-muted-foreground">Manage counsellor profiles, verifications, and system access.</p>
        </div>
        <Link href="/invite?userType=counselor">
          <Button className="bg-primary text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Counsellor
          </Button>
        </Link>
      </div>

      <CounsellorStatsCards />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Counsellor Profiles
          </CardTitle>
          <CardDescription>
            Review and manage counsellor applications, verifications, and profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CounsellorTable initialCounsellors={counsellors} />
        </CardContent>
      </Card>
    </div>
  );
}
