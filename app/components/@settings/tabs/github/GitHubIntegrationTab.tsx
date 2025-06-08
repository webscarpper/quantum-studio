import React from 'react';
import { Button } from '~/components/ui/Button'; // Assuming Button component is suitable

const GitHubIntegrationTab: React.FC = () => {
  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 flex flex-col items-center justify-center text-center">
      <div className="i-mdi:github text-6xl text-gray-400 mb-4" /> {/* Adjusted icon color */}
      <h2 className="text-xl font-semibold text-gray-100 mb-2"> {/* Adjusted text color */}
        GitHub Integration
      </h2>
      <p className="text-gray-400 mb-6"> {/* Adjusted text color */}
        GitHub connection coming soon.
      </p>
      <Button disabled className="opacity-50 cursor-not-allowed bg-gray-700 text-gray-400"> {/* Adjusted button style for dark bg */}
        Connect to GitHub
      </Button>
    </div>
  );
};

export default GitHubIntegrationTab;
