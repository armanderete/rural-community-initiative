'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWalletClient,
} from 'wagmi';
import { CSSProperties, ReactNode } from 'react';
import { parseGwei } from 'viem';
import { base } from 'wagmi/chains';
import { BigNumber, ethers } from 'ethers';
import Lottie from 'lottie-react';
import Image from 'next/image';
import LoginButton from '../../../components/LoginButton';
import SignupButton from '../../../components/SignupButton';
import abi from './abi.json'; // Import ABI from the JSON file
import { getBasename } from '../../../basenames';
import { getEnsName } from '../../../ensnames';
import { truncateWalletAddress } from '../../../utils';

// **Import Voting Configurations** Needed for the Vote button to appear
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
import VotingConfigAnimation12 from './configs/VotingConfigAnimation12.json';
import VotingConfigAnimation13 from './configs/VotingConfigAnimation13.json';
import VotingConfigAnimation14 from './configs/VotingConfigAnimation14.json';
import VotingConfigAnimation15 from './configs/VotingConfigAnimation15.json';
import VotingConfigAnimation16 from './configs/VotingConfigAnimation16.json';
import VotingConfigAnimation17 from './configs/VotingConfigAnimation17.json';

// **Import the VoteDrawer Component**
import VoteDrawer from './components/drawers/VoteDrawer';

// **Import the PrimarySecondaryDrawer Component**
import PrimarySecondaryDrawer from './components/drawers/PrimarySecondaryDrawer';

// Import the configuration
import config from './page-config.json';

// **Import Milestone Buttons JSON** (adjust path as necessary)
import MilestoneMenuButtons from './configs/MilestoneMenuButtons.json';

// **Import Supabase Client**
import { createClient } from '@supabase/supabase-js';

// **Initialize Supabase Client**
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// **Define the type for the config to ensure type safety
interface PageConfig {
  animations: number;
  animationLoopSettings: boolean[];
  contractAddress: string;
  chainId: number;
  contractDeploymentBlock: number;
}

