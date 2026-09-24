import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/mobileApi";

// Weekly Vercel Cron job (see vercel.json): deletes chat images, files and
// voice notes older than 90 days from Cloudinary to control storage costs.
// Replaces the cleanupOldChatMedia Cloud Function.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" on cron requests
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const expression =
    "(public_id:chatImages/* OR public_id:chatFiles/* OR public_id:voiceNotes/*) AND uploaded_at<90d";

  try {
    let deleted = 0;
    let cursor: string | undefined;
    do {
      const search = cloudinary.search.expression(expression).max_results(500);
      if (cursor) search.next_cursor(cursor);
      const result = await search.execute();

      // delete_resources takes one resource type and at most 100 ids per call
      const idsByType: Record<string, string[]> = {};
      for (const resource of result.resources) {
        (idsByType[resource.resource_type] ||= []).push(resource.public_id);
      }
      for (const [resourceType, ids] of Object.entries(idsByType)) {
        for (let i = 0; i < ids.length; i += 100) {
          await cloudinary.api.delete_resources(ids.slice(i, i + 100), { resource_type: resourceType });
        }
        deleted += ids.length;
      }

      cursor = result.next_cursor;
    } while (cursor);

    console.log(`cleanup-chat-media: deleted ${deleted} Cloudinary files older than 90 days`);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("cleanup-chat-media failed:", error);
    return NextResponse.json({ message: "Cleanup failed." }, { status: 500 });
  }
}
