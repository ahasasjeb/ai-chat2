import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';  // 需要创建这个 hook

export function useLocalStorage<T>(key: string, initialValue: T) {
  const { token } = useAuth();

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    if (token) {
      // Sync with server
      fetch('/api/sync', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json())
        .then(data => setStoredValue(data))
        .catch(console.error);
    }
  }, [token]);

  useEffect(() => {
    if (token && key === 'chats') {
      // Sync with server
      fetch('/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => setStoredValue(data))
      .catch(console.error);
    }
  }, [token, key]);

  useEffect(() => {
    if (token && key === 'chats') {
      // Save to server
      fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chats: storedValue })
      }).catch(console.error);
    }
  }, [token, key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
