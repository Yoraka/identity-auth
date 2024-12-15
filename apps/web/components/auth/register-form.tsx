'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaceCapture } from '@/lib/face-api';

// API 基础地址
const API_BASE_URL = (() => {
  // 确保在客户端运行时才获取环境变量
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://172.26.203.52:3001';
  }
  return 'http://172.26.203.52:3001';
})();

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'face'>('info');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('face');
  };

  const handleTestCamera = async () => {
    try {
      setError(null);
      await FaceCapture.testCamera();
      alert('摄像头测试成功！');
    } catch (error) {
      console.error('摄像头测试失败:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('摄像头测试失败，请检查设备连接和权限设置');
      }
    }
  };

  const handleFaceCapture = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      
      // 显示准备提示
      setLoadingStatus('正在初始化摄像头...');
      
      // 等待3秒，让用户准备好
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setLoadingStatus('正在检测人脸...');
      const faceData = await FaceCapture.capture(true);
      
      // 添加错误处理和重试逻辑
      const fetchWithRetry = async (retries = 3) => {
        try {
          console.log('正在请求API:', `${API_BASE_URL}/api/auth/register`);
          
          const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              faceFeatures: Array.from(faceData),
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ 
              message: `HTTP错误! 状态码: ${res.status}` 
            }));
            throw new Error(errorData.message || `注册失败，服务器返回: ${res.status}`);
          }

          return res.json();
        } catch (error) {
          console.error('请求失败:', error);
          if (retries > 0) {
            console.log(`请求失败，${retries - 1}秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(retries - 1);
          }
          throw error;
        }
      };
      
      setLoadingStatus('正在提交数据...');
      const data = await fetchWithRetry();
      
      if (data.success) {
        FaceCapture.cleanup();
        alert('注册成功！');
        router.push('/auth/login');
      } else {
        FaceCapture.cleanup();
        setError(data.message || '注册失败，请重试');
      }
    } catch (error) {
      FaceCapture.cleanup();
      console.error('注册失败:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          setError('无法连接到服务器，请检查网络连接或确认服务器是否运行');
        } else {
          setError(error.message);
        }
      } else {
        setError('注册失败，请重试');
      }
    } finally {
      setIsCapturing(false);
      setLoadingStatus(null);
    }
  };

  // 添加组件卸载时的清理
  React.useEffect(() => {
    return () => {
      FaceCapture.cleanup();
    };
  }, []);

  if (step === 'face') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">人脸采集</h2>
        <div className="space-y-2">
          <p className="text-center text-sm text-gray-500">
            请确保：
          </p>
          <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
            <li>光线充足，避免逆光</li>
            <li>正面面对摄像头</li>
            <li>保持面部在画面中心</li>
            <li>确保摄像头已授权</li>
          </ul>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded">
            {error}
          </div>
        )}
        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={handleTestCamera}
            variant="outline"
            className="w-full"
          >
            测试摄像头
          </Button>
          <Button 
            onClick={handleFaceCapture} 
            disabled={isCapturing}
            className="w-full"
          >
            {isCapturing ? '采集中...' : '开始人脸采集'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setStep('info')}
            disabled={isCapturing}
            className="w-full"
          >
            返回上一步
          </Button>
        </div>
        {loadingStatus && (
          <div className="text-center text-sm text-blue-600">
            {loadingStatus}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleInfoSubmit} className="space-y-4">
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
        <label htmlFor="email" className="text-sm font-medium">
          邮箱
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
      <Button type="submit" className="w-full">
        下一步
      </Button>
    </form>
  );
} 