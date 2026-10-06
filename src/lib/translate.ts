import type { DocumentReference, DocumentData } from "firebase-admin/firestore";
import { FieldValue } from "@/lib/firebase-admin";

// Multilingual chat translation, provider-agnostic so free models can be used
// for testing and swapped later by changing env vars only:
//   TRANSLATION_BASE_URL  OpenAI-compatible API, e.g. https://openrouter.ai/api/v1
//                         or https://router.huggingface.co/v1
//   TRANSLATION_API_KEY   OpenRouter key or Hugging Face token
//   TRANSLATION_MODEL     model id from that provider
//   HF_TOKEN              Hugging Face token for voice-note transcription
//   TRANSCRIPTION_MODEL   speech-to-text model (default openai/whisper-large-v3)
//   TRANSCRIPTION_URL     optional full endpoint; defaults to HF's hf-inference route
// Every call fails soft (returns null) so the app just shows the original.

const TIMEOUT_MS = 15_000;

// Names for the codes the app offers (constants/languages.ts in the app)
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", yo: "Yoruba", ig: "Igbo", ha: "Hausa", pcm: "Nigerian Pidgin", fr: "French",
  es: "Spanish", pt: "Portuguese", de: "German", it: "Italian", nl: "Dutch", ru: "Russian",
  uk: "Ukrainian", pl: "Polish", tr: "Turkish", ar: "Arabic", fa: "Persian", hi: "Hindi",
  bn: "Bengali", ur: "Urdu", zh: "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)", ja: "Japanese", ko: "Korean",
  id: "Indonesian", vi: "Vietnamese", th: "Thai", sw: "Swahili", am: "Amharic", zu: "Zulu",
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

const SYSTEM_PROMPT =
  "You translate messages in a confidential Christian counselling chat between a counsellor and a person seeking help. " +
  "Translate the user's message faithfully and naturally, keeping its meaning, emotional tone, warmth and level of formality. " +
  "Keep names, Bible references and Scripture quotations accurate (use the target language's common Bible wording where one exists). " +
  "Do not add, remove, soften or explain anything, and do not answer the message. " +
  "Reply with only the translated text.";

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function translateText(text: string, fromCode: string | undefined, toCode: string): Promise<string | null> {
  const baseUrl = process.env.TRANSLATION_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.TRANSLATION_API_KEY;
  const model = process.env.TRANSLATION_MODEL;
  if (!baseUrl || !apiKey || !model || !text.trim()) return null;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  // Optional OpenRouter attribution headers
  if (baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_BASE_URL || "https://speak-admin.vercel.app";
    headers["X-Title"] = "Speak";
  }

  const from = fromCode ? languageName(fromCode) : "the source language (detect it)";
  try {
    const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Translate from ${from} to ${languageName(toCode)}:\n\n${text}` },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(`translateText: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 500));
      return null;
    }
    const json = await res.json();
    const out: unknown = json?.choices?.[0]?.message?.content;
    if (typeof out !== "string" || !out.trim()) return null;
    // Some free models wrap the answer in quotes or add a reasoning block
    return out.replace(/<think>[\s\S]*?<\/think>/gi, "").trim().replace(/^"([\s\S]*)"$/, "$1").trim() || null;
  } catch (error) {
    console.warn("translateText failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Cloudinary converts audio on the fly when the URL's extension changes
function toMp3Url(fileUrl: string): string {
  return /\.[a-z0-9]{2,4}$/i.test(fileUrl) ? fileUrl.replace(/\.[a-z0-9]{2,4}$/i, ".mp3") : `${fileUrl}.mp3`;
}

export async function transcribeAudio(fileUrl: string): Promise<string | null> {
  const token = process.env.HF_TOKEN;
  const model = process.env.TRANSCRIPTION_MODEL || "openai/whisper-large-v3";
  const endpoint = process.env.TRANSCRIPTION_URL || `https://router.huggingface.co/hf-inference/models/${model}`;
  if (!token) return null;

  try {
    const audio = await fetchWithTimeout(toMp3Url(fileUrl), { method: "GET" });
    if (!audio.ok) return null;
    const bytes = await audio.arrayBuffer();

    const res = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "audio/mpeg" },
      body: bytes,
    });
    if (!res.ok) {
      console.warn(`transcribeAudio: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 500));
      return null;
    }
    const json = await res.json();
    const text: unknown = json?.text ?? json?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (error) {
    console.warn("transcribeAudio failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

// Translates a chat message (text, or a voice note via its transcript) into
// targetLang and stores it on the message. Always sets translatedAt so the app
// stops showing "Translating…", even when translation fails. Returns the
// translated text (for the push notification) or null.
export async function translateChatMessage(
  messageRef: DocumentReference,
  message: DocumentData,
  targetLang: string
): Promise<string | null> {
  if (!message.lang || message.lang === targetLang) return null;

  let transcript: string | null = null;
  let source: string | null = null;
  if (message.type === "voice" && message.fileUrl) {
    transcript = message.transcript ?? (await transcribeAudio(message.fileUrl));
    source = transcript;
  } else if (!message.type || message.type === "text") {
    source = message.text ?? null;
  }

  const translated = source ? await translateText(source, message.lang, targetLang) : null;

  // set+merge (not a dotted update path) so codes like "zh-TW" are safe map keys
  const update: Record<string, unknown> = { translatedAt: FieldValue.serverTimestamp() };
  if (transcript) update.transcript = transcript;
  if (translated) update.translations = { [targetLang]: translated };
  await messageRef.set(update, { merge: true });

  return translated;
}
