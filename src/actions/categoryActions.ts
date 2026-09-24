"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/actions/activityActions";

export interface CategoryData {
  name: string;
  icon: string;
  color: string;
  description: string;
  order: number;
  isActive: boolean;
}

interface ActionResult { success: boolean; message: string; id?: string }

export async function createCategoryAction(data: CategoryData): Promise<ActionResult> {
  if (!data.name?.trim()) return { success: false, message: "Category name is required." };
  try {
    const ref = await adminDb.collection("categories").add({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/categories");
    await logActivity({
      type: "category_created",
      title: "Category Created",
      description: `"${data.name}" category was created`,
      targetId: ref.id,
      targetName: data.name,
    });
    return { success: true, message: "Category created.", id: ref.id };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, message: `Failed to create: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function updateCategoryAction(id: string, data: CategoryData): Promise<ActionResult> {
  if (!id) return { success: false, message: "Category ID required." };
  try {
    await adminDb.collection("categories").doc(id).update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath("/categories");
    await logActivity({
      type: "category_updated",
      title: "Category Updated",
      description: `"${data.name}" category was updated`,
      targetId: id,
      targetName: data.name,
    });
    return { success: true, message: `Saved ${data.name}.` };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, message: `Failed to save: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  if (!id) return { success: false, message: "Category ID required." };
  try {
    const snap = await adminDb.collection("categories").doc(id).get();
    const name = snap.data()?.name as string | undefined;
    await adminDb.collection("categories").doc(id).delete();
    revalidatePath("/categories");
    await logActivity({
      type: "category_deleted",
      title: "Category Deleted",
      description: name ? `"${name}" category was deleted` : "A category was deleted",
      targetId: id,
      targetName: name,
    });
    return { success: true, message: "Category removed." };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, message: `Failed to delete: ${error instanceof Error ? error.message : String(error)}` };
  }
}
