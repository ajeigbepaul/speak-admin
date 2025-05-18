
"use client";

import React, { useState, useTransition } from "react";
import type { AppUser } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Eye, Trash2, ShieldCheck, UserCircle } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteAppUser } from "@/actions/userActions";
import { ViewUserDialog } from "./ViewUserDialog";

interface UserListProps {
  initialUsers: AppUser[];
}

export function UserList({ initialUsers }: UserListProps) {
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [selectedUserForView, setSelectedUserForView] = useState<AppUser | null>(null);
  const [isViewUserDialogOpen, setIsViewUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
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
    if (user.role === 'superadmin') {
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

  if (users.length === 0 && !superAdminUser) {
    return (
      <p className="text-center text-muted-foreground py-4">No users found.</p>
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
                {superAdminUser.name ? superAdminUser.name.charAt(0).toUpperCase() : superAdminUser.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl flex items-center">
                {superAdminUser.name || superAdminUser.email}
                <ShieldCheck className="ml-2 h-6 w-6 text-primary" />
              </CardTitle>
              <CardDescription>{superAdminUser.email} - Super Administrator</CardDescription>
               <p className="text-xs text-muted-foreground mt-1">
                Joined: {superAdminUser.createdAt ? new Date(superAdminUser.createdAt.seconds ? superAdminUser.createdAt.toDate() : superAdminUser.createdAt).toLocaleDateString() : 'N/A'}
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
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
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
                    {currentUser?.email !== user.email && user.role !== 'superadmin' && (
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
      {otherUsers.length === 0 && !superAdminUser && (
         <p className="text-center text-muted-foreground py-4">No other admin users found.</p>
      )}
       {otherUsers.length === 0 && superAdminUser && (
         <p className="text-center text-muted-foreground py-4">No other admin users found.</p>
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
