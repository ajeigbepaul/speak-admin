// import { CompleteCounsellorProfileForm } from '@/components/auth/CompleteCounsellorProfileForm';

import { Suspense } from "react";
import { CompleteCounsellorProfileForm } from "@/components/auth/CompleteCounsellorProfileForm";

export default function CompleteProfilePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-xl">
        <Suspense fallback={<div>Loading...</div>}>
          <CompleteCounsellorProfileForm />
        </Suspense>
      </div>
    </main>
  );
}
