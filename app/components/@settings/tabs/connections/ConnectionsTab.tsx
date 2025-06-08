import { motion } from 'framer-motion';
import React, { Suspense, useState } from 'react';
import { classNames } from '~/utils/classNames';
import ConnectionDiagnostics from './ConnectionDiagnostics';
import { Button } from '~/components/ui/Button';
import VercelConnection from './VercelConnection';

const GitHubConnection = React.lazy(() => import('./GithubConnection'));
const NetlifyConnection = React.lazy(() => import('./NetlifyConnection'));

const LoadingFallback = () => (
  <div className="p-4 bg-gray-900 rounded-lg border border-gray-700"> {/* Adjusted for black bg */}
    <div className="flex items-center justify-center gap-2 text-gray-400">
      <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
      <span>Loading connection...</span>
    </div>
  </div>
);

export default function ConnectionsTab() {
  const [isEnvVarsExpanded, setIsEnvVarsExpanded] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 space-y-6"> {/* Root styles */}
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <div className="i-ph:plugs-connected w-5 h-5 text-purple-400" /> {/* Adjusted icon color */}
          <h2 className="text-lg font-medium text-gray-100">
            Variables & Connections {/* Updated title to match "Variables" card */}
          </h2>
        </div>
        <Button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          variant="outline"
          // Adjusted button style for black bg
          className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
        >
          {showDiagnostics ? (
            <>
              <div className="i-ph:eye-slash w-4 h-4" />
              Hide Diagnostics
            </>
          ) : (
            <>
              <div className="i-ph:wrench w-4 h-4" />
              Troubleshoot Connections
            </>
          )}
        </Button>
      </motion.div>
      <p className="text-sm text-gray-400">
        Manage your environment variables, external service connections and integrations.
      </p>

      {showDiagnostics && <ConnectionDiagnostics />}

      <motion.div
        className="rounded-lg border border-gray-700" // Removed bg, adjusted border
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-6">
          <button
            onClick={() => setIsEnvVarsExpanded(!isEnvVarsExpanded)}
            className={classNames(
              'w-full flex items-center justify-between',
              'hover:bg-gray-800 text-gray-100', // Adjusted hover and text
              'rounded-md p-2 -m-2 transition-colors',
            )}
          >
            <div className="flex items-center gap-2">
              <div className="i-ph:info w-5 h-5 text-purple-400" /> {/* Adjusted icon color */}
              <h3 className="text-base font-medium text-gray-100">
                Environment Variables
              </h3>
            </div>
            <div
              className={classNames(
                'i-ph:caret-down w-4 h-4 text-gray-400 transition-transform',
                isEnvVarsExpanded ? 'rotate-180' : '',
              )}
            />
          </button>

          {isEnvVarsExpanded && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">
                You can configure connections using environment variables in your{' '}
                <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">.env.local</code> file:
              </p>
              <div className="bg-gray-900 p-3 rounded-md text-xs font-mono overflow-x-auto">
                <div className="text-gray-500"># GitHub Authentication</div>
                <div className="text-gray-200">VITE_GITHUB_ACCESS_TOKEN=your_token_here</div>
                <div className="text-gray-500 mt-1"># Optional: Specify token type (defaults to 'classic' if not specified)</div>
                <div className="text-gray-200">VITE_GITHUB_TOKEN_TYPE=classic|fine-grained</div>
                <div className="text-gray-500 mt-2"># Netlify Authentication</div>
                <div className="text-gray-200">VITE_NETLIFY_ACCESS_TOKEN=your_token_here</div>
              </div>
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <p><span className="font-medium text-gray-300">Token types:</span></p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>
                    <span className="font-medium text-gray-300">classic</span> - Personal Access Token with{' '}
                    <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-300">repo, read:org, read:user</code> scopes
                  </li>
                  <li>
                    <span className="font-medium text-gray-300">fine-grained</span> - Fine-grained token with Repository and Organization access
                  </li>
                </ul>
                <p className="mt-2">
                  When set, these variables will be used automatically without requiring manual connection.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<LoadingFallback />}>
          <GitHubConnection />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <NetlifyConnection />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <VercelConnection />
        </Suspense>
      </div>

      <div className="text-sm text-gray-400 bg-gray-900 p-4 rounded-lg"> {/* Adjusted bg */}
        <p className="flex items-center gap-1 mb-2">
          <span className="i-ph:lightbulb w-4 h-4 text-green-400" /> {/* Adjusted icon color */}
          <span className="font-medium text-gray-300">Troubleshooting Tip:</span>
        </p>
        <p className="mb-2">
          If you're having trouble with connections, try using the troubleshooting tool at the top of this page. It can
          help diagnose and fix common connection issues.
        </p>
        <p>For persistent issues:</p>
        <ol className="list-decimal list-inside pl-4 mt-1">
          <li>Check your browser console for errors</li>
          <li>Verify that your tokens have the correct permissions</li>
          <li>Try clearing your browser cache and cookies</li>
          <li>Ensure your browser allows third-party cookies if using integrations</li>
        </ol>
      </div>
    </div>
  );
}
