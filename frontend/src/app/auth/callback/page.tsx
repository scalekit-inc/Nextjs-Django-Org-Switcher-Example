'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { handleCallback } from '@/lib/api';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent duplicate processing (React Strict Mode runs effects twice)
      if (processedRef.current) {
        return;
      }
      processedRef.current = true;
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication error: ${errorParam}`);
        return;
      }

      if (!code || !state) {
        setError('Missing code or state parameter');
        return;
      }

      try {
        // Send code and state to backend
        await handleCallback({ code, state });

        // Redirect to dashboard on success
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {error ? (
          <div>
            <div className="flex items-center justify-center mb-4">
              <svg
                className="h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-4">
              Authentication Failed
            </h2>
            <p className="text-red-600 text-center mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
              Completing Authentication
            </h2>
            <p className="text-gray-600 text-center">Please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
}
