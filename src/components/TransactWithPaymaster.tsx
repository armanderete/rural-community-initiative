// src/components/TransactWithPaymaster.tsx

import {
    useAccount,
    useChainId,
    useSwitchChain,
  } from 'wagmi';
  import { useCapabilities } from 'wagmi/experimental';
  import { useEffect, useMemo, type CSSProperties } from 'react';
  import { TransactButton } from './TransactButton';
  import { base } from 'wagmi/chains';
  import { parseGwei } from 'viem';
  import { BigNumber } from 'ethers';
  
  export type TransactWithPaymasterProps = {
    functionName: string;
    args: any[];
    poolAddress: string;
    poolAbi: any;
    chainId: number;
    style?: CSSProperties;
    className?: string;
    label?: string;
  }
  
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
  
    const capabilities = useMemo(() => {
      if (!availableCapabilities || !currentChainId) return;
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
        }
      }
    }, [availableCapabilities, currentChainId, chainId, PAYMASTER_ENDPOINT]);
  
    useEffect(() => {
      if (chainId !== currentChainId) {
        switchChain({ chainId: base.id });
      }
    }, [chainId, currentChainId, switchChain]);
  
    return (
      <div>
        <TransactButton
          text={label ?? 'Transact'}
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
  