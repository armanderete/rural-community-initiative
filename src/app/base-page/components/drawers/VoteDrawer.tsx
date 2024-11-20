// src/components/drawers/VoteDrawer.tsx

import React, { useState, useEffect, useMemo } from 'react';
import Lottie from 'lottie-react';
import VoteAnimation from '../../animations/abcvote.json';
import VoteAnimation1_5_10 from '../../animations/vote-1-5-10.json';

// **Import Voting Configurations**
import VotingConfigAnimation1 from '../../configs/VotingConfigAnimation1.json';
import VotingConfigAnimation2 from '../../configs/VotingConfigAnimation2.json';
import VotingConfigAnimation3 from '../../configs/VotingConfigAnimation3.json';
import VotingConfigAnimation4 from '../../configs/VotingConfigAnimation4.json';
import VotingConfigAnimation5 from '../../configs/VotingConfigAnimation5.json';
import VotingConfigAnimation6 from '../../configs/VotingConfigAnimation6.json';
import VotingConfigAnimation7 from '../../configs/VotingConfigAnimation7.json';
import VotingConfigAnimation8 from '../../configs/VotingConfigAnimation8.json';
import VotingConfigAnimation9 from '../../configs/VotingConfigAnimation9.json';
import VotingConfigAnimation10 from '../../configs/VotingConfigAnimation10.json';
import VotingConfigAnimation11 from '../../configs/VotingConfigAnimation11.json';

// **Import the TransactWithPaymaster Component**
import { TransactWithPaymaster } from '../../../../components/TransactWithPaymaster';

// **Import ABI and configuration**
import abi from '../../abi.json'; // Adjust the path as necessary
import config from '../../page-config.json'; // Adjust the path as necessary

// **Import necessary hooks and libraries**
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { useCapabilities } from 'wagmi/experimental';
import { ethers } from 'ethers';

// **Define the VotingConfig interface**
interface VotingOption {
  Active: boolean;
  positionXaxis: string; // e.g., "50%"
  positionYaxis: string; // e.g., "80%"
  Function: string;
  To: string;
  Amount: number;
  Tag: string;
  Concept: string;
}

interface VotingConfig {
  votingButtonVisible: boolean;
  votingType: 'abc' | '1-5-10';
  VoteOption1: VotingOption;
  VoteOption2: VotingOption;
  VoteOption3: VotingOption;
  VoteOption4: VotingOption;
  VoteOption5: VotingOption;
}

// **Props Interface for VoteDrawer**
interface VoteDrawerProps {
  drawerState: 'vote-open' | 'closed';
  handleCloseVoteDrawer: () => void;
  currentAnimationIndex: number;
}

/**
 * Custom hook to convert Wagmi's WalletClient to ethers.js Signer
 */
function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const signer = useMemo(() => {
    if (!walletClient || !address) return null;

    const { transport } = walletClient;
    // Construct ethers.js provider from transport
    const provider = new ethers.providers.Web3Provider(transport, 'any');

    return provider.getSigner(address);
  }, [walletClient, address]);

  return signer;
}

