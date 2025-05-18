
"use server";

import type { CounsellorStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db, serverTimestamp } from "@/lib/firebase"; // Added serverTimestamp
import { doc, updateDoc, getDoc, collection, addDoc } from "firebase/firestore"; // Added collection, addDoc

interface VerificationResult {
  success: boolean;
  message: string;
  counsellorId?: string;
  newStatus?: CounsellorStatus;
}

export async function updateCounsellorStatus(counsellorId: string, newStatus: CounsellorStatus): Promise<VerificationResult> {
  console.log(`[Action] updateCounsellorStatus: Attempting to update counsellor. Received ID: '${counsellorId}', New Status: '${newStatus}'`);

  if (!counsellorId || typeof counsellorId !== 'string' || counsellorId.trim() === "") {
    console.error("[Action] updateCounsellorStatus: Invalid counsellorId received:", counsellorId);
    return {
      success: false,
      message: "Invalid Counsellor ID provided to the update action.",
      counsellorId,
    };
  }

  const trimmedCounsellorId = counsellorId.trim();

  try {
    const counsellorDocRef = doc(db, "counselors", trimmedCounsellorId);
    console.log(`[Action] updateCounsellorStatus: Firestore document reference path being checked: ${counsellorDocRef.path}`);

    const docSnap = await getDoc(counsellorDocRef);
    if (!docSnap.exists()) {
      console.error(`[Action] updateCounsellorStatus: Counsellor document with ID '${trimmedCounsellorId}' not found in 'counselors' collection. Path checked: ${counsellorDocRef.path}`);
      return {
        success: false,
        message: `Counsellor with ID ${trimmedCounsellorId} not found. Please ensure the ID is correct and the document exists in the 'counselors' collection.`,
        counsellorId: trimmedCounsellorId,
      };
    }
    const counsellorData = docSnap.data();

    const updateData: { status: CounsellorStatus; isVerified?: boolean; updatedAt: any } = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (newStatus === "Verified") {
      updateData.isVerified = true;
    } else if (newStatus === "Pending" || newStatus === "Rejected" || newStatus === "Invited") {
      updateData.isVerified = false;
    }

    await updateDoc(counsellorDocRef, updateData);

    // Create notification if status changes to "Pending"
    if (newStatus === "Pending") {
      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        type: "counsellor_pending_verification",
        title: "Counsellor Awaiting Verification",
        message: `${counsellorData.personalInfo?.fullName || 'A counsellor'} is now pending verification.`,
        link: `/counsellors?action=verify&id=${trimmedCounsellorId}`,
        read: false,
        timestamp: serverTimestamp(),
      });
    }

    console.log(`[Action] updateCounsellorStatus: Counsellor '${trimmedCounsellorId}' status successfully updated to '${newStatus}' in Firestore.`);
    revalidatePath("/counsellors");
    revalidatePath("/"); // For dashboard pending verifications card
    // No path revalidation for /notifications as AppHeader uses onSnapshot
    
    return {
      success: true,
      message: `Counsellor status successfully updated to ${newStatus}.`,
      counsellorId: trimmedCounsellorId,
      newStatus,
    };
  } catch (error) {
    console.error(`[Action] updateCounsellorStatus: Failed to update counsellor '${trimmedCounsellorId}' status in Firestore:`, error);
    let errorMessage = "Failed to update counsellor status in the database due to an unexpected error.";
    if (error instanceof Error) {
        errorMessage = `Failed to update counsellor status: ${error.message}`;
    }
    return {
      success: false,
      message: errorMessage,
      counsellorId: trimmedCounsellorId,
    };
  }
}
