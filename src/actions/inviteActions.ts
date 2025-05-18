
"use server";

import { db, serverTimestamp } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import type { ActionResult, InviteAdminOrUserInput, InviteCounselorInput, UserRole, CounsellorStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function inviteAdminOrUserAction(data: InviteAdminOrUserInput): Promise<ActionResult> {
  const { email, name, role } = data;

  if (!email || !name || !role) {
    return { success: false, message: "Missing required fields for admin/user invitation." };
  }

  try {
    // Check if user already exists in 'users' collection
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: `A user with email ${email} already exists.` };
    }
    
    const newUserDocRef = doc(collection(db, "users")); // Creates a ref with an auto-generated ID
    await setDoc(newUserDocRef, {
      uid: newUserDocRef.id, // Store the auto-generated ID as uid
      email: email,
      name: name,
      role: role as UserRole,
      createdAt: serverTimestamp(),
      // You might want to add an 'status: "invited"' field here if more detail is needed
    });

    revalidatePath("/users");
    revalidatePath("/invite");

    return { 
      success: true, 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} '${name}' invited successfully. They will need to register with this email: ${email}.` 
    };

  } catch (error) {
    console.error("Error inviting admin/user:", error);
    let errorMessage = "Failed to invite admin/user due to a database error.";
    if (error instanceof Error) {
        errorMessage = `Failed to invite admin/user: ${error.message}`;
    }
    return { success: false, message: errorMessage, error: String(error) };
  }
}

export async function inviteCounselorAction(data: InviteCounselorInput): Promise<ActionResult> {
  const { email, name } = data;

  if (!email || !name) {
    return { success: false, message: "Missing required fields for counselor invitation." };
  }

  try {
    // Check if counselor already exists in 'counselors' collection
    const counselorsRef = collection(db, "counselors");
    const q = query(counselorsRef, where("personalInfo.email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: `A counselor with email ${email} already exists or has been invited.` };
    }

    // Create a new document in 'counselors' collection
    await addDoc(counselorsRef, {
      personalInfo: {
        fullName: name,
        email: email,
      },
      professionalInfo: {}, // Empty object, can be filled later
      isVerified: false,
      status: "Invited" as CounsellorStatus, // Set status to "Invited"
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    revalidatePath("/counsellors");
    revalidatePath("/invite");

    return { 
      success: true, 
      message: `Counselor '${name}' invited successfully. They will appear in the counselor list as 'Invited'.` 
    };

  } catch (error) {
    console.error("Error inviting counselor:", error);
    let errorMessage = "Failed to invite counselor due to a database error.";
     if (error instanceof Error) {
        errorMessage = `Failed to invite counselor: ${error.message}`;
    }
    return { success: false, message: errorMessage, error: String(error) };
  }
}

