'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-center mb-12">
        身份鉴别系统
      </h1>
      <div className="space-x-6">
        <Link href="/auth/login">
          <Button size="lg">
            登录
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="outline" size="lg">
            注册
          </Button>
        </Link>
      </div>
    </div>
  );
} 