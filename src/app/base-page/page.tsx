// pages/Page.tsx

'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useEstimateFeesPerGas,
  useEstimateGas,
  useEstimateMaxPriorityFeePerGas,
  useGasPrice,
  useWalletClient
} from 'wagmi';
import { CSSProperties, ReactNode } from 'react';
import { useCapabilities } from 'wagmi/experimental';
import { parseGwei } from 'viem';
import { base } from 'wagmi/chains';
import { BigNumber, ethers } from 'ethers';
import Lottie from 'lottie-react';
import Image from 'next/image';
import LoginButton from '../../components/LoginButton';
import SignupButton from '../../components/SignupButton';
import abi from './abi.json'; // Import ABI from the JSON file
import { getBasename } from '../../basenames';
import { getEnsName } from '../../ensnames';
import { truncateWalletAddress } from '../../utils';

// Import your animations
import Animation1 from './animations/animation1.json';
import Animation2 from './animations/animation2.json';
import Animation3 from './animations/animation3.json';
import Animation4 from './animations/animation4.json';
import Animation5 from './animations/animation5.json';
import Animation6 from './animations/animation6.json';
import Animation7 from './animations/animation7.json';
import Animation8 from './animations/animation8.json';
import Animation9 from './animations/animation9.json';
import Animation10 from './animations/animation10.json';
import Animation11 from './animations/animation11.json';

// **Import the Vote Animations**
import VoteAnimation from '../animations/abcvote.json';
import VoteAnimation1_5_10 from '../animations/vote-1-5-10.json'; // Newly added

// **Import Voting Configurations**
import VotingConfigAnimation1 from './configs/VotingConfigAnimation1.json';
import VotingConfigAnimation2 from './configs/VotingConfigAnimation2.json';
import VotingConfigAnimation3 from './configs/VotingConfigAnimation3.json';
import VotingConfigAnimation4 from './configs/VotingConfigAnimation4.json';
import VotingConfigAnimation5 from './configs/VotingConfigAnimation5.json';
import VotingConfigAnimation6 from './configs/VotingConfigAnimation6.json';
import VotingConfigAnimation7 from './configs/VotingConfigAnimation7.json';
import VotingConfigAnimation8 from './configs/VotingConfigAnimation8.json';
import VotingConfigAnimation9 from './configs/VotingConfigAnimation9.json';
import VotingConfigAnimation10 from './configs/VotingConfigAnimation10.json';
import VotingConfigAnimation11 from './configs/VotingConfigAnimation11.json';

// **Import the VoteDrawer Component**
import VoteDrawer from './components/drawers/VoteDrawer';

// **Import the PrimarySecondaryDrawer Component**
import PrimarySecondaryDrawer from './components/drawers/PrimarySecondaryDrawer';

// **Import the TransactWithPaymaster Component**
import { TransactWithPaymaster } from '../../components/TransactWithPaymaster'; // Adjusted to named import

// Import the configuration
import config from './page-config.json';

// Define types for better type safety
type Balance = { address: string; balance: number | string };
type Top10Balance = { address: string; balance: number };
type UserInfo = { place: string; userInfo: string; balanceInfo: string };

// **Define the VotingConfig interface**
interface VotingOption {
  Active: boolean;
  positionXaxis: string;
  positionYaxis: string;
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

// Define the type for the config to ensure type safety
interface PageConfig {
  animations: number;
  animationLoopSettings: boolean[];
  contractAddress: string;
  contractDeploymentBlock: number;
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

export default function Page() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const signer = useEthersSigner();

  // Array of animations in order, limited by config.animations
  const allAnimations = [
    Animation1,
    Animation2,
    Animation3,
    Animation4,
    Animation5,
    Animation6,
    Animation7,
    Animation8,
    Animation9,
    Animation10,
    Animation11,
  ];

  // Limit animations array based on config.animations
  const animations = allAnimations.slice(0, config.animations);

  // Array indicating whether each animation should loop, from config
  const animationLoopSettings = config.animationLoopSettings;

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

