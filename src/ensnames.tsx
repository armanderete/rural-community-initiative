// ensnames.tsx
import {
    http,
    type Address,
    createPublicClient,
  } from "viem";
  import { mainnet } from "viem/chains";
  
  // Using environment variable for Alchemy API URL
  const alchemyMainnetUrl = process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_API_URL;
  
  const ensClient = createPublicClient({
    chain: mainnet,
    transport: http(alchemyMainnetUrl),
  });
  
  export async function getEnsName(address: Address) {
    try {
      const ensName = await ensClient.getEnsName({ address });
      return ensName || null;
    } catch (error) {
      console.error("Error fetching ENS name:", error);
      return null;
    }
  }
  