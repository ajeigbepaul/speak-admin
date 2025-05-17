
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Counsellor } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

interface PendingVerificationsCardProps {
  counsellors: Counsellor[];
  className?: string;
}

export function PendingVerificationsCard({ counsellors, className }: PendingVerificationsCardProps) {
  const pendingCounsellors = counsellors.filter(c => c.status === "Pending");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Pending Verifications
          {pendingCounsellors.length > 0 && (
            <Badge variant="destructive">{pendingCounsellors.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Review and verify new counsellor registrations.</CardDescription>
      </CardHeader>
      <CardContent>
        {pendingCounsellors.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <UserCheck className="mx-auto h-12 w-12 mb-2" />
            <p>No pending verifications at the moment.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <ul className="space-y-3">
              {pendingCounsellors.map((counsellor) => (
                <li key={counsellor.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={counsellor.profilePic} alt={counsellor.fullName} data-ai-hint="person avatar" />
                      <AvatarFallback>{counsellor.fullName?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{counsellor.fullName}</p>
                      <p className="text-xs text-muted-foreground">{counsellor.email}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    {/* Link to the counsellors page and pass params to auto-open dialog */}
                    <Link href={`/counsellors?action=verify&id=${counsellor.id}`}>Review</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
