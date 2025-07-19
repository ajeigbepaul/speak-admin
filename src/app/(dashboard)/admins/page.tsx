import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, where, getCountFromServer } from "firebase/firestore";
import type { AppUser, UserRole } from "@/lib/types";
import { UserList } from "@/components/admins/UserList"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Shield, UserCheck } from "lucide-react";
import Link from "next/link";

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
        name: data.name || 'N/A', 
        createdAt: createdAtString,
      } as AppUser;
    });
    return usersList;
  } catch (error) {
    console.error("Error fetching users:", error);
    return []; 
  }
}

async function getUserStats(): Promise<{ total: number; admins: number; users: number; superadmins: number }> {
  try {
    const usersCol = collection(db, 'users');
    
    const [totalSnapshot, adminSnapshot, userSnapshot, superadminSnapshot] = await Promise.all([
      getCountFromServer(usersCol),
      getCountFromServer(query(usersCol, where("role", "==", "admin"))),
      getCountFromServer(query(usersCol, where("role", "==", "user"))),
      getCountFromServer(query(usersCol, where("role", "==", "superadmin")))
    ]);

    return {
      total: totalSnapshot.data().count,
      admins: adminSnapshot.data().count,
      users: userSnapshot.data().count,
      superadmins: superadminSnapshot.data().count
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { total: 0, admins: 0, users: 0, superadmins: 0 };
  }
}

export default async function UserManagementPage() {
  const [users, userStats] = await Promise.all([
    getUsers(),
    getUserStats()
  ]);

  return (
    <div className="space-y-8">
      {/* Header with stats and quick action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin management</h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and system access.
          </p>
        </div>
        <Link href="/invite?userType=admin">
          <Button className="bg-primary text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Admin
          </Button>
        </Link>
      </div>

      {/* User statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{userStats.admins}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
                <p className="text-2xl font-bold">{userStats.users}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold">{userStats.superadmins}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions. Click on any user to view details or perform actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserList initialUsers={users} />
        </CardContent>
      </Card>
    </div>
  );
}
