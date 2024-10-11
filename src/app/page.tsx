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

export default function Page() {
  const { address } = useAccount();
  const [animationData, setAnimationData] = useState(Animation1);
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const [showButtons, setShowButtons] = useState(false); // State to manage button visibility

  useEffect(() => {
    if (address && !animationPlayed) {
      // User has logged in and animation hasn't played yet
      setAnimationData(Animation1);
      setAnimationPlayed(true);
      setShowButtons(true); // Show buttons after login
    }
  }, [address, animationPlayed]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center">
        {/* White Container */}
        <div className="white-container relative">
          {/* Login Section Positioned at Top Right */}
          <div className="login-section" style={{ zIndex: 20 }}>
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
                zIndex: 10,
              }}
            />
          )}

          {/* Centered Content Inside the Container */}
          <div className="flex items-center justify-center h-full" style={{ zIndex: 5 }}>
            {address ? (
              <TransactionWrapper address={address} />
            ) : (
              <WalletWrapper
                className="w-[450px] max-w-full"
                text="Sign in to transact"
              />
            )}
          </div>

          {/* Conditionally Render the Prev/Next Buttons */}
          {showButtons && (
            <div className="absolute bottom-4 right-4 flex gap-4" style={{ zIndex: 20 }}>
              <button className="prev-button">Prev</button>
              <button className="next-button">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
