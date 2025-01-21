import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/api/user';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 排除登录和注册相关的路由
  const publicPaths = ['/api/login', '/api/register', '/api/send-code'];
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // 只保护特定的API路由
  const protectedPaths = ['/api/chat', '/api/generate-title'];
  if (!protectedPaths.includes(path)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: '请先登录' },
      { status: 401 }
    );
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { success: false, error: '登录已过期，请重新登录' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    '/api/chat',
    '/api/generate-title'
  ]
}
