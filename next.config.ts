import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
      bodySizeLimit: '2mb'
    }
  },
  // 优先使用服务端渲染
  serverRuntimeConfig: {
    // 仅在服务端可用的配置
  },
  publicRuntimeConfig: {
    // 客户端和服务端都可用的配置
  }
};

export default nextConfig;
