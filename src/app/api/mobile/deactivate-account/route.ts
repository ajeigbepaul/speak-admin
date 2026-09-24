import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, FieldValue } from "@/lib/firebase-admin";
import { getRequestToken } from "@/lib/mobileApi";
import { logActivity } from "@/actions/activityActions";

// Soft-deletes (deactivates) the caller's own account. Nothing is deleted:
// the user/counselor doc is flagged, their open chats are closed or handed
// back to the queue, and Firebase Auth sign-in is disabled until an admin
// reactivates the account from the dashboard.

// The app re-authenticates with the user's password right before calling this
const MAX_AUTH_AGE_SECONDS = 5 * 60;

export async function POST(req: NextRequest) {
  const token = await getRequestToken(req);
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (Date.now() / 1000 - token.auth_time > MAX_AUTH_AGE_SECONDS) {
    return NextResponse.json({ message: "Please confirm your password again." }, { status: 401 });
  }

  const uid = token.uid;
  const { reason } = await req.json().catch(() => ({}));
  const deactivationReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";

  try {
    const [userDoc, counselorDoc] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("counselors").doc(uid).get(),
    ]);
    const isCounselor = counselorDoc.exists;
    const profileRef = isCounselor ? counselorDoc.ref : userDoc.ref;
    if (!isCounselor && !userDoc.exists) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    const now = FieldValue.serverTimestamp();
    const batch = adminDb.batch();

    batch.set(
      profileRef,
      {
        accountStatus: "deactivated",
        deactivatedAt: now,
        deactivationReason: deactivationReason || null,
        // Stop push notifications to their devices
        pushTokens: [],
        expoPushToken: FieldValue.delete(),
        updatedAt: now,
      },
      { merge: true }
    );

    if (isCounselor) {
      // Hand their active chats back to the queue so another counselor can pick them up
      const active = await adminDb.collection("posts").where("acceptedBy", "==", uid).get();
      active.docs
        .filter((d) => ["accepted", "reassigned"].includes(d.data().status))
        .forEach((d) =>
          batch.update(d.ref, {
            status: "pending",
            acceptedBy: FieldValue.delete(),
            previousCounselor: uid,
            updatedAt: now,
          })
        );
    } else {
      // Close the user's open requests and chats
      const open = await adminDb.collection("posts").where("userId", "==", uid).get();
      open.docs
        .filter((d) => d.data().status !== "completed")
        .forEach((d) =>
          batch.update(d.ref, {
            status: "completed",
            closedBy: uid,
            closedReason: "account_deactivated",
            completedAt: now,
            updatedAt: now,
          })
        );
    }

    await batch.commit();

    // Block sign-in and end sessions on every device
    await adminAuth.updateUser(uid, { disabled: true });
    await adminAuth.revokeRefreshTokens(uid);

    const name = isCounselor
      ? counselorDoc.data()?.personalInfo?.fullName
      : userDoc.data()?.fullName || userDoc.data()?.displayName;
    await logActivity({
      type: "account_deactivated",
      title: isCounselor ? "Counselor Deactivated Account" : "User Deactivated Account",
      description: `${name || token.email || uid} deactivated their account${deactivationReason ? `: "${deactivationReason}"` : "."}`,
      targetId: uid,
      targetName: name || token.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating account:", error);
    return NextResponse.json({ message: "Failed to deactivate account. Please try again." }, { status: 500 });
  }
}
