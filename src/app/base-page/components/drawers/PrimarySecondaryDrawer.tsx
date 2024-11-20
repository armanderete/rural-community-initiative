// components/drawers/PrimarySecondaryDrawer.tsx

import React from 'react';
import Lottie from 'lottie-react';
import DashboardAnimation from '../../animations/dashboard.json';
import LeaderboardAnimation from '../../animations/leaderboard.json';

// Define the props interface
interface PrimarySecondaryDrawerProps {
  drawerState: 'closed' | 'primary-open' | 'secondary-open';
  handleClosePrimaryDrawer: () => void;
  handleCloseSecondaryDrawer: () => void;
  handleOpenSecondaryDrawer: () => void;
  loading: boolean;
  communityPoolBalance: string;
  userBalance: number | null;
  top10: { address: string; balance: number }[];
  top10UserInfos: { place: string; userInfo: string; balanceInfo: string }[];
  calculateCompletionPercentage: () => string;
}

const PrimarySecondaryDrawer: React.FC<PrimarySecondaryDrawerProps> = ({
  drawerState,
  handleClosePrimaryDrawer,
  handleCloseSecondaryDrawer,
  handleOpenSecondaryDrawer,
  loading,
  communityPoolBalance,
  userBalance,
  top10,
  top10UserInfos,
  calculateCompletionPercentage,
}) => {
  return (
    <>
      {/* Primary Drawer */}
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center transition-transform duration-300 ease-in-out transform ${
          drawerState === 'primary-open' ? 'translate-y-0' : 'translate-y-[100vh]'
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black opacity-50 transition-opacity duration-300 ease-in-out ${
            drawerState === 'primary-open' ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={drawerState === 'primary-open' ? handleClosePrimaryDrawer : undefined}
        ></div>

        {/* Drawer Content */}
        <div
          className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square md:aspect-square"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing drawer
        >
          {/* Close Button */}
          <button
            className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
            onClick={handleClosePrimaryDrawer}
            aria-label="Close Primary Drawer"
          >
            &times;
          </button>

          {/* Drawer Container */}
          <div className="drawer-container w-full h-full relative flex items-center justify-center">
            {/* Lottie Animation */}
            <Lottie
              animationData={DashboardAnimation}
              loop={true} // This animation loops indefinitely
              className="w-full h-full"
            />

            {/* Loading Progress Message */}
            {loading && (
              <div className="absolute bg-yellow-300 text-black px-6 py-4 rounded flex flex-col items-center">
                <p className="text-lg font-semibold">
                  Fetching "community pool" data from the blockchain
                </p>
                <p className="mt-2 text-md">{calculateCompletionPercentage()} completed</p>
              </div>
            )}

            {/* Only render the pool balance if it has been populated and not loading */}
            {communityPoolBalance && communityPoolBalance !== '--' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '53%',
                  left: '34%',
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                {communityPoolBalance} USD
              </div>
            )}

            {/* Render the user's balance if not loading */}
            {userBalance !== null && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '7%',
                  left: '3%',
                  fontSize: '30px',
                  fontWeight: 'bold',
                  color: 'DarkViolet',
                  backgroundColor: 'transparent',
                }}
              >
                ${userBalance}
              </div>
            )}

            {/* Only render the balances if top10 has been populated and not loading */}
            {top10.length > 0 && typeof top10[0].balance === 'number' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '5%',
                  left: '32%',
                  fontSize: '25px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                ${top10[0].balance}
              </div>
            )}

            {top10.length > 1 && typeof top10[1].balance === 'number' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '5%',
                  left: '48%',
                  fontSize: '25px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                ${top10[1].balance}
              </div>
            )}

            {top10.length > 2 && typeof top10[2].balance === 'number' && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '5%',
                  left: '65%',
                  fontSize: '25px',
                  fontWeight: 'bold',
                  color: 'black',
                  backgroundColor: 'transparent',
                }}
              >
                ${top10[2].balance}
              </div>
            )}

            {/* Button to Open Secondary Drawer */}
            <button
              onClick={handleOpenSecondaryDrawer}
              className="absolute"
              style={{
                bottom: '4%',
                left: '82%',
                width: '13%',
                height: '13%',
                backgroundColor: 'transparent', // Transparent background as per your requirement
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
              }}
              aria-label="Open Secondary Drawer"
            ></button>
          </div>
        </div>
      </div>

      {/* Secondary Drawer */}
      <div
        className={`fixed inset-0 z-50 flex items-start justify-center transition-transform duration-300 ease-in-out transform ${
          drawerState === 'secondary-open' ? 'translate-y-0' : 'translate-y-[100vh]'
        }`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black opacity-50 transition-opacity duration-300 ease-in-out ${
            drawerState === 'secondary-open' ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={drawerState === 'secondary-open' ? handleCloseSecondaryDrawer : undefined}
        ></div>

        {/* Drawer Content */}
        <div
          className="relative bg-black rounded-t-lg overflow-hidden transform transition-transform duration-300 ease-in-out w-11/12 md:w-auto md:h-4/5 aspect-square md:aspect-square"
          onClick={(e) => e.stopPropagation()} // Prevent click from closing drawer
        >
          {/* Close Button */}
          <button
            className="absolute top-2 right-2 text-white text-xl focus:outline-none focus:ring-2 focus:ring-white rounded"
            onClick={handleCloseSecondaryDrawer}
            aria-label="Close Secondary Drawer"
          >
            &times;
          </button>

          {/* Drawer Container */}
          <div className="drawer-container w-full h-full relative">
            {/* Leaderboard Lottie Animation */}
            <Lottie
              animationData={LeaderboardAnimation}
              loop={true} // This animation loops indefinitely
              className="w-full h-full"
            />

            {/* Render the user's balance if not loading */}
            {userBalance !== null && !loading && (
              <div
                className="absolute"
                style={{
                  bottom: '4%',
                  left: '59%',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: 'MediumPurple',
                  backgroundColor: 'transparent',
                }}
              >
                ${userBalance}
              </div>
            )}

            {/* Display the top 8 users */}
            {/* Display the 1st place user */}
            {top10UserInfos.length > 0 && !loading && (
              <div
                className="absolute left-[35%] bottom-[90%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[0].userInfo}`}
              </div>
            )}

            {/* Display the 1st place balance */}
            {top10UserInfos.length > 0 && !loading && (
              <div
                className="absolute left-[5%] bottom-[90%] text-[18px] md:text-[23px] font-bold text-pink-500 bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[0].balanceInfo}`}
              </div>
            )}

            {/* Display the 2nd place user */}
            {top10UserInfos.length > 1 && !loading && (
              <div
                className="absolute left-[42%] bottom-[76%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[1].userInfo}`}
              </div>
            )}

            {/* Display the 2nd place balance */}
            {top10UserInfos.length > 1 && !loading && (
              <div
                className="absolute left-[27%] bottom-[75%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[1].balanceInfo}`}
              </div>
            )}

            {/* Display the 3rd place user */}
            {top10UserInfos.length > 2 && !loading && (
              <div
                className="absolute left-[47%] bottom-[68%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[2].userInfo}`}
              </div>
            )}

            {/* Display the 3rd place balance */}
            {top10UserInfos.length > 2 && !loading && (
              <div
                className="absolute left-[30%] bottom-[67%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[2].balanceInfo}`}
              </div>
            )}

            {/* Display the 4th place user */}
            {top10UserInfos.length > 3 && !loading && (
              <div
                className="absolute left-[50%] bottom-[61%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[3].userInfo}`}
              </div>
            )}

            {/* Display the 4th place balance */}
            {top10UserInfos.length > 3 && !loading && (
              <div
                className="absolute left-[32%] bottom-[59%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[3].balanceInfo}`}
              </div>
            )}

            {/* Display the 5th place user */}
            {top10UserInfos.length > 4 && !loading && (
              <div
                className="absolute left-[54%] bottom-[54%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[4].userInfo}`}
              </div>
            )}

            {/* Display the 5th place balance */}
            {top10UserInfos.length > 4 && !loading && (
              <div
                className="absolute left-[33%] bottom-[51%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[4].balanceInfo}`}
              </div>
            )}

            {/* Display the 6th place user */}
            {top10UserInfos.length > 5 && !loading && (
              <div
                className="absolute left-[57%] bottom-[46%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[5].userInfo}`}
              </div>
            )}

            {/* Display the 6th place balance */}
            {top10UserInfos.length > 5 && !loading && (
              <div
                className="absolute left-[35%] bottom-[43%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[5].balanceInfo}`}
              </div>
            )}

            {/* Display the 7th place user */}
            {top10UserInfos.length > 6 && !loading && (
              <div
                className="absolute left-[62%] bottom-[37%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[6].userInfo}`}
              </div>
            )}

            {/* Display the 7th place balance */}
            {top10UserInfos.length > 6 && !loading && (
              <div
                className="absolute left-[33%] bottom-[34%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[6].balanceInfo}`}
              </div>
            )}

            {/* Display the 8th place user */}
            {top10UserInfos.length > 7 && !loading && (
              <div
                className="absolute left-[66%] bottom-[27%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[7].userInfo}`}
              </div>
            )}

            {/* Display the 8th place balance */}
            {top10UserInfos.length > 7 && !loading && (
              <div
                className="absolute left-[30%] bottom-[22%] text-[15px] md:text-[18px] font-bold text-black bg-transparent whitespace-nowrap"
              >
                {`${top10UserInfos[7].balanceInfo}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrimarySecondaryDrawer;
