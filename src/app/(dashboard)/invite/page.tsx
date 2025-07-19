'use client'

import { useSearchParams } from 'next/navigation';
import { InviteAdminForm } from "@/components/invite/InviteAdminForm";
import { InviteCounselorForm } from "@/components/invite/InviteCounselorForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InviteUserPage() {
  const searchParams = useSearchParams();
  const userType = searchParams.get('userType');

  const renderInviteForm = () => {
    switch (userType) {
      case 'admin':
        return (
          <>
            <CardHeader>
              <CardTitle>Invite Admin</CardTitle>
              <CardDescription>
                Fill in the details below to send an admin invitation. 
                Invited admins will need to complete their registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteAdminForm />
            </CardContent>
          </>
        );
      case 'counselor':
        return (
          <>
            <CardHeader>
              <CardTitle>Invite Counselor</CardTitle>
              <CardDescription>
                Fill in the details below to send a counselor invitation. 
                Invited counselors will need to complete their registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteCounselorForm />
            </CardContent>
          </>
        );
      case 'observer':
        return (
          <>
            <CardHeader>
              <CardTitle>Invite Counselor</CardTitle>
              <CardDescription>
                Fill in the details below to send a counselor invitation. 
                Invited counselors will need to complete their registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteCounselorForm />
            </CardContent>
          </>
        );
      default:
        return (
          <>
            <CardHeader>
              <CardTitle>No Invitation Type Selected</CardTitle>
              <CardDescription>
                Please specify an invitation type (admin or counselor) in the URL query parameter.
                Example: ?userType=admin or ?userType=counselor
              </CardDescription>
            </CardHeader>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {userType === 'admin' ? 'Invite Admin' : userType === 'counselor' ? 'Invite Counselor' : 'Invite Observer'}
        </h2>
        <p className="text-muted-foreground">
          {userType === 'admin'
            ? 'Invite new admins to manage the platform.'
            : userType === 'counselor'
            ? 'Invite new counselors to help users resolve issues.'
            : 'Invite new observer to the watch platform activities.'}
        </p>
      </div>
      <Card className="max-w-2xl mx-auto">
        {renderInviteForm()}
      </Card>
    </div>
  );
}