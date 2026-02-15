/**
 * PM2 ecosystem file for trade-docs-platform (Debian Linux).
 * Usage:
 *   pnpm run build && pm2 start ecosystem.config.cjs
 *   pm2 stop all && pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: 'trade-docs-api',
      script: 'dist/main-api.js',
      cwd: __dirname,
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      env_development: { NODE_ENV: 'development' },
    },
    {
      name: 'trade-docs-worker',
      script: 'dist/main-worker.js',
      cwd: __dirname,
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      env_development: { NODE_ENV: 'development' },
    },
  ],
};
