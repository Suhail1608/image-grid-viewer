/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://www.dailytechmind.com;",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // fallback (won’t conflict)
          },
        ],
      },
    ];
  },
};

export default nextConfig;