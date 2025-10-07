/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
      ],
    },
  ],
}

export default nextConfig
