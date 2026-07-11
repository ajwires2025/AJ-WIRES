import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // firebase-admin pulls in jwks-rsa -> jose, which ships ESM-only. Bundling
  // it into the serverless function's CJS output breaks with ERR_REQUIRE_ESM,
  // so leave these external and let Node resolve them natively at runtime.
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
};

export default nextConfig;
