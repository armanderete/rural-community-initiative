// enenames.tsx
import { type Address } from 'viem';
import { publicClient } from './client';

/**
 * Fetches the ENS name associated with a given Ethereum address.
 *
 * @param address - The Ethereum address to resolve.
 * @returns The ENS name if available, otherwise null.
 */
export async function getEnsName(address: Address): Promise<string | null> {
  try {
    const ensName = await publicClient.getEnsName({ address });
    return ensName || null;
  } catch (error) {
    console.error("Error fetching ENS name:", error);
    return null;
  }
}
