'use client';
import Footer from 'src/components/Footer';
import TransactionWrapper from 'src/components/TransactionWrapper';
import WalletWrapper from 'src/components/WalletWrapper';
import { ONCHAINKIT_LINK } from 'src/links';
import OnchainkitSvg from 'src/svg/OnchainkitSvg';
import { useAccount } from 'wagmi';
import LoginButton from '../components/LoginButton';
import SignupButton from '../components/SignupButton';
import './global.css'; // Ensure this path is correct

export default function Page() {
  const { address } = useAccount();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center">
        {/* White Container */}
        <div className="white-container">
          
          {/* Login Section Positioned at Top Right */}
          <div className="login-section">
            <SignupButton />
            {!address && <LoginButton />}
          </div>
          
        </div>
      </div>
    </div>
  );
}