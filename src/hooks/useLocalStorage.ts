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

  return [storedValue, setStoredValue] as const;
}
