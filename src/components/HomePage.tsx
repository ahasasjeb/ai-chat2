"use client";

import { useState, useEffect } from 'react';
import { Input, Button, Spinner } from "@nextui-org/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ChatMessage, Chat } from '@/types/ai';
import ChatList from './ChatList';
import { StarfieldCanvas } from './start';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useLocalStorage<Chat[]>('chats', []);
  const [currentChatId, setCurrentChatId] = useLocalStorage<string | null>('current-chat-id', null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentChat = chats.find(chat => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
  };

  const generateTitle = async (messages: ChatMessage[]) => {
    if (messages.length < 2) return; // 至少需要一次对话才生成标题

    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })) }),
      });

      const { title } = await response.json();
      
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, title }
          : chat
      ));
    } catch (error) {
      console.error('Error generating title:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentChatId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ));
    
    setInput('');
    setIsLoading(true);
    setCurrentAssistantMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const reader = response.body?.getReader();
      let accumulatedContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        accumulatedContent += text;
        setCurrentAssistantMessage(accumulatedContent);
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: accumulatedContent
      };

      // 先清除当前助手消息
      setCurrentAssistantMessage('');
      
      // 更新消息列表
      setChats(prev => prev.map(chat => 
        chat.id === currentChatId 
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));

      // 等待消息更新完成后再生成标题
      const updatedMessages = [...messages, userMessage, assistantMessage];
      if (updatedMessages.length === 2) {
        // 使用setTimeout确保消息更新完成后再生成标题
        setTimeout(async () => {
          await generateTitle(updatedMessages);
        }, 0);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  return (
    <div className="flex h-screen relative bg-black">
      <StarfieldCanvas />
      <div className="flex h-screen w-full absolute" style={{ zIndex: 1 }}>
        {/* 侧边栏容器 */}
        <div className="relative" style={{ zIndex: 50 }}>
          {/* 移动端菜单按钮移到这里 */}
          <Button
            className="md:hidden fixed top-4 left-4 z-10 bg-blue-600 hover:bg-blue-500 text-white"
            isIconOnly
            variant="solid"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '✕' : '☰'}
          </Button>

          {/* 侧边栏 */}
          <aside 
            className={`
              fixed md:relative w-64 h-full transition-transform duration-300 ease-in-out
              bg-gray-900 border-r border-gray-800
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
          >
            <div className="h-full w-full overflow-y-auto pt-16 md:pt-0">
              <ChatList 
                chats={chats}
                currentChatId={currentChatId}
                onSelectChat={(id) => {
                  setCurrentChatId(id);
                  setIsSidebarOpen(false);
                }}
                onNewChat={createNewChat}
                onDeleteChat={deleteChat}
              />
            </div>
          </aside>

          {/* 移动端遮罩层也移到这里 */}
          {isSidebarOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/60"
              style={{ zIndex: -1 }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>

        {/* 主内容区域 */}
        <main className="flex-1 flex flex-col bg-black/50">
          {!currentChatId || chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <div className="max-w-lg text-center space-y-4 text-white">
                <h1 className="text-2xl font-bold">欢迎使用 AI 助手</h1>
                <p className="text-gray-300">
                  这是一个基于GPT 4o mini的对话助手，可以帮助你解答问题、进行创作、编程等。
                  隐私声明：我们不会保存任何对话内容，所有对话内容都只保存在你的浏览器中。
                  点击左侧的&ldquo;新对话&rdquo;按钮开始交谈吧！
                </p>
                <Button color="primary" onPress={createNewChat}>
                  开始新对话
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-2 md:p-4">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`rounded-2xl px-3 py-2 md:px-4 md:py-2 max-w-[90%] md:max-w-[80%] ${
                          m.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-green-500 text-white prose prose-invert max-w-none'
                        }`}
                      >
                        {m.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              pre: ({ ...props }) => (
                                <pre className="bg-black/20 rounded-lg p-2 overflow-auto" {...props} />
                              ),
                              code: ({ className, children, ...props }) => (
                                <code className={`${className || ''} font-mono text-sm`} {...props}>
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                  {currentAssistantMessage && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl px-4 py-2 max-w-[80%] bg-green-500 text-white prose prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            pre: ({ ...props }) => (
                              <pre className="bg-black/20 rounded-lg p-2 overflow-auto" {...props} />
                            ),
                            code: ({ className, children, ...props }) => (
                              <code className={`${className || ''} font-mono text-sm`} {...props}>
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {currentAssistantMessage}
                        </ReactMarkdown>
                        <Spinner size="sm" classNames={{
                          base: "w-4 h-4 mt-2",
                          circle1: "border-b-white",
                          circle2: "border-b-transparent"
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-800 bg-black/70 p-2 md:p-4">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="输入消息..."
                      className="flex-1 text-sm md:text-base"
                      classNames={{
                        input: "bg-gray-900 text-white",
                        inputWrapper: "bg-gray-900 hover:bg-gray-800"
                      }}
                      disabled={isLoading}
                      size="lg"
                    />
                    <Button 
                      type="submit" 
                      color="primary"
                      isLoading={isLoading}
                      size="lg"
                      className="min-w-[60px] md:min-w-[80px]"
                    >
                      发送
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
