import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/.next/**',
          '**/.workspace_store.json',
          '**/.projects_store.json',
          '**/.*_store.json',
          '**/*.store.json',
          '**/.sites-runtime/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

