"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BookOpen, Languages, MessageSquareHeart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getFeatureFlagsAction, updateFeatureFlagAction } from "@/actions/featureFlagActions";
import { auth } from "@/lib/firebase";
import type { FeatureFlags, FeatureKey } from "@/lib/types";

const FEATURES: { key: FeatureKey; title: string; description: string; icon: React.ElementType }[] = [
  {
    key: "testimonies",
    title: "Testimonies",
    description:
      "After a session is completed, users can share their experience. Approved testimonies appear in the app's Stories feed.",
    icon: MessageSquareHeart,
  },
  {
    key: "multilingualChat",
    title: "Multilingual chat",
    description:
      "Users and counsellors chat in their own language. Messages and voice notes are translated by AI for the other person.",
    icon: Languages,
  },
  {
    key: "bookSuggestions",
    title: "Book suggestions",
    description:
      "Shows the Christian books set on each category (Categories page) under every issue in that category.",
    icon: BookOpen,
  },
];

// On/off switches for post-launch features. The mobile app listens to
// config/features, so changes apply on users' phones within seconds.
export function FeatureToggles() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [saving, setSaving] = useState<FeatureKey | null>(null);

  useEffect(() => {
    getFeatureFlagsAction()
      .then(setFlags)
      .catch(() => toast.error("Failed to load feature settings."));
  }, []);

  const toggle = async (key: FeatureKey, enabled: boolean) => {
    if (!flags) return;
    setSaving(key);
    setFlags({ ...flags, [key]: enabled }); // optimistic
    const idToken = await auth.currentUser?.getIdToken();
    const result = await updateFeatureFlagAction(idToken ?? "", key, enabled);
    if (result.success) {
      toast.success(result.message);
    } else {
      setFlags((prev) => (prev ? { ...prev, [key]: !enabled } : prev));
      toast.error(result.message);
    }
    setSaving(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App features</CardTitle>
        <CardDescription>
          Turn features on or off in the mobile app. Changes reach users&apos; phones within a few seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {FEATURES.map(({ key, title, description, icon: Icon }) => (
          <div key={key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-medium leading-none">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {flags ? (
              <Switch
                checked={flags[key]}
                disabled={saving === key}
                onCheckedChange={(checked) => toggle(key, checked)}
                aria-label={`${title} ${flags[key] ? "on" : "off"}`}
              />
            ) : (
              <Skeleton className="h-6 w-11 rounded-full" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
