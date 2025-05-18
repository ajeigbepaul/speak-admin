
"use server";

import type { CounsellorStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

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
    const counsellorDocRef = doc(db, "counsellors", trimmedCounsellorId);
    console.log(`[Action] updateCounsellorStatus: Firestore document reference path being checked: ${counsellorDocRef.path}`);

    const docSnap = await getDoc(counsellorDocRef);
    if (!docSnap.exists()) {
      console.error(`[Action] updateCounsellorStatus: Counsellor document with ID '${trimmedCounsellorId}' not found in 'counsellors' collection. Path checked: ${counsellorDocRef.path}`);
      return {
        success: false,
        message: `Counsellor with ID ${trimmedCounsellorId} not found. Please ensure the ID is correct and the document exists in the 'counsellors' collection.`,
        counsellorId: trimmedCounsellorId,
      };
    }

    const updateData: { status: CounsellorStatus; isVerified?: boolean } = {
      status: newStatus,
    };

    if (newStatus === "Verified") {
      updateData.isVerified = true;
    } else if (newStatus === "Pending" || newStatus === "Rejected") {
      updateData.isVerified = false;
    }

    await updateDoc(counsellorDocRef, updateData);

    console.log(`[Action] updateCounsellorStatus: Counsellor '${trimmedCounsellorId}' status successfully updated to '${newStatus}' in Firestore.`);
    revalidatePath("/counsellors");
    revalidatePath("/");
    
    return {
      success: true,
      message: `Counsellor status successfully updated to ${newStatus}.`,
      counsellorId: trimmedCounsellorId,
      newStatus,
    };
  } catch (error) {
    console.error(`[Action] updateCounsellorStatus: Failed to update counsellor '${trimmedCounsellorId}' status in Firestore:`, error);
    // It's good to provide a more specific error message if possible, but "Failed to update..." is a safe default.
    // Check if error is a FirebaseError and has a code/message
    let errorMessage = "Failed to update counsellor status in the database due to an unexpected error.";
    if (error instanceof Error) {
        errorMessage = `Failed to update counsellor status: ${error.message}`;
    }
    // For Firebase specific errors, you might check error.code
    // if (error.code) { /* handle specific Firebase error codes */ }

    return {
      success: false,
      message: errorMessage,
      counsellorId: trimmedCounsellorId,
    };
  }
}
