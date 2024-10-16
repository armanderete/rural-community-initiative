'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers'; // Import ethers
import Lottie from 'lottie-react';
import Image from 'next/image';
import LoginButton from '../components/LoginButton';
import SignupButton from '../components/SignupButton';
import WalletWrapper from 'src/components/WalletWrapper';
import TransactionWrapper from 'src/components/TransactionWrapper';
import abi from './abi.json'; // Import ABI from the JSON file
import './global.css';
import { getBasename, type Basename } from '../basenames';
import { getEnsName } from '../ensnames';
import { truncateWalletAddress } from '../utils'; // Assuming you have this utility function

// Import your animations
import Animation1 from './animations/animation1.json';
import Animation2 from './animations/animation2.json';
import Animation3 from './animations/animation3.json';
import Animation4 from './animations/animation4.json';
import Animation5 from './animations/animation5.json';

import DashboardAnimation from './animations/dashboard.json';

// Define constants
const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
const CONTRACT_ADDRESS = '0xfe3Fc6cb04bA5958b0577a0c6528269964e7C8bF'; // Your contract address

export default function Page() {
  const { address } = useAccount();

  // Array of animations in order
  const animations = [Animation1, Animation2, Animation3, Animation4, Animation5];

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

  // State to prevent button clicks during animation
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  // State to manage the drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // State to store balances
  const [balances, setBalances] = useState<{ address: string; balance: number }[]>([]);

  // State to store community pool balance
  const [communityPoolBalance, setCommunityPoolBalance] = useState<string>('');

  // State to handle errors
  const [error, setError] = useState<string | null>(null);

  // State to handle loading
  const [loading, setLoading] = useState<boolean>(false);

  // New state variable to store the top basename
  const [topBasename, setTopBasename] = useState<Basename | null>(null);

  const [top10, setTop10] = useState<{ address: string; balance: number }[]>([]);

 

  // Initialize ethers provider and contract
  const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

  // Fetch all Assigned events to get unique user addresses
  const fetchAllAddresses = async () => {
    try {
      const filter = contract.filters.Assigned();
      const events = await contract.queryFilter(filter, 0, 'latest');

      const addressesSet = new Set<string>();
      events.forEach((event) => {
        // Check if event.args is defined
        if (event.args) {
          const userAddress = event.args.user;
          // Exclude the contract address itself
          if (userAddress.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
            addressesSet.add(userAddress);
          }
        }
      });

      return Array.from(addressesSet);
    } catch (err) {
      console.error('Error fetching Assigned events:', err);
      throw err;
    }
  };

  // Fetch balance for a single address
  const fetchBalance = async (userAddress: string) => {
    try {
      const balance = await contract.getCommunityUSDC(userAddress);
      // Convert to cents by dividing by 10,000
      const balanceInCents = balance.div(ethers.BigNumber.from(10000));
      // Convert BigNumber to Number (assuming balance is not too large)
      return balanceInCents.toNumber();
    } catch (err) {
      console.error(`Error fetching balance for ${userAddress}:`, err);
      return '--';
    }
  };

  // Fetch Community Pool Balance
  const fetchCommunityPoolBalance = async () => {
    try {
      const poolBalance = await contract.unassignedPoolBalance();
      // Assuming poolBalance is a BigNumber, convert it appropriately
      // Here, dividing by 1,000,000 and adding '$' sign
      const formattedBalance = (poolBalance.toNumber() / 1000000).toFixed(0);
      return `$${formattedBalance}`;
    } catch (err) {
      console.error('Error fetching community pool balance:', err);
      return '--';
    }
  };

  useEffect(() => {
    if (address && !animationPlayed) {
      // User has logged in and animation hasn't played yet
      setAnimationData(animations[currentAnimationIndex]);
      setAnimationPlayed(true);
      setShowButtons(true); // Show Prev and Next buttons after login
      setLoading(true); // Start loading

      // Fetch data from smart contract
      const fetchData = async () => {
        try {
          // Step 1: Fetch all addresses from Assigned events
          const addresses = await fetchAllAddresses();

          if (addresses.length === 0) {
            setError('No Assigned events found.');
            setLoading(false);
            return;
          }

          // Step 2: Fetch all balances in parallel
          const balancePromises = addresses.map(async (addr: string) => {
            const balance = await fetchBalance(addr);
            return { address: addr, balance };
          });

          const results = await Promise.all(balancePromises);

          setBalances(results);

          // Step 5: Fetch Community Pool Balance
          const poolBalance = await fetchCommunityPoolBalance();
          setCommunityPoolBalance(poolBalance);

          

          // Top 10 results by balance descending
          const top10 = results
            .filter((item) => typeof item.balance === 'number')
            .sort((a, b) => (b.balance as number) - (a.balance as number))
            .slice(0, 10); // Changed to top 10

          // Step 7: Construct Alert Message
          let alertMessage = `Contract Balance: ${poolBalance}\n`;
          alertMessage += `Current User: ${address}\n`;

          setTop10(top10); // **Add this line to update the top10 state**
          
          

          // Modified 1st Place Alert: ENS Name > Base Name > Truncated Address, with Community USDC balance
          alertMessage += `1st place: ${
            top10[0]
              ? (await getEnsName(top10[0].address as `0x${string}`)) ||
                (await getBasename(top10[0].address as `0x${string}`)) ||
                truncateWalletAddress(top10[0]?.address)
              : 'N/A'
          } - Community USDC: ${top10[0].balance}\n`;

          // Modified 2nd Place Alert: ENS Name > Base Name > Truncated Address, with Community USDC balance
          alertMessage += `2nd place: ${
            top10[1]
              ? (await getEnsName(top10[1].address as `0x${string}`)) ||
                (await getBasename(top10[1].address as `0x${string}`)) ||
                truncateWalletAddress(top10[1]?.address)
              : 'N/A'
          } - Community USDC: ${top10[1].balance}\n`;

          // Modified 3rd Place Alert
          alertMessage += `3rd place: ${
            top10[2]
              ? (await getEnsName(top10[2].address as `0x${string}`)) ||
                (await getBasename(top10[2].address as `0x${string}`)) ||
                truncateWalletAddress(top10[2]?.address)
              : 'N/A'
          } - Community USDC: ${top10[2].balance}\n`;

          // Modified 4th Place Alert
          alertMessage += `4th place: ${
            top10[3]
              ? (await getEnsName(top10[3].address as `0x${string}`)) ||
                (await getBasename(top10[3].address as `0x${string}`)) ||
                truncateWalletAddress(top10[3]?.address)
              : 'N/A'
          } - Community USDC: ${top10[3].balance}\n`;

          // Modified 5th Place Alert
          alertMessage += `5th place: ${
            top10[4]
              ? (await getEnsName(top10[4].address as `0x${string}`)) ||
                (await getBasename(top10[4].address as `0x${string}`)) ||
                truncateWalletAddress(top10[4]?.address)
              : 'N/A'
          } - Community USDC: ${top10[4].balance}\n`;

          // Modified 6th Place Alert
          alertMessage += `6th place: ${
            top10[5]
              ? (await getEnsName(top10[5].address as `0x${string}`)) ||
                (await getBasename(top10[5].address as `0x${string}`)) ||
                truncateWalletAddress(top10[5]?.address)
              : 'N/A'
          } - Community USDC: ${top10[5].balance}\n`;

          // Modified 7th Place Alert
          alertMessage += `7th place: ${
            top10[6]
              ? (await getEnsName(top10[6].address as `0x${string}`)) ||
                (await getBasename(top10[6].address as `0x${string}`)) ||
                truncateWalletAddress(top10[6]?.address)
              : 'N/A'
          } - Community USDC: ${top10[6].balance}\n`;

          // Modified 8th Place Alert
          alertMessage += `8th place: ${
            top10[7]
              ? (await getEnsName(top10[7].address as `0x${string}`)) ||
                (await getBasename(top10[7].address as `0x${string}`)) ||
                truncateWalletAddress(top10[7]?.address)
              : 'N/A'
          } - Community USDC: ${top10[7].balance}\n`;

          // Modified 9th Place Alert
          alertMessage += `9th place: ${
            top10[8]
              ? (await getEnsName(top10[8].address as `0x${string}`)) ||
                (await getBasename(top10[8].address as `0x${string}`)) ||
                truncateWalletAddress(top10[8]?.address)
              : 'N/A'
          } - Community USDC: ${top10[8].balance}\n`;

          // Modified 10th Place Alert
          alertMessage += `10th place: ${
            top10[9]
              ? (await getEnsName(top10[9].address as `0x${string}`)) ||
                (await getBasename(top10[9].address as `0x${string}`)) ||
                truncateWalletAddress(top10[9]?.address)
              : 'N/A'
          } - Community USDC: ${top10[9].balance}\n`;

          alert(alertMessage);
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

  // Handler for Next button
  const handleNext = () => {
    if (isAnimating) return; // Prevent action if animating
    const nextIndex = (currentAnimationIndex + 1) % animations.length;
    setCurrentAnimationIndex(nextIndex);
    setAnimationData(animations[nextIndex]);
    setIsAnimating(true); // Animation is playing
  };

  // Handler for Prev button
  const handlePrev = () => {
    if (isAnimating) return; // Prevent action if animating
    if (currentAnimationIndex === 0) {
      // If on the first animation, do not loop back
      setAnimationData(animations[0]);
    } else {
      const prevIndex = currentAnimationIndex - 1;
      setCurrentAnimationIndex(prevIndex);
      setAnimationData(animations[prevIndex]);
    }
    setIsAnimating(true); // Animation is playing
  };

  // Handler for Vote Button Click
  const handleVoteButtonClick = () => {
    // Open the drawer
    setIsDrawerOpen(true);
  };

  // Handler to close the drawer
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
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
              loop={false}
              onComplete={() => {
                setIsAnimating(false); // Animation finished
              }}
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

          {/* Prev and Next Buttons */}
          {showButtons && address && (
            <div className="prev-next-buttons z-20">
              <button
                className={`prev-button`}
                onClick={handlePrev}
                disabled={currentAnimationIndex === 0 || isAnimating}
                aria-label="Previous Animation"
              >
                Prev
              </button>
              <button
                className="next-button ml-4"
                onClick={handleNext}
                disabled={isAnimating}
                aria-label="Next Animation"
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
          <div
            className="flex justify-center"
            style={{ paddingTop: '10px' }}
          >
            <SignupButton />
            {!address && <LoginButton />}
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
              loop={false}
              onComplete={() => {
                setIsAnimating(false); // Animation finished
              }}
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

        {/* Blue Container */}
        <div className="blue-container relative">
          {/* Prev and Next Buttons */}
          {showButtons && address && (
            <div
              className="absolute top-0 right-0 z-20"
              style={{ paddingTop: '5px', paddingRight: '5px' }}
            >
              <button
                className={`prev-button px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition ${
                  currentAnimationIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePrev}
                disabled={currentAnimationIndex === 0 || isAnimating}
                aria-label="Previous Animation"
              >
                Prev
              </button>
              <button
                className="next-button px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition ml-2"
                onClick={handleNext}
                disabled={isAnimating}
                aria-label="Next Animation"
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

      {/* Drawer Component */}
      <div
        className={`fixed inset-0 z-40 flex items-start justify-center transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-[100vh]'
        }`}
      >
        {/* Overlay */}
        {isDrawerOpen && (
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={handleCloseDrawer}
          ></div>
        )}

        {/* Drawer */}
        <div
          className={`fixed inset-0 z-40 flex items-center justify-center transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Overlay */}
          {isDrawerOpen && (
            <div
              className="absolute inset-0 bg-black opacity-50"
              onClick={handleCloseDrawer}
            ></div>
          )}

          {/* Drawer */}
          <div
            className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square md:aspect-square"
            onClick={(e) => e.stopPropagation()} // Prevent click from propagating to overlay
          >
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
              onClick={handleCloseDrawer}
              aria-label="Close Drawer"
            >
              &times;
            </button>

            {/* Drawer Container */}
            <div className="drawer-container w-full h-full relative">
                  {/* Lottie Animation */}
                  <Lottie
                    animationData={DashboardAnimation}
                    loop={true}
                    className="w-full h-full"
                  />

                  {/* Only render the pool balance if it has been populated */}
                  {communityPoolBalance && communityPoolBalance !== '--' && (
                    <div
                      className="absolute"
                      style={{
                        bottom: '53%',
                        left: '32%',
                        fontSize: '40px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {communityPoolBalance} usd
                    </div>
                  )}

                  {/* Only render the balances if top10 has been populated */}
                  {top10.length > 0 && typeof top10[0].balance === 'number' && (
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

                  {top10.length > 1 && typeof top10[1].balance === 'number' && (
                    <div
                      className="absolute"
                      style={{
                        bottom: '5%',
                        left: '50%',
                        fontSize: '30px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {top10[1].balance}
                    </div>
                  )}

                  {top10.length > 2 && typeof top10[2].balance === 'number' && (
                    <div
                      className="absolute"
                      style={{
                        bottom: '5%',
                        left: '70%',
                        fontSize: '30px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {top10[2].balance}
                    </div>
      )}
    </div>
  </div>
</div>
</div>
</div>
);
}
