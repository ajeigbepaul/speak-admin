
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import type { AppUser } from "@/lib/types";
import { UserList } from "@/components/users/UserList"; // We'll create this component

async function getUsers(): Promise<AppUser[]> {
  try {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, orderBy("createdAt", "desc"));
    const usersSnapshot = await getDocs(q);
    const usersList = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      let createdAtString = new Date().toISOString(); // Fallback
      if (data.createdAt && data.createdAt instanceof Timestamp) {
        createdAtString = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        try {
          createdAtString = new Date(data.createdAt).toISOString();
        } catch (e) {
          // keep fallback
        }
      }

      return {
        uid: doc.id,
        email: data.email || 'N/A',
        role: data.role || 'admin', // Default to admin if role is missing
        name: data.name, // Optional name
        createdAt: createdAtString,
      } as AppUser;
    });
    return usersList;
  } catch (error) {
    console.error("Error fetching users:", error);
    return []; 
  }
}

export default async function UserManagementPage() {
  const users = await getUsers();

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
          <UserList users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
