
import { CounsellorTable } from '@/components/counsellors/CounsellorTable';
import type { Counsellor } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

async function getCounsellors(): Promise<Counsellor[]> {
  try {
    const counsellorsCol = collection(db, 'counsellors');
    // Consider adding orderBy if you want a specific default sort, e.g., by registrationDate
    const q = query(counsellorsCol, orderBy("registrationDate", "desc"));
    const counsellorSnapshot = await getDocs(q);
    const counsellorsList = counsellorSnapshot.docs.map(doc => {
      const data = doc.data();
      let status: Counsellor['status'] = 'Pending'; // Default

      if (data.status) {
        status = data.status as Counsellor['status'];
      } else if (typeof data.isVerified === 'boolean') {
        status = data.isVerified ? 'Verified' : 'Pending';
      }
      
      // Convert Firestore Timestamp to ISO string for registrationDate
      let registrationDateString = new Date().toISOString(); // Fallback
      if (data.registrationDate && data.registrationDate instanceof Timestamp) {
        registrationDateString = data.registrationDate.toDate().toISOString();
      } else if (typeof data.registrationDate === 'string') { // Handle if it's already a string
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
    console.error("Error fetching counsellors:", error);
    return []; // Return empty array on error
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
