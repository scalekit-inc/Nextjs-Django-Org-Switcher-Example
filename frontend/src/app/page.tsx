'use client';

import { useState } from 'react';
import { getAuthUrl } from '@/lib/api';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (useOrgSwitcher: boolean) => {
    setLoading(true);
    setError(null);

    try {
      // Request auth URL with or without prompt=select_account
      const options = useOrgSwitcher ? { prompt: 'select_account' } : {};
      const { auth_url } = await getAuthUrl(options);

      // Redirect to Scalekit authorization URL
      window.location.href = auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate login');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Organization Switcher Demo
            </h1>
            <p className="text-lg text-gray-600">
              Scalekit authentication with Django backend and Next.js frontend
            </p>
          </div>

          {/* Login Options Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Choose Login Method
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Option 1: Out-of-the-box Org Switcher */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  1. Out-of-the-box Organization Switcher
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Uses Scalekit's built-in organization selection UI by passing{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    prompt: 'select_account'
                  </code>
                </p>
                <button
                  onClick={() => handleLogin(true)}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Login with Org Switcher'}
                </button>
              </div>

              {/* Option 2: Standard Login */}
              <div className="border border-gray-200 rounded-lg p-6 hover:border-green-500 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2. Standard Login (No Org Switcher)
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Regular authentication flow without the organization switcher
                </p>
                <button
                  onClick={() => handleLogin(false)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Standard Login'}
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> After login, you'll be redirected to the dashboard where
                you can see a custom-built organization switcher using API calls.
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              What's Included
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  Out-of-the-box organization switcher using{' '}
                  <code className="bg-gray-100 px-1 rounded text-sm">
                    prompt: 'select_account'
                  </code>
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  Custom organization switcher built with API calls
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  Django REST API backend with session management
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">
                  Next.js 14 frontend with TypeScript and Tailwind CSS
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
