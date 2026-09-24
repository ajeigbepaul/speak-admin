"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserPlus, CheckCircle2, XCircle, ClipboardList,
  ShieldCheck, Tag, Pencil, Trash2, UserX, RotateCcw,
} from "lucide-react";
import type { ActivityType } from "@/actions/activityActions";

interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Timestamp | null;
}

type Config = { icon: React.ElementType; color: string; bg: string };

const TYPE_CONFIG: Record<ActivityType, Config> = {
  counselor_invited:           { icon: UserPlus,      color: "text-blue-600",   bg: "bg-blue-100" },
  counselor_approved:          { icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-100" },
  counselor_rejected:          { icon: XCircle,       color: "text-red-600",    bg: "bg-red-100" },
  counselor_profile_completed: { icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-100" },
  admin_invited:               { icon: ShieldCheck,   color: "text-orange-600", bg: "bg-orange-100" },
  category_created:            { icon: Tag,           color: "text-teal-600",   bg: "bg-teal-100" },
  category_updated:            { icon: Pencil,        color: "text-slate-600",  bg: "bg-slate-100" },
  category_deleted:            { icon: Trash2,        color: "text-red-500",    bg: "bg-red-50" },
  account_deactivated:         { icon: UserX,         color: "text-red-600",    bg: "bg-red-100" },
  account_reactivated:         { icon: RotateCcw,     color: "text-green-600",  bg: "bg-green-100" },
};

function timeAgo(ts: Timestamp): string {
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return ts.toDate().toLocaleDateString();
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "activityLog"),
      orderBy("timestamp", "desc"),
      limit(20),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription>Latest admin and platform actions</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-3 px-6 pb-6">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[440px]">
            <ul className="divide-y px-1">
              {activities.map((item) => {
                const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.counselor_invited;
                const Icon = cfg.icon;
                return (
                  <li key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/40 transition-colors">
                    <span className={`mt-0.5 shrink-0 rounded-full p-2 ${cfg.bg}`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                      {item.timestamp ? timeAgo(item.timestamp) : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