  // State to manage current animation index
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState<number>(0);

  // State to trigger animation playback
  const [animationData, setAnimationData] = useState<any>(null);

  // State to track if animation has played
  const [animationPlayed, setAnimationPlayed] = useState<boolean>(false);

  // State to manage visibility of Prev and Next buttons
  const [showButtons, setShowButtons] = useState<boolean>(false);

  // State to manage visibility of the dashboard_button
  const [dashboardButtonVisible, setDashboardButtonVisible] = useState<boolean>(true);

  // **Extend drawerState to include 'vote-open'**
  const [drawerState, setDrawerState] = useState<
    'closed' | 'primary-open' | 'secondary-open' | 'vote-open'
  >('closed');

  // State to store balances (allows balance to be number or string)
  const [balances, setBalances] = useState<Balance[]>([]);

  const [userBalance, setUserBalance] = useState<number | null>(null);

  // State to store community pool balance
  const [communityPoolBalance, setCommunityPoolBalance] = useState<string>('');

  // State to handle errors
  const [error, setError] = useState<string | null>(null);

  // State to handle loading
  const [loading, setLoading] = useState<boolean>(false);

  // State to store top 10 balances (only numbers)
  const [top10, setTop10] = useState<Top10Balance[]>([]);

  // State variable for top 10 users' information
  const [top10UserInfos, setTop10UserInfos] = useState<UserInfo[]>([]);

  // State variables for batch tracking
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [processedBatches, setProcessedBatches] = useState<number>(0);

  // **Additional State Variables for Transaction**
  const [isTransactionLoading, setIsTransactionLoading] = useState<boolean>(false);
  const [isTransactionPending, setIsTransactionPending] = useState<boolean>(false);
  const [isTransactionSuccess, setIsTransactionSuccess] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<Error | null>(null);

  // Initialize ethers providers and contracts
  const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
  const alchemyProvider = useMemo(() => {
    if (ALCHEMY_API_URL) {
      return new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
    }
    return null;
  }, [ALCHEMY_API_URL]);

  const CONTRACT_ADDRESS = config.contractAddress; // fetched from config file

  // **Contracts**
  const readContract = useMemo(() => {
    if (alchemyProvider) {
      return new ethers.Contract(CONTRACT_ADDRESS, abi, alchemyProvider);
    }
    return null;
  }, [alchemyProvider, CONTRACT_ADDRESS]);

  const writeContract = useMemo(() => {
    if (signer) {
      return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    }
    return null;
  }, [signer, CONTRACT_ADDRESS]);

  /**
   * Fetch all Assigned events to get unique user addresses.
   * Implements batching to comply with Alchemy's max block range limitation.
   */
  const fetchAllAddresses = async (): Promise<string[]> => {
    if (!readContract) {
      console.error('Read Contract is not initialized.');
      return [];
    }

    try {
      const filter = readContract.filters.Assigned();
      const latestBlock = await alchemyProvider!.getBlockNumber();
      const maxBlockRange = 100000; // Alchemy's maximum block range per query

      const contractDeploymentBlock = config.contractDeploymentBlock; // Fetching from config file
      if (!contractDeploymentBlock || typeof contractDeploymentBlock !== 'number') {
        throw new Error('Contract deployment block number is not set or invalid.');
      }

      let startBlock = contractDeploymentBlock;
      let endBlock = startBlock + maxBlockRange - 1;
      let allAddressesSet = new Set<string>();

      console.log(`Starting to fetch events from block ${startBlock} to block ${latestBlock}`);

      // Calculate total number of batches
      const remainingBlocks = latestBlock - contractDeploymentBlock + 1;
      const calculatedTotalBatches = Math.ceil(remainingBlocks / maxBlockRange);
      setTotalBatches(calculatedTotalBatches);
      console.log(`Total batches to fetch: ${calculatedTotalBatches}`);

      while (startBlock <= latestBlock) {
        // Adjust endBlock if it exceeds latestBlock
        endBlock = Math.min(startBlock + maxBlockRange - 1, latestBlock);
        console.log(`Fetching events from block ${startBlock} to block ${endBlock}`);

        // Fetch events in the current block range
        const batchEvents = await readContract.queryFilter(filter, startBlock, endBlock);

        console.log(`Fetched ${batchEvents.length} events in this batch.`);

        // Process each event to extract unique addresses
        batchEvents.forEach((event) => {
          if (event.args) {
            const userAddress: string = event.args.user;
            if (userAddress.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
              allAddressesSet.add(userAddress.toLowerCase());
            }
          }
        });

        // Update batch progress
        setProcessedBatches((prev) => prev + 1);

        // Update the startBlock for the next batch
        startBlock = endBlock + 1;
      }

      console.log(`Total unique addresses fetched: ${allAddressesSet.size}`);

      return Array.from(allAddressesSet);
    } catch (err) {
      console.error('Error fetching Assigned events:', err);
      throw err;
    }
  };

