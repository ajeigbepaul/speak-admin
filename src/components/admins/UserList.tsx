"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import type { AppUser } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Eye, Trash2, ShieldCheck, Search, Filter, Users, UserPlus } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { deleteAppUser } from "@/actions/userActions";
import { ViewUserDialog } from "./ViewUserDialog";
import Link from "next/link";

interface UserListProps {
  initialUsers: AppUser[];
}

export function UserList({ initialUsers }: UserListProps) {
  const [users, setUsers] = useState<AppUser[]>(() => {
    if (Array.isArray(initialUsers)) {
      return initialUsers;
    }
    console.warn("UserList: initialUsers prop was not an array. Defaulting to an empty array. Received:", initialUsers);
    return [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
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

  const superAdminUser = users.find(u => u.email === superAdminEmail && u.role === 'superadmin');
  const otherUsers = users.filter(u => !(u.email === superAdminEmail && u.role === 'superadmin'));

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return otherUsers.filter((user) => {
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [otherUsers, searchTerm, roleFilter]);

  const getRoleBadgeVariant = (role: AppUser["role"]) => {
    switch (role) {
      case "superadmin": return "destructive";
      case "admin": return "default";
      case "user": return "secondary";
      default: return "outline";
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
      const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", createdAt, e);
    }
    return 'Invalid Date';
  };
  
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No users found</h3>
        <p className="text-muted-foreground mb-4">Get started by inviting your first user.</p>
        <Link href="/invite?userType=admin">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Admin
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="superadmin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">Observer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Super admin card */}
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

      {/* Other users list */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={undefined} alt={user.name || user.email} data-ai-hint="person avatar"/>
                  <AvatarFallback>
                    {user.name ? user.name.charAt(0).toUpperCase() : (user.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {formatUserCreationDate(user.createdAt)}
                  </p>
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
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm || roleFilter !== "all" 
              ? "No users match your search criteria." 
              : "No other users found in the system."
            }
          </p>
        </div>
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
