'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, logout, User, Organization } from '@/lib/api';
import CustomOrgSwitcher from '@/components/CustomOrgSwitcher';
import ConnectorsPanel from '@/components/ConnectorsPanel';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserInfo();
        setUser(data.user);
        setOrganizations(data.organizations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data');
        // Redirect to home if not authenticated
        setTimeout(() => router.push('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { logout_url } = await logout();

      // Redirect to Scalekit logout URL if provided, otherwise go home
      if (logout_url) {
        window.location.href = logout_url;
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-700">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Failed to load user data'}</p>
          <p className="text-gray-600">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  const currentOrg = organizations.find((org) => org.is_current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              {/* Current Organization Indicator */}
              {currentOrg && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 rounded-full">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                  <span className="text-sm font-medium text-indigo-700">
                    {currentOrg.display_name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Custom Organization Switcher */}
              <CustomOrgSwitcher
                organizations={organizations}
              />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Current Organization Banner */}
      {currentOrg && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {currentOrg.display_name[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-indigo-200 uppercase tracking-wide">Current Organization</p>
                  <p className="text-lg font-semibold">{currentOrg.display_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-200">Organization ID</p>
                <p className="text-sm font-mono">{currentOrg.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome, {user.name}!
            </h2>
            <p className="text-gray-600">You're successfully authenticated with Scalekit.</p>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="text-gray-900">{user.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">User ID:</span>
                <span className="text-gray-900 font-mono text-sm">{user.id}</span>
              </div>
              {currentOrg && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 font-medium">Current Organization:</span>
                  <span className="text-gray-900">{currentOrg.display_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Connected Services Card */}
          <ConnectorsPanel />

          {/* Organizations Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Organizations ({organizations.length})
            </h3>
            {organizations.length > 0 ? (
              <div className="space-y-2">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className={`p-4 rounded-md border ${
                      org.is_current
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{org.display_name}</h4>
                        <p className="text-sm text-gray-600 font-mono">{org.id}</p>
                      </div>
                      {org.is_current && (
                        <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No organizations found.</p>
            )}
          </div>

          {/* Implementation Details Card */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-lg p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Organization Switching Methods
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  1. Out-of-the-box Switcher (Login Page)
                </h4>
                <p className="text-gray-700 text-sm">
                  Uses{' '}
                  <code className="bg-white px-2 py-1 rounded text-xs border border-purple-300">
                    prompt: 'select_account'
                  </code>{' '}
                  parameter to display Scalekit's built-in organization selection UI during login.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  2. Custom Switcher (This Page)
                </h4>
                <p className="text-gray-700 text-sm">
                  The dropdown in the header is a custom-built organization switcher that uses the{' '}
                  <code className="bg-white px-2 py-1 rounded text-xs border border-purple-300">
                    /api/auth/switch-org
                  </code>{' '}
                  endpoint to switch organizations programmatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
