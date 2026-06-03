/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wifi, ShieldAlert, Cpu, RefreshCw, User, Users, Lock, Unlock } from 'lucide-react';
import { Network, UserRole } from '../types.js';

interface NavbarProps {
  network: Network | null;
  onlineCount: number;
  blockedCount: number;
  userRole: UserRole;
  onRoleToggle: (role: UserRole) => void;
  onRefresh: () => void;
  isSyncing: boolean;
  platform: 'web' | 'desktop';
  onPlatformChange: (platform: 'web' | 'desktop') => void;
}

export function Navbar({
  network,
  onlineCount,
  blockedCount,
  userRole,
  onRoleToggle,
  onRefresh,
  isSyncing,
  platform,
  onPlatformChange,
}: NavbarProps) {
  return (
    <header className="border-b border-gray-100 bg-white shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900">
                Smart Network Access Manager
              </h1>
              <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active SSID: {network?.ssid || 'Loading...'}
              </p>
            </div>
          </div>

          {/* Platform Selector Tabs */}
          <div className="hidden md:flex items-center gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => onPlatformChange('web')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                platform === 'web'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Web Dashboard
            </button>
            <button
              onClick={() => onPlatformChange('desktop')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                platform === 'desktop'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Windows Desktop Client
            </button>
          </div>

          {/* Actions & Role Switches */}
          <div className="flex items-center gap-3">
            {/* Sync trigger */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              title="Force Router Deep Scan"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Role switch toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                onClick={() => onRoleToggle('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  userRole === 'admin'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Swith to Network Owner"
              >
                <Unlock className="h-3 w-3" />
                <span className="hidden sm:inline">Owner</span>
              </button>
              <button
                onClick={() => onRoleToggle('viewer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  userRole === 'viewer'
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Switch to Family Account"
              >
                <Lock className="h-3 w-3" />
                <span className="hidden sm:inline">Guest / Family</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
