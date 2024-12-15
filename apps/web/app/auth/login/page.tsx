'use client';

import dynamic from 'next/dynamic';
import { LoginForm } from '@/components/auth/login-form';

// 动态导入 LoginForm 组件，禁用 SSR
const DynamicLoginForm = dynamic(
  () => Promise.resolve(LoginForm),
  { ssr: false }
);

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">登录</h1>
        <DynamicLoginForm />
      </div>
    </div>
  );
} 