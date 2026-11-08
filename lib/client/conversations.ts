import { z } from "zod";

import { createId, readStored, STORAGE_KEYS, writeStored } from "@/lib/client/storage";

export const messageAttachmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["image", "file"]),
  name: z.string(),
  size: z.number().nonnegative(),
  /** Session-only data URL. Stripped before persistence to protect quota. */
  previewUrl: z.string().optional(),
});

export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  /** Full prompt content (may include attached file text) used for history. */
  content: z.string(),
  /** Short text rendered in the bubble when content contains file context. */
  displayText: z.string().optional(),
  createdAt: z.string(),
  status: z.enum(["complete", "streaming", "stopped", "error"]),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
  attachments: z.array(messageAttachmentSchema).max(8).optional(),
  model: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(chatMessageSchema).max(120),
});

export type Conversation = z.infer<typeof conversationSchema>;

export interface ConversationStore {
  version: 1;
  conversations: Conversation[];
  activeId: string | null;
}

export const EMPTY_STORE: ConversationStore = {
  version: 1,
  conversations: [],
  activeId: null,
};

const MAX_CONVERSATIONS = 50;

const storeSchema = z.object({
  version: z.literal(1),
  conversations: z.array(conversationSchema).max(MAX_CONVERSATIONS),
  activeId: z.string().nullable(),
});

export function loadConversationStore(): ConversationStore {
  const parsed = storeSchema.safeParse(
    readStored(STORAGE_KEYS.conversations, (raw) => raw),
  );
  if (!parsed.success) return EMPTY_STORE;
  const conversations = parsed.data.conversations.filter(
    (conversation) => conversation.id.length > 0,
  );
  const activeId = conversations.some((item) => item.id === parsed.data.activeId)
    ? parsed.data.activeId
    : (conversations[0]?.id ?? null);
  return { version: 1, conversations, activeId };
}

/** Image bytes are never written to localStorage; metadata is retained. */
function forStorage(store: ConversationStore): ConversationStore {
  return {
    ...store,
    conversations: store.conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) => ({
        ...message,
        status: message.status === "streaming" ? "stopped" : message.status,
        attachments: message.attachments?.map((attachment) => ({
          id: attachment.id,
          kind: attachment.kind,
          name: attachment.name,
          size: attachment.size,
        })),
      })),
    })),
  };
}

export function saveConversationStore(store: ConversationStore): boolean {
  return writeStored(STORAGE_KEYS.conversations, forStorage(store));
}

export function newConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: "New conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function deriveTitle(content: string, attachmentCount: number): string {
  const firstLine = content
    .trim()
    .split("\n")
    .find((line) => line.trim().length > 0);
  if (firstLine) {
    return firstLine.length > 48 ? `${firstLine.slice(0, 47)}…` : firstLine;
  }
  return attachmentCount > 0 ? "Attachment conversation" : "New conversation";
}

export function sortConversations(items: Conversation[]): Conversation[] {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
