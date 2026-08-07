import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

// Pin project root — a package-lock.json in C:\Users\ethan otherwise steals resolution
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep file tracing inside this app (not parent monorepo/home package.json)
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
};

export default nextConfig;
