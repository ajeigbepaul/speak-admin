"use server";

import { revalidatePath } from "next/cache";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";
import { logActivity } from "@/actions/activityActions";
import type { ActionResult } from "@/lib/types";

// Restores an account the user deactivated from the app: re-enables Firebase
// Auth sign-in and clears the deactivated flag. Their closed chats stay closed.
export async function reactivateAccountAction(idToken: string, accountId: string): Promise<ActionResult> {
  if (!(await requireAdmin(idToken))) {
    return { success: false, message: "Not authorized." };
  }
  if (!accountId) return { success: false, message: "Account ID not provided." };

  try {
    const [userDoc, counselorDoc] = await Promise.all([
      adminDb.collection("users").doc(accountId).get(),
      adminDb.collection("counselors").doc(accountId).get(),
    ]);
    const profileDoc = counselorDoc.exists ? counselorDoc : userDoc;
    if (!profileDoc.exists) return { success: false, message: "Account not found." };

    await adminAuth.updateUser(accountId, { disabled: false });
    await profileDoc.ref.update({
      accountStatus: "active",
      reactivatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const data = profileDoc.data();
    const name = data?.personalInfo?.fullName || data?.fullName || data?.displayName || data?.email;
    await logActivity({
      type: "account_reactivated",
      title: "Account Reactivated",
      description: `${name || accountId}'s account was reactivated by an admin.`,
      targetId: accountId,
      targetName: name,
    });

    revalidatePath("/users");
    revalidatePath("/counsellors");
    return { success: true, message: `${name || "Account"} has been reactivated.` };
  } catch (error) {
    console.error("Error reactivating account:", error);
    return { success: false, message: `Failed to reactivate: ${error instanceof Error ? error.message : String(error)}` };
  }
}
