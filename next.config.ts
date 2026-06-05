import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const vercelOgStub = path.join(
  process.cwd(),
  "src/lib/stubs/vercel-og-stub.ts",
);

const nextConfig: NextConfig = {
  // PDF deliverables run in clinovyr-deliverables Worker — exclude from main trace.
  serverExternalPackages: [
    "@react-pdf/renderer",
    "archiver",
    "xlsx-js-style",
  ],
  outputFileTracingExcludes: {
    "*": [
      "./src/lib/deliverables/generators/**/*",
      "./src/lib/deliverables/run-generation.ts",
      "./src/lib/deliverables/industry-map.ts",
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@vercel/og": vercelOgStub,
        "next/dist/compiled/@vercel/og/index.node.js": vercelOgStub,
        "next/dist/compiled/@vercel/og/index.edge.js": vercelOgStub,
      };
    }
    return config;
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
