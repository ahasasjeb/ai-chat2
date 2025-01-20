import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '../user';
import { isValidEmail } from '@/utils/emailValidator';

export async function POST(request: NextRequest) {
  try {
    const { email, password, code } = await request.json();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱地址无效或不在白名单中' },
        { status: 400 }
      );
    }

    await registerUser(email, password, code);
    
    return NextResponse.json({ message: '注册成功' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '注册失败' },
      { status: 500 }
    );
  }
}
