
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, UserCheck, LogOut, UserCog, UserPlus } from "lucide-react"; 

// NEW IMPORTS for Firestore
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import type { CounsellorStatus } from "@/lib/types";


const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/counsellors", label: "Counsellors", icon: UserCheck, badgeKey: "pendingCounsellorsActual" },
  { href: "/users", label: "User Management", icon: UserCog },
  { href: "/invite", label: "Invite User", icon: UserPlus }, // New Invite User link
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  // State for the actual count of pending counsellors
  const [pendingCounsellorsActualCount, setPendingCounsellorsActualCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchPendingCounsellorsCount = async () => {
      try {
        const counsellorsCol = collection(db, 'counselors');
        // Query for documents where status is 'Pending'
        const q = query(counsellorsCol, where("status", "==", "Pending" as CounsellorStatus));
        const snapshot = await getCountFromServer(q);
        setPendingCounsellorsActualCount(snapshot.data().count);
      } catch (error) {
        console.error("Error fetching pending counsellors count for sidebar badge:", error);
        setPendingCounsellorsActualCount(0); // Fallback to 0 on error
      }
    };

    fetchPendingCounsellorsCount();
    
    // Note: getCountFromServer is a one-time fetch. 
    // For real-time updates, you might consider Firestore listeners or periodic refetching.
  }, []);


  const badges = {
    // Use the new state for the actual count
    pendingCounsellorsActual: pendingCounsellorsActualCount !== undefined && pendingCounsellorsActualCount > 0 
                               ? pendingCounsellorsActualCount.toString() 
                               : undefined,
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4 flex items-center gap-2 justify-center group-data-[collapsible=icon]:justify-center">
         <div className="p-1.5 bg-sidebar-primary-foreground rounded-md">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--sidebar-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.99.58 3.832 1.595 5.405L2 22l4.595-1.595A9.905 9.905 0 0 0 12 22z"></path>
            <path d="M8 10h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M16 10h.01"></path>
          </svg>
         </div>
        <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Speak Admin</h1>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                  tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border" }}
                  className="justify-start"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  {item.badgeKey && badges[item.badgeKey as keyof typeof badges] && (
                     <SidebarMenuBadge className="ml-auto group-data-[collapsible=icon]:hidden bg-destructive text-destructive-foreground">
                        {badges[item.badgeKey as keyof typeof badges]}
                     </SidebarMenuBadge>
                  )}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
          onClick={logout}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-2 group-data-[collapsible=icon]:hidden">Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
