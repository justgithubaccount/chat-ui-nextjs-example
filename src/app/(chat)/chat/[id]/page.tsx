import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col h-full">
      <ChatMessages chatId={params.id} />
      <ChatInput chatId={params.id} />
    </div>
  );
}
