"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";
import type { ActionResult, InviteAdminOrUserInput, InviteCounselorInput, UserRole, CounsellorStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/email";
import { buildAdminInviteEmail, buildCounselorInviteEmail } from "@/lib/emailTemplates";
import { logActivity } from "@/actions/activityActions";
import crypto from 'crypto';

function generateTemporaryPassword(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// VERCEL_URL is the per-deployment address (e.g. speak-admin-abc123-….vercel.app), so prefer the
// project's production domain, which Vercel sets on every deployment, before falling back to it.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
const APP_BASE_URL = (
  process.env.NEXT_PUBLIC_APP_BASE_URL ||
  (vercelHost ? `https://${vercelHost}` : "http://localhost:9002")
).replace(/\/+$/, "");

export async function inviteAdminOrUserAction(data: InviteAdminOrUserInput): Promise<ActionResult> {
  const { email, name, role } = data;

  if (!email || !name || !role) {
    return { success: false, message: "Missing required fields for admin/user invitation." };
  }

  try {
    // Check for existing user by email
    const existing = await adminDb.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return { success: false, message: `A user with email ${email} already exists.` };
    }

    // Create Firestore document
    const newDocRef = adminDb.collection('users').doc();
    await newDocRef.set({
      uid:       newDocRef.id,
      email,
      name,
      role:      role as UserRole,
      createdAt: FieldValue.serverTimestamp(),
    });

    const temporaryPassword = generateTemporaryPassword();
    const setPasswordLink = `${APP_BASE_URL}/set-initial-password?email=${encodeURIComponent(email)}&tempPass=${encodeURIComponent(temporaryPassword)}`;

    const mailResult = await sendMail({
      to: email,
      subject: `You're invited to Speak Admin as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      text: `Hello ${name},\n\nYou have been invited to join Speak Admin as a ${role}.\nPlease set your initial password: ${setPasswordLink}\nTemporary password: ${temporaryPassword}\n\nThanks,\nSpeak Admin Team`,
      html: buildAdminInviteEmail(name, role, setPasswordLink, temporaryPassword),
    });

    if (!mailResult.success) {
      return {
        success: true,
        error: "email_failed",
        message: `${role} '${name}' invited. Email failed: ${mailResult.message}. Set password link: ${setPasswordLink}`,
      };
    }

    revalidatePath("/admins");
    revalidatePath("/invite");

    await logActivity({
      type: "admin_invited",
      title: "Admin Invited",
      description: `${name} (${email}) was invited as ${role}`,
      targetName: name,
    });

    return {
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} '${name}' invited successfully. An email has been sent to ${email}.`,
    };
  } catch (error) {
    console.error("Error inviting admin/user:", error);
    return { success: false, message: `Failed to invite: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function inviteCounselorAction(data: InviteCounselorInput): Promise<ActionResult> {
  const { email } = data;

  if (!email) {
    return { success: false, message: "Email is required to invite a counselor." };
  }

  try {
    // Check for existing counselor
    const existing = await adminDb.collection('counselors').where('personalInfo.email', '==', email).get();
    if (!existing.empty) {
      return { success: false, message: `A counselor with email ${email} has already been invited.` };
    }

    // Create counselor document (name will be filled in during profile completion)
    const newCounselorRef = adminDb.collection('counselors').doc();
    await newCounselorRef.set({
      personalInfo:     { email },
      professionalInfo: {},
      isVerified:       false,
      status:           "Invited" as CounsellorStatus,
      createdAt:        FieldValue.serverTimestamp(),
      updatedAt:        FieldValue.serverTimestamp(),
    });

    // Create notification
    await adminDb.collection('notifications').add({
      type:      "new_counsellor_invited",
      title:     "New Counsellor Invited",
      message:   `${email} has been invited and is awaiting profile completion.`,
      link:      `/counsellors?action=verify&id=${newCounselorRef.id}`,
      read:      false,
      timestamp: FieldValue.serverTimestamp(),
    });

    const temporaryPassword = generateTemporaryPassword();
    const setPasswordLink = `${APP_BASE_URL}/set-initial-password?email=${encodeURIComponent(email)}&tempPass=${encodeURIComponent(temporaryPassword)}&type=counselor`;

    const mailResult = await sendMail({
      to: email,
      subject: "You're invited to join Speak as a Counselor",
      text: `Hello,\n\nYou have been invited to join Speak as a Counselor.\nSet your password: ${setPasswordLink}\n\nThanks,\nSpeak Team`,
      html: buildCounselorInviteEmail(email, setPasswordLink, temporaryPassword),
    });

    if (!mailResult.success) {
      return {
        success: true,
        error: "email_failed",
        message: `Counselor invited. Email failed: ${mailResult.message}. Set password link: ${setPasswordLink}`,
      };
    }

    revalidatePath("/counsellors");
    revalidatePath("/invite");

    await logActivity({
      type: "counselor_invited",
      title: "Counselor Invited",
      description: `${email} was invited to join as a counselor`,
      targetId: newCounselorRef.id,
      targetName: email,
    });

    return {
      success: true,
      message: `Invitation sent successfully to ${email}.`,
    };
  } catch (error) {
    console.error("Error inviting counselor:", error);
    return { success: false, message: `Failed to send invitation: ${error instanceof Error ? error.message : String(error)}` };
  }
}
