
"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, UserCircle, Moon, Sun, CheckCheck } from "lucide-react"; // Added CheckCheck
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import type { AppNotification } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notificationActions";
import { toast } from "react-hot-toast";

export function AppHeader({ pageTitle }: { pageTitle: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("timestamp", "desc"), limit(10));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp, // Keep as Firestore Timestamp or convert if needed
        } as AppNotification;
      });
      setNotifications(fetchedNotifications);
      setUnreadNotificationsCount(fetchedNotifications.filter(n => !n.read).length);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      toast.error("Could not fetch notifications.");
    });

    return () => unsubscribe();
  }, [toast]);

  const handleNotificationClick = async (notification: AppNotification) => {
    startTransition(async () => {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        // Optimistic update can be done here if needed, but onSnapshot will refresh
      }
      if (notification.link) {
        router.push(notification.link);
      }
    });
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) {
      toast("All notifications are already marked as read.");
      return;
    }
    startTransition(async () => {
      const result = await markAllNotificationsAsRead(unreadIds);
      if (result.success) {
        toast.success(result.message);
        // Optimistic update or rely on onSnapshot
      } else {
        toast.error(result.message);
      }
    });
  };

  const renderThemeToggleIcon = () => {
    if (!mounted) {
      return <Moon className="h-5 w-5 opacity-50" />;
    }
    return resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString();
    }
    // Fallback for older data or if it's already a string/number
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          disabled={!mounted}
        >
          {renderThemeToggleIcon()}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-xs rounded-full">
                  {unreadNotificationsCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
            <DropdownMenuLabel className="flex justify-between items-center">
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={isPending} className="text-xs h-auto p-1">
                  <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled className="text-center text-muted-foreground">No notifications</DropdownMenuItem>
            ) : (
              <DropdownMenuGroup>
                {notifications.map(notif => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`cursor-pointer p-2 hover:bg-muted ${!notif.read ? 'font-semibold bg-muted/30' : ''}`}
                    disabled={isPending}
                  >
                    <div>
                      <p className="text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground whitespace-normal">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(notif.timestamp)}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}
            {notifications.length > 5 && ( // Example: only show if many notifications
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="#" className="block p-2 text-center text-primary hover:underline">View all notifications</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} data-ai-hint="user avatar" />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{user?.email}</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
