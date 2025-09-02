"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { AppUser, UserRole } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  MoreHorizontal,
  UserX,
  Shield,
  ShieldAlert,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

// Extended user type with additional fields for UI
interface ExtendedUser extends AppUser {
  id: string;
  formattedDate: string;
  avatarUrl?: string;
  disabled?: boolean; // account suspension flag
  lastLoginAt?: any; // Firestore Timestamp | ISO string | Date
  updatedAt?: any; // optional updatedAt for convenience
}

export function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const canEditRoles = currentUser?.role === "superadmin";
  const canDeleteOrSuspend = currentUser?.role === "superadmin";
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<ExtendedUser>>({});
  const [activeTab, setActiveTab] = useState("all");
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const USERS_PER_PAGE = 10;

  // Fetch initial users
  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter, statusFilter, activeTab]);

  const fetchUsers = async (isLoadMore = false) => {
    try {
      setIsLoading(!isLoadMore);

      let usersQuery;

      if (isLoadMore && lastVisible) {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(USERS_PER_PAGE)
        );
      } else {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(USERS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(usersQuery);

      if (snapshot.empty) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      // Set the last visible document for pagination
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

      const fetchedUsers = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        const createdDate = data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date();
        const lastLogin = data.lastLoginAt?.toDate
          ? data.lastLoginAt.toDate()
          : data.lastLoginAt;

        const user: ExtendedUser = {
          uid: data.uid,
          email: data.email,
          role: data.role,
          name: data.name,
          createdAt: data.createdAt,
          profilePic: data.profilePic,
          photoURL: data.photoURL,
          id: docSnap.id,
          formattedDate: format(createdDate, "PPP"),
          avatarUrl: data.photoURL || data.profilePic || undefined,
          disabled: data.disabled ?? false,
          lastLoginAt: lastLogin,
          updatedAt: data.updatedAt,
        };

        return user;
      });

      setUsers((prev) =>
        isLoadMore ? [...prev, ...fetchedUsers] : fetchedUsers
      );
      setHasMore(snapshot.docs.length === USERS_PER_PAGE);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.uid.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (user) =>
          (statusFilter === "active" && !user.disabled) ||
          (statusFilter === "suspended" && user.disabled)
      );
    }

    // Apply tab filter
    if (activeTab !== "all") {
      if (activeTab === "users") {
        filtered = filtered.filter((user) => user.role === "user");
      } else if (activeTab === "admins") {
        filtered = filtered.filter(
          (user) => user.role === "admin" || user.role === "superadmin"
        );
      }
    }

    setFilteredUsers(filtered);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchUsers(true);
    }
  };

  const handleViewUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setEditedUser({
      name: user.name,
      role: user.role,
      disabled: user.disabled,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        ...editedUser,
        updatedAt: new Date(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, ...editedUser } : user
        )
      );

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        disabled: true,
        updatedAt: new Date(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, disabled: true } : user
        )
      );

      toast({
        title: "Success",
        description: "User suspended successfully",
      });

      setIsSuspendDialogOpen(false);
    } catch (error) {
      console.error("Error suspending user:", error);
      toast({
        title: "Error",
        description: "Failed to suspend user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnsuspendUser = async (user: ExtendedUser) => {
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        disabled: false,
        updatedAt: new Date(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, disabled: false } : u))
      );

      toast({
        title: "Success",
        description: "User unsuspended successfully",
      });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast({
        title: "Error",
        description: "Failed to unsuspend user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser.id);
      await deleteDoc(userRef);

      // Update local state
      setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id));

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setUsers([]);
    setLastVisible(null);
    setHasMore(true);
    fetchUsers();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage all users in your application
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="users">Regular Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or ID..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">
              No users found matching your criteria
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "superadmin"
                            ? "destructive"
                            : user.role === "admin"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.disabled ? "outline" : "default"}>
                        {user.disabled ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.formattedDate}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewUser(user)}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                          >
                            Edit user
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canDeleteOrSuspend && (
                            <>
                              {user.disabled ? (
                                <DropdownMenuItem
                                  onClick={() => handleUnsuspendUser(user)}
                                >
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Unsuspend user
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsSuspendDialogOpen(true);
                                  }}
                                  className="text-amber-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend user
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Delete user
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        {hasMore && (
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        )}
      </CardFooter>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about this user.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback>
                    {selectedUser.name?.charAt(0) ||
                      selectedUser.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedUser.name || "N/A"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.uid}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <Badge
                    variant={
                      selectedUser.role === "superadmin"
                        ? "destructive"
                        : selectedUser.role === "admin"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge
                    variant={selectedUser.disabled ? "outline" : "default"}
                  >
                    {selectedUser.disabled ? "Suspended" : "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.formattedDate}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Activity</p>
                <p className="text-sm text-muted-foreground">
                  Last login:{" "}
                  {selectedUser.lastLoginAt
                    ? format(new Date(selectedUser.lastLoginAt), "PPP")
                    : "Never"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditUser(selectedUser!);
              }}
            >
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's information.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editedUser.name || ""}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, name: e.target.value })
                  }
                />
              </div>

              {canEditRoles && (
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={editedUser.role}
                    onValueChange={(value) =>
                      setEditedUser({ ...editedUser, role: value as UserRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editedUser.disabled ? "suspended" : "active"}
                  onValueChange={(value) =>
                    setEditedUser({
                      ...editedUser,
                      disabled: value === "suspended",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <AlertDialog
        open={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend this user? They will not be able
              to access the application until unsuspended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              className="bg-amber-600"
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone and all user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
