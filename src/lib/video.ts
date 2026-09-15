import crypto from "crypto";
import type { VideoProvider } from "@prisma/client";

const SIGNING_KEY = process.env.VIDEO_SIGNING_KEY ?? "dev-video-signing-key";
const DEFAULT_TTL_SECONDS = 60 * 60 * 2; // 2h

/**
 * Génère un jeton signé temporaire pour autoriser la lecture d'une vidéo.
 * Le jeton est lié à (lessonId, userId) et expire — il n'expose jamais le
 * fichier source de façon permanente.
 */
export function signVideoToken(
  lessonId: string,
  userId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${lessonId}.${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", SIGNING_KEY).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

/** Vérifie un jeton signé et retourne le lessonId/userId si valide. */
export function verifyVideoToken(
  token: string
): { lessonId: string; userId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [lessonId, userId, expStr, sig] = decoded.split(".");
    if (!lessonId || !userId || !expStr || !sig) return null;

    const payload = `${lessonId}.${userId}.${expStr}`;
    const expected = crypto
      .createHmac("sha256", SIGNING_KEY)
      .update(payload)
      .digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    if (Number(expStr) * 1000 < Date.now()) return null;

    return { lessonId, userId };
  } catch {
    return null;
  }
}

/**
 * Construit la source de lecture côté client à partir du provider.
 * - LOCAL : passe par notre route proxy signée (jamais le fichier direct).
 * - BUNNY / CLOUDFLARE / VIMEO : URL d'iframe du provider (déjà protégée).
 * - YOUTUBE : embed (pour les previews gratuits / démo).
 */
export function buildPlaybackSource(opts: {
  provider: VideoProvider;
  videoUrl: string | null;
  lessonId: string;
  signedToken: string;
}): { type: "iframe" | "file"; src: string } | null {
  const { provider, videoUrl, lessonId, signedToken } = opts;
  if (!videoUrl) return null;

  switch (provider) {
    case "BUNNY":
    case "CLOUDFLARE":
    case "VIMEO":
      return { type: "iframe", src: videoUrl };
    case "YOUTUBE":
      return { type: "iframe", src: toYoutubeEmbed(videoUrl) };
    case "LOCAL":
    default:
      return { type: "file", src: `/api/video/${lessonId}?token=${signedToken}` };
  }
}

function toYoutubeEmbed(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  const id = match?.[1];
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : url;
}
