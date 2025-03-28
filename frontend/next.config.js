/** @type {import('next').NextConfig} */
const userConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL + "/:path*",
      },
    ]
  },
}

// Заменяем export default на module.exports
module.exports = userConfig

