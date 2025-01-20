import { NextResponse } from 'next/server';
import { verifyToken } from '../user';
import { MySql } from '../MySql';
import { RowDataPacket } from 'mysql2';

interface ChatRow extends RowDataPacket {
  id: string;
  user_id: number;
  title: string;
  created_at: number;
}

interface MessageRow extends RowDataPacket {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: number;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { userId } = await verifyToken(authHeader.split(' ')[1]);
    const pool = MySql.getInstance();
    
    // 获取用户的所有聊天记录
    const [chats] = await pool.query<ChatRow[]>(
      'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // 获取每个聊天的消息
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const [messages] = await pool.query<MessageRow[]>(
          'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
          [chat.id]
        );
        return {
          ...chat,
          messages: messages
        };
      })
    );

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return new Response('Error fetching chats', { status: 500 });
  }
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { userId } = await verifyToken(authHeader.split(' ')[1]);
    const { chats } = await req.json();
    const pool = MySql.getInstance();

    // 删除用户所有现有聊天
    await pool.query('DELETE FROM chats WHERE user_id = ?', [userId]);

    // 插入新的聊天记录
    for (const chat of chats) {
      const { id, title, messages, createdAt } = chat;
      
      // 插入聊天
      await pool.query(
        'INSERT INTO chats (id, user_id, title, created_at) VALUES (?, ?, ?, ?)',
        [id, userId, title, createdAt]
      );

      // 插入消息
      for (const msg of messages) {
        await pool.query(
          'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
          [msg.id, id, msg.role, msg.content, msg.createdAt || Date.now()]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error syncing chats:', error);
    return new Response('Error syncing chats', { status: 500 });
  }
}
