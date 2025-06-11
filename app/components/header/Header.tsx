import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { toggleTopDropModal } from '~/lib/stores/topDropModalStore'; // Import modal toggle function

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      {/* Logo - Old trigger button removed from here */}
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary mt-[25px]"> {/* Adjusted top margin: 40px - 15px = 25px */}
        <a href="/" className="text-2xl font-semibold text-accent flex items-center"> {/* Reverted <a> tag font size */}
          <img src="/custom-logo.png" alt="Custom Logo" className="w-[90px] inline-block" /> {/* Reverted logo size */}
          <span className="ml-2 text-sm text-white font-bold transform translate-x-[-45px] translate-y-[17px]">ynthetic Intelligence Network</span> {/* Text moved another 5px right from previous -50px */}
        </a>
      </div>

      {/* Spacer to push subsequent items to the right */}
      <div className="flex-1">
        {chat.started && (
          <span className="block px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
        )}
      </div>
      
      {/* Right section of the header */}
      <div className="flex items-center gap-4">
        {chat.started && (
          <ClientOnly>
            {() => <HeaderActionButtons chatStarted={chat.started} />}
          </ClientOnly>
        )}
        <button
          onClick={toggleTopDropModal}
          className="px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 ease-in-out hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00D3A9] transform translate-x-[-5px] translate-y-[15px]" // Adjusted position
          style={{
            backgroundColor: '#00D3A9', // Sphere's teal color
            color: '#FFFFFF', // White text for contrast
            boxShadow: '0 0 6px rgba(0, 211, 169, 0.7), 0 0 12px rgba(0, 211, 169, 0.5)', // More subtle glow
            // No need for JS hover for glow if base glow is subtle enough or handled by Tailwind hover (e.g. hover:shadow-lg)
          }}
        >
          Quantum Brain
        </button>
      </div>
    </header>
  );
}
