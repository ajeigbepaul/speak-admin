import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Helpers for the /api/mobile/* routes the Speak mobile app calls. These
// replace the old Firebase Cloud Functions so the project can stay on the
// free Spark plan.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export { cloudinary };

// Verifies the "Authorization: Bearer <idToken>" header. Returns the decoded
// token, or null if it's missing, invalid or revoked.
export async function getRequestToken(req: NextRequest): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!idToken) return null;
  try {
    return await adminAuth.verifyIdToken(idToken, true);
  } catch {
    return null;
  }
}

// Returns the Firebase uid from the request's ID token, or null.
export async function getRequestUid(req: NextRequest): Promise<string | null> {
  return (await getRequestToken(req))?.uid ?? null;
}

export function isValidDocId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]+$/.test(id);
}

// Returns the post if uid is its user or accepted counselor, otherwise null.
export async function getPostForParticipant(postId: string, uid: string) {
  const postDoc = await adminDb.collection("posts").doc(postId).get();
  const post = postDoc.data();
  if (!post || (post.userId !== uid && post.acceptedBy !== uid)) return null;
  return post;
}
