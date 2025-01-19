import OpenAI from 'openai';

const openai = new OpenAI({
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '请为这个对话生成一个简短的标题（不超过15个字），直接返回标题文本，不要加任何其他内容。根据对话的主要内容和主题来总结。'
      },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 50,
    stream: true,  // 启用流式输出
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let accumulatedTitle = '';
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            accumulatedTitle += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ title: accumulatedTitle })}\n\n`));
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const messages = JSON.parse(searchParams.get('messages') || '[]');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '请为这个对话生成一个简短的标题（不超过15个字），直接返回标题文本，不要加任何其他内容。根据对话的主要内容和主题来总结。'
      },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 50,
    stream: true,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let accumulatedTitle = '';
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            accumulatedTitle += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ title: accumulatedTitle })}\n\n`));
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
