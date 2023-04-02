const process = require('process');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  publicRuntimeConfig: {
    API_BASE_URL: process.env.API_BASE_URL,
  },
};

module.exports = nextConfig;
