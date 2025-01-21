import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '../user';
import { isValidEmail } from '@/utils/emailValidator';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: '邮箱地址无效' },
        { status: 400 }
      );
    }

    // 验证用户并生成token 
    const token = await loginUser(email, password);

    // 设置cookie - 添加 await
    const cookieStore = await cookies();
    await cookieStore.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24小时
    });

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: { email }
    });

  } catch (error) {
    console.error('登录失败:', error instanceof Error ? error.message : '未知错误');
    const errorMessage = error instanceof Error 
      ? error.message 
      : '登录失败';
      
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 401 }
    );
  }
}

// 登出接口
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    await cookieStore.delete('auth-token');
    
    return NextResponse.json({
      success: true,
      message: '登出成功'
    });
  } catch {
    return NextResponse.json(
      { success: false, error: '登出失败' },
      { status: 500 }
    );
  }
}
