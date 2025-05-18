
"use server";

import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, writeBatch, getDocs, query, where } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

export async function markNotificationAsRead(notificationId: string): Promise<ActionResult> {
  if (!notificationId) {
    return { success: false, message: "Notification ID not provided." };
  }
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
    // No path revalidation needed here as AppHeader uses onSnapshot for real-time updates
    return { success: true, message: "Notification marked as read." };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    let errorMessage = "Failed to mark notification as read.";
    if (error instanceof Error) {
        errorMessage = `Failed to mark notification as read: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}

export async function markAllNotificationsAsRead(notificationIds: string[]): Promise<ActionResult> {
  if (!notificationIds || notificationIds.length === 0) {
    return { success: false, message: "No notification IDs provided to mark as read." };
  }
  try {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
      const notificationRef = doc(db, "notifications", id);
      batch.update(notificationRef, { read: true });
    });
    await batch.commit();
    // No path revalidation needed here as AppHeader uses onSnapshot
    return { success: true, message: `${notificationIds.length} notifications marked as read.` };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    let errorMessage = "Failed to mark all notifications as read.";
    if (error instanceof Error) {
        errorMessage = `Failed to mark all notifications as read: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}
