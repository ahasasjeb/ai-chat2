import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode } from '../user';
import { isValidEmail } from '@/utils/emailValidator';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱地址无效或不在白名单中' },
        { status: 400 }
      );
    }

    await sendVerificationCode(email);
    
    return NextResponse.json({ message: '验证码已发送' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '发送验证码失败' },
      { status: 500 }
    );
  }
}
