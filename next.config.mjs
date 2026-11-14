const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Static export so the demo can be hosted on GitHub Pages without a server. */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
