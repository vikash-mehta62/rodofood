/** @type {import('next').NextConfig} */

// Extract hostname from NEXT_PUBLIC_API_URL for image domains
function getApiHostname() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}

const apiHostname = getApiHostname();

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // Allow images from the backend server (derived from env)
      {
        protocol: apiHostname === 'localhost' ? 'http' : 'https',
        hostname: apiHostname,
      },
    ],
  },
};

module.exports = nextConfig;
