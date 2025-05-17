
import { CounsellorTable } from '@/components/counsellors/CounsellorTable';
import type { Counsellor } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

async function getCounsellors(): Promise<Counsellor[]> {
  try {
    const counsellorsCol = collection(db, 'counselors'); // Corrected collection name to 'counsellors'
    const q = query(counsellorsCol, orderBy("createdAt", "desc"));
    const counsellorSnapshot = await getDocs(q);
    const counsellorsList = counsellorSnapshot.docs.map(doc => {
      const data = doc.data();
      
      let status: Counsellor['status'] = 'Pending'; // Default
      if (data.status) { // If a root 'status' field exists
        status = data.status as Counsellor['status'];
      } else if (typeof data.isVerified === 'boolean') { // Fallback to 'isVerified'
        status = data.isVerified ? 'Verified' : 'Pending';
      }
      
      let createdAtString = new Date().toISOString(); // Fallback
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        createdAtString = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') { 
        createdAtString = data.createdAt;
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
    console.error("Error fetching counsellors:", error);
    return []; 
  }
}

export default async function CounsellorsPage() {
  const counsellors = await getCounsellors();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Counsellor Management</h2>
        <p className="text-muted-foreground">
          View, verify, and manage counsellor profiles from Firestore.
        </p>
      </div>
      <CounsellorTable initialCounsellors={counsellors} />
    </div>
  );
}
