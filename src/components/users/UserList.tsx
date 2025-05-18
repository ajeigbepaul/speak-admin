
"use client";

import type { AppUser } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserListProps {
  users: AppUser[];
}

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">No users found.</p>
    );
  }

  const getRoleBadgeVariant = (role: AppUser["role"]) => {
    switch (role) {
      case "superadmin":
        return "destructive"; // Or a specific color for superadmin
      case "admin":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <ul className="space-y-3">
      {users.map((user) => (
        <li
          key={user.uid}
          className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {/* Assuming users might not have avatars yet */}
              <AvatarImage src={undefined} alt={user.name || user.email} data-ai-hint="person avatar" />
              <AvatarFallback>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user.name || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
            {user.role}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
