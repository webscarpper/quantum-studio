import React from 'react';

const SupabaseConnectionTab: React.FC = () => {
  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 flex flex-col items-center justify-center text-center">
      <div className="i-simple-icons:supabase text-6xl text-gray-400 mb-4" /> {/* Adjusted icon color */}
      <h2 className="text-xl font-semibold text-gray-100 mb-2"> {/* Adjusted text color */}
        Supabase Connection
      </h2>
      <p className="text-gray-400 mb-4"> {/* Adjusted text color */}
        Supabase setup placeholder.
      </p>
      <div className="w-full max-w-md">
        <label htmlFor="mock-api-key" className="block text-sm font-medium text-gray-400 mb-1"> {/* Adjusted text color */}
          Linked Project ID (Mock)
        </label>
        <input
          type="text"
          id="mock-api-key"
          readOnly
          value="none"
          className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-500 cursor-not-allowed" // Adjusted styles for dark bg
        />
      </div>
    </div>
  );
};

export default SupabaseConnectionTab;
