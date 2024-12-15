'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaceCapture } from '@/lib/face-api';

// API 基础地址
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://172.26.203.52:3001';
  }
  return 'http://172.26.203.52:3001';
})();

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'password' | 'face'>('password');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsVerifying(true);
      setError(null);
      setLoadingStatus('正在验证密码...');

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('密码验证响应:', data);

      if (data.success && data.score === 0.5) {
        setStep('face');
      } else {
        setError(data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setError('登录失败，请重试');
    } finally {
      setIsVerifying(false);
      setLoadingStatus(null);
    }
  };

  const handleFaceVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      
      // 初始化摄像头
      setLoadingStatus('正在初始化摄像头...');
      await FaceCapture.initialize();
      
      // 开始人脸验证
      setLoadingStatus('正在进行人脸验证...');
      const faceData = await FaceCapture.capture(true);
      
      // 提交验证
      setLoadingStatus('正在验证身份...');
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          faceFeatures: Array.from(faceData),
        }),
      });

      const data = await res.json();
      console.log('人脸验证响应:', data);

      if (data.success && data.score === 1) {
        setLoadingStatus('验证成功，正在跳转...');
        localStorage.setItem('auth_token', data.data.token);
        router.push('/dashboard');
      } else {
        setError(data.message || '人脸验证失败');
      }
    } catch (error) {
      console.error('人脸验证失败:', error);
      setError(error instanceof Error ? error.message : '人脸验证失败，请重试');
    } finally {
      setIsVerifying(false);
      setLoadingStatus(null);
      FaceCapture.cleanup(); // 确保清理资源
    }
  };

  // 组件卸载时清理资源
  React.useEffect(() => {
    return () => {
      FaceCapture.cleanup();
    };
  }, []);

  if (step === 'face') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">人脸验证</h2>
        <p className="text-center text-sm text-gray-500">
          请确保光线充足，正面面对摄像头
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {loadingStatus && (
          <div className="text-center text-sm text-blue-600">
            {loadingStatus}
          </div>
        )}
        <div className="flex justify-center">
          <Button 
            onClick={handleFaceVerify}
            disabled={isVerifying}
          >
            {isVerifying ? '验证中...' : '开始人脸验证'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium">
          用户名
        </label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          密码
        </label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
          {error}
        </div>
      )}
      {loadingStatus && (
        <div className="text-center text-sm text-blue-600">
          {loadingStatus}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isVerifying}>
        {isVerifying ? '验证中...' : '下一步'}
      </Button>
    </form>
  );
} 