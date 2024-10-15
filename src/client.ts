// client.ts
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Ensure you have the NEXT_PUBLIC_ALCHEMY_MAINNET_API_URL set in your environment variables
const alchemyMainnetUrl = process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_URL;

// Fallback to a default URL if the environment variable is not set
const transportUrl = alchemyMainnetUrl 

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(transportUrl),
});
