import { NextRequest, NextResponse } from "next/server";
import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { getPostForParticipant, getRequestUid, isValidDocId } from "@/lib/mobileApi";

// Sends an Expo push notification for a new chat message. The mobile app calls
// this right after writing the message (replaces the sendPushNotification
// Cloud Function). Only the sender can trigger it, and only once per message.
export async function POST(req: NextRequest) {
  const uid = await getRequestUid(req);
  if (!uid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId, messageId } = await req.json().catch(() => ({}));
  if (!isValidDocId(postId) || !isValidDocId(messageId)) {
    return NextResponse.json({ message: "postId and messageId are required." }, { status: 400 });
  }

  const postData = await getPostForParticipant(postId, uid);
  if (!postData) {
    return NextResponse.json({ message: "You are not part of this chat." }, { status: 403 });
  }

  // Claim the message so a retry or replay can't send the notification twice
  const messageRef = adminDb.collection("posts").doc(postId).collection("messages").doc(messageId);
  const messageData = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(messageRef);
    const data = snap.data();
    if (!data || data.senderId !== uid || data.pushSentAt) return null;
    tx.update(messageRef, { pushSentAt: FieldValue.serverTimestamp() });
    return data;
  });
  if (!messageData) {
    return NextResponse.json({ sent: false });
  }

  try {
    // Determine recipient id and whether they are a counselor
    const senderIsUser         = uid === postData.userId;
    const recipientId          = senderIsUser ? postData.acceptedBy : postData.userId;
    const recipientIsCounselor = senderIsUser; // if sender is user, recipient is counselor

    if (!recipientId) return NextResponse.json({ sent: false });

    // Look up tokens from the correct collection
    const recipientDoc = await adminDb
      .collection(recipientIsCounselor ? "counselors" : "users")
      .doc(recipientId)
      .get();
    const recipientData = recipientDoc.data();
    if (!recipientData) return NextResponse.json({ sent: false });

    const tokens: string[] = Array.isArray(recipientData.pushTokens)
      ? recipientData.pushTokens
      : recipientData.expoPushToken
        ? [recipientData.expoPushToken]
        : [];

    if (tokens.length === 0) return NextResponse.json({ sent: false });

    // Resolve sender display name
    let senderName = "Someone";
    if (senderIsUser) {
      const senderDoc = await adminDb.collection("users").doc(uid).get();
      senderName = senderDoc.data()?.displayName || senderName;
    } else {
      const senderDoc = await adminDb.collection("counselors").doc(uid).get();
      senderName = senderDoc.data()?.personalInfo?.fullName || senderName;
    }

    // Build notification body based on message type
    let body: string;
    switch (messageData.type) {
      case "image": body = "📷 Sent an image";          break;
      case "voice": body = "🎤 Sent a voice note";      break;
      case "file":  body = `📎 Sent a file: ${messageData.fileName || "file"}`; break;
      default: {
        const text: string = messageData.text || "";
        body = text.length > 80 ? `${text.substring(0, 80)}…` : text;
      }
    }

    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: `New message from ${senderName}`,
      body,
      data: { type: "chat", postId, senderId: uid },
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log(`Push sent for post=${postId}, recipient=${recipientId}:`, result);
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Error in notify-message:", error);
    return NextResponse.json({ message: "Failed to send notification." }, { status: 500 });
  }
}
