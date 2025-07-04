// next.config.js

import withPWA from '@ducanh2912/next-pwa';

const nextConfig = {
    // You can add more Next.js configurations here if needed
};

const pwaConfig = withPWA({
    dest: 'public',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === 'development',
    workboxOptions: {
        disableDevLogs: true,
    },
    fallbacks: {
        document: '/~offline',
    },
});

export default pwaConfig(nextConfig);