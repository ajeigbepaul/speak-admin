"use client";

import { useEffect, useState, useTransition } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CounselorActivity, CounselorChatActivity, CounselorChatStatus, Counsellor } from "@/lib/types";
import { updateCounsellorStatus } from "@/actions/counsellorActions";
import { getCounselorActivity } from "@/actions/counselorActivityActions";
import { reactivateAccountAction } from "@/actions/accountActions";
import { auth } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Phone, Mail, Clock, MessageSquare, CalendarDays, Briefcase, UserX, RotateCcw } from "lucide-react";

interface VerificationDialogProps {
  counsellor: Counsellor | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStatusUpdate: (counsellorId: string, newStatus: Counsellor["status"]) => void;
}

const CHAT_STATUS: Record<CounselorChatStatus, { label: string; className: string }> = {
  active:             { label: "Active",             className: "bg-green-100 text-green-800 border-green-200" },
  completed:          { label: "Completed",          className: "bg-slate-100 text-slate-700 border-slate-200" },
  reassign_requested: { label: "Reassign requested", className: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" },
  handed_off:         { label: "Handed off",         className: "bg-amber-100 text-amber-800 border-amber-200" },
  reopened:           { label: "Reopened",           className: "bg-blue-100 text-blue-800 border-blue-200" },
  pending:            { label: "Pending",            className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
};

const CLOSED_REASONS: Record<string, string> = {
  no_response_24h: "Closed — no response in 24h",
  resolved: "Resolved",
  other: "Closed",
};

function formatDuration(minutes?: number) {
  if (minutes === undefined || minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const days = Math.floor(minutes / (60 * 24));
  return `${days}d ${Math.floor((minutes % (60 * 24)) / 60)}h`;
}

function getStatusBadgeVariant(status: Counsellor["status"]) {
  switch (status) {
    case "Verified": return "default";
    case "Pending": return "secondary";
    case "Rejected": return "destructive";
    default: return "outline";
  }
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ChatCard({ chat }: { chat: CounselorChatActivity }) {
  const status = CHAT_STATUS[chat.status];
  const isActive = chat.status === "active";

  return (
    <div className={cn("rounded-xl border p-4 space-y-3", isActive && "border-green-300 bg-green-50/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={chat.user.profilePic} alt={chat.user.name} />
            <AvatarFallback>{chat.user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{chat.user.name}</p>
            {chat.user.email && chat.user.email !== chat.user.name && (
              <p className="text-xs text-muted-foreground truncate">{chat.user.email}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0", status.className)}>{status.label}</Badge>
      </div>

      {(chat.category || chat.issue) && (
        <div className="space-y-1">
          {chat.category && <Badge variant="secondary" className="capitalize">{chat.category}</Badge>}
          {chat.issue && <p className="text-sm text-muted-foreground line-clamp-2">{chat.issue}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span>{chat.startedAt ? format(new Date(chat.startedAt), "d MMM yyyy, HH:mm") : "Not started"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {isActive ? "Active for " : "Lasted "}
            <span className="font-medium text-foreground">{formatDuration(chat.durationMinutes)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">{chat.counselorMessages}</span> sent · {chat.totalMessages} total
          </span>
        </div>
        <div className="text-muted-foreground">
          {chat.lastMessageAt
            ? `Last message ${formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}`
            : "No messages yet"}
        </div>
      </div>

      {(chat.closedReason || chat.reassignReason) && (
        <p className="text-xs text-muted-foreground border-t pt-2">
          {chat.closedReason && (CLOSED_REASONS[chat.closedReason] ?? chat.closedReason)}
          {chat.reassignReason && `Reassign reason: ${chat.reassignReason}`}
        </p>
      )}
    </div>
  );
}

export function VerificationDialog({ counsellor, isOpen, onOpenChange, onStatusUpdate }: VerificationDialogProps) {
  const [isPending, startTransition] = useTransition();
  // Which status change is in flight, so only that button shows a loading state
  const [pendingStatus, setPendingStatus] = useState<Counsellor["status"] | null>(null);
  const [activity, setActivity] = useState<CounselorActivity | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [reactivatedId, setReactivatedId] = useState<string | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const counsellorId = counsellor?.id;

  useEffect(() => {
    if (!isOpen || !counsellorId) return;
    let cancelled = false;

    setActivity(null);
    setActivityError(null);
    setIsLoadingActivity(true);

    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const result = await getCounselorActivity(idToken ?? "", counsellorId);
        if (cancelled) return;
        if (result.success) setActivity(result.data);
        else setActivityError(result.message);
      } catch {
        if (!cancelled) setActivityError("Failed to load activity.");
      } finally {
        if (!cancelled) setIsLoadingActivity(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, counsellorId]);

  if (!counsellor) return null;

  const handleStatusChange = (newStatus: "Verified" | "Rejected") => {
    setPendingStatus(newStatus);
    startTransition(async () => {
      const result = await updateCounsellorStatus(counsellor.id, newStatus);
      if (result.success) {
        toast.success(result.message);
        onStatusUpdate(counsellor.id, newStatus);
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
      setPendingStatus(null);
    });
  };

  const isDeactivated = !!counsellor.accountDeactivated && reactivatedId !== counsellor.id;

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const result = await reactivateAccountAction(idToken ?? "", counsellor.id);
      if (result.success) {
        toast.success(result.message);
        setReactivatedId(counsellor.id);
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsReactivating(false);
    }
  };

  const activeChats = activity?.chats.filter((c) => c.status === "active") ?? [];
  const pastChats = activity?.chats.filter((c) => c.status !== "active") ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 rounded-l-2xl overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b text-left">
          <SheetTitle>Counsellor Details</SheetTitle>
          <SheetDescription>Profile, chats and activity on the app.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={counsellor.profilePic} alt={counsellor.fullName} data-ai-hint="person avatar" />
              <AvatarFallback>{counsellor.fullName?.charAt(0) || "C"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold truncate">{counsellor.fullName}</h3>
                <Badge variant={getStatusBadgeVariant(counsellor.status)} className="capitalize">
                  {counsellor.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {counsellor.email}
              </p>
              {counsellor.phoneNumber && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {counsellor.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {isDeactivated && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <UserX className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                This counsellor deactivated their account
                {counsellor.deactivatedAt ? ` on ${format(new Date(counsellor.deactivatedAt), "d MMM yyyy")}` : ""}.
                They can't sign in until the account is reactivated.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Occupation / Specialization
              </p>
              <p className="mt-1 font-medium">{counsellor.specialization || "Not provided"}</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> Registered
              </p>
              <p className="mt-1 font-medium">{new Date(counsellor.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Activity */}
          {isLoadingActivity && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          )}

          {activityError && (
            <p className="text-sm text-destructive rounded-xl border border-destructive/30 p-3">{activityError}</p>
          )}

          {activity && (
            <>
              <section className="space-y-3">
                <h4 className="text-sm font-semibold">Overview</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatTile label="Total chats" value={activity.stats.totalChats} />
                  <StatTile label="Active now" value={activity.stats.activeChats} />
                  <StatTile label="Completed" value={activity.stats.completedChats} />
                  <StatTile label="Users helped" value={activity.stats.uniqueUsers} />
                  <StatTile label="Messages sent" value={activity.stats.messagesSent} />
                  <StatTile label="Avg. chat length" value={formatDuration(activity.stats.avgDurationMinutes ?? undefined)} />
                </div>
                {activity.stats.reassignmentsRequested > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Requested {activity.stats.reassignmentsRequested} reassignment
                    {activity.stats.reassignmentsRequested === 1 ? "" : "s"}.
                  </p>
                )}
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold">Active chat{activeChats.length === 1 ? "" : "s"}</h4>
                {activeChats.length > 0
                  ? activeChats.map((chat) => <ChatCard key={chat.postId} chat={chat} />)
                  : <p className="text-sm text-muted-foreground">No active chat right now.</p>}
              </section>

              <section className="space-y-3">
                <h4 className="text-sm font-semibold">Chat history</h4>
                {pastChats.length > 0
                  ? pastChats.map((chat) => <ChatCard key={chat.postId} chat={chat} />)
                  : <p className="text-sm text-muted-foreground">No previous chats.</p>}
              </section>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-background">
          <SheetClose asChild>
            <Button variant="outline" disabled={isPending}>Close</Button>
          </SheetClose>

          {isDeactivated && (
            <Button variant="outline" onClick={handleReactivate} disabled={isReactivating || isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {isReactivating ? "Reactivating..." : "Reactivate account"}
            </Button>
          )}

          {/* Reject Button: Show if status is Pending or Verified */}
          {(counsellor.status === "Pending" || counsellor.status === "Verified") && (
            <Button
              variant="destructive"
              onClick={() => handleStatusChange("Rejected")}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {pendingStatus === "Rejected" ? "Rejecting..." : "Reject"}
            </Button>
          )}

          {/* Verify Button: Show if status is Pending or Rejected */}
          {(counsellor.status === "Pending" || counsellor.status === "Rejected") && (
            <Button
              onClick={() => handleStatusChange("Verified")}
              disabled={isPending}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {pendingStatus === "Verified" ? "Verifying..." : "Verify"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
