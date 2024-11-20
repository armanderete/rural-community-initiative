// src/components/drawers/VoteDrawer.tsx

import React from 'react';
import Lottie from 'lottie-react';
import VoteAnimation from '../../animations/abcvote.json';
import VoteAnimation1_5_10 from '../../animations/vote-1-5-10.json';

// **Import Voting Configurations**
import VotingConfigAnimation1 from '../../configs/VotingConfigAnimation1.json';
import VotingConfigAnimation2 from '../../configs/VotingConfigAnimation2.json';
import VotingConfigAnimation3 from '../../configs/VotingConfigAnimation3.json';
import VotingConfigAnimation4 from '../../configs/VotingConfigAnimation4.json';
import VotingConfigAnimation5 from '../../configs/VotingConfigAnimation5.json';
import VotingConfigAnimation6 from '../../configs/VotingConfigAnimation6.json';
import VotingConfigAnimation7 from '../../configs/VotingConfigAnimation7.json';
import VotingConfigAnimation8 from '../../configs/VotingConfigAnimation8.json';
import VotingConfigAnimation9 from '../../configs/VotingConfigAnimation9.json';
import VotingConfigAnimation10 from '../../configs/VotingConfigAnimation10.json';
import VotingConfigAnimation11 from '../../configs/VotingConfigAnimation11.json';

// **Import the TransactWithPaymaster Component**
import { TransactWithPaymaster } from '../../../../components/TransactWithPaymaster';

// **Define the VotingConfig interface**
interface VotingOption {
  Active: boolean;
  positionXaxis: string; // e.g., "50%"
  positionYaxis: string; // e.g., "80%"
  Function: string;
  To: string;
  Amount: number;
  Tag: string;
  Concept: string;
}

interface VotingConfig {
  votingButtonVisible: boolean;
  votingType: 'abc' | '1-5-10';
  VoteOption1: VotingOption;
  VoteOption2: VotingOption;
  VoteOption3: VotingOption;
  VoteOption4: VotingOption;
  VoteOption5: VotingOption;
}

// **Props Interface for VoteDrawer**
interface VoteDrawerProps {
  drawerState: 'vote-open' | 'closed';
  handleCloseVoteDrawer: () => void;
  currentAnimationIndex: number;
}

// **Import ABI and configuration**
import abi from '../../abi.json'; // Adjust the path as necessary
import config from '../../page-config.json'; // Adjust the path as necessary

const VoteDrawer: React.FC<VoteDrawerProps> = ({
  drawerState,
  handleCloseVoteDrawer,
  currentAnimationIndex,
}) => {
  // **Array of Voting Configurations**
  const votingConfigs: VotingConfig[] = [
    VotingConfigAnimation1 as VotingConfig,
    VotingConfigAnimation2 as VotingConfig,
    VotingConfigAnimation3 as VotingConfig,
    VotingConfigAnimation4 as VotingConfig,
    VotingConfigAnimation5 as VotingConfig,
    VotingConfigAnimation6 as VotingConfig,
    VotingConfigAnimation7 as VotingConfig,
    VotingConfigAnimation8 as VotingConfig,
    VotingConfigAnimation9 as VotingConfig,
    VotingConfigAnimation10 as VotingConfig,
    VotingConfigAnimation11 as VotingConfig,
  ];

  // **Determine the current voting configuration**
  const currentVotingConfig =
    currentAnimationIndex < votingConfigs.length
      ? votingConfigs[currentAnimationIndex]
      : {
          votingButtonVisible: false,
          votingType: 'abc',
          VoteOption1: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption2: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption3: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption4: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
          VoteOption5: { Active: false, positionXaxis: '', positionYaxis: '', Function: '', To: '', Amount: 0, Tag: '', Concept: '' },
        };

  // **Determine the current Vote Animation based on votingType**
  const currentVoteAnimation =
    currentVotingConfig.votingType === '1-5-10' ? VoteAnimation1_5_10 : VoteAnimation;

  // **Render Vote Buttons**
  const renderVoteButtons = () => {
    const voteOptions = [
      currentVotingConfig.VoteOption1,
      currentVotingConfig.VoteOption2,
      currentVotingConfig.VoteOption3,
      currentVotingConfig.VoteOption4,
      currentVotingConfig.VoteOption5,
    ];

    return voteOptions.map((option, index) => {
      if (!option.Active) return null;

      return (
        <TransactWithPaymaster
          key={index + 1}
          functionName={option.Function}
          args={[option.To, option.Amount, option.Tag, option.Concept]}
          poolAddress={config.contractAddress}
          poolAbi={abi}
          chainId={Number(config.chainId)} // Ensure 'chainId' is a number
          style={{
            left: option.positionXaxis,
            bottom: option.positionYaxis,
            width: '38%',
            height: '25%',
            transform: 'translate(-50%, 50%)', // Ensures alignment relative to the container
            position: 'absolute',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent for visibility
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          label={`Vote ${index + 1}`}
        />
      );
    });
  };

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-transform duration-300 ease-in-out transform ${
        drawerState === 'vote-open' ? 'translate-y-0' : 'translate-y-[100vh]'
      }`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          drawerState === 'vote-open' ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={drawerState === 'vote-open' ? handleCloseVoteDrawer : undefined}
      ></div>

      {/* Drawer Content */}
      <div
        className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing drawer
      >
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
          onClick={handleCloseVoteDrawer}
          aria-label="Close Vote Drawer"
        >
          &times;
        </button>

        {/* Drawer Container */}
        <div className="drawer-container w-full h-full relative flex items-center justify-center">
          {/* Vote Lottie Animation */}
          <Lottie
            animationData={currentVoteAnimation}
            loop={true}
            className="w-full h-full"
          />

          {/* Render Buttons */}
          {currentVotingConfig.votingButtonVisible && renderVoteButtons()}
        </div>
      </div>
    </div>
  );
};

export default VoteDrawer;
