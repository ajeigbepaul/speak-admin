import { ContentModeration } from "@/components/moderation/ContentModeration";

export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate user-generated content.
        </p>
      </div>
      
      <ContentModeration />
    </div>
  );
}