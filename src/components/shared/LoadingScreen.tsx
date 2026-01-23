import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading ServicePulse..." }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Pulse Animation */}
        <div className="relative mb-8">
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 120 120" 
            className="mx-auto"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2"
            />
            
            {/* Animated pulse line */}
            <path
              d="M 20 60 L 35 60 L 45 30 L 55 90 L 65 20 L 75 80 L 85 60 L 100 60"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,200;100,200;0,200"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dashoffset"
                values="0;-100;-200"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            
            {/* Pulsing outer ring */}
            <circle
              cx="60"
              cy="60"
              r="55"
              fill="none"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="1"
              className="animate-ping"
            />
          </svg>
        </div>
        
        {/* Loading text */}
        <div className="text-white">
          <h2 className="text-2xl font-bold mb-2">ServicePulse</h2>
          <p className="text-gray-300 text-lg mb-4">{message}</p>
          
          {/* Loading dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;