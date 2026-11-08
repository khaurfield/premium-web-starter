/** Shared browser-side types. No server secrets or server-only imports here. */

export type {
  ChatMessage,
  Conversation,
  MessageAttachment,
} from "@/lib/client/conversations";
export type { Preferences, ThemePreference } from "@/lib/client/preferences";
export type { AvatarAccent, Profile } from "@/lib/client/profile";

export const ALLOWED_IMAGE_MEDIA_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type ImageMediaType = (typeof ALLOWED_IMAGE_MEDIA_TYPES)[number];

export interface PendingTextAttachment {
  id: string;
  kind: "file";
  name: string;
  size: number;
  /** Real file contents, included in the outgoing prompt. */
  text: string;
}

export interface PendingImageAttachment {
  id: string;
  kind: "image";
  name: string;
  size: number;
  mediaType: ImageMediaType;
  /** Session-only object/data URL used for the thumbnail. */
  previewUrl: string;
  /** Raw base64 bytes sent to the provider. */
  base64: string;
}

export type PendingAttachment = PendingTextAttachment | PendingImageAttachment;

export interface ApiErrorInfo {
  code: string;
  message: string;
  status?: number;
  requestId?: string;
}
