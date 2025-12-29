/** @type {import('next').NextConfig} */
// Force restart: 2025-12-29
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'aladucaryevwfmdcpmjn.supabase.co',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
