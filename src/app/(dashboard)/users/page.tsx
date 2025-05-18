
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import type { AppUser, UserRole } from "@/lib/types";
import { UserList } from "@/components/users/UserList"; 

async function getUsers(): Promise<AppUser[]> {
  try {
    const usersCol = collection(db, 'users');
    // Query for users where role is 'admin', 'superadmin', or 'user'
    const q = query(
      usersCol, 
      where("role", "in", ["admin", "superadmin", "user"] as UserRole[]), 
      orderBy("createdAt", "desc")
    );
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

      // Ensure role is one of the expected types
      const role = data.role as UserRole;

      return {
        uid: doc.id,
        email: data.email || 'N/A',
        role: role, 
        name: data.name, 
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
            Manage existing user roles and permissions.
          </p>
        </div>
        {/* "Invite User" button removed from here */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Users</CardTitle>
          <CardDescription>A list of all administrative and regular users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserList initialUsers={users} />
        </CardContent>
      </Card>
    </div>
  );
}