  /**
   * Fetch balance for a single address.
   * @param userAddress - Ethereum address of the user
   * @returns Balance in USD (number) or '--' if an error occurs
   */
  const fetchBalance = async (userAddress: string): Promise<number | string> => {
    if (!readContract) {
      console.error('Read Contract is not initialized.');
      return '--';
    }

    try {
      const balance = await readContract.getCommunityUSDC(userAddress);
      const balanceInCents = balance.div(ethers.BigNumber.from(10000));
      return balanceInCents.toNumber();
    } catch (err) {
      console.error(`Error fetching balance for ${userAddress}:`, err);
      return '--';
    }
  };

  /**
   * Fetch the total community pool balance.
   * @returns Formatted pool balance string or '--' if an error occurs
   */
  const fetchCommunityPoolBalance = async (): Promise<string> => {
    if (!readContract) {
      console.error('Read Contract is not initialized.');
      return '--';
    }

    try {
      const poolBalance = await readContract.unassignedPoolBalance();
      const formattedBalance = (poolBalance.toNumber() / 1000000).toFixed(0);
      return `$${formattedBalance}`;
    } catch (err) {
      console.error('Error fetching community pool balance:', err);
      return '--';
    }
  };

  /**
   * Effect hook to initialize animations and fetch data when a wallet is connected.
   */
  useEffect(() => {
    if (address && !animationPlayed) {
      setAnimationData(animations[currentAnimationIndex]);
      setAnimationPlayed(true);
      setShowButtons(true);
      setLoading(true);
      // No need to set isAnimating

      // Fetch data from smart contract
      const fetchData = async () => {
        try {
          const addresses = await fetchAllAddresses();

          if (addresses.length === 0) {
            setError('No Assigned events found.');
            setLoading(false);
            return;
          }

          // Fetch balances for all addresses
          const balancePromises = addresses.map(async (addr: string) => {
            const balance = await fetchBalance(addr);
            return { address: addr, balance };
          });

          const results: Balance[] = await Promise.all(balancePromises);

          setBalances(results);
          console.log('Fetched Balances:', results);

          // Fetch community pool balance
          const poolBalance = await fetchCommunityPoolBalance();
          setCommunityPoolBalance(poolBalance);
          console.log('Community Pool Balance:', poolBalance);

          // Determine top 10 balances (only numbers)
          const top10Results: Top10Balance[] = results
            .filter((item): item is Top10Balance => typeof item.balance === 'number')
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);

          setTop10(top10Results);
          console.log('Top 10 Balances:', top10Results);

          // Fetch user's balance
          const userBalanceObj = results.find(
            (item) => item.address.toLowerCase() === address.toLowerCase()
          );
          const fetchedUserBalance =
            userBalanceObj && typeof userBalanceObj.balance === 'number'
              ? userBalanceObj.balance
              : null;
          setUserBalance(fetchedUserBalance);
          console.log('User Balance:', fetchedUserBalance);

          // Compute and set the top 10 users' information
          const top10UserInfosArray: UserInfo[] = [];

          for (let i = 0; i < top10Results.length; i++) {
            const place = `${i + 1}${getOrdinalSuffix(i + 1)} place`;
            const ensName = await getEnsName(top10Results[i].address as `0x${string}`);
            const baseName = await getBasename(top10Results[i].address as `0x${string}`);
            const truncatedAddress = truncateWalletAddress(top10Results[i]?.address);
            const userInfo = ensName || baseName || truncatedAddress;
            const balanceInfo = top10Results[i].balance.toString();

            // Populate the top10UserInfosArray
            top10UserInfosArray.push({ place, userInfo, balanceInfo });
          }

          setTop10UserInfos(top10UserInfosArray);
        } catch (err) {
          console.error('Error executing calculations:', err);
          setError('An error occurred while executing calculations.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [address, animationPlayed, currentAnimationIndex, animations]);

  /**
   * Function to get the ordinal suffix for a given number.
   * @param i - The number to get the ordinal suffix for
   * @returns Ordinal suffix string
   */
  const getOrdinalSuffix = (i: number): string => {
    const j = i % 10,
      k = i % 100;
    if (j === 1 && k !== 11) {
      return 'st';
    }
    if (j === 2 && k !== 12) {
      return 'nd';
    }
    if (j === 3 && k !== 13) {
      return 'rd';
    }
    return 'th';
  };

  /**
   * Handler for the Next button to navigate to the next animation.
   */
  const handleNext = () => {
    // If we're already at the last animation, don't go to the next
    if (currentAnimationIndex < animations.length - 1) {
      const nextIndex = currentAnimationIndex + 1;
      setCurrentAnimationIndex(nextIndex);
      setAnimationData(animations[nextIndex]);
    }
  };

  /**
   * Handler for the Prev button to navigate to the previous animation.
   */
  const handlePrev = () => {
    // Change to decrement by 2 instead of 1
    if (currentAnimationIndex > 1) { // Ensure we don't go below 0
      const prevIndex = currentAnimationIndex - 2;
      setCurrentAnimationIndex(prevIndex);
      setAnimationData(animations[prevIndex]);
    } else if (currentAnimationIndex === 1) { // Edge case to prevent negative index
      setCurrentAnimationIndex(0);
      setAnimationData(animations[0]);
    }
  };

  /**
   * Handler to open the primary drawer.
   */
  const handleDashboardButtonClick = () => {
    setDrawerState('primary-open');
  };

  /**
   * Handler to close the primary drawer.
   */
  const handleClosePrimaryDrawer = () => {
    setDrawerState('closed');
  };

  /**
   * Handler to open the secondary drawer.
   */
  const handleOpenSecondaryDrawer = () => {
    setDrawerState('secondary-open');
  };

  /**
   * Handler to close the secondary drawer and reopen the primary drawer.
   */
  const handleCloseSecondaryDrawer = () => {
    setDrawerState('primary-open');
  };

  /**
   * **Handler to open the vote drawer.**
   */
  const handleVoteButtonClick = () => {
    setDrawerState('vote-open');
  };

  /**
   * **Handler to close the vote drawer.**
   */
  const handleCloseVoteDrawer = () => {
    setDrawerState('closed');
  };

  /**
   * Calculate the percentage completion based on batches processed.
   * @returns Percentage string
   */
  const calculateCompletionPercentage = (): string => {
    if (totalBatches === 0) return '0%';
    const percentage = (processedBatches / totalBatches) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  // **Determine the current voting configuration**
  const currentVotingConfig =
    currentAnimationIndex < votingConfigs.length
      ? votingConfigs[currentAnimationIndex]
      : {
          votingButtonVisible: false,
          votingType: 'abc',
          VoteOption1: {
            Active: false,
            positionXaxis: '',
            positionYaxis: '',
            Function: '',
            To: '',
            Amount: 0,
            Tag: '',
            Concept: '',
          },
          VoteOption2: {
            Active: false,
            positionXaxis: '',
            positionYaxis: '',
            Function: '',
            To: '',
            Amount: 0,
            Tag: '',
            Concept: '',
          },
          VoteOption3: {
            Active: false,
            positionXaxis: '',
            positionYaxis: '',
            Function: '',
            To: '',
            Amount: 0,
            Tag: '',
            Concept: '',
          },
          VoteOption4: {
            Active: false,
            positionXaxis: '',
            positionYaxis: '',
            Function: '',
            To: '',
            Amount: 0,
            Tag: '',
            Concept: '',
          },
          VoteOption5: {
            Active: false,
            positionXaxis: '',
            positionYaxis: '',
            Function: '',
            To: '',
            Amount: 0,
            Tag: '',
            Concept: '',
          },
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

  /**
   * **Handler for Regular Transaction (Fallback)**
   */
  const handleRegularTransaction = async () => {
    if (!writeContract) {
      alert('Contract is not initialized.');
      return;
    }

    try {
      setIsTransactionLoading(true);
      setTransactionError(null);
      setIsTransactionSuccess(false);

      // Initiate the transaction
      const tx = await writeContract.transferCommunityUSDC(
        '0xA7C6a8782632733d48246bF516475341Dac6d65B', // _to
        10000, // _amount
        'Test', // _tag
        'Test' // _concept
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

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Brown Container (left side) */}
        <div className="brown-container"></div>

        {/* Yellow Container (center) */}
        <div className="yellow-container relative">
          {/* Main Animations */}
          {animationData && (
            <Lottie
              animationData={animationData}
              loop={animationLoopSettings[currentAnimationIndex]} // true or false
              onComplete={handleNext} // Automatically calls handleNext when animation completes
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 10,
              }}
            />
          )}

          {/* Added "Please connect your wallet" message */}
          {!address && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-xl font-semibold">Please connect your wallet</p>
            </div>
          )}

          {/* Error and Loading Indicators */}
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded">
              {error}
            </div>
          )}

          {loading && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Loading...
            </div>
          )}
        </div>

        {/* Red Container (right side) */}
        <div className="red-container">
          {/* Login Buttons */}
          <div className="flex justify-center">
            <SignupButton />
            {!address && <LoginButton />}
          </div>

          {/* **Conditional Rendering of TransactWithPaymaster or Fallback Button** */}
          {address && isPaymasterSupported ? (
            <TransactWithPaymaster
              functionName="transferCommunityUSDC"
              args={[
                '0xA7C6a8782632733d48246bF516475341Dac6d65B', // _to
                10000, // _amount
                'Test', // _tag
                'Test' // _concept
              ]}
              poolAddress={CONTRACT_ADDRESS}
              poolAbi={abi}
              chainId={base.id}
              style={{}} // Add any custom styles if needed
              className="transaction-button z-20 mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              label="Send Community USDC"
            />
          ) : (
            address && (
              <button
                onClick={handleRegularTransaction}
                className="transaction-button z-20 mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Send Community USDC
              </button>
            )
          )}

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

          {/* Dashboard and Navigation Buttons Group */}
          <div className="vote-nav-group">
            {/* Vote Button */}
            {address && currentVotingConfig.votingButtonVisible && (
              <button
                onClick={handleVoteButtonClick}
                className="vote-button z-20" // Use the class defined in global.css
                aria-label="Vote Button"
              >
                <Image
                  src="/buttons/votebutton.png"
                  alt="Vote Button"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </button>
            )}

            {/* Dashboard Button */}
            {address && dashboardButtonVisible && (
              <button
                onClick={handleDashboardButtonClick}
                className="dashboard-button z-20" // Use the class defined in global.css
                aria-label="Dashboard Button"
              >
                <Image
                  src="/buttons/dashboardbutton.png"
                  alt="Dashboard Button"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </button>
            )}

            {/* Prev and Next Buttons */}
            {showButtons && address && (
              <div className="prev-next-buttons z-20">
                <button
                  className="prev-button"
                  onClick={handlePrev}
                  aria-label="Previous Animation"
                  style={{ visibility: currentAnimationIndex > 0 ? 'visible' : 'hidden' }}
                >
                  Prev
                </button>
                <button
                  className="next-button ml-4"
                  onClick={handleNext}
                  aria-label="Next Animation"
                  style={{
                    visibility:
                      currentAnimationIndex < config.animations - 1 ? 'visible' : 'hidden',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden">
        {/* Green Container */}
        <div className="green-container relative">
          {/* Login Buttons */}
          <div
            className="absolute top-0 right-0 flex items-center"
            style={{ paddingTop: '5px', paddingRight: '5px' }}
          >
            <SignupButton />
            {!address && <LoginButton />}
          </div>
        </div>

        {/* Yellow Container */}
        <div className="yellow-container relative">
          {/* Main Animations */}
          {animationData && (
            <Lottie
              animationData={animationData}
              loop={animationLoopSettings[currentAnimationIndex]} // true or false
              onComplete={handleNext} // Automatically calls handleNext when animation completes
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 10,
              }}
            />
          )}
          {/* Added "Please connect your wallet" message */}
          {!address && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-xl font-semibold">Please connect your wallet</p>
            </div>
          )}
        </div>

        {/* Blue Container */}
        <div className="blue-container relative">
          {/* Prev and Next Buttons */}
          {showButtons && address && (
            <div
              className="absolute top-0 right-0 z-20"
              style={{ paddingTop: '5px', paddingRight: '5px' }}
            >
              <button
                className="prev-button px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                onClick={handlePrev}
                aria-label="Previous Animation"
                style={{ visibility: currentAnimationIndex > 0 ? 'visible' : 'hidden' }}
              >
                Prev
              </button>
              <button
                className="next-button px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition ml-2"
                onClick={handleNext}
                aria-label="Next Animation"
                style={{
                  visibility:
                    currentAnimationIndex < config.animations - 1 ? 'visible' : 'hidden',
                }}
              >
                Next
              </button>
            </div>
          )}

          {/* Dashboard Button */}
          {address && dashboardButtonVisible && (
            <button
              onClick={handleDashboardButtonClick}
              className="dashboard-button z-20" // Use the class defined in global.css
              aria-label="Dashboard Button"
            >
              <Image
                src="/buttons/dashboardbutton.png"
                alt="Dashboard Button"
                width={100}
                height={100}
                className="object-contain"
              />
            </button>
          )}

          {/* Vote Button */}
          {address && currentVotingConfig.votingButtonVisible && (
            <button
              onClick={handleVoteButtonClick}
              className="vote-button z-20" // Use the class defined in global.css
              aria-label="Vote Button"
            >
              <Image
                src="/buttons/votebutton.png"
                alt="Vote Button"
                width={100}
                height={100}
                className="object-contain"
              />
            </button>
          )}
        </div>
      </div>

      {/* Primary and Secondary Drawers */}
      <PrimarySecondaryDrawer
        drawerState={drawerState as 'closed' | 'primary-open' | 'secondary-open'}
        handleClosePrimaryDrawer={handleClosePrimaryDrawer}
        handleCloseSecondaryDrawer={handleCloseSecondaryDrawer}
        handleOpenSecondaryDrawer={handleOpenSecondaryDrawer}
        loading={loading}
        communityPoolBalance={communityPoolBalance}
        userBalance={userBalance}
        top10={top10}
        top10UserInfos={top10UserInfos}
        calculateCompletionPercentage={calculateCompletionPercentage}
      />

      {/* **Vote Drawer** */}
      <VoteDrawer
        drawerState={drawerState as 'closed' | 'vote-open'}
        handleCloseVoteDrawer={handleCloseVoteDrawer}
        currentAnimationIndex={currentAnimationIndex}
      />
    </div>
  );
}
