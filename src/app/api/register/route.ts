import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '../user';
import { isValidEmail } from '@/utils/emailValidator';

export async function POST(request: NextRequest) {
  try {
    // 确保请求体是有效的JSON
    if (!request.body) {
      return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
    }

    const body = await request.json();
    
    // 验证必需字段
    if (!body.email || !body.password || !body.code) {
      return NextResponse.json({ error: '缺少必需字段' }, { status: 400 });
    }

    const { email, password, code } = body;

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: '邮箱地址无效或不在白名单中' },
        { status: 400 }
      );
    }

    await registerUser(email, password, code);
    
    return NextResponse.json({ 
      success: true,
      message: '注册成功' 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '注册失败'
      },
      { status: 500 }
    );
  }
}
