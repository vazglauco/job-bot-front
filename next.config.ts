import type { NextConfig } from "next";

const isTauri = process.env.TAURI === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Static export only for Tauri production build; web and Tauri dev use SSR
  ...(isTauri ? { output: "export" } : {}),
  images: { unoptimized: true },
  trailingSlash: isTauri,
};

export default nextConfig;
