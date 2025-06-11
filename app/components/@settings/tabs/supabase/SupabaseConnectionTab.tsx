import React from 'react';
import { SupabaseConnection } from '~/components/chat/SupabaseConnection'; // Import the component

const SupabaseConnectionTab: React.FC = () => {
  return (
    // The tab content area has a black background and high-contrast text from parent styles.
    // Provide a simple container. SupabaseConnection component will render its button which opens a dialog.
    // The SupabaseConnection component itself is relatively positioned, so it should work fine here.
    // We might want the SupabaseConnection UI to be directly visible rather than a button opening a dialog.
    // For now, this will make the existing UI accessible.
    <div className="p-6 h-full flex flex-col items-start"> 
      {/* items-start to align the button to the top-left if it's small, or allow it to take full width if needed */}
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        Supabase Connection Management
      </h2>
      <p className="text-gray-400 mb-6 text-sm">
        Connect to your Supabase account to manage projects, link databases, and enable Supabase-specific features within your chat.
        Click the button below to open the connection dialog.
      </p>
      <SupabaseConnection />
    </div>
  );
};

export default SupabaseConnectionTab;
