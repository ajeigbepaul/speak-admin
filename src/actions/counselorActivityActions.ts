"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";
import type { CounselorActivity, CounselorChatActivity, CounselorChatStatus } from "@/lib/types";

const MAX_CHATS = 100;

// Firestore Timestamps, Dates and ISO strings all end up here
function toDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (typeof value.toDate === "function") return value.toDate();
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

function getChatStatus(post: FirebaseFirestore.DocumentData, counselorId: string): CounselorChatStatus {
  const isCurrent = post.acceptedBy === counselorId;
  if (post.status === "completed") return "completed";
  if (post.status === "reassigned" && post.reassignRequestedBy === counselorId && post.reassignState === "pending") {
    return "reassign_requested";
  }
  if (!isCurrent) return "handed_off";
  if (post.status === "accepted" || post.status === "reassigned") return "active";
  if (post.status === "reopened") return "reopened";
  return "pending";
}

// Everything a counsellor has done on the app: each chat they handled, who it
// was with, how long it ran and how many messages they sent.
export async function getCounselorActivity(
  idToken: string,
  counselorId: string
): Promise<{ success: true; data: CounselorActivity } | { success: false; message: string }> {
  if (!(await requireAdmin(idToken))) {
    return { success: false, message: "Not authorized." };
  }
  if (!counselorId) return { success: false, message: "Counsellor ID not provided." };

  try {
    const posts = adminDb.collection("posts");
    // Chats they hold now, previously held, or asked to hand over
    const snapshots = await Promise.all([
      posts.where("acceptedBy", "==", counselorId).get(),
      posts.where("previousCounselor", "==", counselorId).get(),
      posts.where("reassignRequestedBy", "==", counselorId).get(),
    ]);

    const postDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    snapshots.forEach((snap) => snap.docs.forEach((d) => postDocs.set(d.id, d)));

    const recentPosts = [...postDocs.values()]
      .sort((a, b) => (toDate(b.data().createdAt)?.getTime() ?? 0) - (toDate(a.data().createdAt)?.getTime() ?? 0))
      .slice(0, MAX_CHATS);

    const userCache = new Map<string, Promise<FirebaseFirestore.DocumentData | undefined>>();
    const getUser = (userId: string) => {
      if (!userCache.has(userId)) {
        userCache.set(userId, adminDb.collection("users").doc(userId).get().then((d) => d.data()));
      }
      return userCache.get(userId)!;
    };

    const chats: CounselorChatActivity[] = await Promise.all(
      recentPosts.map(async (postDoc) => {
        const post = postDoc.data();
        const messages = postDoc.ref.collection("messages");

        const [totalSnap, counselorSnap, lastSnap, user] = await Promise.all([
          messages.count().get(),
          messages.where("senderId", "==", counselorId).select("createdAt").get(),
          messages.orderBy("createdAt", "desc").limit(1).select("createdAt").get(),
          post.userId ? getUser(post.userId) : Promise.resolve(undefined),
        ]);

        const counselorMessageTimes = counselorSnap.docs
          .map((d) => toDate(d.data().createdAt)?.getTime())
          .filter((t): t is number => t !== undefined);
        const firstCounselorMessage = counselorMessageTimes.length ? new Date(Math.min(...counselorMessageTimes)) : undefined;
        const lastCounselorMessage  = counselorMessageTimes.length ? new Date(Math.max(...counselorMessageTimes)) : undefined;

        const status = getChatStatus(post, counselorId);
        const startedAt = toDate(post.acceptedAt) ?? firstCounselorMessage;
        const endedAt =
          status === "completed" ? toDate(post.completedAt) ?? toDate(post.updatedAt)
          : status === "active" ? undefined
          : lastCounselorMessage;
        const durationMinutes = startedAt
          ? Math.max(0, Math.round(((endedAt ?? new Date()).getTime() - startedAt.getTime()) / 60000))
          : undefined;

        return {
          postId: postDoc.id,
          status,
          category: post.category,
          issue: typeof post.content === "string" ? post.content.slice(0, 200) : undefined,
          user: {
            id: post.userId,
            name: user?.fullName || user?.displayName || user?.name || user?.email || "Unknown user",
            email: user?.email,
            profilePic: user?.profilePic,
          },
          startedAt: startedAt?.toISOString(),
          endedAt: endedAt?.toISOString(),
          lastMessageAt: toDate(lastSnap.docs[0]?.data().createdAt)?.toISOString(),
          durationMinutes,
          totalMessages: totalSnap.data().count,
          counselorMessages: counselorSnap.size,
          closedReason: post.closedReason,
          reassignReason: post.reassignRequestedBy === counselorId ? post.reassignReason : undefined,
        };
      })
    );

    // Active chats first, then most recent activity
    chats.sort((a, b) => {
      if ((a.status === "active") !== (b.status === "active")) return a.status === "active" ? -1 : 1;
      return (b.lastMessageAt ?? b.startedAt ?? "").localeCompare(a.lastMessageAt ?? a.startedAt ?? "");
    });

    const completedDurations = chats
      .filter((c) => c.status === "completed" && c.durationMinutes !== undefined)
      .map((c) => c.durationMinutes!);

    return {
      success: true,
      data: {
        stats: {
          totalChats: chats.length,
          activeChats: chats.filter((c) => c.status === "active").length,
          completedChats: chats.filter((c) => c.status === "completed").length,
          uniqueUsers: new Set(chats.map((c) => c.user.id)).size,
          messagesSent: chats.reduce((sum, c) => sum + c.counselorMessages, 0),
          avgDurationMinutes: completedDurations.length
            ? Math.round(completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length)
            : null,
          reassignmentsRequested: snapshots[2].size,
        },
        chats,
      },
    };
  } catch (error) {
    console.error("Error loading counsellor activity:", error);
    return { success: false, message: `Failed to load activity: ${error instanceof Error ? error.message : String(error)}` };
  }
}
