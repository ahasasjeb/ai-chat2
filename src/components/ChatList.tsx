import { Button } from "@nextui-org/react";
import type { Chat } from "@/types/ai";

interface ChatListProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export default function ChatList({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }: ChatListProps) {
  const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-64 bg-gray-900 p-4 flex flex-col gap-2">
      <Button 
        color="primary" 
        onPress={onNewChat}
      >
        新对话
      </Button>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedChats.map((chat) => (
          <div 
            key={chat.id}
            className={`group flex items-center gap-2 p-2 rounded cursor-pointer ${
              chat.id === currentChatId ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <div 
              className="flex-1 truncate"
              onClick={() => onSelectChat(chat.id)}
            >
              {chat.title || '新对话'}
            </div>
            <Button 
              size="sm" 
              color="danger" 
              variant="flat"
              onPress={() => onDeleteChat(chat.id)}
              className="opacity-0 group-hover:opacity-100"
            >
              删除
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
