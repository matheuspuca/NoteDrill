/** @type {import('next').NextConfig} */
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
