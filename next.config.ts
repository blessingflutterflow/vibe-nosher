import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handle WASM files from tree-sitter
  webpack: (config, { isServer }) => {
    // Don't bundle tree-sitter on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    return config;
  },
  
  // Don't try to bundle these server-only packages on client
  serverExternalPackages: [
    '@codebuff/sdk',
    'tree-sitter',
    '@vscode/tree-sitter-wasm',
  ],
  
};

export default nextConfig;
