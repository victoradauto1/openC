import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env:{
    MARKETPLACE_ADDRESS:process.env.MARKETPLACE_ADDRESS,
    COLLECTION_ADDRESS:process.env.COLLECTION_ADDRESS,
    CHAIN_ID:process.env.CHAIN_ID
  }
};

export default nextConfig;
