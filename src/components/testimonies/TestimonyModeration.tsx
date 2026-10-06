"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Check, EyeOff, Star, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listTestimoniesAction, reviewTestimonyAction } from "@/actions/testimonyActions";
import { auth } from "@/lib/firebase";
import type { AdminTestimony, TestimonyStatus } from "@/lib/types";

const TABS: { value: TestimonyStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      ))}
    </div>
  );
}

// Review testimonies users share after sessions. Approved ones appear in the
// app's "Stories of hope" feed (when Testimonies is on in Settings).
export function TestimonyModeration() {
  const [tab, setTab] = useState<TestimonyStatus>("pending");
  const [items, setItems] = useState<AdminTestimony[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: TestimonyStatus) => {
    setItems(null);
    const idToken = await auth.currentUser?.getIdToken();
    const result = await listTestimoniesAction(idToken ?? "", status);
    if (result.success) setItems(result.data);
    else {
      setItems([]);
      toast.error(result.message);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const review = async (item: AdminTestimony, decision: "approved" | "rejected") => {
    setBusyId(item.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const result = await reviewTestimonyAction(idToken ?? "", item.id, decision);
      if (result.success) {
        toast.success(result.message);
        setItems((prev) => prev?.filter((t) => t.id !== item.id) ?? prev);
      } else {
        toast.error(result.message);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as TestimonyStatus)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">
          {tab === "pending" ? "No testimonies waiting for review." : "Nothing here yet."}
        </p>
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Stars rating={item.rating} />
                  {item.category && <Badge variant="secondary" className="capitalize">{item.category}</Badge>}
                  {item.anonymous && (
                    <Badge variant="outline" className="gap-1"><EyeOff className="h-3 w-3" /> Anonymous in app</Badge>
                  )}
                </div>
                {item.createdAt && (
                  <span className="text-xs text-muted-foreground">{format(new Date(item.createdAt), "d MMM yyyy, HH:mm")}</span>
                )}
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.text}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  By <span className="font-medium text-foreground">{item.user.name}</span>
                  {item.user.email && item.user.email !== item.user.name ? ` (${item.user.email})` : ""}
                  {item.counselorName ? ` · Counsellor: ${item.counselorName}` : ""}
                  {!item.anonymous && item.displayName ? ` · Shown as "${item.displayName}"` : ""}
                </p>
                <div className="flex gap-2">
                  {item.status !== "rejected" && (
                    <Button variant="outline" size="sm" onClick={() => review(item, "rejected")} disabled={busyId === item.id}>
                      <X className="mr-1 h-4 w-4" /> {item.status === "approved" ? "Unpublish" : "Reject"}
                    </Button>
                  )}
                  {item.status !== "approved" && (
                    <Button size="sm" onClick={() => review(item, "approved")} disabled={busyId === item.id}>
                      <Check className="mr-1 h-4 w-4" /> {item.status === "rejected" ? "Publish anyway" : "Approve"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