const VoteDrawer: React.FC<VoteDrawerProps> = ({
  drawerState,
  handleCloseVoteDrawer,
  currentAnimationIndex,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const signer = useEthersSigner();

  // **State Variables for Transaction**
  const [isTransactionLoading, setIsTransactionLoading] = useState<boolean>(false);
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);
  const [isTransactionSuccess, setIsTransactionSuccess] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  // **Array of Voting Configurations**
  const votingConfigs: VotingConfig[] = [
    VotingConfigAnimation1 as VotingConfig,
    VotingConfigAnimation2 as VotingConfig,
    VotingConfigAnimation3 as VotingConfig,
    VotingConfigAnimation4 as VotingConfig,
    VotingConfigAnimation5 as VotingConfig,
    VotingConfigAnimation6 as VotingConfig,
    VotingConfigAnimation7 as VotingConfig,
    VotingConfigAnimation8 as VotingConfig,
    VotingConfigAnimation9 as VotingConfig,
    VotingConfigAnimation10 as VotingConfig,
    VotingConfigAnimation11 as VotingConfig,
  ];

  // **Determine the current voting configuration**
  const currentVotingConfig =
    currentAnimationIndex < votingConfigs.length
      ? votingConfigs[currentAnimationIndex]
      : {
          votingButtonVisible: false,
          votingType: 'abc',
          VoteOption1: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption2: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption3: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption4: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption5: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
        };

  // **Determine the current Vote Animation based on votingType**
  const currentVoteAnimation =
    currentVotingConfig.votingType === '1-5-10' ? VoteAnimation1_5_10 : VoteAnimation;

  /**
   * **Detect if Paymaster is Supported**
   */
  const { data: availableCapabilities } = useCapabilities({
    account: address
  });

  const isPaymasterSupported = useMemo(() => {
    if (!availableCapabilities || !chainId) return false;
    const capabilitiesForChain = availableCapabilities[chainId];
    return (
      capabilitiesForChain?.['paymasterService'] &&
      capabilitiesForChain['paymasterService'].supported
    );
  }, [availableCapabilities, chainId]);

  // **Contracts**
  const writeContract = useMemo(() => {
    if (signer) {
      return new ethers.Contract(config.contractAddress, abi, signer);
    }
    return null;
  }, [signer, config.contractAddress]);

  /**
   * **Handler for Regular Transaction (Fallback)**
   */
  const handleRegularTransaction = async (option: VotingOption) => {
    if (!writeContract) {
      alert('Contract is not initialized.');
      return;
    }

    try {
      setIsTransactionLoading(true);
      setTransactionError(null);
      setIsTransactionSuccess(false);

      // Initiate the transaction using the function and arguments from the option
      const tx = await writeContract[option.Function](
        option.To,
        option.Amount,
        option.Tag,
        option.Concept
      );

      setIsTransactionPending(true);

      // Wait for the transaction to be mined
      await tx.wait();

      setIsTransactionPending(false);
      setIsTransactionSuccess(true);
    } catch (err) {
      console.error('Regular Transaction Error:', err);
      setTransactionError(err as Error);
      setIsTransactionPending(false);
    } finally {
      setIsTransactionLoading(false);
    }
  };

  // **Render Vote Buttons**
  const renderVoteButtons = () => {
    const voteOptions = [
      currentVotingConfig.VoteOption1,
      currentVotingConfig.VoteOption2,
      currentVotingConfig.VoteOption3,
      currentVotingConfig.VoteOption4,
      currentVotingConfig.VoteOption5,
    ];

    return voteOptions.map((option, index) => {
      if (!option.Active) return null;

      return isPaymasterSupported ? (
        <TransactWithPaymaster
          key={index + 1}
          functionName={option.Function}
          args={[option.To, option.Amount, option.Tag, option.Concept]}
          poolAddress={config.contractAddress}
          poolAbi={abi}
          chainId={Number(config.chainId)} // Ensure 'chainId' is a number
          style={{
            left: option.positionXaxis,
            bottom: option.positionYaxis,
            width: '38%',
            height: '25%',
            transform: 'translate(-50%, 50%)', // Ensures alignment relative to the container
            position: 'absolute',
            zIndex: 20,
            backgroundColor: 'transparent', // Semi-transparent for visibility
            color: 'transparent', // Make font transparent
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        />
      ) : (
        <button
          key={index + 1}
          onClick={() => handleRegularTransaction(option)}
          className="absolute bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          style={{
            left: option.positionXaxis,
            bottom: option.positionYaxis,
            width: '38%',
            height: '25%',
            transform: 'translate(-50%, 50%)', // Ensures alignment relative to the container
            position: 'absolute',
            zIndex: 20,
            backgroundColor: 'transparent', // Semi-transparent for visibility
            color: 'transparent', // Make font transparent
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Vote {index + 1}
        </button>
      );
    });
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-transform duration-300 ease-in-out transform ${
        drawerState === 'vote-open' ? 'translate-y-0' : 'translate-y-[100vh]'
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          drawerState === 'vote-open' ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={drawerState === 'vote-open' ? handleCloseVoteDrawer : undefined}
      ></div>

      {/* Drawer Content */}
      <div
        className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing drawer
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
          onClick={handleCloseVoteDrawer}
          aria-label="Close Vote Drawer"
        >
          &times;
        </button>

        {/* Drawer Container */}
        <div className="drawer-container w-full h-full relative flex items-center justify-center">
          {/* Vote Lottie Animation */}
          <Lottie
            animationData={currentVoteAnimation}
            loop={true}
            className="w-full h-full"
          />

          {/* Render Buttons */}
          {currentVotingConfig.votingButtonVisible && renderVoteButtons()}
        </div>

        {/* Transaction Status Messages */}
        <div className="mt-2 text-center">
          {isTransactionLoading && <p>Preparing transaction...</p>}
          {isTransactionPending && <p>Transaction is pending...</p>}
          {isTransactionSuccess && <p className="text-green-500">Transaction successful!</p>}
          {transactionError && (
            <p className="text-red-500">
              Error: {transactionError.message || 'An error occurred.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoteDrawer;
