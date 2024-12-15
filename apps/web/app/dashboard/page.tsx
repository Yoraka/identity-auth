'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';

const ActionButton = Button as React.ComponentType<ButtonProps>;

interface User {
  id: number;
  username: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const getInfo = async () => {
      await fetchUserInfo(token);
    };

    getInfo();
  }, [router]);

  const fetchUserInfo = async (token: string) => {
    try {
      console.log('开始获取用户信息:', { token });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('获取用户信息响应:', {
        status: res.status,
        statusText: res.statusText
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('获取用户信息失败:', errorData);
        throw new Error(errorData.message || '获取用户信息失败');
      }

      const data = await res.json();
      console.log('获取用户信息成功:', data);

      if (data.success) {
        setUser(data.data);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('auth_token');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('登出失败');
      }

      localStorage.removeItem('auth_token');
      router.push('/auth/login');
    } catch (error) {
      console.error('登出失败:', error);
      alert('登出失败，请重试');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('确定要注销账号吗？此操作不可恢复！')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('注销账号失败');
      }

      localStorage.removeItem('auth_token');
      router.push('/auth/register');
    } catch (error) {
      console.error('注销账号失败:', error);
      alert('注销账号失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-8">欢迎回来</h1>
        <div className="space-y-2">
          <p className="text-lg">
            <span className="text-gray-500">用户名：</span>
            <span className="font-medium">{user.username}</span>
          </p>
          <p className="text-lg">
            <span className="text-gray-500">邮箱：</span>
            <span className="font-medium">{user.email}</span>
          </p>
        </div>
      </div>
      <div className="space-x-6">
        <ActionButton
          variant="outline"
          size="lg"
          onClick={handleLogout}
          type="button"
        >
          登出
        </ActionButton>
        <ActionButton
          variant="destructive"
          size="lg"
          onClick={handleDeactivate}
          type="button"
        >
          注销账号
        </ActionButton>
      </div>
    </div>
  );
} 