'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Lottie from 'lottie-react';
import Image from 'next/image';
import LoginButton from '../components/LoginButton';
import SignupButton from '../components/SignupButton';
import WalletWrapper from 'src/components/WalletWrapper';
import TransactionWrapper from 'src/components/TransactionWrapper';
import './global.css';

// Import your animations
import Animation1 from './animations/animation1.json';
import Animation2 from './animations/animation2.json';
import Animation3 from './animations/animation3.json';
import Animation4 from './animations/animation4.json';
import Animation5 from './animations/animation5.json';

import AbcAnimation from './animations/abcvote.json';

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
  const [voteButtonVisible, setVoteButtonVisible] = useState<boolean>(true); // Initialize as needed
  
  // Optional: State to prevent button clicks during animation
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  useEffect(() => {
    if (address && !animationPlayed) {
      // User has logged in and animation hasn't played yet
      setAnimationData(animations[currentAnimationIndex]);
      setAnimationPlayed(true);
      setShowButtons(true); // Show Prev and Next buttons after login
      setIsAnimating(true); // Animation is playing
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
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center">
        {/* White Container */}
        <div className="white-container relative">
          {/* Login Section Positioned at Top Right */}
          <div className="login-section z-20">
            <SignupButton />
            {!address && <LoginButton />}
          </div>

          {/* Lottie Animation */}
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
                zIndex: 10, // Ensure animation is below the login section and buttons
              }}
            />
          )}

          {/* Prev and Next Buttons */}
          {showButtons && address && (
            <div className="absolute bottom-4 right-4 flex gap-4 z-20">
              <button
                className={`prev-button px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition ${
                  currentAnimationIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePrev}
                disabled={currentAnimationIndex === 0 || isAnimating}
                aria-label="Previous Animation"
              >
                Prev
              </button>
              <button
                className="next-button px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                onClick={handleNext}
                disabled={isAnimating}
                aria-label="Next Animation"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vote Button Floating on Top of Whole Web App */}
      {address && voteButtonVisible && (
        <button
          onClick={handleVoteButtonClick}
          className="fixed bottom-10 md:bottom-3 left-1/2 transform -translate-x-1/2 z-50 p-0"
          aria-label="Vote Button"
        >
          <Image
            src="/buttons/votebutton.png"
            alt="Vote Button"
            width={0} // Set to 0 to let Tailwind control the width
            height={0} // Set to 20 (in pixels) instead of "20%"
            sizes="20vh" // Specify the size
            className="h-[20vh] w-auto object-contain" // Also here specify the size
          />
        </button>
      )}

      {/* Drawer Component */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={handleCloseDrawer}
          ></div>

          {/* Drawer */}
          <div
            className="relative bg-black z-50 rounded-b-lg overflow-hidden mt-2.5 w-[90%] md:w-1/2 h-[70%]"
            onClick={(e) => e.stopPropagation()} // Prevent click from propagating to overlay
          >
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-white"
              onClick={handleCloseDrawer}
            >
              Close
            </button>

            {/* Lottie Animation inside the Drawer */}
            <div className="h-full w-full">
              <Lottie
                animationData={AbcAnimation}
                loop={true}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}