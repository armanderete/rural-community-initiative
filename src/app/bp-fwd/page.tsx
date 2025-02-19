// pages/Page.tsx

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
import LoginButton from '../../components/LoginButton';
import SignupButton from '../../components/SignupButton';
import abi from './abi.json'; // Import ABI from the JSON file
import { getBasename } from '../../basenames';
import { getEnsName } from '../../ensnames';
import { truncateWalletAddress } from '../../utils';





// Import the configuration
import config from './page-config.json';

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


// Define the type for the config to ensure type safety
interface PageConfig {
  animations: number;
  animationLoopSettings: boolean[];
  contractAddress: string;
  chainId: number;
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


  // State to handle errors
  const [error, setError] = useState<string | null>(null);

  // State to handle loading
  const [loading, setLoading] = useState<boolean>(false);


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
      () => import('./animations/animation13.json'),
      () => import('./animations/animation14.json'),
      () => import('./animations/animation15.json'),
      () => import('./animations/animation16.json'),
      () => import('./animations/animation17.json'),



    ],
    []
  );

  /**
   * **Effect Hook to Start Loading Animations Sequentially**
   */
  useEffect(() => {
    if (address && !animationPlayed) {
      setAnimationPlayed(true);
      setShowButtons(true);
      setLoading(true);
      setLoadingIndex(0);
    }
  }, [address, animationPlayed]);

  // State to track which animation is being loaded
  const [loadingIndex, setLoadingIndex] = useState<number>(0);

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
    // Use config.animations to determine the last animation index
    if (currentAnimationIndex < config.animations - 1) {
      const nextIndex = currentAnimationIndex + 1;
      setCurrentAnimationIndex(nextIndex);
      setCurrentAnimation(loadedAnimations[nextIndex]);
    }
  };

  /**
   * Handler for the Prev button to navigate to the previous animation.
   */
  const handlePrev = () => {
    if (currentAnimationIndex > 1) {
      const prevIndex = currentAnimationIndex - 2;
      setCurrentAnimationIndex(prevIndex);
      setCurrentAnimation(loadedAnimations[prevIndex]);
    } else if (currentAnimationIndex === 1) {
      // Prevent negative index
      const prevIndex = 0;
      setCurrentAnimationIndex(prevIndex);
      setCurrentAnimation(loadedAnimations[prevIndex]);
    }
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
        </div>

        {/* Red Container (right side) */}
        <div className="red-container">
          {/* Login Buttons */}
          <div className="flex justify-center">
            <SignupButton />
            {!address && <LoginButton />}
          </div>

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
                    currentAnimationIndex === config.animations - 1 ? 'hidden' : 'visible',
                }}
              >
                Next
              </button>
            </div>
          )}
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
                  visibility:
                    currentAnimationIndex === config.animations - 1 ? 'hidden' : 'visible',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
