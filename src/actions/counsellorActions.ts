
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
  console.log(`Attempting to update counsellor ${counsellorId} to status ${newStatus} in Firestore.`);

  try {
    const counsellorDocRef = doc(db, "counsellors", counsellorId);

    // Check if counsellor exists before updating (optional but good practice)
    const docSnap = await getDoc(counsellorDocRef);
    if (!docSnap.exists()) {
      console.error(`Counsellor document with ID ${counsellorId} not found.`);
      return {
        success: false,
        message: `Counsellor with ID ${counsellorId} not found.`,
        counsellorId,
      };
    }

    // Prepare data for update. We'll primarily update the status.
    // If your Firestore structure also uses isVerified, you might want to update it too.
    // For now, we assume 'status' is the primary field to represent these states.
    const updateData: { status: CounsellorStatus; isVerified?: boolean } = {
      status: newStatus,
    };

    // Optionally, set isVerified based on the newStatus if your schema uses it
    if (newStatus === "Verified") {
      updateData.isVerified = true;
    } else if (newStatus === "Pending" || newStatus === "Rejected") {
      updateData.isVerified = false; // Explicitly set isVerified for Pending/Rejected
    }

    await updateDoc(counsellorDocRef, updateData);

    console.log(`Counsellor ${counsellorId} status updated to ${newStatus} in Firestore.`);
    revalidatePath("/counsellors"); // Revalidate the counsellors page to reflect changes
    revalidatePath("/"); // Revalidate dashboard page (e.g. for pending verifications card)
    
    return {
      success: true,
      message: `Counsellor status successfully updated to ${newStatus}.`,
      counsellorId,
      newStatus,
    };
  } catch (error) {
    console.error(`Failed to update counsellor ${counsellorId} status in Firestore:`, error);
    return {
      success: false,
      message: "Failed to update counsellor status in the database.",
      counsellorId,
    };
  }
}
