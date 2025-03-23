/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Проксирование всех API запросов к FastAPI бэкенду
        source: '/api/:path*',
        destination: 'http://api:8000/questionnaires/:path*',
      },
    ]
  },
  // Добавляем env переменные для удобного доступа в приложении
  env: {
    API_BASE_URL: 'http://api:8000',
  }
}

module.exports = nextConfig