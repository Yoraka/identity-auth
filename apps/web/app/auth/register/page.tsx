'use client';

import dynamic from 'next/dynamic';
import { RegisterForm } from '@/components/auth/register-form';

// 动态导入 RegisterForm 组件，禁用 SSR
const DynamicRegisterForm = dynamic(
  () => Promise.resolve(RegisterForm),
  { ssr: false }
);

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">注册</h1>
        <DynamicRegisterForm />
      </div>
    </div>
  );
} 