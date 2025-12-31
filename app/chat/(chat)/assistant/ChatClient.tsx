// app/chat/ChatClient.tsx
"use client";

import { Chat } from "../../components/Chat";

const fakeBackendCall = async (message: string) => {
  await new Promise(r => setTimeout(r, 500));
  return `Respuesta simulada a: "${message}"`;
};

export default function ChatClient() {
  return <Chat onSendMessage={fakeBackendCall} />;
}
