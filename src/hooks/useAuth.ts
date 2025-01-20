import { useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
  message?: string; // 添加可选的 message 字段
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    if (storedToken) {
      setToken(storedToken);
      // 验证token并获取用户信息
      fetch('/api/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('auth-token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '登录失败');
      
      const authData = data as AuthResponse;  // 使用类型断言
      setToken(authData.token);
      setUser(authData.user);
      localStorage.setItem('auth-token', authData.token);
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('登录失败');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth-token');
  };

  return { user, token, login, logout, isLoading };
}
