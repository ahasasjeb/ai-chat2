import { Button } from "@nextui-org/react";
import type { Chat } from "@/types/ai";

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export default function ChatList({ chats, currentChatId, onSelectChat, onNewChat }: ChatListProps) {
  const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-64 h-screen bg-gray-100 p-4 flex flex-col gap-2">
      <Button 
        color="primary" 
        className="mb-4"
        onPress={onNewChat}
      >
        新建对话
      </Button>
      
      <div className="flex-1 overflow-y-auto">
        {sortedChats.map((chat) => (
          <Button
            key={chat.id}
            className="w-full mb-2 justify-start"
            color={currentChatId === chat.id ? "primary" : "default"}
            variant={currentChatId === chat.id ? "solid" : "light"}
            onPress={() => onSelectChat(chat.id)}
          >
            {chat.title || '新对话'}
          </Button>
        ))}
      </div>
    </div>
  );
}
