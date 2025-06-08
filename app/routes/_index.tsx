import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import AnimatedSphere from '~/components/ui/AnimatedSphere';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt' }, { name: 'description', content: 'Talk with Bolt, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return (
    <div className="flex flex-col h-full w-full"> {/* Removed background color, no specific positioning needed for this test */}
      {/* Background elements */}
      {/* <BackgroundRays className="fixed inset-0 z-[-2]" /> Temporarily commented out */}
      <AnimatedSphere 
        className="fixed inset-0 z-0" // Test: Sphere at z-0
        color="#00D3A9" // Teal Accent
        secondaryColor="#3B82F6" // Bright Blue
        particleCount={150} 
        speed={0.0015} 
      />
      {/* Foreground content (Layer 3) */}
      <div className="relative z-[1] flex flex-col h-full w-full"> {/* Content on top of fixed elements */}
        <Header />
        <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      </div>
    </div>
  );
}
