'use client';

import { CounselorPerformance } from "@/components/counsellors/CounselorPerformance";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CounselorPerformancePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Counselor
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Counselor Performance</h1>
          <p className="text-muted-foreground">
            Detailed performance metrics and analytics.
          </p>
        </div>
      </div>
      
      <CounselorPerformance counselorId={params.id} />
    </div>
  );
}