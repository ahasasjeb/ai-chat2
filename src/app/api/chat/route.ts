import OpenAI from 'openai';
import { verifyToken } from '../user';
import { MySql } from '../MySql';

const openai = new OpenAI({
});

export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { userId } = await verifyToken(authHeader.split(' ')[1]);
    const { messages, model, chatId } = await req.json();

    // Store message in database
    const pool = await MySql.getInstance();
    await pool.query(
      'INSERT INTO messages (id, chat_id, role, content, created_at, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [Date.now().toString(), chatId, messages[messages.length - 1].role, messages[messages.length - 1].content, Date.now(), userId]
    );

    const response = await openai.chat.completions.create({
      model: model,
      messages,
      temperature: 0.7,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          // 发送结束标记
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '未知错误';
    return new Response('Error: ' + errorMessage, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messages = JSON.parse(searchParams.get('messages') || '[]');
  const model = searchParams.get('model') || 'gpt-4o-mini';

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
    stream: true,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
