import OpenAI from 'openai';

const openai = new OpenAI({
});

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const response = await openai.chat.completions.create({
    model: model,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(content);
        }
      }
      controller.close();
    },
  });

  return new Response(stream);
}
