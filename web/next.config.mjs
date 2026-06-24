/** @type {import('next').NextConfig} */
// `output: export` produces a static bundle that the Tauri desktop shell loads
// directly from disk. Works as a plain web app under `next dev` too.
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
