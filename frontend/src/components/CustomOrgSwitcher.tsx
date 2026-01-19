'use client';

import { useState } from 'react';
import { Organization } from '@/lib/api';
import { switchOrganization } from '@/lib/api';

interface CustomOrgSwitcherProps {
  organizations: Organization[];
}

export default function CustomOrgSwitcher({
  organizations,
}: CustomOrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find current org, or fall back to first org if none marked as current
  const currentOrg = organizations.find((org) => org.is_current) || organizations[0];

  const handleSwitchOrg = async (orgId: string) => {
    // Don't switch if already on this org
    if (organizations.find(o => o.id === orgId)?.is_current) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    setError(null);

    try {
      // Call API to switch organization
      const { auth_url } = await switchOrganization(orgId);

      // Redirect to Scalekit to complete org switch
      window.location.href = auth_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch organization');
      setSwitching(false);
    }
  };

  // Always show the switcher, even with one org (to show current org info)
  // But only enable switching if there are multiple orgs

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        disabled={switching}
      >
        {/* Organization Icon */}
        <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
          <span className="text-white font-semibold text-xs">
            {currentOrg?.display_name?.[0]?.toUpperCase() || 'O'}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {currentOrg?.display_name || 'Select Organization'}
        </span>
        {/* Chevron Icon */}
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <p className="text-xs text-gray-500 px-3 py-2 font-semibold uppercase tracking-wide">
              Switch Organization
            </p>
            <div className="space-y-1">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  disabled={switching}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 ${
                    org.is_current
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Org Icon */}
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    org.is_current ? 'bg-indigo-600' : 'bg-gray-400'
                  }`}>
                    <span className="text-white font-semibold text-xs">
                      {org.display_name[0]?.toUpperCase()}
                    </span>
                  </div>

                  {/* Org Name and Status */}
                  <div className="flex-1">
                    <div className="font-medium">{org.display_name}</div>
                    {org.is_current && (
                      <div className="text-xs text-indigo-500">Current</div>
                    )}
                  </div>

                  {/* Checkmark for current */}
                  {org.is_current && (
                    <svg
                      className="h-5 w-5 text-indigo-600"
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
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="border-t border-gray-200 p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="border-t border-gray-200 p-2">
            <p className="text-xs text-gray-400 px-3 py-1">
              {organizations.length} organization{organizations.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
