/**
 * Angular Dev Proxy Configuration
 * Routes /api/weroad/** → https://api-catalog.weroad.it/**
 * Avoids CORS issues during local development.
 *
 * Usage: configured in apps/travel-admin/project.json under serve > proxyConfig
 */
export default [
  {
    context: ['/api/weroad'],
    target: 'https://api-catalog.weroad.it',
    changeOrigin: true,
    secure: true,
    pathRewrite: { '^/api/weroad': '' },
    logLevel: 'debug',
  },
];
