import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cloudinary, getPostForParticipant, getRequestUid, isValidDocId } from "@/lib/mobileApi";

// Signs a Cloudinary upload for the mobile app. The server decides where the
// file goes and checks the caller may upload there, so the signed preset
// can't be used by anyone who isn't a signed-in participant.
const UPLOAD_PRESET = "speak_signed";

const UPLOAD_KINDS = {
  avatar:          { prefix: "profilePics",          resourceType: "image", chat: false },
  counselorAvatar: { prefix: "counselorProfilePics", resourceType: "image", chat: false },
  chatImage:       { prefix: "chatImages",           resourceType: "image", chat: true  },
  chatFile:        { prefix: "chatFiles",            resourceType: "raw",   chat: true  },
  voiceNote:       { prefix: "voiceNotes",           resourceType: "video", chat: true  }, // Cloudinary stores audio as video
} as const;

type UploadKind = keyof typeof UPLOAD_KINDS;

export async function POST(req: NextRequest) {
  const uid = await getRequestUid(req);
  if (!uid) {
    return NextResponse.json({ message: "Sign in to upload files." }, { status: 401 });
  }

  const { kind, postId, fileName } = await req.json().catch(() => ({}));
  const config = UPLOAD_KINDS[kind as UploadKind];
  if (!config) {
    return NextResponse.json({ message: "Unknown upload kind." }, { status: 400 });
  }

  let publicId: string;
  const params: Record<string, string | number | boolean> = { upload_preset: UPLOAD_PRESET };

  if (config.chat) {
    if (!isValidDocId(postId)) {
      return NextResponse.json({ message: "A valid postId is required." }, { status: 400 });
    }
    if (!(await getPostForParticipant(postId, uid))) {
      return NextResponse.json({ message: "You are not part of this chat." }, { status: 403 });
    }

    publicId = `${config.prefix}/${postId}/${crypto.randomBytes(16).toString("hex")}`;
    // Raw files are served as-is, so keep the extension or the download has none
    if (config.resourceType === "raw" && typeof fileName === "string") {
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (ext && ext !== fileName.toLowerCase() && /^[a-z0-9]{1,8}$/.test(ext)) {
        publicId += `.${ext}`;
      }
    }
  } else {
    // Fixed id per user; overwrite + invalidate so a new avatar replaces the old one
    publicId = `${config.prefix}/${uid}/avatar`;
    params.overwrite  = true;
    params.invalidate = true;
  }

  params.public_id = publicId;
  params.timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return NextResponse.json({
    cloudName:    process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:       process.env.CLOUDINARY_API_KEY,
    resourceType: config.resourceType,
    params,
    signature,
  });
}
