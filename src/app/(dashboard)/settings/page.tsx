import { FeatureToggles } from "@/components/settings/FeatureToggles";

// The older SystemSettings form (components/settings/SystemSettings.tsx) is
// left unmounted: it writes system/settings, which the Firestore rules don't
// allow and the mobile app doesn't read.
export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Control which features are available in the Speak app.</p>
      </div>

      <FeatureToggles />
    </div>
  );
}
