
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AppUser, MockChatMessage } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CalendarDays } from "lucide-react";

interface ViewUserDialogProps {
  user: AppUser | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Mock chat data
const mockChatHistory: MockChatMessage[] = [
  { id: 'chat1', sender: 'user', text: 'Hello, I need help with my account.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'chat2', sender: 'support', text: 'Hi there! How can I assist you today?', timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString() },
  { id: 'chat3', sender: 'user', text: 'I am unable to reset my password.', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
  { id: 'chat4', sender: 'support', text: 'Okay, I can help with that. Have you tried the "Forgot Password" link on the login page?', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString() },
  { id: 'chat5', sender: 'user', text: 'Yes, I did, but I did not receive an email.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
];


export function ViewUserDialog({ user, isOpen, onOpenChange }: ViewUserDialogProps) {
  if (!user) return null;

  const getRoleBadgeVariant = (role: AppUser["role"]) => {
    switch (role) {
      case "superadmin": return "destructive";
      case "admin": return "default";
      default: return "secondary";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>User Details: {user.name || user.email}</DialogTitle>
          <DialogDescription>Information and activity for this user.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-2 space-y-6 py-4">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={undefined} alt={user.name || user.email} data-ai-hint="person avatar" />
              <AvatarFallback>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user.name || "N/A"}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1 capitalize">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input id="userId" value={user.uid} readOnly />
            </div>
            <div>
              <Label htmlFor="registrationDate">Registration Date</Label>
              <Input 
                id="registrationDate" 
                value={user.createdAt ? new Date(user.createdAt.seconds ? user.createdAt.toDate() : user.createdAt).toLocaleDateString() : 'N/A'} 
                readOnly 
              />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-2 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Mock Chat History
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto rounded-md border p-3 bg-muted/30">
              {mockChatHistory.length > 0 ? mockChatHistory.map((chat) => (
                <div key={chat.id} className={`flex flex-col ${chat.sender === 'user' ? 'items-start' : 'items-end'}`}>
                  <div className={`p-2 rounded-lg max-w-[70%] ${
                    chat.sender === 'user' ? 'bg-secondary text-secondary-foreground' 
                    : 'bg-primary text-primary-foreground'
                  }`}>
                    <p className="text-sm">{chat.text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No chat history available.</p>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
