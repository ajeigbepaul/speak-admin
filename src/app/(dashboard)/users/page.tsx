
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

// Mock data for now - in a real app, this would come from a database
const mockUsers = [
  { id: "admin001", name: "Admin User", email: "pdave4krist@gmail.com", role: "superadmin", status: "Active" },
  { id: "user002", name: "Jane Doe", email: "jane.doe@example.com", role: "admin", status: "Active" },
  { id: "user003", name: "John Smith", email: "john.smith@example.com", role: "admin", status: "Invited" },
];

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Invite new users and manage existing user roles and permissions.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Users</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Basic list for now, will be replaced with a table later */}
          <ul className="space-y-2">
            {mockUsers.map(user => (
              <li key={user.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{user.name} <span className="text-xs text-muted-foreground">({user.role})</span></p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {user.status}
                </span>
              </li>
            ))}
          </ul>
          {mockUsers.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No users found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
