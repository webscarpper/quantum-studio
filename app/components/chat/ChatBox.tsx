import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Icon } from '@iconify/react'; // Import Icon component
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';

interface ChatBoxProps {
  // Removed props related to inline model/API settings
  // isModelSettingsCollapsed: boolean;
  // setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  // provider: any; // Will be sourced from store if needed by other parts, or not needed by ChatBox
  providerList: any[]; // Kept for SendButton, might be refactored later
  // modelList: any[];
  // apiKeys: Record<string, string>;
  // isModelLoading: string | undefined;
  // onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  // setProvider?: ((provider: ProviderInfo) => void) | undefined; // Removed
  // model?: string | undefined; // Removed
  // setModel?: ((model: string) => void) | undefined; // Removed
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
  isLandingMode?: boolean; // Added prop to control width styling
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const { isLandingMode, ...restProps } = props; // Destructure isLandingMode

  return (
    <div
      className={classNames(
        'relative w-full z-prompt animated-glowing-border', // Base classes, new border class
        'backdrop-blur-[12px] rounded-2xl', // Keep backdrop-blur and rounded-2xl
        'border-2 border-transparent', // Added for the CSS border technique
        'py-5 px-4', // New padding (1.25rem T/B, 1rem L/R)
        // bg-[rgba(0,0,0,0.4)] is now handled by the .animated-glowing-border class in animations.scss
        { 'max-w-chat mx-auto': !isLandingMode }, // Conditional width constraint
        /*
         * {
         *   'sticky bottom-2': chatStarted,
         * },
         */
      )}
    >
      <svg className={classNames(styles.PromptEffectContainer)}>
        <defs>
          <linearGradient
            id="line-gradient"
            x1="20%"
            y1="0%"
            x2="-14%"
            y2="10%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-45)"
          >
            <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
          </linearGradient>
          <linearGradient id="shine-gradient">
            <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
          </linearGradient>
        </defs>
        <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
        <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
      </svg>
      {/* Removed inline ModelSelector and APIKeyManager */}
      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(index) => {
          props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
          props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
        }}
      />
      <ClientOnly>
        {() => (
          <ScreenshotStateManager
            setUploadedFiles={props.setUploadedFiles}
            setImageDataList={props.setImageDataList}
            uploadedFiles={props.uploadedFiles}
            imageDataList={props.imageDataList}
          />
        )}
      </ClientOnly>
      {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
              {props?.selectedElement?.tagName}
            </code>
            selected for inspection
          </div>
          <button
            className="bg-transparent text-accent-500 pointer-auto"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Clear
          </button>
        </div>
      )}
      {/* Simplified inner container for textarea and button bar */}
      <div className="relative flex flex-col"> 
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pr-12 pt-0 pb-2 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm', // Adjusted padding
            // Removed hover:border-bolt-elements-focus as the main container has the animated border
          )}
          onDragEnter={(e) => { e.preventDefault(); }}
          onDragOver={(e) => { e.preventDefault(); }}
          onDragLeave={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            // Original onDrop file handling logic:
            const files = Array.from(e.dataTransfer.files);
            files.forEach((file) => {
              if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                  const base64Image = e.target?.result as string;
                  props.setUploadedFiles?.([...props.uploadedFiles, file]);
                  props.setImageDataList?.([...props.imageDataList, base64Image]);
                };
                reader.readAsDataURL(file);
              }
            });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              // ignore if using input method engine
              if (event.nativeEvent.isComposing) {
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={(event) => {
            props.handleInputChange?.(event);
          }}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={props.chatMode === 'build' ? 'How can Sin help you today?' : 'What would you like to discuss?'}
          translate="no"
        />
        <ClientOnly>
          {() => (
            <SendButton
              show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
              isStreaming={props.isStreaming}
              disabled={!props.providerList || props.providerList.length === 0}
              onClick={(event) => {
                if (props.isStreaming) {
                  props.handleStop?.();
                  return;
                }

                if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                  props.handleSendMessage?.(event);
                }
              }}
            />
          )}
        </ClientOnly>
        {/* Updated Button Layout Area */}
        <div className="flex justify-between items-center text-sm px-1 pt-3"> {/* Adjusted padding: px-1 for internal, pt-3 from textarea */}
          {/* Left Group */}
          <div className="flex gap-3 items-center"> {/* gap-3 for 0.75rem */}
            <IconButton title="Upload file" className="transition-all hover:text-bolt-accent-primary" onClick={() => props.handleFileUpload()}>
              <Icon icon="ph:paperclip" className="text-xl" />
            </IconButton>
            <IconButton
              title="Enhance prompt"
              disabled={props.input.length === 0 || props.enhancingPrompt}
              className={classNames('transition-all hover:text-bolt-accent-primary', props.enhancingPrompt ? 'opacity-100' : '')}
              onClick={() => {
                props.enhancePrompt?.();
                toast.success('Prompt enhanced!');
              }}
            >
              {props.enhancingPrompt ? (
                <Icon icon="svg-spinners:90-ring-with-bg" className="text-bolt-elements-loader-progress text-xl animate-spin" />
              ) : (
                <Icon icon="ph:stars-bold" className="text-xl" /> 
              )}
            </IconButton>
            {/* ColorSchemeDialog removed from here */}
            {/* Discuss button removed from here, as it's chatStarted dependent and not in the new minimalist layout */}
          </div>

          {/* Center: "Shift + Return" hint */}
          <div className="flex-1 text-center"> {/* flex-1 to take up space and center the hint */}
            {props.input.length > 3 ? (
              <div className="text-xs text-bolt-elements-textTertiary">
                Use <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-3">Shift</kbd> +{' '}
                <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-3">Return</kbd> a new line
              </div>
            ) : null}
          </div>
          
          {/* Right Group */}
          <div className="flex gap-3 items-center">
            <SpeechRecognitionButton
              isListening={props.isListening}
              onStart={props.startListening}
              onStop={props.stopListening}
              disabled={props.isStreaming}
              // className="hover:text-bolt-accent-primary" // Removed className, SpeechRecognitionButton might not support it directly
            />
            {/* SupabaseConnection component removed */}
            {/* ExpoQrModal trigger removed from here, it's a modal not a button in this bar */}
          </div>
        </div>
      </div>
      {/* ExpoQrModal needs to be triggered from somewhere else if still needed */}
      {props.qrModalOpen && <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />}
    </div>
  );
};
