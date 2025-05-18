
"use server";

import { db, serverTimestamp } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import type { UserRole } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  message: string;
}

// This action is specifically for setting the initial superadmin role.
export async function setSuperAdminRole(uid: string, email: string): Promise<ActionResult> {
  if (email !== process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL) {
    return { success: false, message: "Unauthorized: Email does not match designated superadmin email." };
  }

  try {
    const usersRef = collection(db, "users");
    
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
    
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, {
      email: email,
      role: "superadmin" as UserRole,
      createdAt: serverTimestamp(),
      uid: uid,
    }, { merge: true }); 

    console.log(`Superadmin role set for UID: ${uid}`);
    return { success: true, message: "Superadmin role configured successfully." };

  } catch (error) {
    console.error("Error setting superadmin role:", error);
    return { success: false, message: "Failed to configure superadmin role in database." };
  }
}

export async function deleteAppUser(uid: string): Promise<ActionResult> {
  if (!uid) {
    return { success: false, message: "User ID not provided." };
  }

  // Prevent deletion of the superadmin account
  const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;
  if (superAdminEmail) {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists() && userDoc.data().email === superAdminEmail) {
      return { success: false, message: "Superadmin account cannot be deleted through this panel." };
    }
  }

  try {
    const userDocRef = doc(db, "users", uid);
    await deleteDoc(userDocRef);

    revalidatePath("/users");
    // TODO: Implement Firebase Authentication user deletion.
    // This typically requires Firebase Admin SDK in a trusted backend environment (e.g., Cloud Function).
    // Example: admin.auth().deleteUser(uid);
    // For now, only the Firestore record is deleted.
    console.log(`User document ${uid} deleted from Firestore.`);
    return { success: true, message: "User removed successfully from the application list. Note: Firebase Auth record may still exist." };
  } catch (error) {
    console.error(`Error deleting user ${uid} from Firestore:`, error);
    let errorMessage = "Failed to delete user from database.";
    if (error instanceof Error) {
        errorMessage = `Failed to delete user: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
