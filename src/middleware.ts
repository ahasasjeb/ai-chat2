import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './app/api/user';

export async function middleware(request: NextRequest) {
  // 需要保护的路由
  const protectedPaths = ['/api/chat', '/api/generate-title'];
  
  const path = request.nextUrl.pathname;
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
  matcher: '/api/:path*',
}
