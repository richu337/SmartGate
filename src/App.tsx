/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { NetworkStats } from './components/NetworkStats.js';
import { DeviceInventory } from './components/DeviceInventory.js';
import { SchedulePlanner } from './components/SchedulePlanner.js';
import { SecurityRadar } from './components/SecurityRadar.js';
import { SupabaseMonitor } from './components/SupabaseMonitor.js';
import { TraySimulator } from './components/TraySimulator.js';
import { Network, NetworkDevice, AccessSchedule, ActivityLog, UserRole } from './types.js';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  Server,
  Layers,
  Laptop,
  CheckCircle,
  Clock,
  Wifi,
  Database
} from 'lucide-react';

export default function App() {
  // Platform & Tab selectors
  const [platform, setPlatform] = useState<'web' | 'desktop'>('web');
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'devices' | 'schedules' | 'security' | 'database'>('dashboard');

  // Network variables
  const [network, setNetwork] = useState<Network | null>(null);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [schedules, setSchedules] = useState<AccessSchedule[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // AI Scanning maps
  const [secReports, setSecReports] = useState<Record<string, any>>({});
  const [scanningIds, setScanningIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Supabase Table Synchronous Triggers Feed
  const [syncTriggers, setSyncTriggers] = useState<Array<{
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    recordId: string;
    timestamp: string;
    status: 'synced' | 'pending';
  }>>([]);

  // Load all initial subnets & leases on first run
  const fetchNetworkData = async (toastLabel?: string) => {
    setIsSyncing(true);
    try {
      const [netRes, devRes, schedRes, logsRes] = await Promise.all([
        fetch('/api/network'),
        fetch('/api/devices'),
        fetch('/api/schedules'),
        fetch('/api/logs'),
      ]);

      const netData = await netRes.json();
      const devData = await devRes.json();
      const schedData = await schedRes.json();
      const logsData = await logsRes.json();

      setNetwork(netData);
      setDevices(devData);
      setSchedules(schedData);
      setLogs(logsData);
    } catch (e) {
      console.error('Failed to parse gateway datasets:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  // Sync transactional events Helper
  const pushSyncTrigger = (table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', recordId: string) => {
    const newTrigger = {
      table,
      operation,
      recordId,
      timestamp: new Date().toISOString(),
      status: 'synced' as const,
    };
    setSyncTriggers((prev) => [newTrigger, ...prev].slice(0, 50));
  };

  // Device CRUD Operations proxying express
  const handleModifyDevice = async (id: string, payload: Partial<NetworkDevice>) => {
    try {
      const res = await fetch('/api/devices/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = await res.json();
      if (data.success) {
        // Update in-memory local state
        setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...data.device } : d)));
        pushSyncTrigger('devices', 'UPDATE', id);

        // Fetch logs again
        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      }
    } catch (e) {
      console.error('Failed operational update on device lease:', e);
    }
  };

  // Add a brand new device manually to the network
  const handleAddDevice = async (payload: {
    name: string;
    brand?: string;
    type?: any;
    ip?: string;
    mac: string;
    category?: any;
  }) => {
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) => [...prev, data.device]);
        pushSyncTrigger('devices', 'INSERT', data.device.id);

        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      } else {
        throw new Error(data.error || 'Failed to add device.');
      }
    } catch (e: any) {
      console.error('Failed to register manual device:', e);
      throw e;
    }
  };

  // Delete/Purge a device lease profile entirely from management records
  const handleDeleteDevice = async (id: string) => {
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        // Remove related schedules locally
        setSchedules((prev) => prev.filter((s) => s.deviceId !== id));
        pushSyncTrigger('devices', 'DELETE', id);

        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      } else {
        alert(`Failed to delete device lease: ${data.error || 'Unknown database error'}`);
      }
    } catch (e: any) {
      console.error('Failed to delete target device lease:', e);
      alert(`Network/Server error deleting device lease: ${e.message || e}`);
    }
  };

  // Schedules parental rules additions
  const handleAddSchedule = async (payload: {
    deviceId: string;
    name: string;
    days: number[];
    startTime: string;
    endTime: string;
  }) => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => [...prev, data.schedule]);
        pushSyncTrigger('schedules', 'INSERT', data.schedule.id);

        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      }
    } catch (e) {
      console.error('Failed to deploy parental access rule:', e);
    }
  };

  // Schedule parental rules deleting
  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        pushSyncTrigger('schedules', 'DELETE', id);

        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      }
    } catch (e) {
      console.error('Failed to terminate parental control schedule:', e);
    }
  };

  // Switch schedule toggle enabled
  const handleToggleSchedule = async (id: string) => {
    try {
      const res = await fetch('/api/schedules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, isEnabled: data.schedule.isEnabled } : s)));
        pushSyncTrigger('schedules', 'UPDATE', id);

        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      }
    } catch (e) {
      console.error('Failed override action on parental policy rule:', e);
    }
  };

  // Background router lease scan trigger
  const handleRouterSweep = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/network/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDevices(data.devices);
        pushSyncTrigger('networks', 'UPDATE', 'net-main-001');

        const logsRes = await fetch('/api/logs');
        setLogs(await logsRes.json());
      }
    } catch (e) {
      console.error('Failed background SSID band scan sweep:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Call server-side Gemini tool wrapper
  const handleAIScanDevice = async (deviceId: string) => {
    if (scanningIds.includes(deviceId)) return;
    setScanningIds((prev) => [...prev, deviceId]);

    try {
      const res = await fetch('/api/gemini/analyze-security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (data.success) {
        // Cache the evaluation report
        setSecReports((prev) => ({ ...prev, [deviceId]: data.report }));

        // Refresh devices and logs schemas to capture updated classifications
        const [devRes, logsRes] = await Promise.all([
          fetch('/api/devices'),
          fetch('/api/logs'),
        ]);
        setDevices(await devRes.json());
        setLogs(await logsRes.json());

        // Sync visual telemetry payload
        pushSyncTrigger('devices', 'UPDATE', deviceId);
      } else {
        alert(`AI Security Sweep failed: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      console.error('Failed to connect AI scan service:', e);
      alert(`AI scanner failed connection: ${e.message}`);
    } finally {
      setScanningIds((prev) => prev.filter((id) => id !== deviceId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70 font-sans antialiased text-gray-800">
      {/* Navigation Topbar */}
      <Navbar
        network={network}
        onlineCount={devices.filter((d) => d.connectionStatus === 'online').length}
        blockedCount={devices.filter((d) => d.category === 'blocked' || d.isBlockedByPolicy).length}
        userRole={userRole}
        onRoleToggle={setUserRole}
        onRefresh={handleRouterSweep}
        isSyncing={isSyncing}
        platform={platform}
        onPlatformChange={setPlatform}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Windows tray widget platform */}
        {platform === 'desktop' && (
          <div className="text-center">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                <Server className="h-3.5 w-3.5" /> PC Taskbar Widget Emulator
              </span>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-normal">
                Models our Windows background client daemon syncing with local gateway sockets.
              </p>
            </div>
            <TraySimulator
              devices={devices}
              network={network}
              onModifyDevice={handleModifyDevice}
              onRefresh={handleRouterSweep}
              isSyncing={isSyncing}
            />
          </div>
        )}

        {/* Primary Web Dashboard Consoles */}
        {platform === 'web' && (
          <div className="space-y-6">
            {/* Quick stats grid always visible */}
            <NetworkStats devices={devices} network={network} logsCount={logs.length} />

            {/* Dashboard Sub-tab selector */}
            <div className="flex border-b border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`border-b-2 px-1 py-4 text-xs font-bold tracking-wide uppercase transition-colors ${
                    currentTab === 'dashboard'
                      ? 'border-indigo-650 text-indigo-600 font-black'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Insights & Controls
                </button>
                <button
                  onClick={() => setCurrentTab('devices')}
                  className={`border-b-2 px-1 py-4 text-xs font-bold tracking-wide uppercase transition-colors ${
                    currentTab === 'devices'
                      ? 'border-indigo-650 text-indigo-600 font-black'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Devices ({devices.length})
                </button>
                <button
                  onClick={() => setCurrentTab('schedules')}
                  className={`border-b-2 px-1 py-4 text-xs font-bold tracking-wide uppercase transition-colors ${
                    currentTab === 'schedules'
                      ? 'border-indigo-650 text-indigo-600 font-black'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Access Schedules ({schedules.length})
                </button>
                <button
                  onClick={() => setCurrentTab('security')}
                  className={`border-b-2 px-1 py-4 text-xs font-bold tracking-wide uppercase transition-colors ${
                    currentTab === 'security'
                      ? 'border-indigo-650 text-indigo-600 font-black'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  AI Risk Radar
                </button>
                <button
                  onClick={() => setCurrentTab('database')}
                  className={`border-b-2 px-1 py-4 text-xs font-bold tracking-wide uppercase transition-colors ${
                    currentTab === 'database'
                      ? 'border-indigo-650 text-indigo-600 font-black'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Supabase Live DB
                </button>
              </div>
            </div>

            {/* Sub-tab views routing */}
            {currentTab === 'dashboard' && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Device summary lists */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Active List summary inline */}
                  <DeviceInventory
                    devices={devices}
                    userRole={userRole}
                    onModifyDevice={handleModifyDevice}
                    onTriggerAIScan={handleAIScanDevice}
                    secReports={secReports}
                    scanningIds={scanningIds}
                    onAddDevice={handleAddDevice}
                    onDeleteDevice={handleDeleteDevice}
                  />
                </div>

                {/* Left side schedules & security flags block */}
                <div className="space-y-6">
                  {/* Mini-schedules review */}
                  <SchedulePlanner
                    schedules={schedules}
                    devices={devices}
                    userRole={userRole}
                    onAddSchedule={handleAddSchedule}
                    onDeleteSchedule={handleDeleteSchedule}
                    onToggleSchedule={handleToggleSchedule}
                  />

                  {/* Audit Logs list */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">Enforcement Logs</h4>
                        <p className="text-[10px] text-gray-400">Router physical security audit</p>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Lease Events
                      </span>
                    </div>

                    <div className="mt-4 space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {logs.map((log) => (
                        <div key={log.id} className="flex gap-3 text-xs leading-normal">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                              log.severity === 'alert'
                                ? 'bg-rose-50 text-rose-600'
                                : log.severity === 'warning'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-slate-50 text-indigo-600'
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 leading-snug">
                              {log.deviceName}: <span className="text-gray-500 font-medium">{log.details}</span>
                            </p>
                            <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">
                              {log.timestamp.slice(11, 19)} • MAC: {log.deviceMac}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'devices' && (
              <DeviceInventory
                devices={devices}
                userRole={userRole}
                onModifyDevice={handleModifyDevice}
                onTriggerAIScan={handleAIScanDevice}
                secReports={secReports}
                scanningIds={scanningIds}
                onAddDevice={handleAddDevice}
                onDeleteDevice={handleDeleteDevice}
              />
            )}

            {currentTab === 'schedules' && (
              <SchedulePlanner
                schedules={schedules}
                devices={devices}
                userRole={userRole}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onToggleSchedule={handleToggleSchedule}
              />
            )}

            {currentTab === 'security' && (
              <SecurityRadar
                devices={devices}
                onTriggerAIScan={handleAIScanDevice}
                secReports={secReports}
                scanningIds={scanningIds}
              />
            )}

            {currentTab === 'database' && (
              <SupabaseMonitor
                devices={devices}
                schedules={schedules}
                logs={logs}
                network={network}
                syncTriggers={syncTriggers}
              />
            )}
          </div>
        )}
      </main>

      {/* Aesthetic Footer */}
      <footer className="mt-16 border-t border-gray-150 bg-white py-12 text-center text-xs text-gray-400 font-medium">
        <p className="mt-1">
          Owner Control Station • Gateway API Firmware v3.2.1-Prod
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          Sync Engine: Supabase Realtime • AI threat vector scanner: Gemini 3.5 Flash
        </p>
      </footer>
    </div>
  );
}
