
"use server";

import { db, serverTimestamp } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { UserRole } from "@/lib/types";

interface ActionResult {
  success: boolean;
  message: string;
}

// This action is specifically for setting the initial superadmin role.
// It should only be callable under very controlled circumstances (e.g., by the signup form for the designated superadmin email).
export async function setSuperAdminRole(uid: string, email: string): Promise<ActionResult> {
  if (email !== process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL) {
    return { success: false, message: "Unauthorized: Email does not match designated superadmin email." };
  }

  try {
    const usersRef = collection(db, "users");
    
    // Check if a superadmin document already exists for a *different* user
    const q = query(usersRef, where("role", "==", "superadmin"));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      let superadminExistsForOtherUser = false;
      querySnapshot.forEach((doc) => {
        if (doc.id !== uid) {
          superadminExistsForOtherUser = true;
        }
      });
      if (superadminExistsForOtherUser) {
         return { success: false, message: "A superadmin account already exists for a different user." };
      }
    }
    
    // If we are here, either no superadmin exists, or the existing one is the current user (uid match).
    // So, we can proceed to set/update the role for this UID.
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      email: email,
      role: "superadmin" as UserRole,
      createdAt: serverTimestamp(),
      uid: uid,
    }, { merge: true }); // Use merge: true to update if doc exists, or create if not

    console.log(`Superadmin role set for UID: ${uid}`);
    return { success: true, message: "Superadmin role configured successfully." };

  } catch (error) {
    console.error("Error setting superadmin role:", error);
    return { success: false, message: "Failed to configure superadmin role in database." };
  }
}
