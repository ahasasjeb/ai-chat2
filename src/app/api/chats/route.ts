import { NextRequest, NextResponse } from 'next/server';
import { MySql } from '../MySql';
import { verifyToken } from '../user';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Chat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
  }>;
  createdAt: number;
}

interface DbChat extends RowDataPacket {
  id: string;
  user_id: number;
  title: string;
  created_at: number;
}

interface DbMessage extends RowDataPacket {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  created_at: number;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { userId } = await verifyToken(token);
    const pool = await MySql.getInstance();

    // 获取所有聊天
    const [chatRows] = await pool.query<DbChat[]>(
      'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // 获取每个聊天的消息
    const chatsWithMessages = await Promise.all(chatRows.map(async (chat) => {
      const [messageRows] = await pool.query<DbMessage[]>(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        [chat.id]
      );

      return {
        id: chat.id,
        title: chat.title,
        createdAt: chat.created_at,
        messages: messageRows.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content
        }))
      };
    }));

    return NextResponse.json({ chats: chatsWithMessages });

  } catch (error) {
    console.error('获取聊天记录失败:', error);
    return NextResponse.json(
      { error: '获取聊天记录失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { userId } = await verifyToken(token);
    const body = await request.json();
    const chat: Chat = body.chat;

    const pool = await MySql.getInstance();

    // 创建新聊天
    await pool.query<ResultSetHeader>(
      'INSERT INTO chats (id, user_id, title, created_at) VALUES (?, ?, ?, ?)',
      [chat.id, userId, chat.title, chat.createdAt]
    );

    // 插入消息
    if (chat.messages.length > 0) {
      await Promise.all(chat.messages.map(msg =>
        pool.query<ResultSetHeader>(
          'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
          [msg.id, chat.id, msg.role, msg.content, Date.now()]
        )
      ));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('保存聊天记录失败:', error);
    return NextResponse.json(
      { error: '保存聊天记录失败' },
      { status: 500 }
    );
  }
}
