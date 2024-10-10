'use client';
import Footer from 'src/components/Footer';
import TransactionWrapper from 'src/components/TransactionWrapper';
import WalletWrapper from 'src/components/WalletWrapper';
import { ONCHAINKIT_LINK } from 'src/links';
import OnchainkitSvg from 'src/svg/OnchainkitSvg';
import { useAccount } from 'wagmi';
import LoginButton from '../components/LoginButton';
import SignupButton from '../components/SignupButton';

export default function Page() {
  const { address } = useAccount();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center">
        {/* White Container */}
        <div className="bg-white w-full h-[100vw] max-w-[100vh] max-h-full md:w-[100vh] md:h-[100vh] relative mt-[10px] md:mt-0">
          
          {/* Login Section Positioned at Top Right */}
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <SignupButton />
            {!address && <LoginButton />}
          </div>
          
        </div>
      </div>
    </div>
  );
}