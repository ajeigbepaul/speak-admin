import { CounsellorTable } from '@/components/counsellors/CounsellorTable';
import type { Counsellor } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { CounsellorStatsCards } from "@/components/dashboard/CounsellorStatsCards";

async function getCounsellors(): Promise<Counsellor[]> {
  try {
    const counsellorsCol = collection(db, 'counselors');
    const q = query(counsellorsCol, orderBy("createdAt", "desc"));
    const counsellorSnapshot = await getDocs(q);
    const counsellorsList = counsellorSnapshot.docs.map(doc => {
      const data = doc.data();
      
      let status: Counsellor['status'] = 'Pending';
      if (data.status && ["Pending", "Verified", "Rejected", "Invited"].includes(data.status)) { 
        status = data.status as Counsellor['status'];
      } else if (typeof data.isVerified === 'boolean') { 
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
      } as unknown as Counsellor;
    });
    return counsellorsList;
  } catch (error) {
    console.error("Error fetching counsellors:", error);
    return []; 
  }
}

export default async function CounsellorsPage() {
  const counsellors = await getCounsellors();

  return (
    <div className="space-y-8">
      {/* Header with quick action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Counsellor Management</h1>
          <p className="text-muted-foreground">
            Manage counsellor profiles, verifications, and system access.
          </p>
        </div>
        <Link href="/invite?userType=counselor">
          <Button className="bg-primary text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Counsellor
          </Button>
        </Link>
      </div>

      {/* Real-time Counsellor statistics */}
      <CounsellorStatsCards />

      {/* Counsellor list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Counsellor Profiles
          </CardTitle>
          <CardDescription>
            Review and manage counsellor applications, verifications, and profiles. Click on any counsellor to view details or perform actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CounsellorTable initialCounsellors={counsellors} />
        </CardContent>
      </Card>
    </div>
  );
}
