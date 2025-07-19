module.exports = {
  apps: [
    {
      name: 'hyperliquid-electron',
      script: 'electron',
      args: '.',
      cwd: '/var/www/hyperliquid',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/hyperliquid/electron-error.log',
      out_file: '/var/log/hyperliquid/electron-out.log',
      log_file: '/var/log/hyperliquid/electron-combined.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        DISPLAY: ':99',
        MONGODB_URI: 'mongodb://mongoadmin:t6AMn4hPFi8R@155.138.229.220:27017/defaultdb',
        VITE_API_URL: 'https://api.hyperliquid.xyz',
        VITE_TESTNET_URL: 'https://api.hyperliquid-testnet.xyz',
        VITE_APP_NAME: 'Hyperliquid Trading App',
        VITE_ENVIRONMENT: 'production'
      }
    },
    {
      name: 'hyperliquid-web',
      script: 'npm',
      args: 'run preview',
      cwd: '/var/www/hyperliquid',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/hyperliquid/web-error.log',
      out_file: '/var/log/hyperliquid/web-out.log',
      log_file: '/var/log/hyperliquid/web-combined.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        VITE_API_URL: 'https://api.hyperliquid.xyz',
        VITE_TESTNET_URL: 'https://api.hyperliquid-testnet.xyz'
      }
    }
  ]
};
