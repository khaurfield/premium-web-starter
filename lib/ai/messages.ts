import type {
  AssistantModelMessage,
  ImagePart,
  ModelMessage,
  SystemModelMessage,
  TextPart,
  UserModelMessage,
} from "ai";

import type {
  ChatMessageInput,
  ImageAttachmentInput,
} from "@/lib/api/contracts";

/**
 * Map validated HTTP input to AI SDK model messages without `any` casts.
 * Images become real `image` parts on the last user turn, so a vision-capable
 * provider receives the same bytes the browser attached.
 */
export function toModelMessages(
  messages: ChatMessageInput[],
  images: ImageAttachmentInput[] = [],
): ModelMessage[] {
  const result: ModelMessage[] = messages.map((message): ModelMessage => {
    switch (message.role) {
      case "system": {
        const system: SystemModelMessage = {
          role: "system",
          content: message.content,
        };
        return system;
      }
      case "user": {
        const user: UserModelMessage = {
          role: "user",
          content: message.content,
        };
        return user;
      }
      case "assistant": {
        const assistant: AssistantModelMessage = {
          role: "assistant",
          content: message.content,
        };
        return assistant;
      }
    }
  });

  if (images.length === 0) return result;

  let lastUserIndex = -1;
  for (let index = result.length - 1; index >= 0; index -= 1) {
    if (result[index]?.role === "user") {
      lastUserIndex = index;
      break;
    }
  }
  if (lastUserIndex < 0) return result;

  const lastUser = result[lastUserIndex] as UserModelMessage;
  const text = typeof lastUser.content === "string" ? lastUser.content : "";

  const imageParts: ImagePart[] = images.map((image) => ({
    type: "image",
    image: image.data,
    mediaType: image.mediaType,
  }));
  const parts: (TextPart | ImagePart)[] = text
    ? [{ type: "text", text }, ...imageParts]
    : imageParts;

  result[lastUserIndex] = { role: "user", content: parts };
  return result;
}
