import type { Metadata } from "next";

import { ChatApp } from "@/components/chat/chat-app";

export const metadata: Metadata = {
  title: "Assistant",
  description:
    "Your responsive AI chat workspace with local conversation history, model selection, attachments, voice dictation and dark/light themes.",
};

export default function ChatPage() {
  return <ChatApp />;
}
