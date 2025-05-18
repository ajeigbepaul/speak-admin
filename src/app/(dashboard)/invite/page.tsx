
import { InviteForm } from "@/components/invite/InviteForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InviteUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Invite New User</h2>
        <p className="text-muted-foreground">
          Invite new administrators or counselors to the platform.
        </p>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Invitation Details</CardTitle>
          <CardDescription>
            Fill in the details below to send an invitation. 
            Invited users will need to complete their registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>
    </div>
  );
}
