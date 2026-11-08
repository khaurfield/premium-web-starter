import type {
  AssistantModelMessage,
  ModelMessage,
  SystemModelMessage,
  UserModelMessage,
} from "ai";

import type { ChatMessageInput } from "@/lib/api/contracts";

/** Map validated HTTP input to AI SDK model messages without `any` casts. */
export function toModelMessages(messages: ChatMessageInput[]): ModelMessage[] {
  return messages.map((message): ModelMessage => {
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
}
