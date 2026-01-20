'use client';

import { useState, useEffect } from 'react';
import {
  Connector,
  getConnectors,
  connectConnector,
  disconnectConnector,
} from '@/lib/api';

const CONNECTOR_ICONS: Record<string, JSX.Element> = {
  github: (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  slack: (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  ),
  google_ads: (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
    </svg>
  ),
};

interface ConnectorsPanelProps {
  onRefresh?: () => void;
}

export default function ConnectorsPanel({ onRefresh }: ConnectorsPanelProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConnectors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConnectors();
      setConnectors(response.connectors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleConnect = async (connector: string) => {
    try {
      setActionLoading(connector);
      const response = await connectConnector(
        connector,
        window.location.href // Redirect back to current page after auth
      );
      // Open auth URL in new tab
      window.open(response.auth_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (connector: string) => {
    try {
      setActionLoading(connector);
      await disconnectConnector(connector);
      await fetchConnectors();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Services</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Services</h2>
      <p className="text-sm text-gray-600 mb-6">
        Connect your accounts to enable integrations with external services.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {connectors.map((connector) => (
          <div
            key={connector.connector}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div
                className={`p-2 rounded-lg ${
                  connector.connected
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {CONNECTOR_ICONS[connector.connector] || (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{connector.display_name}</h3>
                <p className="text-sm text-gray-500">{connector.description}</p>
                {connector.connected && (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                )}
                {connector.error && (
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Error: {connector.error}
                  </span>
                )}
              </div>
            </div>

            <div>
              {connector.connected ? (
                <button
                  onClick={() => handleDisconnect(connector.connector)}
                  disabled={actionLoading === connector.connector}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === connector.connector ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Disconnecting...
                    </span>
                  ) : (
                    'Disconnect'
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(connector.connector)}
                  disabled={actionLoading === connector.connector}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === connector.connector ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">How it works</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Click "Connect" to authorize access to your account</li>
          <li>2. Complete the OAuth flow with the service provider</li>
          <li>3. Once connected, your app can interact with the service on your behalf</li>
        </ul>
      </div>
    </div>
  );
}