// Define the type for newRow
type MilestoneRow = {
  wallet_address: string;
  [key: string]: number | string; // Allow dynamic keys
};

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

  // **Array of Voting Configurations** Needed for the Vote button to appear
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
    VotingConfigAnimation12 as VotingConfig,
    VotingConfigAnimation13 as VotingConfig,
    VotingConfigAnimation14 as VotingConfig,
    VotingConfigAnimation15 as VotingConfig,
    VotingConfigAnimation16 as VotingConfig,
    VotingConfigAnimation17 as VotingConfig,
  ];

  // State to manage current animation index
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState<number>(0);

  // State to hold loaded animations
  const [loadedAnimations, setLoadedAnimations] = useState<any[]>([]);

  // State to hold the currently displayed animation
  const [currentAnimation, setCurrentAnimation] = useState<any>(null);

  // State to track if animations have started loading
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

  // Initialize ethers providers and contracts
  const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
  const alchemyProvider = useMemo(() => {
    if (ALCHEMY_API_URL) {
      return new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
    }
    return null;
  }, [ALCHEMY_API_URL]);

  const CONTRACT_ADDRESS = config.contractAddress; // fetched from config file

  // **Contracts** Using Alchemy provider for the queries, signer for wallet transactions
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
   * Fetch all user addresses from Supabase for a specific contract.
   * @param contractAddress - Ethereum smart contract address to filter by.
   */
  const fetchAllAddressesFromSupabase = async (contractAddress: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('community_pool_members') // Ensure this table exists in Supabase
        .select('user_address')
        .eq('community_pool_address', contractAddress);

      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }

      if (data) {
        // Extract addresses from data and convert to lowercase
        const addresses: string[] = data.map((member: { user_address: string }) =>
          member.user_address.toLowerCase()
        );
        console.log(`Fetched ${addresses.length} addresses from Supabase for contract ${contractAddress}.`);
        return addresses;
      }

      return [];
    } catch (err) {
      console.error('Error fetching addresses from Supabase:', err);
      setError('Failed to fetch community members.');
      return [];
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
      // Assuming USDC has 6 decimals, adjust if different
      const balanceInUSD = parseFloat(ethers.utils.formatUnits(balance, 6));
      return balanceInUSD;
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
      // Assuming USDC has 6 decimals, adjust if different
      const formattedBalance = parseFloat(ethers.utils.formatUnits(poolBalance, 6)).toFixed(0);
      return `$${formattedBalance}`;
    } catch (err) {
      console.error('Error fetching community pool balance:', err);
      return '--';
    }
  };

  /**
   * **Dynamic Import of Animations**
   * Define an array of functions that dynamically import each animation.
   */
  const animationImports = useMemo(
    () => [
      () => import('./animations/animation1.json'),
      () => import('./animations/animation2.json'),
      () => import('./animations/animation3.json'),
      () => import('./animations/animation4.json'),
      () => import('./animations/animation5.json'),
      () => import('./animations/animation6.json'),
      () => import('./animations/animation7.json'),
      () => import('./animations/animation8.json'),
      () => import('./animations/animation9.json'),
      () => import('./animations/animation10.json'),
      () => import('./animations/animation11.json'),
      () => import('./animations/animation12.json'),
    ],
    []
  );

  /**
   * **Effect Hook to Start Loading Animations Sequentially**
   */
  const [loadingIndex, setLoadingIndex] = useState<number>(0);

  useEffect(() => {
    if (address && !animationPlayed) {
      setAnimationPlayed(true);
      setShowButtons(true);
      setLoading(true);
      setLoadingIndex(0);
    }
  }, [address, animationPlayed]);

  useEffect(() => {
    if (loadingIndex >= animationImports.length) {
      setLoading(false);
      return;
    }

    const loadAnimation = async () => {
      try {
        const animation = await animationImports[loadingIndex]();
        setLoadedAnimations((prev) => [...prev, animation.default]);

        if (loadingIndex === 0) {
          setCurrentAnimation(animation.default);
        }
      } catch (error) {
        console.error(`Failed to load animation ${loadingIndex + 1}:`, error);
      } finally {
        setLoadingIndex((prev) => prev + 1);
      }
    };

    if (loadingIndex < animationImports.length) {
      loadAnimation();
    }
  }, [loadingIndex, animationImports]);

  /**
   * Effect hook to initialize animations and fetch data when a wallet is connected.
   * This ensures that data fetching and animation loading occur simultaneously.
   */
  useEffect(() => {
    if (address && !animationPlayed) {
      // Animation loading is already handled by the above effect
      setLoading(true);

      // Fetch data from Supabase and smart contract
      const fetchData = async () => {
        try {
          // Step 1: Fetch all community member addresses
          const addresses = await fetchAllAddressesFromSupabase(CONTRACT_ADDRESS);

          if (addresses.length === 0) {
            setError('No community members found for this contract.');
            setLoading(false);
            return;
          }

          // Step 2: Fetch balances
          const balancePromises = addresses.map(async (addr: string) => {
            const balance = await fetchBalance(addr);
            return { address: addr, balance };
          });

          const results: Balance[] = await Promise.all(balancePromises);
          setBalances(results);
          console.log('Fetched Balances:', results);

          // Step 3: Fetch community pool balance
          const poolBalance = await fetchCommunityPoolBalance();
          setCommunityPoolBalance(poolBalance);
          console.log('Community Pool Balance:', poolBalance);

          // Step 4: Determine top 10 balances
          const top10Results: Top10Balance[] = results
            .filter((item): item is Top10Balance => typeof item.balance === 'number')
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);

          setTop10(top10Results);
          console.log('Top 10 Balances:', top10Results);

          // Step 5: Fetch user's balance
          const userBalanceObj = results.find(
            (item) => item.address.toLowerCase() === address.toLowerCase()
          );
          const fetchedUserBalance =
            userBalanceObj && typeof userBalanceObj.balance === 'number'
              ? userBalanceObj.balance
              : null;
          setUserBalance(fetchedUserBalance);
          console.log('User Balance:', fetchedUserBalance);

          // Step 6: Compute and set the top 10 users' information
          const top10UserInfosArray: UserInfo[] = [];

          for (let i = 0; i < top10Results.length; i++) {
            const place = `${i + 1}${getOrdinalSuffix(i + 1)} place`;
            const ensName = await getEnsName(top10Results[i].address as `0x${string}`);
            const baseName = await getBasename(top10Results[i].address as `0x${string}`);
            const truncatedAddress = truncateWalletAddress(top10Results[i]?.address);
            const userInfo = ensName || baseName || truncatedAddress;
            const balanceInfo = top10Results[i].balance.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

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
  }, [address, animationPlayed]);

  /**
   * Function to get the ordinal suffix for a given number.
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
    if (currentAnimationIndex < config.animations - 1) {
      const nextIndex = currentAnimationIndex + 1;
      setCurrentAnimationIndex(nextIndex);
      setCurrentAnimation(loadedAnimations[nextIndex]);
    }
  };

  /**
   * Handler for the Prev button to navigate to the previous animation.
   * (Going back 2 steps by design)
   */
  const handlePrev = () => {
    if (currentAnimationIndex > 1) {
      const prevIndex = currentAnimationIndex - 2;
      setCurrentAnimationIndex(prevIndex);
      setCurrentAnimation(loadedAnimations[prevIndex]);
    } else if (currentAnimationIndex === 1) {
      const prevIndex = 0;
      setCurrentAnimationIndex(prevIndex);
      setCurrentAnimation(loadedAnimations[prevIndex]);
    }
  };

  // ------------------------------------------------
  // Dashboard Drawer Handlers
  // ------------------------------------------------
  const handleDashboardButtonClick = () => {
    setDrawerState('primary-open');
  };
  const handleClosePrimaryDrawer = () => {
    setDrawerState('closed');
  };
  const handleOpenSecondaryDrawer = () => {
    setDrawerState('secondary-open');
  };
  const handleCloseSecondaryDrawer = () => {
    setDrawerState('primary-open');
  };

  // ------------------------------------------------
  // Vote Drawer Handlers
  // ------------------------------------------------
  const handleVoteButtonClick = () => {
    setDrawerState('vote-open');
  };
  const handleCloseVoteDrawer = () => {
    setDrawerState('closed');
  };

  /**
   * Calculate the percentage completion based on batches processed.
   */
  const calculateCompletionPercentage = (): string => {
    if (totalBatches === 0) return '0%';
    const percentage = (processedBatches / totalBatches) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  // ------------------------------------------------
  // Milestone Buttons + Scoring Buttons
  // ------------------------------------------------

  // Track the current milestone clicked (e.g. 'MilestoneButton1') so we can show the scoring buttons
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);

  /**
   * Renders the main milestone buttons (MilestoneButton1..8).
   */
  const renderMilestoneButtons = () => {
    if (!MilestoneMenuButtons.MilestoneButtonsVisible) return null;

    const result: JSX.Element[] = [];

    for (let i = 1; i <= 8; i++) {
      const key = `MilestoneButton${i}`;
      const data = (MilestoneMenuButtons as any)[key];
      if (!data || !data.Active) continue;

      const { animation, positionXaxis, positionYaxis, width, height } = data;

      // On click, set the currentAnimationIndex (as existing) and set milestone
      const handleClick = async () => {
        const newIndex = parseInt(animation, 10);
        if (isNaN(newIndex) || newIndex < 0 || newIndex >= config.animations) {
          console.error(`Invalid animation index for ${key}:`, animation);
          return;
        }

        // Set the animation
        setCurrentAnimationIndex(newIndex);
        if (loadedAnimations[newIndex]) {
          setCurrentAnimation(loadedAnimations[newIndex]);
        }

        // Set the milestone
        setCurrentMilestone(key);

        // Query Supabase for all columns
        const { data, error } = await supabase
          .from(config.milestoneScoringTable)
          .select('*')
          .eq('wallet_address', address?.toLowerCase());

        if (error) {
          console.error('Supabase query error:', error);
          return;
        }

        if (data?.[0]) {
          const milestoneNumber = key.replace('MilestoneButton', '');
          const milestoneCol = `milestone${milestoneNumber}`;
          setCurrentScoreForMilestone(data[0][milestoneCol]);
        } else {
          setCurrentScoreForMilestone(null);
        }

        // **New Code Block to Log Milestone Scores and Current Tier**
        if (data && data[0]) {
          console.log('--- Current Scores for All Milestones ---');
          for (let i = 1; i <= 8; i++) {
            const milestoneScore = data[0][`milestone${i}`];
            console.log(`Milestone ${i} => Score: ${milestoneScore}`);
          }
          console.log(`Current Tier: ${currentUserTier}`); // Log current user tier
        }
        // **End of New Code Block**
      };

      result.push(
        <button
          key={key}
          onClick={handleClick}
          style={{
            position: 'absolute',
            left: positionXaxis,
            top: positionYaxis,
            width,
            height,
            backgroundColor: 'transparent',
            color: 'transparent',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          {key}
        </button>
      );
    }

    return result;
  };

  /**
   * Renders the scoring buttons for the currently selected milestone.
   * According to #5, each milestone might have up to 5 scoring buttons named like:
   *  "MilestoneScoringButton1.1", "MilestoneScoringButton1.2", etc.
   * If currentMilestone is "MilestoneButton1", we only show scoring buttons that start with "MilestoneScoringButton1.".
   */
  const renderScoringButtons = () => {
    if (!currentMilestone) return null; // no milestone selected => hide scoring
  
    // e.g. if currentMilestone = "MilestoneButton1", we want "MilestoneScoringButton1."
    const milestoneNumber = currentMilestone.replace('MilestoneButton', ''); // "1"
    const prefix = `MilestoneScoringButton${milestoneNumber}.`; // "MilestoneScoringButton1."
  
    const scoringElements: JSX.Element[] = [];
  
    // Loop through all keys in the JSON that start with the desired prefix
    for (const key in MilestoneMenuButtons) {
      if (!key.startsWith(prefix)) continue; // Skip keys that don't match the current milestone
  
      const data = (MilestoneMenuButtons as any)[key];
      if (!data || !data.Active) continue; // Skip inactive buttons
  
      const { value, positionXaxis, positionYaxis, width, height } = data;
  
      const handleScoringClick = async () => {
        if (!address) return; // Ensure the user is logged in

        const tableName = config.milestoneScoringTable;
        const column = `milestone${currentMilestone.replace('MilestoneButton', '')}`; // Extract milestone number

        // Query Supabase for the wallet address
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('wallet_address', address.toLowerCase());

        if (error) {
          console.error('Supabase query error:', error);
          return;
        }

        if (!data || data.length === 0) {
          // Wallet address not found – create new row
          const newRow: MilestoneRow = { wallet_address: address.toLowerCase() };
          newRow[column] = value; // Set the score for the clicked milestone

          // Insert new row into Supabase
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(newRow);

          if (insertError) {
            console.error('Error inserting new row:', insertError);
          } else {
            setCurrentScoreForMilestone(value); // Update the current score
          }
        } else {
          // Wallet exists – update the existing score
          const existingData = data[0];
          const updatedRow = { [column]: value }; // Update the specific milestone score

          const { error: updateError } = await supabase
            .from(tableName)
            .update(updatedRow)
            .eq('wallet_address', address.toLowerCase());

          if (updateError) {
            console.error('Error updating score:', updateError);
          } else {
            setCurrentScoreForMilestone(value); // Update the current score
          }
        }

        // **New Code Block to Log Updated Milestone Scores and Current Tier**
        const { data: scoreData, error: scoreError } = await supabase
          .from(config.milestoneScoringTable)
          .select('*')
          .eq('wallet_address', address.toLowerCase());

        if (scoreError) {
          console.error('Supabase score query error:', scoreError);
        } else if (scoreData && scoreData[0]) {
          console.log('--- Updated Scores for All Milestones ---');
          for (let i = 1; i <= 8; i++) {
            const milestoneScore = scoreData[0][`milestone${i}`];
            console.log(`Milestone ${i} => Score: ${milestoneScore}`);
          }
          console.log(`Current Tier: ${currentUserTier}`); // Log current user tier
        }
        // **End of New Code Block**
      };
  
      scoringElements.push(
        <button
          key={key}
          onClick={handleScoringClick}
          style={{
            position: 'absolute',
            left: positionXaxis,
            top: positionYaxis,
            width,
            height,
            backgroundColor: 'transparent',
            color: 'transparent',
            border: 'transparent',
            cursor: 'pointer',
            zIndex: 30,
          }}
        >
          {key}
        </button>
      );
    }
  
    return scoringElements;
  };
    
  // ------------------------------------------------
  // End Milestone + Scoring Logic
  // ------------------------------------------------

  const [milestoneScores, setMilestoneScores] = useState<number[]>(Array(8).fill(0)); // Initialize with default scores

  useEffect(() => {
    const initializeMilestoneScores = async () => {
      if (!address) return; // No wallet connected, skip initialization

      const tableName = config.milestoneScoringTable;

      // Query Supabase for the wallet address
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('wallet_address', address.toLowerCase());

      if (error) {
        console.error('Supabase query error:', error);
        return;
      }

      if (!data || data.length === 0) {
        // Wallet address not found – create new row
        const defaultScore = MilestoneMenuButtons.defaultMilestoneScore;
        const newRow: MilestoneRow = { wallet_address: address.toLowerCase() }; // Use the actual wallet address

        // Populate all milestone score columns with defaultScore
        for (let i = 1; i <= 8; i++) {
          newRow[`milestone${i}`] = defaultScore;
        }
        newRow['tier'] = MilestoneMenuButtons.DefaultTier; // Set the tier

        // Insert new row into Supabase
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(newRow);

        if (insertError) {
          console.error('Error inserting new row:', insertError);
        } else {
          // Update state with default scores and tier
          setMilestoneScores(Array(8).fill(defaultScore));
          setCurrentUserTier(MilestoneMenuButtons.DefaultTier); // Set the current user tier
        }
      } else {
        // Existing user
        const existingData = data[0];
        const scores = [];
        for (let i = 1; i <= 8; i++) {
          const column = `milestone${i}`;
          scores.push(existingData[column]);
        }
        setMilestoneScores(scores);

        // Handle user tier
        const tierValue = existingData['tier'] || MilestoneMenuButtons.DefaultTier;
        if (!existingData['tier']) {
          // Optionally update row with default tier if missing
          await supabase
            .from(tableName)
            .update({ tier: MilestoneMenuButtons.DefaultTier })
            .eq('wallet_address', address.toLowerCase());
        }
        setCurrentUserTier(tierValue); // Set the current user tier
      }
    };

    initializeMilestoneScores();
  }, [address]);

  const [currentScoreForMilestone, setCurrentScoreForMilestone] = useState<string | null>(null);

  const [currentUserTier, setCurrentUserTier] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      // Fetch user data logic...
      if (address) {
        const { data, error } = await supabase
          .from(config.milestoneScoringTable)
          .select('*')
          .eq('wallet_address', address.toLowerCase());

        if (data && data[0]) {
          const tierValue = data[0]['tier'] || MilestoneMenuButtons.DefaultTier;
          setCurrentUserTier(tierValue); // Sync current user tier
        }
      } else {
        console.error('Address is undefined.');
      }
    };

    if (address) {
      fetchUserData();
    }
  }, [address]);

  /**
   * Renders the Tier buttons based on MilestoneMenuButtons.json.
   * Only active Tier buttons are rendered.
   * In this section below you can change the tier button color.
   */
  const renderTierButtons = () => {
    const tierButtons: JSX.Element[] = [];

    for (let i = 1; i <= 5; i++) {
      const key = `TierButton${i}`;
      const data = (MilestoneMenuButtons as any)[key];
      if (!data || !data.Active) continue; // Skip inactive buttons

      const { value, positionXaxis, positionYaxis, width, height } = data;

      const handleTierClick = async () => {
        if (!address) return; // Ensure the user is logged in

        const tableName = config.milestoneScoringTable;

        // Update the tier in Supabase
        const { error } = await supabase
          .from(tableName)
          .update({ tier: value })
          .eq('wallet_address', address.toLowerCase());

        if (error) {
          console.error('Error updating tier:', error);
          return;
        }

        // Fetch the updated tier
        const { data: updatedData, error: fetchError } = await supabase
          .from(tableName)
          .select('tier')
          .eq('wallet_address', address.toLowerCase())
          .single();

        if (fetchError) {
          console.error('Error fetching updated tier:', fetchError);
          return;
        }

        if (updatedData) {
          setCurrentUserTier(updatedData.tier);
          console.log(`Tier updated to: ${updatedData.tier}`);
        }
      };

      tierButtons.push(
        <button
          key={key}
          onClick={handleTierClick}
          style={{
            position: 'absolute',
            left: positionXaxis,
            top: positionYaxis,
            width,
            height,
            backgroundColor: 'white', // Set background to white
            border: 'none',
            cursor: 'pointer',
            zIndex: 25,
          }}
        >
          {`Tier ${i}`}
        </button>
      );
    }

    return tierButtons;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Desktop View */}
      <div className="hidden md:flex flex-row">
        {/* Brown Container (left side) */}
        <div className="brown-container"></div>

        {/* Yellow Container (center) */}
        <div className="yellow-container relative">
          {/* Main Animations with Controlled Visibility */}
          <div
            className={`w-full h-full transition-opacity duration-500 ${
              address ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {currentAnimation && (
              <Lottie
                animationData={currentAnimation}
                loop={config.animationLoopSettings[currentAnimationIndex]} // true or false
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
          </div>

          {/* "Please connect your wallet" message */}
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

          {/* Milestone Buttons */}
          {renderMilestoneButtons()}

          {/* Scoring Buttons for the selected milestone */}
          {renderScoringButtons()}

          {/* Tier Buttons - Added here inside the yellow container */}
          {address && renderTierButtons()} {/* Render Tier Buttons */}
        </div>

        {/* Red Container (right side) */}
        <div className="red-container">
          {/* Login Buttons */}
          <div className="flex justify-center">
            <SignupButton />
            {!address && <LoginButton />}
          </div>

          {/* Dashboard and Navigation Buttons Group */}
          <div className="vote-nav-group">
            {/* Vote Button */}
            {address && votingConfigs[currentAnimationIndex]?.votingButtonVisible && (
              <button
                onClick={handleVoteButtonClick}
                className="vote-button z-20"
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
                className="dashboard-button z-20"
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
                    visibility: currentAnimationIndex === config.animations - 1 ? 'hidden' : 'visible',
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
          {/* Main Animations with Controlled Visibility */}
          <div
            className={`w-full h-full transition-opacity duration-500 ${
              address ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {currentAnimation && (
              <Lottie
                animationData={currentAnimation}
                loop={config.animationLoopSettings[currentAnimationIndex]} // true or false
                onComplete={handleNext}
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
          </div>

          {/* "Please connect your wallet" message */}
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

          {/* Milestone Buttons for Mobile */}
          {MilestoneMenuButtons.MilestoneButtonsVisible && renderMilestoneButtons()}
          {/* Scoring Buttons for the selected milestone */}
          {renderScoringButtons()}

          {/* Tier Buttons - Added here inside the yellow container for mobile */}
          {address && renderTierButtons()} {/* Render Tier Buttons */}
        </div>

        {/* Blue Container */}
        <div className="blue-container relative">
          {/* Prev and Next Buttons */}
          {showButtons && address && (
            <div
              className="absolute top-0 right-0 z-20 flex space-x-2"
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
                  visibility: currentAnimationIndex === config.animations - 1 ? 'hidden' : 'visible',
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
              className="dashboard-button z-20"
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
          {address && votingConfigs[currentAnimationIndex]?.votingButtonVisible && (
            <button
              onClick={handleVoteButtonClick}
              className="vote-button z-20"
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
