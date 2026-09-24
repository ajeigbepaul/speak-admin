
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
    <Card className={`flex flex-col ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Pending Verifications
          {pendingCounsellors.length > 0 && (
            <Badge variant="destructive" className="text-sm px-2.5 py-0.5">{pendingCounsellors.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Review and verify new counsellor registrations.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {pendingCounsellors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <UserCheck className="h-14 w-14 mb-3 opacity-40" />
            <p className="text-sm">No pending verifications at the moment.</p>
          </div>
        ) : (
          <ScrollArea className="h-[440px]">
            <ul className="divide-y px-1">
              {pendingCounsellors.map((counsellor) => (
                <li key={counsellor.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={counsellor.personalInfo.profilePic} alt={counsellor.personalInfo.fullName} data-ai-hint="person avatar" />
                      <AvatarFallback className="text-base">{counsellor.personalInfo.fullName?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{counsellor.personalInfo.fullName}</p>
                      <p className="text-xs text-muted-foreground">{counsellor.personalInfo.email}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
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
