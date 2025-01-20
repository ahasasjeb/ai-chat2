'use client';

import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-[1024px] mx-auto px-6 h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-default-500 mb-8">
        抱歉，您访问的页面不存在，大白话就是这个页面没人写过
      </p>
      <Button 
        color="primary"
        variant="shadow"
        as={Link}
        href="/"
      >
        返回首页
      </Button>
    </div>
  );
}
