
"use client";

import React, { useState, useTransition, useEffect } from "react";
import type { AppUser } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Eye, Trash2, ShieldCheck } from "lucide-react"; // Removed UserCircle as it was unused
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // AlertDialogTrigger was unused
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteAppUser } from "@/actions/userActions";
import { ViewUserDialog } from "./ViewUserDialog";

interface UserListProps {
  initialUsers: AppUser[];
}

export function UserList({ initialUsers }: UserListProps) {
  const [users, setUsers] = useState<AppUser[]>(() => {
    if (Array.isArray(initialUsers)) {
      return initialUsers;
    }
    // This case should ideally not happen if UserManagementPage passes data correctly.
    console.warn("UserList: initialUsers prop was not an array. Defaulting to an empty array. Received:", initialUsers);
    return [];
  });

  const [selectedUserForView, setSelectedUserForView] = useState<AppUser | null>(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;

  useEffect(() => {
    if (!superAdminEmail) {
      console.error("CRITICAL: NEXT_PUBLIC_SUPERADMIN_EMAIL environment variable is not set. User list functionality will be impaired.");
    }
  }, [superAdminEmail]);

  // 'users' is now guaranteed to be an array.
  const superAdminUser = users.find(u => u.email === superAdminEmail && u.role === 'superadmin');
  const otherUsers = users.filter(u => !(u.email === superAdminEmail && u.role === 'superadmin'));

  const getRoleBadgeVariant = (role: AppUser["role"]) => {
    switch (role) {
      case "superadmin": return "destructive";
      case "admin": return "default";
      default: return "secondary";
    }
  };

  const handleViewUser = (user: AppUser) => {
    setSelectedUserForView(user);
    setIsViewUserDialogOpen(true);
  };

  const handleDeleteUser = (user: AppUser) => {
    if (currentUser?.email === user.email) {
        toast({ title: "Action Restricted", description: "You cannot delete your own account.", variant: "destructive"});
        return;
    }
    if (user.role === 'superadmin' && user.email === superAdminEmail) {
        toast({ title: "Action Restricted", description: "Superadmin account cannot be deleted from here.", variant: "destructive"});
        return;
    }
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    startTransition(async () => {
      const result = await deleteAppUser(userToDelete.uid);
      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "default" });
        setUsers(prevUsers => prevUsers.filter(u => u.uid !== userToDelete.uid));
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
      setUserToDelete(null);
      setIsDeleteConfirmOpen(false);
    });
  };

  const formatUserCreationDate = (createdAt: any): string => {
    if (!createdAt) return 'N/A';
    try {
      if (typeof createdAt === 'string') {
        return new Date(createdAt).toLocaleDateString();
      } else if (createdAt.seconds && typeof createdAt.toDate === 'function') {
        // Firestore Timestamp
        return createdAt.toDate().toLocaleDateString();
      } else if (createdAt instanceof Date) {
        return createdAt.toLocaleDateString();
      }
    } catch (e) {
      console.error("Error formatting date:", createdAt, e);
    }
    return 'Invalid Date';
  };
  
  // This condition handles the case where there are no users at all.
  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">No users found in the system.</p>
    );
  }

  return (
    <div className="space-y-6">
      {superAdminUser && (
        <Card className="mb-6 border-primary shadow-lg bg-gradient-to-r from-primary/5 via-card to-card">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={undefined} alt={superAdminUser.name || superAdminUser.email} data-ai-hint="admin avatar" />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {superAdminUser.name ? superAdminUser.name.charAt(0).toUpperCase() : (superAdminUser.email || 'S').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl flex items-center">
                {superAdminUser.name || superAdminUser.email}
                <ShieldCheck className="ml-2 h-6 w-6 text-primary" />
              </CardTitle>
              <CardDescription>{superAdminUser.email} - Super Administrator</CardDescription>
               <p className="text-xs text-muted-foreground mt-1">
                Joined: {formatUserCreationDate(superAdminUser.createdAt)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">This is the primary administrative account with full system privileges.</p>
          </CardContent>
        </Card>
      )}

      {otherUsers.length > 0 && (
        <ul className="space-y-3">
          {otherUsers.map((user) => (
            <li
              key={user.uid}
              className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={undefined} alt={user.name || user.email} data-ai-hint="person avatar"/>
                  <AvatarFallback>
                    {user.name ? user.name.charAt(0).toUpperCase() : (user.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                  {user.role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewUser(user)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {/* Ensure current user cannot delete themselves & superadmin cannot be deleted by others from this list */}
                    { !(user.role === 'superadmin' && user.email === superAdminEmail) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)} 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          disabled={isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Display this message if there's a superAdmin but no other users */}
      {superAdminUser && otherUsers.length === 0 && (
         <p className="text-center text-muted-foreground py-4">No other admin users found.</p>
      )}
      {/* Display this if there's no superAdmin (shouldn't happen if one is configured and fetched) AND no other users */}
      {!superAdminUser && otherUsers.length === 0 && users.length > 0 && ( 
         // This implies users array has users, but none match superAdmin criteria and none are "otherUsers"
         // This state is unusual but covered. If users.length is 0, the top "No users found" handles it.
         <p className="text-center text-muted-foreground py-4">No users match display criteria.</p>
      )}


      <ViewUserDialog
        user={selectedUserForView}
        isOpen={isViewUserDialogOpen}
        onOpenChange={setIsViewUserDialogOpen}
      />

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the user's data
              ({userToDelete?.name || userToDelete?.email}) from the application list.
              The user's Firebase Authentication account will not be deleted by this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

