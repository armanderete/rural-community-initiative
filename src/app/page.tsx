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
// Import other animations if needed

export default function Page() {
  const { address } = useAccount();
  const [animationData, setAnimationData] = useState(Animation1);
  const [animationPlayed, setAnimationPlayed] = useState(false);

  useEffect(() => {
    if (address && !animationPlayed) {
      // User has logged in and animation hasn't played yet
      setAnimationData(Animation1);
      setAnimationPlayed(true);
    }
  }, [address, animationPlayed]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center">
        {/* White Container */}
        <div className="white-container">
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
                zIndex: 10, // Ensure it overlays other content
              }}
            />
          )}

          {/* Centered Content Inside the Container */}
          <div className="flex items-center justify-center h-full">
            {address ? (
              <TransactionWrapper address={address} />
            ) : (
              <WalletWrapper
                className="w-[450px] max-w-full"
                text="Sign in to transact"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
