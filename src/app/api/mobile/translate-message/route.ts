import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getPostForParticipant, getRequestUid, isFeatureEnabled, isValidDocId } from "@/lib/mobileApi";
import { translateChatMessage } from "@/lib/translate";

export const maxDuration = 60;

// On-demand translation for multilingual chat:
// - the sender calls it after editing a message: translated into the other
//   participant's language;
// - the reader calls it (with targetLang = their chat language) for an older
//   message after changing their language.
export async function POST(req: NextRequest) {
  const uid = await getRequestUid(req);
  if (!uid) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId, messageId, targetLang } = await req.json().catch(() => ({}));
  if (!isValidDocId(postId) || !isValidDocId(messageId)) {
    return NextResponse.json({ message: "postId and messageId are required." }, { status: 400 });
  }

  const post = await getPostForParticipant(postId, uid);
  if (!post) {
    return NextResponse.json({ message: "You are not part of this chat." }, { status: 403 });
  }
  if (!(await isFeatureEnabled("multilingualChat"))) {
    return NextResponse.json({ translated: false });
  }

  const messageRef = adminDb.collection("posts").doc(postId).collection("messages").doc(messageId);
  const message = (await messageRef.get()).data();
  if (!message) {
    return NextResponse.json({ message: "Message not found." }, { status: 404 });
  }

  const callerIsUser = uid === post.userId;
  let target: string | undefined;

  if (message.senderId === uid) {
    // Sender after an edit: translate for the other participant
    const recipientId = callerIsUser ? post.acceptedBy : post.userId;
    if (!recipientId) return NextResponse.json({ translated: false });
    const recipientDoc = await adminDb.collection(callerIsUser ? "counselors" : "users").doc(recipientId).get();
    target = recipientDoc.data()?.preferredLanguage;
  } else {
    // Reader: only into their own saved chat language
    const readerDoc = await adminDb.collection(callerIsUser ? "users" : "counselors").doc(uid).get();
    const readerLang: string | undefined = readerDoc.data()?.preferredLanguage;
    if (typeof targetLang !== "string" || targetLang !== readerLang) {
      return NextResponse.json({ message: "Can only translate into your chat language." }, { status: 400 });
    }
    target = readerLang;
  }

  if (!target || target === message.lang) return NextResponse.json({ translated: false });

  try {
    const translated = await translateChatMessage(messageRef, message, target);
    return NextResponse.json({ translated: !!translated });
  } catch (error) {
    console.error("Error in translate-message:", error);
    return NextResponse.json({ message: "Failed to translate." }, { status: 500 });
  }
}
