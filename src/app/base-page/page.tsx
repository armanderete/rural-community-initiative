'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers'; // Import ethers
import Lottie from 'lottie-react';
import Image from 'next/image';
import LoginButton from '../../components/LoginButton';
import SignupButton from '../../components/SignupButton';
import abi from '../abi.json'; // Import ABI from the JSON file
import { getBasename, type Basename } from '../../basenames';
import { getEnsName } from '../../ensnames';
import { truncateWalletAddress } from '../../utils'; // Assuming you have this utility function

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

import DashboardAnimation from '../animations/dashboard.json';
import LeaderboardAnimation from '../animations/leaderboard.json';

// Import the configuration
import config from './page-config.json';

// Define types for better type safety
type Balance = { address: string; balance: number | string };
type Top10Balance = { address: string; balance: number };
type UserInfo = { place: string; userInfo: string; balanceInfo: string };

// Define the type for the config to ensure type safety
interface PageConfig {
  animations: number;
  animationLoopSettings: boolean[];
  contractAddress: string;
  contractDeploymentBlock: number;
}

export default function Page() {
  const { address } = useAccount();

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

  // State to manage current animation index
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState<number>(0);

  // State to trigger animation playback
  const [animationData, setAnimationData] = useState<any>(null);

  // State to track if animation has played
  const [animationPlayed, setAnimationPlayed] = useState<boolean>(false);

  // State to manage visibility of Prev and Next buttons
  const [showButtons, setShowButtons] = useState<boolean>(false);

  // State to manage visibility of the vote_button
  const [voteButtonVisible, setVoteButtonVisible] = useState<boolean>(true);

  // State to manage drawer states
  const [drawerState, setDrawerState] = useState<'closed' | 'primary-open' | 'secondary-open'>('closed');

  // State to store balances (allows balance to be number or string)
  const [balances, setBalances] = useState<Balance[]>([]);

  const [userBalance, setUserBalance] = useState<number | null>(null);

  // State to store community pool balance
  const [communityPoolBalance, setCommunityPoolBalance] = useState<string>('');

  // State to handle errors
  const [error, setError] = useState<string | null>(null);

  // State to handle loading
  const [loading, setLoading] = useState<boolean>(false);

  // New state variable to store the top basename
  const [topBasename, setTopBasename] = useState<Basename | null>(null);

  // State to store top 10 balances (only numbers)
  const [top10, setTop10] = useState<Top10Balance[]>([]);

  // State variable for top 10 users' information
  const [top10UserInfos, setTop10UserInfos] = useState<UserInfo[]>([]);

  // State variables for batch tracking
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [processedBatches, setProcessedBatches] = useState<number>(0);

  // Initialize ethers provider and contract using config values
  const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
  const CONTRACT_ADDRESS = config.contractAddress; // fetched from config file
  const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

  /**
   * Fetch all Assigned events to get unique user addresses.
   * Implements batching to comply with Alchemy's max block range limitation.
   */
  const fetchAllAddresses = async (): Promise<string[]> => {
    try {
      const filter = contract.filters.Assigned();
      const latestBlock = await provider.getBlockNumber();
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
        const batchEvents = await contract.queryFilter(filter, startBlock, endBlock);

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
    try {
      const balance = await contract.getCommunityUSDC(userAddress);
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
    try {
      const poolBalance = await contract.unassignedPoolBalance();
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
    // If we're already at the first animation, don't go to the previous
    if (currentAnimationIndex > 0) {
      const prevIndex = currentAnimationIndex - 2;
      setCurrentAnimationIndex(prevIndex);
      setAnimationData(animations[prevIndex]);
    }
  };

  /**
   * Handler to open the primary drawer.
   */
  const handleVoteButtonClick = () => {
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
   * Calculate the percentage completion based on batches processed.
   * @returns Percentage string
   */
  const calculateCompletionPercentage = (): string => {
    if (totalBatches === 0) return '0%';
    const percentage = (processedBatches / totalBatches) * 100;
    return `${percentage.toFixed(2)}%`;
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

          {/* Vote and Navigation Buttons Group */}
          <div className="vote-nav-group">
            {/* Vote Button */}
            {address && voteButtonVisible && (
              <button
                onClick={handleVoteButtonClick}
                className="vote-button z-20" // Use the class defined in global.css
                aria-label="Vote Button"
              >
                <Image
                  src="/buttons/dashboardbutton.png"
                  alt="Vote Button"
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
                  style={{ visibility: currentAnimationIndex < config.animations - 1 ? 'visible' : 'hidden' }}
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
                style={{ visibility: currentAnimationIndex < config.animations - 1 ? 'visible' : 'hidden' }}
              >
                Next
              </button>
            </div>
          )}

          {/* Vote Button */}
          {address && voteButtonVisible && (
            <button
              onClick={handleVoteButtonClick}
              className="vote-button z-20" // Use the class defined in global.css
              aria-label="Vote Button"
            >
              <Image
                src="/buttons/dashboardbutton.png"
                alt="Vote Button"
                width={100}
                height={100}
                className="object-contain"
              />
            </button>
          )}
        </div>
      </div>

      {/* Primary Drawer */}
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center transition-transform duration-300 ease-in-out transform ${
          drawerState === 'primary-open' ? 'translate-y-0' : 'translate-y-[100vh]'
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black opacity-50 transition-opacity duration-300 ease-in-out ${
            drawerState === 'primary-open' ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={drawerState === 'primary-open' ? handleClosePrimaryDrawer : undefined}
        ></div>

        {/* Drawer Content */}
        <div
          className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square md:aspect-square"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing drawer
        >
          {/* Close Button */}
          <button
            className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
            onClick={handleClosePrimaryDrawer}
            aria-label="Close Primary Drawer"
          >
            &times;
          </button>

          {/* Drawer Container */}
          <div className="drawer-container w-full h-full relative flex items-center justify-center">
            {/* Lottie Animation */}
            <Lottie
              animationData={DashboardAnimation}
              loop={true} // This animation loops indefinitely
              className="w-full h-full"
            />

            {/* Loading Progress Message */}
            {loading && (
              <div className="absolute bg-yellow-300 text-black px-6 py-4 rounded flex flex-col items-center">
                <p className="text-lg font-semibold">Loading community pool data from the blockchain</p>
                <p className="mt-2 text-md">{calculateCompletionPercentage()} completed</p>
              </div>
            )}

            {/* Only render the pool balance if it has been populated and not loading */}
            {communityPoolBalance && communityPoolBalance !== '--' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '53%',
                  left: '34%',
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                {communityPoolBalance} USD
              </div>
            )}

            {/* Render the user's balance if not loading */}
            {userBalance !== null && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '7%',
                  left: '8%',
                  fontSize: '30px',
                  fontWeight: 'bold',
                  color: 'DarkViolet',
                  backgroundColor: 'transparent',
                }}
              >
                {userBalance}
              </div>
            )}

            {/* Only render the balances if top10 has been populated and not loading */}
            {top10.length > 0 && typeof top10[0].balance === 'number' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '5%',
                  left: '35%',
                  fontSize: '30px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                {top10[0].balance}
              </div>
            )}

            {top10.length > 1 && typeof top10[1].balance === 'number' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '5%',
                  left: '51%',
                  fontSize: '30px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                {top10[1].balance}
              </div>
            )}

            {top10.length > 2 && typeof top10[2].balance === 'number' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '5%',
                  left: '68%',
                  fontSize: '30px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                {top10[2].balance}
              </div>
            )}

            {/* Button to Open Secondary Drawer */}
            <button
              onClick={handleOpenSecondaryDrawer}
              className="absolute"
              style={{
                bottom: '4%',
                left: '82%',
                width: '13%',
                height: '13%',
                backgroundColor: 'transparent', // Transparent background as per your requirement
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
              }}
              aria-label="Open Secondary Drawer"
            ></button>
          </div>
        </div>
      </div>

      {/* Secondary Drawer */}
      <div
        className={`fixed inset-0 z-50 flex items-start justify-center transition-transform duration-300 ease-in-out transform ${
          drawerState === 'secondary-open' ? 'translate-y-0' : 'translate-y-[100vh]'
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black opacity-50 transition-opacity duration-300 ease-in-out ${
            drawerState === 'secondary-open' ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={drawerState === 'secondary-open' ? handleCloseSecondaryDrawer : undefined}
        ></div>

        {/* Drawer Content */}
        <div
          className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square md:aspect-square"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing drawer
        >
          {/* Close Button */}
          <button
            className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
            onClick={handleCloseSecondaryDrawer}
            aria-label="Close Secondary Drawer"
          >
            &times;
          </button>

          {/* Drawer Container */}
          <div className="drawer-container w-full h-full relative">
            {/* Leaderboard Lottie Animation */}
            <Lottie
              animationData={LeaderboardAnimation}
              loop={true} // This animation loops indefinitely
              className="w-full h-full"
            />

            {/* Render the user's balance if not loading */}
            {userBalance !== null && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '4%',
                  left: '63%',
                  fontSize: '25px',
                  fontWeight: 'bold',
                  color: 'MediumPurple',
                  backgroundColor: 'transparent',
                }}
              >
                {userBalance}
              </div>
            )}

            {/* Display the top 8 users */}
            {/* Display the 1st place user */}
            {top10UserInfos.length > 0 && !loading && (
              <div
                className="absolute left-[35%] bottom-[90%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[0].userInfo}`}
              </div>
            )}

            {/* Display the 1st place balance */}
            {top10UserInfos.length > 0 && !loading && (
              <div
                className="absolute left-[9%] bottom-[89%] text-[18px] md:text-[23px] font-bold text-pink-500 bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[0].balanceInfo}`}
              </div>
            )}

            {/* Display the 2nd place user */}
            {top10UserInfos.length > 1 && !loading && (
              <div
                className="absolute left-[42%] bottom-[76%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[1].userInfo}`}
              </div>
            )}

            {/* Display the 2nd place balance */}
            {top10UserInfos.length > 1 && !loading && (
              <div
                className="absolute left-[30%] bottom-[75%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[1].balanceInfo}`}
              </div>
            )}

            {/* Display the 3rd place user */}
            {top10UserInfos.length > 2 && !loading && (
              <div
                className="absolute left-[47%] bottom-[68%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[2].userInfo}`}
              </div>
            )}

            {/* Display the 3rd place balance */}
            {top10UserInfos.length > 2 && !loading && (
              <div
                className="absolute left-[33%] bottom-[67%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[2].balanceInfo}`}
              </div>
            )}

            {/* Display the 4th place user */}
            {top10UserInfos.length > 3 && !loading && (
              <div
                className="absolute left-[50%] bottom-[61%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[3].userInfo}`}
              </div>
            )}

            {/* Display the 4th place balance */}
            {top10UserInfos.length > 3 && !loading && (
              <div
                className="absolute left-[34%] bottom-[59%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[3].balanceInfo}`}
              </div>
            )}

            {/* Display the 5th place user */}
            {top10UserInfos.length > 4 && !loading && (
              <div
                className="absolute left-[54%] bottom-[54%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[4].userInfo}`}
              </div>
            )}

            {/* Display the 5th place balance */}
            {top10UserInfos.length > 4 && !loading && (
              <div
                className="absolute left-[36%] bottom-[51%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[4].balanceInfo}`}
              </div>
            )}

            {/* Display the 6th place user */}
            {top10UserInfos.length > 5 && !loading && (
              <div
                className="absolute left-[57%] bottom-[46%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[5].userInfo}`}
              </div>
            )}

            {/* Display the 6th place balance */}
            {top10UserInfos.length > 5 && !loading && (
              <div
                className="absolute left-[37%] bottom-[43%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[5].balanceInfo}`}
              </div>
            )}

            {/* Display the 7th place user */}
            {top10UserInfos.length > 6 && !loading && (
              <div
                className="absolute left-[62%] bottom-[37%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[6].userInfo}`}
              </div>
            )}

            {/* Display the 7th place balance */}
            {top10UserInfos.length > 6 && !loading && (
              <div
                className="absolute left-[36%] bottom-[35%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[6].balanceInfo}`}
              </div>
            )}

            {/* Display the 8th place user */}
            {top10UserInfos.length > 7 && !loading && (
              <div
                className="absolute left-[66%] bottom-[27%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[7].userInfo}`}
              </div>
            )}

            {/* Display the 8th place balance */}
            {top10UserInfos.length > 7 && !loading && (
              <div
                className="absolute left-[32%] bottom-[22%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[7].balanceInfo}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
