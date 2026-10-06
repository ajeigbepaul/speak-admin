"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/requireAdmin";
import { logActivity } from "@/actions/activityActions";
import type { ActionResult, FeatureFlags, FeatureKey } from "@/lib/types";

// Post-launch features the mobile app shows only when switched on here.
// Stored in config/features; a missing doc or field means "off".
const FEATURE_KEYS: FeatureKey[] = ["testimonies", "multilingualChat", "bookSuggestions"];

const FEATURE_NAMES: Record<FeatureKey, string> = {
  testimonies: "Testimonies",
  multilingualChat: "Multilingual chat",
  bookSuggestions: "Book suggestions",
};

export async function getFeatureFlagsAction(): Promise<FeatureFlags> {
  const data = (await adminDb.collection("config").doc("features").get()).data() ?? {};
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, data[key] === true])) as FeatureFlags;
}

export async function updateFeatureFlagAction(
  idToken: string,
  key: FeatureKey,
  enabled: boolean
): Promise<ActionResult> {
  const adminUid = await requireAdmin(idToken);
  if (!adminUid) return { success: false, message: "Not authorized." };
  if (!FEATURE_KEYS.includes(key)) return { success: false, message: "Unknown feature." };

  try {
    await adminDb.collection("config").doc("features").set(
      { [key]: enabled, updatedAt: FieldValue.serverTimestamp(), updatedBy: adminUid },
      { merge: true }
    );
    await logActivity({
      type: "feature_toggled",
      title: `${FEATURE_NAMES[key]} ${enabled ? "turned on" : "turned off"}`,
      description: `${FEATURE_NAMES[key]} was ${enabled ? "enabled" : "disabled"} in the mobile app.`,
      targetId: key,
      targetName: FEATURE_NAMES[key],
    });
    return { success: true, message: `${FEATURE_NAMES[key]} ${enabled ? "enabled" : "disabled"}.` };
  } catch (error) {
    console.error("Error updating feature flag:", error);
    return { success: false, message: `Failed to update: ${error instanceof Error ? error.message : String(error)}` };
  }
}
