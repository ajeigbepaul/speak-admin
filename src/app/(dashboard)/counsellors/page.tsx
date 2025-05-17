
import { CounsellorTable } from '@/components/counsellors/CounsellorTable';
import { mockCounsellors } from '@/lib/mockData';
import type { Counsellor } from '@/lib/types';

// In a real app, fetch this data from your backend
async function getCounsellors(): Promise<Counsellor[]> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockCounsellors;
}

export default async function CounsellorsPage() {
  const counsellors = await getCounsellors();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Counsellor Management</h2>
        <p className="text-muted-foreground">
          View, verify, and manage counsellor profiles.
        </p>
      </div>
      <CounsellorTable initialCounsellors={counsellors} />
    </div>
  );
}
