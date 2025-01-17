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
  });

  return Response.json({ title: response.choices[0]?.message?.content || '新对话' });
}
