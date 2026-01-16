
"use server";

import { db, serverTimestamp } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import type { ActionResult, InviteAdminOrUserInput, InviteCounselorInput, UserRole, CounsellorStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/email";
import crypto from 'crypto';

function generateTemporaryPassword(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:9002");

export async function inviteAdminOrUserAction(data: InviteAdminOrUserInput): Promise<ActionResult> {
  const { email, name, role } = data;

  if (!email || !name || !role) {
    return { success: false, message: "Missing required fields for admin/user invitation." };
  }

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: `A user with email ${email} already exists.` };
    }

    const newUserDocRef = doc(collection(db, "users"));
    await setDoc(newUserDocRef, {
      uid: newUserDocRef.id,
      email: email,
      name: name,
      role: role as UserRole,
      createdAt: serverTimestamp(),
    });

    const temporaryPassword = generateTemporaryPassword();
    const setPasswordLink = `${APP_BASE_URL}/set-initial-password?email=${encodeURIComponent(email)}&tempPass=${encodeURIComponent(temporaryPassword)}`;

    const mailResult = await sendMail({
      to: email,
      subject: "You're invited to Speak Admin",
      text: `Hello ${name},\n\nYou have been invited to join Speak Admin as a ${role}.\nPlease set your initial password by visiting this link: ${setPasswordLink}\nYour temporary password is: ${temporaryPassword}\n\nIf you did not expect this invitation, please ignore this email.\n\nThanks,\nThe Speak Admin Team`,
      html: `<p>Hello ${name},</p><p>You have been invited to join Speak Admin as a ${role}.</p><p>Please set your initial password by clicking the link below:</p><p><a href="${setPasswordLink}">Set Your Password</a></p><p>Your temporary password (for context, primarily used in the link) is: <strong>${temporaryPassword}</strong></p><p>If you did not expect this invitation, please ignore this email.</p><p>Thanks,<br/>The Speak Admin Team</p>`,
    });

    if (!mailResult.success) {
      console.error("Failed to send invitation email, but user record created:", mailResult.message);
      return {
        success: true,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} '${name}' invited. Firestore record created, but an error occurred sending the invitation email: ${mailResult.message}. Please provide them this link to set password: ${setPasswordLink} (Temp Pass: ${temporaryPassword})`
      };
    }

    revalidatePath("/admins");
    revalidatePath("/invite");

    return {
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} '${name}' invited successfully. An email has been sent to ${email} with instructions to set their password.`
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
    const counselorsRef = collection(db, "counselors");
    const q = query(counselorsRef, where("personalInfo.email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return { success: false, message: `A counselor with email ${email} already exists or has been invited.` };
    }

    const newCounselorDocRef = await addDoc(counselorsRef, {
      personalInfo: {
        fullName: name,
        email: email,
      },
      professionalInfo: {},
      isVerified: false,
      status: "Invited" as CounsellorStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create a notification for the new counselor invitation
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      type: "new_counsellor_invited",
      title: "New Counsellor Invited",
      message: `${name} has been invited and is awaiting profile completion.`,
      link: `/counsellors?action=verify&id=${newCounselorDocRef.id}`,
      read: false,
      timestamp: serverTimestamp(),
    });

    const temporaryPassword = generateTemporaryPassword();
    const setPasswordLink = `${APP_BASE_URL}/set-initial-password?email=${encodeURIComponent(email)}&tempPass=${encodeURIComponent(temporaryPassword)}&type=counselor`;

    const mailResult = await sendMail({
      to: email,
      subject: "You're invited to become a Speak Counselor",
      text: `Hello ${name},\n\nYou have been invited to join Speak as a Counselor.\nPlease set your initial password and complete your profile by visiting this link: ${setPasswordLink}\nYour temporary password is: ${temporaryPassword}\n\nIf you did not expect this invitation, please ignore this email.\n\nThanks,\nThe Speak Admin Team`,
      html: `<p>Hello ${name},</p><p>You have been invited to join Speak as a Counselor.</p><p>Please set your initial password and complete your profile by clicking the link below:</p><p><a href="${setPasswordLink}">Set Your Password & Complete Profile</a></p><p>Your temporary password (for context, primarily used in the link) is: <strong>${temporaryPassword}</strong></p><p>If you did not expect this invitation, please ignore this email.</p><p>Thanks,<br/>The Speak Admin Team</p>`,
    });

    if (!mailResult.success) {
      console.error("Failed to send invitation email, but counselor record created:", mailResult.message);
      return {
        success: true,
        message: `Counselor '${name}' invited. Firestore record created, but an error occurred sending the invitation email: ${mailResult.message}. Please provide them this link to set password: ${setPasswordLink} (Temp Pass: ${temporaryPassword})`
      };
    }

    revalidatePath("/counsellors");
    revalidatePath("/invite");
    // No path revalidation for /notifications as AppHeader uses onSnapshot

    return {
      success: true,
      message: `Counselor '${name}' invited successfully. An email has been sent to ${email} with instructions to set their password and complete their profile. A notification has been created.`
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
