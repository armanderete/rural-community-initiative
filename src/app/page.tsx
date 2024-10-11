'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Lottie from 'lottie-react';
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

export default function Page() {
  const { address } = useAccount();
  
  // Array of animations
  const animations = [Animation1, Animation2, Animation3, Animation4, Animation5];
  
  // State to manage current animation index
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState<number>(0);
  
  // State to trigger animation playback
  const [animationData, setAnimationData] = useState<any>(null);
  
  // State to track if animation has played
  const [animationPlayed, setAnimationPlayed] = useState<boolean>(false);
  
  // State to manage visibility of Prev and Next buttons
  const [showButtons, setShowButtons] = useState<boolean>(false);

  useEffect(() => {
    if (address && !animationPlayed) {
      // User has logged in and animation hasn't played yet
      setAnimationData(animations[currentAnimationIndex]);
      setAnimationPlayed(true);
      setShowButtons(true); // Show Prev and Next buttons after login
    }
  }, [address, animationPlayed, currentAnimationIndex, animations]);

  // Handler for Next button
  const handleNext = () => {
    const nextIndex = (currentAnimationIndex + 1) % animations.length;
    setCurrentAnimationIndex(nextIndex);
    setAnimationData(animations[nextIndex]);
  };

  // Handler for Prev button
  const handlePrev = () => {
    if (currentAnimationIndex === 0) {
      // If on the first animation, do not loop back
      setAnimationData(animations[0]);
    } else {
      const prevIndex = currentAnimationIndex - 1;
      setCurrentAnimationIndex(prevIndex);
      setAnimationData(animations[prevIndex]);
    }
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

          {/* Centered Content Inside the Container */}
          <div className="flex items-center justify-center h-full z-5">
            {address ? (
              <TransactionWrapper address={address} />
            ) : (
              <WalletWrapper
                className="w-[450px] max-w-full"
                text="Sign in to transact"
              />
            )}
          </div>

          {/* Prev and Next Buttons */}
          {showButtons && address && (
            <div className="absolute bottom-4 right-4 flex gap-4 z-20">
              <button
                className="prev-button px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                onClick={handlePrev}
              >
                Prev
              </button>
              <button
                className="next-button px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
                onClick={handleNext}
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
