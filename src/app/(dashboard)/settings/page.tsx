import { SystemSettings } from "@/components/settings/SystemSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure your application settings.
        </p>
      </div>
      
      <SystemSettings />
    </div>
  );
}