"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";

export type ActivityType =
  | "counselor_invited"
  | "counselor_approved"
  | "counselor_rejected"
  | "counselor_profile_completed"
  | "admin_invited"
  | "category_created"
  | "category_updated"
  | "category_deleted";

export interface ActivityEntry {
  type: ActivityType;
  title: string;
  description: string;
  targetId?: string;
  targetName?: string;
}

export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    await adminDb.collection("activityLog").add({
      ...entry,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    // Never propagate — activity logging must not block the primary operation
  }
}
