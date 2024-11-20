// src/components/TransactWithPaymaster.tsx

import React, { useMemo, useEffect } from 'react';
import {
  useAccount,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { useCapabilities } from 'wagmi/experimental';
import { TransactButton } from './TransactButton';
import { base } from 'wagmi/chains';
import { parseGwei } from 'viem';
import { CSSProperties } from 'react';

export type TransactWithPaymasterProps = {
  functionName: string;
  args: any[];
  poolAddress: string;
  poolAbi: any;
  chainId: number;
  style?: CSSProperties;
  className?: string;
  label?: string;
};

const PAYMASTER_ENDPOINT = process.env.NEXT_PUBLIC_PAYMASTER_AND_BUNDLER_ENDPOINT || '';

export function TransactWithPaymaster({
  functionName,
  args,
  poolAddress,
  poolAbi,
  chainId,
  style,
  label,
  className
}: TransactWithPaymasterProps) {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: availableCapabilities } = useCapabilities({
    account: address
  });

  // Determine if Paymaster is supported
  const capabilities = useMemo(() => {
    if (!availableCapabilities || !currentChainId) return undefined;
    const capabilitiesForChain = availableCapabilities[currentChainId];
    if (
      capabilitiesForChain['paymasterService'] &&
      capabilitiesForChain['paymasterService'].supported
    ) {
      return {
        paymasterService: {
          url:
            chainId.toString() === base.id.toString()
              ? PAYMASTER_ENDPOINT
              : ''
        }
      };
    }
    return undefined;
  }, [availableCapabilities, currentChainId, chainId]);

  // Switch to the desired chain if not already connected
  useEffect(() => {
    if (chainId !== currentChainId) {
      switchChain({ chainId: base.id });
    }
  }, [chainId, currentChainId, switchChain]);

  return (
    <div>
      <TransactButton
        text={label ?? ''} // deleted the text to not show any
        style={style ?? {}}
        targetChainId={chainId}
        className={className}
        contracts={[
          {
            abi: poolAbi,
            address: poolAddress,
            functionName: functionName,
            args: args,
            gas: parseGwei('0.00001'),
            gasPrice: parseGwei('0.00001'),
            maxFeePerGas: parseGwei('0.00001'),
            maxPriorityFeePerGas: parseGwei('0.00001'),
          }
        ]}
        capabilities={capabilities}
      />
    </div>
  )
}
