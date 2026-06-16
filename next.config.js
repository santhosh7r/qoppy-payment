/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      // Serve the static marketing landing page at the root URL.
      // Runs before filesystem/app routes so "/" maps to public/landing.html.
      beforeFiles: [{ source: "/", destination: "/landing.html" }],
    };
  },
};

module.exports = nextConfig;
