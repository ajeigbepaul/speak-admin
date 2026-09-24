import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Server actions are public endpoints, so actions that return sensitive data
// must check the caller. Pass the client's Firebase ID token
// (auth.currentUser.getIdToken()); returns the admin's uid, or null if the
// token is invalid or the user has no adminRoles doc (same check as isAdmin()
// in firestore.rules).
export async function requireAdmin(idToken: string | undefined): Promise<string | null> {
  if (!idToken) return null;
  try {
    const { uid } = await adminAuth.verifyIdToken(idToken);
    const roleDoc = await adminDb.collection("adminRoles").doc(uid).get();
    return roleDoc.exists ? uid : null;
  } catch {
    return null;
  }
}
