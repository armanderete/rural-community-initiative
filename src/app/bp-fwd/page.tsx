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

// Import donation flow configuration
import donationFlow from './configs/donationFlow.json';

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

  // New state: current contract address from selected network (default from config)
  const [currentContractAddress, setCurrentContractAddress] = useState<string>(config.contractAddress);

  // New state: approval state for non-ETH tokens ("idle" | "pending" | "approved")
  const [approvalState, setApprovalState] = useState<"idle" | "pending" | "approved">("idle");
  // New state: control display of the yellow button (after a 2-second delay)
  const [showYellowButton, setShowYellowButton] = useState<boolean>(false);

  // Initialize ethers providers and contracts
  const ALCHEMY_API_URL = process.env.NEXT_PUBLIC_ALCHEMY_API_URL;
  const alchemyProvider = useMemo(() => {
    if (ALCHEMY_API_URL) {
      return new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
    }
    return null;
  }, [ALCHEMY_API_URL]);

  // **Contracts**
  const readContract = useMemo(() => {
    if (alchemyProvider) {
      return new ethers.Contract(currentContractAddress, abi, alchemyProvider);
    }
    return null;
  }, [alchemyProvider, currentContractAddress]);

  const writeContract = useMemo(() => {
    if (signer) {
      return new ethers.Contract(currentContractAddress, abi, signer);
    }
    return null;
  }, [signer, currentContractAddress]);

  /**
   * **Dynamic Import of Animations**
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
      () => import('./animations/animation17.json')
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

  // -------------------
  // DONATION FLOW LOGIC
  // -------------------
  const [donationStep, setDonationStep] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");

  // Determine device type based on window width (simple approach)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Style settings from donationFlow.json (global)
  const styleSettings = isMobile
    ? donationFlow.style.mobile
    : donationFlow.style.desktop;

  // Sorted networks from donationFlow config
  const sortedNetworks = useMemo(() => {
    return donationFlow.networkSelection.networks.sort((a: any, b: any) => a.order - b.order);
  }, []);

  // Handler for donation flow steps:
  const handleDonateClick = () => {
    setDonationStep(1);
  };

  const handleNetworkSelect = async (network: any) => {
    setSelectedNetwork(network);
    // Attempt to switch chain using window.ethereum.request
    if (network.chainId && network.chainId !== 0 && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(network.chainId) }],
        });
        alert(`You are now connected to ${network.name} network`);
      } catch (switchError: any) {
        console.error("Switch chain error:", switchError);
        setError(switchError.message);
      }
    }
    // Update current contract address based on network selection
    if (network.contractAddress) {
      setCurrentContractAddress(network.contractAddress);
    }
    setDonationStep(2);
  };

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
    setDonationStep(3);
  };

  const handleAmountDonate = async () => {
    if (!donationAmount || !selectedToken) return;
    if (!writeContract) {
      setError("Wallet not connected or writeContract not initialized.");
      return;
    }
    let amountToSend: BigNumber;
    try {
      if (selectedToken.name === "ETH") {
        amountToSend = ethers.utils.parseEther(donationAmount);
        await writeContract.transferEth(amountToSend, "test", { value: amountToSend });
      } else {
        if (selectedToken.conversionFactor) {
          const converted = Math.floor(parseFloat(donationAmount) * selectedToken.conversionFactor);
          amountToSend = BigNumber.from(converted);
        } else {
          amountToSend = BigNumber.from(donationAmount);
        }
        // For tokens with standard approval flow (eip2612 false)
        if (!selectedToken.eip2612 && signer) {
          // Immediately hide the green button by setting approval state to pending
          setApprovalState("pending");
          // Start a 2-second delay before showing the yellow button
          setShowYellowButton(false);
          setTimeout(() => {
            setShowYellowButton(true);
          }, 2000);
          const tokenContract = new ethers.Contract(
            selectedToken.token_contract,
            ["function approve(address spender, uint256 amount) public returns (bool)"],
            signer
          );
          const approvalTx = await tokenContract.approve(currentContractAddress, amountToSend);
          await approvalTx.wait();
          setApprovalState("approved");
        }
        await writeContract.forwardTokens(selectedToken.token_contract, amountToSend, "test");
      }
      alert("Donation transaction submitted!");
      // Reset flow and approval state
      setDonationStep(0);
      setSelectedNetwork(null);
      setSelectedToken(null);
      setDonationAmount("");
      setApprovalState("idle");
      setShowYellowButton(false);
    } catch (txError: any) {
      console.error("Donation transaction error:", txError);
      alert("The token approval failed");
      setError(txError.message);
      setDonationStep(0);
      setSelectedNetwork(null);
      setSelectedToken(null);
      setDonationAmount("");
      setApprovalState("idle");
      setShowYellowButton(false);
    }
  };

  // Render the donation flow UI.
  // For desktop: appears in the red container.
  // For mobile: appears in the blue container.
  const renderDonationFlow = () => {
    const headerStyle: React.CSSProperties = {
      marginLeft: "10%",
      marginRight: "10%",
      fontSize: "16px",
    };

    if (donationStep === 0) {
      return (
        <div className="donation-flow flex flex-col items-center justify-center bg-black bg-opacity-80" style={{ width: "100%", height: "100%" }}>
          <h2 style={headerStyle} className="text-white mb-4">{donationFlow.donationButton.header}</h2>
          <button
            className="donate-btn bg-green-500 text-white rounded px-4 py-2"
            style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, margin: styleSettings.buttonMargin }}
            onClick={handleDonateClick}
          >
            {donationFlow.donationButton.text}
          </button>
        </div>
      );
    }
    if (donationStep === 1) {
      return (
        <div className="donation-flow flex flex-col items-center justify-center bg-black bg-opacity-80" style={{ width: "100%", height: "100%" }}>
          <h2 style={headerStyle} className="text-white mb-4">{donationFlow.networkSelection.header}</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}>
            {sortedNetworks.map((network: any) => (
              <button
                key={network.name}
                className="network-btn bg-blue-500 text-white rounded"
                style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, margin: styleSettings.buttonMargin }}
                onClick={() => handleNetworkSelect(network)}
              >
                {network.name}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (donationStep === 2 && selectedNetwork) {
      const sortedTokens = selectedNetwork.tokens.sort((a: any, b: any) => a.order - b.order);
      return (
        <div className="donation-flow flex flex-col items-center justify-center bg-black bg-opacity-80" style={{ width: "100%", height: "100%" }}>
          <h2 style={headerStyle} className="text-white mb-4">Please select the Token you want to donate</h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}>
            {sortedTokens.map((token: any) => (
              <button
                key={token.name}
                className="token-btn bg-purple-500 text-white rounded"
                style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, margin: styleSettings.buttonMargin }}
                onClick={() => handleTokenSelect(token)}
              >
                {token.name}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (donationStep === 3 && selectedToken) {
      return (
        <div className="donation-flow flex flex-col items-center justify-center bg-black bg-opacity-80" style={{ width: "100%", height: "100%" }}>
          <h2 style={headerStyle} className="text-white mb-4">{donationFlow.amountInput.header}</h2>
          <input
            type="text"
            placeholder="Enter amount"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            className="p-2 rounded mb-4"
            style={{ width: "50%", color: "black" }}
          />
          {selectedToken.name === "ETH" || approvalState === "idle" ? (
            <button
              className="final-donate-btn bg-green-700 text-white rounded px-4 py-2"
              style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, margin: styleSettings.buttonMargin }}
              onClick={handleAmountDonate}
            >
              {donationFlow.amountInput.donateButtonText}
            </button>
          ) : (approvalState === "pending" && showYellowButton) || approvalState === "approved" ? (
            <button
              className="final-donate-btn bg-yellow-500 text-black rounded px-4 py-2"
              style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, margin: styleSettings.buttonMargin, fontSize: "12px" }}
              disabled
            >
              <svg
                className="animate-spin inline mr-2 h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Token approved. Wait for the final transaction
            </button>
          ) : null}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Desktop View */}
      <div className="hidden md:flex flex-row">
        {/* Brown Container (left side) */}
        <div className="brown-container"></div>
        {/* Yellow Container (center) */}
        <div className="yellow-container relative">
          <div
            className={`w-full h-full transition-opacity duration-500 ${address ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {currentAnimation && (
              <Lottie
                animationData={currentAnimation}
                loop={config.animationLoopSettings[currentAnimationIndex]}
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
          {!address && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-xl font-semibold">Please connect your wallet</p>
            </div>
          )}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Loading...
            </div>
          )}
        </div>
        {/* Red Container (right side) */}
        <div className="red-container">
          <div className="flex justify-center">
            <SignupButton />
            {!address && <LoginButton />}
          </div>
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
          {/* Donation Flow appears in the red container on desktop */}
          {address && renderDonationFlow()}
        </div>
      </div>
      {/* Mobile View */}
      <div className="block md:hidden">
        {/* Green Container */}
        <div className="green-container relative">
          <div className="absolute top-0 right-0 flex items-center" style={{ paddingTop: '5px', paddingRight: '5px' }}>
            <SignupButton />
            {!address && <LoginButton />}
          </div>
        </div>
        {/* Yellow Container */}
        <div className="yellow-container relative">
          <div
            className={`w-full h-full transition-opacity duration-500 ${address ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {currentAnimation && (
              <Lottie
                animationData={currentAnimation}
                loop={config.animationLoopSettings[currentAnimationIndex]}
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
          {!address && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-xl font-semibold">Please connect your wallet</p>
            </div>
          )}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Loading...
            </div>
          )}
        </div>
        {/* Blue Container */}
        <div className="blue-container relative">
          {showButtons && address && (
            <div className="absolute top-0 right-0 z-20 flex space-x-2" style={{ paddingTop: '5px', paddingRight: '5px' }}>
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
          {/* Donation Flow appears in the blue container on mobile */}
          {address && renderDonationFlow()}
        </div>
      </div>
    </div>
  );
}
