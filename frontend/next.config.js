/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    // Required for FHEVM SDK
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    // Fix for "Can't resolve 'fs'" error in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Ignore React Native modules from MetaMask SDK
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }
    
    // Suppress circular dependency warnings from relayer-sdk
    config.ignoreWarnings = [
      { module: /node_modules\/@zama-fhe\/relayer-sdk/ },
    ];
    
    return config;
  },
};

module.exports = nextConfig;

