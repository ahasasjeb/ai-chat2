"use client";

import { Code } from "@nextui-org/react";

export default function HomePage() {
  return (
    <div className="min-h-screen p-8 pb-20 flex flex-col items-center justify-center">
      <div className="flex flex-wrap gap-4">
        <Code color="default">npm install @heroui/react</Code>
        <Code color="primary">npm install @heroui/react</Code>
        <Code color="secondary">npm install @heroui/react</Code>
        <Code color="success">npm install @heroui/react</Code>
        <Code color="warning">npm install @heroui/react</Code>
        <Code color="danger">npm install @heroui/react</Code>
      </div>
    </div>
  );
}
