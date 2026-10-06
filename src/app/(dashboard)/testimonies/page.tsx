import { TestimonyModeration } from "@/components/testimonies/TestimonyModeration";

export default function TestimoniesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Testimonies</h1>
        <p className="text-muted-foreground">
          Experiences users shared after their sessions. Approved stories appear in the app&apos;s Stories feed.
        </p>
      </div>
      <TestimonyModeration />
    </div>
  );
}
