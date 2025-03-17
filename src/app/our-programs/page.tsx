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
import ReactMarkdown from 'react-markdown'; // NEW: Import react-markdown

// Import the configuration
import config from './page-config.json';

// Import donation flow configuration
import donationFlow from './configs/donationFlow.json';

// Import program buttons JSON from ./configs/programButtons.json
import programButtonsData from './configs/programButtons.json';

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

interface ProgramButton {
  name: string;
  number: number;
}

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
  // State to handle errors
  const [error, setError] = useState<string | null>(null);
  // State to handle loading
  const [loading, setLoading] = useState<boolean>(false);
  // State to track the currently selected program button
  const [selectedProgramButton, setSelectedProgramButton] = useState<number>(1);

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

  // State for dynamically loaded markdown buttons (each with text and URL)
  const [markdownButtons, setMarkdownButtons] = useState<{ text: string; url: string }[]>([]);

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
      () => import('./animations/animation9.json')
    ],
    []
  );

  /**
   * **Effect Hook to Start Loading Animations Sequentially**
   */
  useEffect(() => {
    if (address && !animationPlayed) {
      setAnimationPlayed(true);
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

  // Effect to set initial animation when animations are loaded
  useEffect(() => {
    if (loadedAnimations.length > 0 && currentAnimationIndex === 0) {
      setCurrentAnimation(loadedAnimations[0]);
    }
  }, [loadedAnimations]);

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

  // Remove Prev/Next buttons from navigation.
  // Instead, program buttons (from JSON) will update the current animation index instantly.
  const handleProgramButtonClick = (btnNumber: number) => {
    // Assuming the program button number corresponds directly to animation index (1-indexed)
    const newIndex = btnNumber - 1;
    if (newIndex < loadedAnimations.length) {
      setCurrentAnimationIndex(newIndex);
      setCurrentAnimation(loadedAnimations[newIndex]);
      setSelectedProgramButton(btnNumber);
    }
  };

  // -------------------
  // NEW: Dynamic Markdown Text for Animations
  // -------------------
  const animationTextUrls = [
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation1/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation1/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation1/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation2/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation2/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation2/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation3/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation3/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation3/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation4/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation4/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation4/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation5/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation5/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation5/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation6/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation6/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation6/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation7/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation7/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation7/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation8/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation8/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation8/text3.md"
    ],
    [
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation9/text1.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation9/text2.md",
      "https://raw.githubusercontent.com/armanderete/rural-community-initiative/main/src/app/our-programs/dynamicText/Animation9/text3.md"
    ]
  ];

  useEffect(() => {
    const loadMarkdownButtons = async () => {
      if (!animationTextUrls[currentAnimationIndex]) return;
      const currentUrls = animationTextUrls[currentAnimationIndex];
      const markdownPromises = currentUrls.map(async (url) => {
        const timestamp = Date.now(); // Cache-busting
        const response = await fetch(`${url}?t=${timestamp}`);
        const text = await response.text();
        return text.trim() ? { text, url } : null;
      });

      const results = (await Promise.all(markdownPromises)).filter(Boolean);
      setMarkdownButtons(results.filter((item): item is { text: string; url: string } => item !== null));
    };
    loadMarkdownButtons();
  }, [currentAnimationIndex]);

  // -------------------
  // DONATION FLOW LOGIC
  // -------------------
  const [donationStep, setDonationStep] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use style settings from donationFlow.json (global)
  const styleSettings = isMobile
    ? donationFlow.style.mobile
    : donationFlow.style.desktop;

  // Sorted networks from donationFlow config
  const sortedNetworks = useMemo(() => {
    return donationFlow.networkSelection.networks.sort((a: any, b: any) => a.order - b.order);
  }, []);

  // Handler for donation flow steps:
  const handleDonateClick = () => {
    if (!address) {
      alert("Please connect your wallet to donate");
      return;
    }
    setDonationStep(1);
  };

  const handleNetworkSelect = async (network: any) => {
    setSelectedNetwork(network);
    if (network.chainId && network.chainId !== 0 && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(network.chainId) }],
        });
      } catch (switchError: any) {
        console.error("Switch chain error:", switchError);
        alert("The network was NOT successfully changed. Please do it manually in your wallet.");
        setError(switchError.message);
      }
    }
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
    if (!address) {
      setError("Please connect your wallet to make a donation");
      return;
    }
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
        if (
          selectedToken.name === "ARB" ||
          selectedToken.name === "OP" ||
          selectedToken.name === "POL" ||
          selectedToken.name === "wETH" ||
          selectedToken.name === "USDGLO" ||
          selectedToken.name === "CELO"
        ) {
          amountToSend = ethers.utils.parseUnits(donationAmount, 18);
        } else if (selectedToken.conversionFactor) {
          const converted = Math.floor(parseFloat(donationAmount) * selectedToken.conversionFactor);
          amountToSend = BigNumber.from(converted);
        } else {
          amountToSend = BigNumber.from(donationAmount);
        }
        if (!selectedToken.eip2612 && signer) {
          setApprovalState("pending");
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
    const headerStyle: CSSProperties = {
      marginLeft: "10%",
      marginRight: "10%",
      fontSize: "16px",
      textAlign: "center",
    };

    if (donationStep === 0) {
      return (
        <div className="donation-flow flex flex-col items-center justify-center bg-black bg-opacity-80" style={{ width: "100%", height: "100%" }}>
          <h2 style={headerStyle} className="text-white mb-4">{donationFlow.donationButton.header}</h2>
          <button
            className="donate-btn bg-green-500 text-white rounded px-4 py-2"
            style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, marginLeft: "0 auto" }}
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
          <div
            className="grid"
            style={{
              gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
              gap: styleSettings.buttonMargin,
            }}
          >
            {sortedNetworks.map((network: any) => (
              network.order !== 0 && (
                <button
                  key={network.name}
                  className="network-btn bg-blue-500 text-white rounded"
                  style={{ width: "100%", height: "100%" }}
                  onClick={() => handleNetworkSelect(network)}
                >
                  {network.name}
                </button>
              )
            ))}
          </div>
        </div>
      );
    }
    if (donationStep === 2 && selectedNetwork) {
      const sortedTokens = selectedNetwork.tokens.sort((a: any, b: any) => a.order - b.order);
      return (
        <div className="donation-flow flex flex-col items-center justify-center bg-black bg-opacity-80" style={{ width: "100%", height: "100%" }}>
          <h2 style={headerStyle} className="text-white mb-4">Please select the Token you want to donate:</h2>
          <div
            className="grid"
            style={{
              gridTemplateColumns: isMobile ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
              gap: styleSettings.buttonMargin,
            }}
          >
            {sortedTokens.map((token: any) => (
              token.order !== 0 && (
                <button
                  key={token.name}
                  className="token-btn bg-purple-500 text-white rounded"
                  style={{ width: "100%", height: "100%" }}
                  onClick={() => handleTokenSelect(token)}
                >
                  {token.name}
                </button>
              )
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
              style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, marginLeft: "0 auto" }}
              onClick={handleAmountDonate}
            >
              {donationFlow.amountInput.donateButtonText}
            </button>
          ) : (approvalState === "pending" && showYellowButton) || approvalState === "approved" ? (
            <button
              className="final-donate-btn bg-yellow-500 text-black rounded px-4 py-2"
              style={{ width: styleSettings.buttonWidth, height: styleSettings.buttonHeight, marginLeft: styleSettings.buttonMargin, fontSize: "12px" }}
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

  // -------------------
  // PROGRAM BUTTONS LOGIC
  // -------------------
  const programButtons = programButtonsData.programButtons.filter(
    (btn) => btn.name && btn.name.trim() !== ""
  );
  const maxButtons = 9;
  const buttonsToRender = programButtons.slice(0, maxButtons);
  const numRows = Math.ceil(buttonsToRender.length / 3);
  const programRows: ProgramButton[][] = [];
  for (let i = 0; i < numRows; i++) {
    programRows.push(buttonsToRender.slice(i * 3, i * 3 + 3));
  }
  const renderProgramButtons = () => {
    if (buttonsToRender.length === 0) return null;
    return (
      <div
        className="program-buttons-container absolute bottom-0 w-full"
        style={{
          height: "40%",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          paddingBottom: "1%",
        }}
      >
        {programRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center items-center"
            style={{ height: "25%", marginTop: rowIndex === 0 ? 0 : "1%" }}
          >
            {row.map((btn, btnIndex) => {
              let marginRight: string = "0";
              if (row.length === 2 && btnIndex === 0) {
                marginRight = "5%";
              } else if (row.length === 3 && btnIndex < row.length - 1) {
                marginRight = "3%";
              }
              return (
                <button
                  key={btn.number}
                  className="program-button md:text-base text-[10px] md:font-bold font-normal"
                  onClick={() => handleProgramButtonClick(btn.number)}
                  style={{
                    width: "30%",
                    height: "100%",
                    marginRight: marginRight,
                    padding: "4px 8px",
                    backgroundColor:
                      selectedProgramButton === btn.number ? "#FFD700" : "#5b2c6f",
                    color: selectedProgramButton === btn.number ? "black" : "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1px",
                      textAlign: "center",
                    }}
                  >
                    {(() => {
                      const words = btn.name.split(" ");
                      const midpoint = Math.ceil(words.length / 2);
                      const firstLine = words.slice(0, midpoint).join(" ");
                      const secondLine = words.slice(midpoint).join(" ");
                      return (
                        <>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {firstLine}
                          </div>
                          <div
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {secondLine || "\u00A0"}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderMarkdownButtons = () => {
    if (markdownButtons.length === 0) return null;
    return (
      <div
        className="absolute markdown-container"
        style={{
          top: "2%",
          width: "100%",
          height: "30%",
          display: "flex",
          justifyContent: "space-evenly",
          zIndex: 20,
        }}
      >
        {markdownButtons.map((btn, idx) => (
          <div
            key={idx}
            style={{
              width: "30%",
              height: "100%",
              backgroundColor: "#e0c9fa",
              color: "black",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "8px",
              fontSize: isMobile ? "10px" : "1rem", // Adjust mobile font size
              textAlign: "center",
              padding: isMobile ? "8px" : "0.5rem", // Adjust mobile padding
              boxSizing: "border-box",
            }}
          >
            <ReactMarkdown>{btn.text}</ReactMarkdown>
          </div>
        ))}
      </div>
    );
  };
  

  // -------------------
  // RENDER
  // -------------------
  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Desktop View */}
      <div className="hidden md:flex flex-row">
        {/* Brown Container (left side) */}
        <div className="brown-container"></div>
        {/* Yellow Container (center) */}
        <div className="yellow-container relative">
          {/* Render Markdown Buttons at the top */}
          {renderMarkdownButtons()}
          <div className="w-full h-full">
            {currentAnimation && (
              <Lottie
                animationData={currentAnimation}
                loop={config.animationLoopSettings[currentAnimationIndex]}
                onComplete={() => {}}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 10,
                }}
              />
            )}
          </div>
          {/* Render Program Buttons at the bottom */}
          {renderProgramButtons()}
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
          <div className="flex justify-center">
            <SignupButton />
            {!address && <LoginButton />}
          </div>
          {renderDonationFlow()}
        </div>
      </div>
      {/* Mobile View */}
      <div className="block md:hidden">
        {/* Green Container */}
        <div className="green-container relative">
          <div
            className="absolute top-0 right-0 flex items-center"
            style={{ paddingTop: "5px", paddingRight: "5px" }}
          >
            <SignupButton />
            {!address && <LoginButton />}
          </div>
        </div>
        {/* Yellow Container */}
        <div className="yellow-container relative">
          {/* Render Markdown Buttons at the top */}
          {renderMarkdownButtons()}
          <div className="w-full h-full">
            {currentAnimation && (
              <Lottie
                animationData={currentAnimation}
                loop={config.animationLoopSettings[currentAnimationIndex]}
                onComplete={() => {}}
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 10,
                }}
              />
            )}
          </div>
          {/* Render Program Buttons at the bottom */}
          {renderProgramButtons()}
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
          {renderDonationFlow()}
        </div>
      </div>
      <style jsx>{`
        .program-button:hover::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
