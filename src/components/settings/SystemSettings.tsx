'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from "react-hot-toast";

interface SystemSettingsData {
  // User Registration
  userRegistrationEnabled: boolean;
  requireEmailVerification: boolean;
  allowSocialLogin: boolean;

  // Counselor Settings
  counselorApplicationsOpen: boolean;
  counselorVerificationRequired: boolean;
  maxChatsPerCounselor: number;
  autoAssignmentEnabled: boolean;

  // Content Settings
  allowImageUploads: boolean;
  allowVoiceMessages: boolean;
  maxPostLength: number;
  moderationEnabled: boolean;
  autoModerateContent: boolean;

  // Notification Settings
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';

  // System Messages
  welcomeMessage: string;
  systemAnnouncementEnabled: boolean;
  systemAnnouncement: string;

  // Privacy & Terms
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;

  // Advanced Settings
  maintenanceMode: boolean;
  debugMode: boolean;
  apiRateLimit: number;
}

const defaultSettings: SystemSettingsData = {
  // User Registration
  userRegistrationEnabled: true,
  requireEmailVerification: true,
  allowSocialLogin: true,

  // Counselor Settings
  counselorApplicationsOpen: true,
  counselorVerificationRequired: true,
  maxChatsPerCounselor: 10,
  autoAssignmentEnabled: true,

  // Content Settings
  allowImageUploads: true,
  allowVoiceMessages: true,
  maxPostLength: 1000,
  moderationEnabled: true,
  autoModerateContent: false,

  // Notification Settings
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  notificationFrequency: 'immediate',

  // System Messages
  welcomeMessage: "Welcome to Talk! We're here to support you.",
  systemAnnouncementEnabled: false,
  systemAnnouncement: '',

  // Privacy & Terms
  privacyPolicyUrl: '',
  termsOfServiceUrl: '',

  // Advanced Settings
  maintenanceMode: false,
  debugMode: false,
  apiRateLimit: 100
};

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SystemSettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const [hasChanges, setHasChanges] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if current settings differ from original
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const fetchSettings = async () => {
    setIsLoading(true);

    try {
      const settingsRef = doc(db, 'system', 'settings');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as Partial<SystemSettingsData>;

        // Merge with default settings to ensure all fields exist
        const mergedSettings = { ...defaultSettings, ...data };
        setSettings(mergedSettings);
        setOriginalSettings(mergedSettings);
      } else {
        // If no settings document exists, use defaults
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error('Failed to load system settings. Using defaults.');
    }

    setIsLoading(false);
  };

  const saveSettings = async () => {
    setIsSaving(true);

    try {
      const settingsRef = doc(db, 'system', 'settings');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date()
      });

      setOriginalSettings(settings);

      toast.success('System settings saved successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Failed to save system settings. Please try again.');
    }

    setIsSaving(false);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setIsResetDialogOpen(false);
  };

  const handleInputChange = (field: keyof SystemSettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full">
      <Tabs defaultValue="user" value={activeTab} onValueChange={setActiveTab}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure your application settings</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetDialogOpen(true)}
                disabled={isLoading || isSaving}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isLoading || isSaving || !hasChanges}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="counselor">Counselor</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="user" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">User Registration</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register for the application
                      </p>
                    </div>
                    <Switch
                      checked={settings.userRegistrationEnabled}
                      onCheckedChange={(checked) => handleInputChange('userRegistrationEnabled', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Users must verify their email before accessing the app
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Social Login</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable login with Google, Facebook, etc.
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowSocialLogin}
                      onCheckedChange={(checked) => handleInputChange('allowSocialLogin', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Privacy Policy URL</Label>
                    <Input
                      value={settings.privacyPolicyUrl}
                      onChange={(e) => handleInputChange('privacyPolicyUrl', e.target.value)}
                      placeholder="https://example.com/privacy"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Terms of Service URL</Label>
                    <Input
                      value={settings.termsOfServiceUrl}
                      onChange={(e) => handleInputChange('termsOfServiceUrl', e.target.value)}
                      placeholder="https://example.com/terms"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="counselor" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Counselor Settings</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Open Counselor Applications</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new counselors to apply
                      </p>
                    </div>
                    <Switch
                      checked={settings.counselorApplicationsOpen}
                      onCheckedChange={(checked) => handleInputChange('counselorApplicationsOpen', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Verification</Label>
                      <p className="text-sm text-muted-foreground">
                        Counselors must be verified before they can respond to users
                      </p>
                    </div>
                    <Switch
                      checked={settings.counselorVerificationRequired}
                      onCheckedChange={(checked) => handleInputChange('counselorVerificationRequired', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Auto-Assignment</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign counselors to new chat requests
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoAssignmentEnabled}
                      onCheckedChange={(checked) => handleInputChange('autoAssignmentEnabled', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Maximum Active Chats per Counselor</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.maxChatsPerCounselor}
                      onChange={(e) => handleInputChange('maxChatsPerCounselor', parseInt(e.target.value) || 1)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Limit how many active chats a counselor can have at once
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Content Settings</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Image Uploads</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can upload images in posts and chats
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowImageUploads}
                      onCheckedChange={(checked) => handleInputChange('allowImageUploads', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Voice Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can send voice messages in chats
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowVoiceMessages}
                      onCheckedChange={(checked) => handleInputChange('allowVoiceMessages', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Maximum Post Length</Label>
                    <Input
                      type="number"
                      min="100"
                      max="10000"
                      value={settings.maxPostLength}
                      onChange={(e) => handleInputChange('maxPostLength', parseInt(e.target.value) || 1000)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum number of characters allowed in a post
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Content Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Review and moderate user-generated content
                      </p>
                    </div>
                    <Switch
                      checked={settings.moderationEnabled}
                      onCheckedChange={(checked) => handleInputChange('moderationEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Moderate Content</Label>
                      <p className="text-sm text-muted-foreground">
                        Use AI to automatically filter inappropriate content
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoModerateContent}
                      onCheckedChange={(checked) => handleInputChange('autoModerateContent', checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Settings</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications to users
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotificationsEnabled}
                      onCheckedChange={(checked) => handleInputChange('emailNotificationsEnabled', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send push notifications to mobile devices
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotificationsEnabled}
                      onCheckedChange={(checked) => handleInputChange('pushNotificationsEnabled', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Notification Frequency</Label>
                    <Select
                      value={settings.notificationFrequency}
                      onValueChange={(value) => handleInputChange('notificationFrequency', value as 'immediate' | 'hourly' | 'daily')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      How often to send notification digests
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="messages" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">System Messages</h3>

                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea
                      value={settings.welcomeMessage}
                      onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                      placeholder="Welcome message for new users"
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Message shown to new users when they first sign up
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable System Announcement</Label>
                      <p className="text-sm text-muted-foreground">
                        Display an announcement banner to all users
                      </p>
                    </div>
                    <Switch
                      checked={settings.systemAnnouncementEnabled}
                      onCheckedChange={(checked) => handleInputChange('systemAnnouncementEnabled', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>System Announcement</Label>
                    <Textarea
                      value={settings.systemAnnouncement}
                      onChange={(e) => handleInputChange('systemAnnouncement', e.target.value)}
                      placeholder="Important announcement for all users"
                      rows={3}
                      disabled={!settings.systemAnnouncementEnabled}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800 flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">Warning</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        These settings can significantly impact your application. Change with caution.
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium">Advanced Settings</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Take the application offline for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable additional logging and debugging features
                      </p>
                    </div>
                    <Switch
                      checked={settings.debugMode}
                      onCheckedChange={(checked) => handleInputChange('debugMode', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>API Rate Limit</Label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      value={settings.apiRateLimit}
                      onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value) || 100)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum number of API requests per minute per user
                    </p>
                  </div>
                </div>
              </TabsContent>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Last updated: {originalSettings !== defaultSettings ? new Date().toLocaleString() : 'Never'}
          </p>

          {hasChanges && (
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}


          {/* Reset to Defaults Dialog */}
          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset all settings to their default values? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToDefaults} className="bg-destructive">
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Tabs>
    </Card>
  );
}