import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button'; // Assuming Button component exists and is suitable
import { db, getAll, chatId, type ChatHistoryItem, useChatHistory, deleteById } from '~/lib/persistence';
import { HistoryItem } from '~/components/sidebar/HistoryItem'; // Reusing HistoryItem
import { binDates } from '~/components/sidebar/date-binning';   // Reusing binDates
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
import { classNames } from '~/utils/classNames';
// Dialog components might be needed later if delete functionality is fully ported
// import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';


// Minimal DialogContent type for now if needed
type DialogContent = { type: 'delete'; item: ChatHistoryItem } | null;


export const ChatHistoryPanel: React.FC = () => {
  const { duplicateCurrentChat, exportChat } = useChatHistory(); // Keep relevant parts
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null); // For delete confirmation

  const { filteredItems, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((items) => items.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  useEffect(() => {
    loadEntries();
    // Consider adding a listener for when the modal becomes visible to refresh,
    // or if `db` changes. For now, load on mount.
  }, [loadEntries]);
  
  // Simplified deleteItem for now, can be expanded with dialogs later
  const handleDeleteItem = useCallback(
    async (item: ChatHistoryItem) => {
      if (!db) {
        toast.error('Database not available.');
        return;
      }
      try {
        await deleteById(db, item.id);
        toast.success('Chat deleted successfully');
        loadEntries();
        if (chatId.get() === item.id) {
          window.location.pathname = '/'; // Navigate to home if current chat deleted
        }
      } catch (error: any) {
        toast.error(`Failed to delete chat: ${error.message}`);
      }
    },
    [loadEntries]
  );


  return (
    <div className="w-full h-full bg-bolt-elements-background-depth-1 border-l border-bolt-elements-borderColor p-6 flex flex-col">
      <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">
        Chat History
      </h2>
      <a
        href="/" // Navigate to root to start a new chat
        className="w-full p-2 mb-4 rounded bg-bolt-accent-primary text-center text-bolt-elements-textPrimary font-medium hover:opacity-80 transition-opacity"
      >
        Start New Chat
      </a>
      <div className="relative w-full mb-4">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <span className="i-ph:magnifying-glass h-4 w-4 text-bolt-elements-textTertiary" />
        </div>
        <input
          type="search"
          placeholder="Search chats..."
          className="w-full pl-9 pr-3 py-2 rounded bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:ring-1 focus:ring-bolt-accent-primary"
          onChange={handleSearchChange}
          aria-label="Search chats"
        />
      </div>
      <div className="flex-1 overflow-y-auto modern-scrollbar pr-1"> {/* Added pr-1 for scrollbar space */}
        {filteredItems.length === 0 && (
          <div className="px-1 text-bolt-elements-textSecondary text-sm">
            {list.length === 0 ? 'No previous conversations' : 'No matches found'}
          </div>
        )}
        {binDates(filteredItems).map(({ category, items }) => (
          <div key={category} className="mb-3 last:mb-0">
            <div className="text-xs font-medium text-bolt-elements-textTertiary sticky top-0 bg-bolt-elements-background-depth-1 py-1 px-1">
              {category}
            </div>
            <div className="space-y-0.5">
              {items.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  exportChat={exportChat} // Prop drill or manage via context/store if complex
                  onDelete={(event) => { // Basic delete, can be enhanced with confirmation
                    event.stopPropagation();
                    event.preventDefault();
                    // For now, direct delete. Confirmation dialog can be added.
                    if(window.confirm(`Are you sure you want to delete "${item.description}"?`)) {
                        handleDeleteItem(item);
                    }
                  }}
                  onDuplicate={() => { // Basic duplicate
                    duplicateCurrentChat(item.id).then(loadEntries);
                  }}
                  // selectionMode and related props are omitted for simplicity in this phase
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistoryPanel;
