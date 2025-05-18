
import { SetInitialPasswordForm } from '@/components/auth/SetInitialPasswordForm';
import { Suspense } from 'react';

// Helper component to extract query params because useSearchParams can only be used in Client Components
function SetInitialPasswordFormWrapper() {
  return <SetInitialPasswordForm />;
}

export default function SetInitialPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Suspense fallback={<div className="text-foreground">Loading form...</div>}>
        <SetInitialPasswordFormWrapper />
      </Suspense>
    </main>
  );
}
