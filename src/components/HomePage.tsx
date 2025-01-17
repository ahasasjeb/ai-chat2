"use client";

import { useState, useEffect } from 'react';
import { Input, Button, Spinner } from "@nextui-org/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ChatMessage, Chat } from '@/types/ai';
import ChatList from './ChatList';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useLocalStorage<Chat[]>('chats', []);
  const [currentChatId, setCurrentChatId] = useLocalStorage<string | null>('current-chat-id', null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');

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

  return (
    <div className="flex h-screen">
      <ChatList 
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
      />
      
      <div className="flex-1 flex flex-col bg-gray-50">
        {!currentChatId ? (
          <div className="flex items-center justify-center h-full">
            <Button color="primary" onPress={createNewChat}>
              开始新对话
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`rounded-2xl px-4 py-2 max-w-[80%] ${
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
            
            <div className="border-t bg-white p-4">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1"
                    disabled={isLoading}
                    size="lg"
                  />
                  <Button 
                    type="submit" 
                    color="primary"
                    isLoading={isLoading}
                    size="lg"
                  >
                    发送
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
