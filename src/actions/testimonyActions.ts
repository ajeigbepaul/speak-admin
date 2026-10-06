"use server";

import { revalidatePath } from "next/cache";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";
import { logActivity } from "@/actions/activityActions";
import type { ActionResult, AdminTestimony, TestimonyStatus } from "@/lib/types";

const STATUSES: TestimonyStatus[] = ["pending", "approved", "rejected"];

function toIso(value: any): string | undefined {
  const date = typeof value?.toDate === "function" ? value.toDate() : undefined;
  return date ? date.toISOString() : undefined;
}

// Testimonies in one review state, newest first. Admins also see who wrote an
// anonymous testimony (the app never shows that).
export async function listTestimoniesAction(
  idToken: string,
  status: TestimonyStatus
): Promise<{ success: true; data: AdminTestimony[] } | { success: false; message: string }> {
  if (!(await requireAdmin(idToken))) return { success: false, message: "Not authorized." };
  if (!STATUSES.includes(status)) return { success: false, message: "Unknown status." };

  try {
    const snap = await adminDb
      .collection("testimonies")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const userIds = [...new Set(snap.docs.map((d) => d.data().userId).filter(Boolean))];
    const counselorIds = [...new Set(snap.docs.map((d) => d.data().counselorId).filter(Boolean))];
    const [users, counselors] = await Promise.all([
      userIds.length ? adminDb.getAll(...userIds.map((id) => adminDb.collection("users").doc(id))) : [],
      counselorIds.length ? adminDb.getAll(...counselorIds.map((id) => adminDb.collection("counselors").doc(id))) : [],
    ]);
    const userById = new Map(users.map((d) => [d.id, d.data()]));
    const counselorById = new Map(counselors.map((d) => [d.id, d.data()]));

    const data: AdminTestimony[] = snap.docs.map((d) => {
      const t = d.data();
      const u = userById.get(t.userId);
      return {
        id: d.id,
        postId: t.postId ?? d.id,
        rating: t.rating ?? 0,
        text: t.text ?? "",
        category: t.category,
        anonymous: t.anonymous !== false,
        displayName: t.displayName ?? null,
        status: t.status,
        createdAt: toIso(t.createdAt),
        reviewedAt: toIso(t.reviewedAt),
        user: {
          id: t.userId,
          name: u?.fullName || u?.displayName || u?.name || u?.email || "Unknown user",
          email: u?.email,
        },
        counselorName: counselorById.get(t.counselorId)?.personalInfo?.fullName,
      };
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error listing testimonies:", error);
    return { success: false, message: `Failed to load testimonies: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Approve (publish to the app's Stories feed) or reject a testimony.
export async function reviewTestimonyAction(
  idToken: string,
  testimonyId: string,
  decision: "approved" | "rejected"
): Promise<ActionResult> {
  const adminUid = await requireAdmin(idToken);
  if (!adminUid) return { success: false, message: "Not authorized." };
  if (!testimonyId || !["approved", "rejected"].includes(decision)) {
    return { success: false, message: "Invalid request." };
  }

  try {
    const ref = adminDb.collection("testimonies").doc(testimonyId);
    const snap = await ref.get();
    if (!snap.exists) return { success: false, message: "Testimony not found." };
    const t = snap.data()!;

    const batch = adminDb.batch();
    batch.update(ref, { status: decision, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: adminUid });
    // Lets the user's issue card show "Story published" without another read
    batch.set(adminDb.collection("posts").doc(t.postId ?? testimonyId), { testimonyStatus: decision }, { merge: true });
    await batch.commit();

    await logActivity({
      type: decision === "approved" ? "testimony_approved" : "testimony_rejected",
      title: decision === "approved" ? "Testimony Approved" : "Testimony Rejected",
      description: `A ${t.rating}-star testimony${t.category ? ` (${t.category})` : ""} was ${decision}.`,
      targetId: testimonyId,
    });

    revalidatePath("/testimonies");
    return { success: true, message: decision === "approved" ? "Published to Stories." : "Testimony rejected." };
  } catch (error) {
    console.error("Error reviewing testimony:", error);
    return { success: false, message: `Failed to update: ${error instanceof Error ? error.message : String(error)}` };
  }
}
