
"use client";

import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, UserCircle, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mockNotifications } from "@/lib/mockData";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

export function AppHeader({ pageTitle }: { pageTitle: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const renderThemeToggleIcon = () => {
    if (!mounted) {
      // Render a placeholder or nothing until mounted to avoid hydration mismatch
      return <Moon className="h-5 w-5 opacity-50" />; // Default placeholder
    }
    return resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />;
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
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-xs rounded-full">
                  {unreadNotifications}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.slice(0,3).map(notif => (
              <DropdownMenuItem key={notif.id} asChild>
                <Link href={notif.link || "#"} className={`block p-2 hover:bg-muted ${!notif.read ? 'font-semibold': ''}`}>
                  <p className="text-sm">{notif.title}</p>
                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                </Link>
              </DropdownMenuItem>
            ))}
             <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="#" className="block p-2 text-center text-primary hover:underline">View all notifications</Link>
            </DropdownMenuItem>
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
