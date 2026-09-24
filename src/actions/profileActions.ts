"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { ActionResult } from "@/lib/types";
import { logActivity } from "@/actions/activityActions";

export async function getActiveCategoriesAction(): Promise<{ id: string; name: string }[]> {
  try {
    const snap = await adminDb
      .collection("categories")
      .where("isActive", "==", true)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
  } catch {
    return [];
  }
}

export async function getInvitedCounselorData(email: string): Promise<{ fullName?: string } | null> {
  try {
    const snapshot = await adminDb
      .collection("counselors")
      .where("personalInfo.email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return { fullName: snapshot.docs[0].data().personalInfo?.fullName };
  } catch (error) {
    console.error("Error fetching invited counselor:", error);
    return null;
  }
}

interface CompleteProfileInput {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  address: { street: string; city: string; state: string; country: string };
  occupation: string;
  preferredCategories: string[];
}

export async function completeProfileAction(data: CompleteProfileInput): Promise<ActionResult> {
  const { uid, email, fullName, phoneNumber, address, occupation, preferredCategories } = data;

  if (!uid || !email) {
    return { success: false, message: "Missing required fields." };
  }

  try {
    // Find the original invited doc (may have a different ID than uid)
    const existing = await adminDb
      .collection("counselors")
      .where("personalInfo.email", "==", email)
      .limit(1)
      .get();

    const invitedDocData = existing.empty ? {} : existing.docs[0].data();
    const invitedDocId = existing.empty ? null : existing.docs[0].id;

    // Write the completed profile doc keyed by Firebase Auth UID
    await adminDb.collection("counselors").doc(uid).set(
      {
        ...invitedDocData,
        personalInfo: {
          ...(invitedDocData.personalInfo || {}),
          fullName,
          email,
          phoneNumber,
          address,
        },
        professionalInfo: {
          ...(invitedDocData.professionalInfo || {}),
          occupation,
          preferredCategories,
        },
        isVerified: false,
        status: "Pending",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Delete the original invited doc if its ID differs from uid
    if (invitedDocId && invitedDocId !== uid) {
      await adminDb.collection("counselors").doc(invitedDocId).delete();
    }

    await logActivity({
      type: "counselor_profile_completed",
      title: "Profile Completed",
      description: `${fullName} completed their counselor profile`,
      targetId: uid,
      targetName: fullName,
    });

    return { success: true, message: "Profile submitted successfully." };
  } catch (error) {
    console.error("Error completing counselor profile:", error);
    return {
      success: false,
      message: `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
