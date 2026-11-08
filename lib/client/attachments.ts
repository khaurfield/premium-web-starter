import type { ImageAttachmentInput } from "@/lib/api/contracts";
import { createId } from "@/lib/client/storage";
import {
  ALLOWED_IMAGE_MEDIA_TYPES,
  type ImageMediaType,
  type MessageAttachment,
  type PendingAttachment,
  type PendingImageAttachment,
} from "@/lib/client/types";

export { ALLOWED_IMAGE_MEDIA_TYPES, type ImageMediaType } from "@/lib/client/types";

export const TEXT_FILE_EXTENSIONS = [
  "txt",
  "md",
  "markdown",
  "json",
  "csv",
  "tsv",
  "log",
  "yaml",
  "yml",
  "xml",
] as const;

export const MAX_TEXT_FILE_BYTES = 100_000;
export const MAX_TOTAL_TEXT_BYTES = 200_000;
export const MAX_TEXT_FILES = 4;
export const MAX_IMAGE_BYTES = 2_000_000;
export const MAX_IMAGES = 4;
export const MAX_MESSAGE_CHARS = 32_000;

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function formatBytes(bytes: number): string {
  return bytes < 1024
    ? `${bytes} B`
    : `${(bytes / 1024).toFixed(bytes < 1024 * 1024 ? 0 : 1)} KB`;
}

function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  return (TEXT_FILE_EXTENSIONS as readonly string[]).includes(extensionOf(file.name));
}

function isAllowedImageType(value: string): value is ImageMediaType {
  return (ALLOWED_IMAGE_MEDIA_TYPES as readonly string[]).includes(value);
}

/** Reads a small text file and returns real content to include in the prompt. */
export async function createTextAttachment(file: File): Promise<PendingAttachment> {
  if (!isTextFile(file)) {
    throw new Error(
      `“${file.name}” is not a supported text file. Use ${TEXT_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(", ")}.`,
    );
  }
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error(
      `“${file.name}” is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_TEXT_FILE_BYTES)}.`,
    );
  }

  const text = await file.text();
  if (text.trim().length === 0) throw new Error(`“${file.name}” is empty.`);

  return { id: createId(), kind: "file", name: file.name, size: file.size, text };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the image."));
    };
    reader.onerror = () => reject(new Error(`Could not read “${file.name}”.`));
    reader.readAsDataURL(file);
  });
}

/** Reject mislabelled or corrupt files before they are sent to a provider. */
function hasExpectedSignature(base64: string, mediaType: ImageMediaType): boolean {
  let head: string;
  try {
    head = atob(base64.slice(0, 24));
  } catch {
    return false;
  }
  const bytes = [...head].map((char) => char.charCodeAt(0));
  switch (mediaType) {
    case "image/png":
      return bytes[0] === 0x89 && head.slice(1, 4) === "PNG";
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/gif":
      return head.startsWith("GIF8");
    case "image/webp":
      return head.startsWith("RIFF") && head.slice(8, 12) === "WEBP";
  }
}

/** Reads a real image into a base64 payload for the provider. */
export async function createImageAttachment(file: File): Promise<PendingAttachment> {
  if (!isAllowedImageType(file.type)) {
    throw new Error(`“${file.name}” is not a PNG, JPEG, WebP or GIF image.`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `“${file.name}” is ${formatBytes(file.size)}; the limit is ${formatBytes(MAX_IMAGE_BYTES)}.`,
    );
  }

  const previewUrl = await readAsDataUrl(file);
  const base64 = previewUrl.split(",")[1] ?? "";
  if (!base64 || !hasExpectedSignature(base64, file.type)) {
    throw new Error(`“${file.name}” does not contain valid image data.`);
  }

  return {
    id: createId(),
    kind: "image",
    name: file.name,
    size: file.size,
    mediaType: file.type,
    previewUrl,
    base64,
  };
}

/** Text-file contents become real prompt context, clearly delimited. */
export function composeMessageContent(
  text: string,
  attachments: PendingAttachment[],
): string {
  const files = attachments.filter(
    (item): item is Extract<PendingAttachment, { kind: "file" }> =>
      item.kind === "file" && item.text.length > 0,
  );
  if (files.length === 0) return text.trim();

  const blocks = files.map(
    (file) => `--- Attached file: ${file.name} ---\n${file.text}`,
  );
  return [text.trim(), ...blocks].filter(Boolean).join("\n\n");
}

export function toImageInputs(
  attachments: PendingAttachment[],
): ImageAttachmentInput[] {
  return attachments
    .filter((item): item is PendingImageAttachment => item.kind === "image")
    .map((item) => ({
      kind: "image",
      mediaType: item.mediaType,
      data: item.base64,
      name: item.name,
    }));
}

export function toMessageAttachments(
  attachments: PendingAttachment[],
): MessageAttachment[] {
  return attachments.map((item) => ({
    id: item.id,
    kind: item.kind,
    name: item.name,
    size: item.size,
    ...(item.kind === "image" ? { previewUrl: item.previewUrl } : {}),
  }));
}

export const attachmentLimits = {
  maxTextFiles: MAX_TEXT_FILES,
  maxImages: MAX_IMAGES,
  maxMessageChars: MAX_MESSAGE_CHARS,
  maxTotalTextBytes: MAX_TOTAL_TEXT_BYTES,
  maxImageBytes: MAX_IMAGE_BYTES,
} as const;
