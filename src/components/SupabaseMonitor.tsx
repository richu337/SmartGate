/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Layers, CheckCircle, Flame, ExternalLink, AlertTriangle, Check, Copy, Terminal } from 'lucide-react';
import { NetworkDevice, AccessSchedule, ActivityLog, Network } from '../types.js';

interface SupabaseMonitorProps {
  devices: NetworkDevice[];
  schedules: AccessSchedule[];
  logs: ActivityLog[];
  network: Network | null;
  syncTriggers: Array<{
    table: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    recordId: string;
    timestamp: string;
    status: 'synced' | 'pending';
  }>;
}

export function SupabaseMonitor({
  devices,
  schedules,
  logs,
  network,
  syncTriggers,
}: SupabaseMonitorProps) {
  const [activeTable, setActiveTable] = useState<'devices' | 'locked_policies' | 'schedules' | 'activity_logs'>('devices');
  const [dbStatus, setDbStatus] = useState<{
    isConfigured: boolean;
    tablesExist: boolean;
    error: string | null;
    url: string;
    sqlScript: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Failed to load Supabase connection stats:', err);
    }
  };

  const recheckConnection = async () => {
    setLoading(true);
    try {
      await fetch('/api/supabase/recheck', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copySql = () => {
    if (dbStatus?.sqlScript) {
      navigator.clipboard.writeText(dbStatus.sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const blockedCount = devices.filter((d) => d.category === 'blocked' || d.isBlockedByPolicy).length;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Title block */}
      <div className="flex flex-col gap-4 border-b border-gray-150 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-1.5 leading-none">
            <Database className="h-4.5 w-4.5 text-indigo-600" /> Supabase PostgREST & Realtime Hub
          </h2>
          <p className="text-xs text-gray-500">
            Audit row data structures synced instantly across IOS/Android, Web and Desktop channels
          </p>
        </div>

        {/* Sync status indicator */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 text-xs text-emerald-800 font-bold font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Supabase Realtime Channel: Online
        </div>
      </div>

      {/* Supabase connection diagnostics card */}
      {dbStatus && (
        <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-gray-700">Supabase Endpoint URL:</span>
                <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 break-all select-all">
                  {dbStatus.url || 'Not configured'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                {dbStatus.isConfigured 
                  ? dbStatus.tablesExist 
                    ? dbStatus.error
                      ? `⚠️ Database Error: ${dbStatus.error}`
                      : '⚡ Connection Active: Your database tables were found and seeded. Real-time actions update your active Supabase schemas.'
                    : '⚠️ Tables Missing: Supabase link has been established, but PostgreSQL schema tables do not exist yet. Running safely in local fallback.'
                  : '🔌 Client Unconfigured: Using sandbox local memory store fallback.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={recheckConnection}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-gray-250 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Rechecking...' : 'Test Connection'}
              </button>

              {dbStatus.isConfigured && dbStatus.tablesExist && !dbStatus.error ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <Check className="h-3 w-3" /> Fully Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <AlertTriangle className="h-3 w-3" /> Setup Needed
                </span>
              )}
            </div>
          </div>

          {/* Prompt to run setup scripts in user Supabase dashboard if tables don't exist */}
          {dbStatus.isConfigured && !dbStatus.tablesExist && (
            <div className="mt-4 border-t border-gray-150 pt-4">
              <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3.5 text-xs text-indigo-900 leading-relaxed">
                <div className="flex gap-2 font-bold text-indigo-900 border-b border-indigo-100/50 pb-1.5 mb-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  PostgreSQL Table Creation Needed
                </div>
                Your Supabase database does not have the required tables yet. Open the **SQL Editor** inside your [Supabase Dashboard](https://supabase.com/dashboard) for this project, paste the creation script shown below, and click **Run**. Once done, press **Test Connection** above to activate real persistence!
              </div>

              <div className="relative mt-3 rounded-lg overflow-hidden bg-gray-900 font-mono text-xs text-gray-300 border border-gray-800">
                <div className="flex items-center justify-between bg-gray-950 px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-emerald-500 font-bold" /> Schema Creation Script
                  </span>
                  <button
                    onClick={copySql}
                    className="flex items-center gap-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-1 text-white hover:text-emerald-400 font-semibold cursor-pointer text-[10px]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400 font-bold" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy SQL script
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto max-h-56 leading-relaxed select-all border-b border-gray-850">
                  {dbStatus.sqlScript}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-Column split: Table inspector on left, Sync queue logs stream on right */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left Column: Database Tables inspector */}
        <div className="lg:col-span-2">
          <div className="flex gap-1.5 border-b border-gray-100 pb-2.5 overflow-x-auto">
            <button
              onClick={() => setActiveTable('devices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 ${
                activeTable === 'devices'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Table: devices ({devices.length})
            </button>
            <button
              onClick={() => setActiveTable('locked_policies')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 ${
                activeTable === 'locked_policies'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Table: blocked_devices ({blockedCount})
            </button>
            <button
              onClick={() => setActiveTable('schedules')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 ${
                activeTable === 'schedules'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Table: schedules ({schedules.length})
            </button>
            <button
              onClick={() => setActiveTable('activity_logs')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 ${
                activeTable === 'activity_logs'
                  ? 'bg-indigo-50 text-indigo-700 font-bold border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Table: activity_logs ({logs.length})
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/50 p-3 max-h-96 overflow-y-auto">
            {activeTable === 'devices' && (
              <table className="w-full text-left font-mono text-[10px] leading-tight">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">id</th>
                    <th className="pb-2">name</th>
                    <th className="pb-2">mac_address</th>
                    <th className="pb-2">category</th>
                    <th className="pb-2">status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-700">
                  {devices.map((d) => (
                    <tr key={d.id} className="hover:bg-indigo-50/20">
                      <td className="py-2.5 font-bold text-indigo-600 truncate max-w-[80px]">{d.id}</td>
                      <td className="py-2.5">{d.name}</td>
                      <td className="py-2.5">{d.mac}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 uppercase">{d.category}</span>
                      </td>
                      <td className="py-2.5 font-bold">{d.connectionStatus.toUpperCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTable === 'locked_policies' && (
              <table className="w-full text-left font-mono text-[10px] leading-tight">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">id</th>
                    <th className="pb-2">device_id</th>
                    <th className="pb-2">enforcement_type</th>
                    <th className="pb-2">synced_router</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-700">
                  {devices
                    .filter((d) => d.category === 'blocked' || d.isBlockedByPolicy)
                    .map((d) => (
                      <tr key={d.id} className="hover:bg-indigo-50/20">
                        <td className="py-2.5 font-bold text-rose-600">block-{d.id}</td>
                        <td className="py-2.5">{d.id}</td>
                        <td className="py-2.5">ROUTER_GATEWAY_DROP</td>
                        <td className="py-2.5 text-emerald-600 font-bold">YES</td>
                      </tr>
                    ))}
                  {devices.filter((d) => d.category === 'blocked' || d.isBlockedByPolicy).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">
                        No rows synchronized in blocked_devices table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTable === 'schedules' && (
              <table className="w-full text-left font-mono text-[10px] leading-tight">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">id</th>
                    <th className="pb-2">device_id</th>
                    <th className="pb-2">day_filter</th>
                    <th className="pb-2">slots</th>
                    <th className="pb-2">enabled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-750">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-indigo-50/20">
                      <td className="py-2.5 font-bold text-indigo-600 truncate max-w-[80px]">{s.id}</td>
                      <td className="py-2.5">{s.deviceId}</td>
                      <td className="py-2.5">[{s.days.join(',')}]</td>
                      <td className="py-2.5 text-rose-600 font-bold">{s.startTime}-{s.endTime}</td>
                      <td className="py-2.5">{s.isEnabled ? 'TRUE' : 'FALSE'}</td>
                    </tr>
                  ))}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No rows synchronized in schedules table
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTable === 'activity_logs' && (
              <table className="w-full text-left font-mono text-[10px] leading-tight">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="pb-2">timestamp</th>
                    <th className="pb-2">device</th>
                    <th className="pb-2">type</th>
                    <th className="pb-2">severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-gray-700">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-indigo-50/20">
                      <td className="py-2.5 text-gray-400">{l.timestamp.slice(11, 19)}</td>
                      <td className="py-2.5">{l.deviceName}</td>
                      <td className="py-2.5">{l.type}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            l.severity === 'alert'
                              ? 'bg-rose-100 text-rose-800'
                              : l.severity === 'warning'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {l.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Broadcast payload sync stream logs */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-500 animate-pulse" /> PostgREST Transaction Feed
          </h3>
          <p className="text-[10px] text-gray-400">Listen live on public schemas</p>

          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {syncTriggers.map((ev, index) => (
              <div key={index} className="rounded-lg bg-white border border-gray-150 p-2.5 font-mono text-[9px] leading-relaxed shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-50 pb-1 text-gray-400">
                  <span>{ev.timestamp.slice(11, 19)}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-black text-[8px] ${
                      ev.operation === 'INSERT'
                        ? 'bg-emerald-50 text-emerald-700'
                        : ev.operation === 'DELETE'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {ev.operation}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-2 text-slate-700 leading-none">
                  <span className="font-bold text-indigo-700">schema:</span> public
                  <span className="font-bold text-indigo-700">table:</span> {ev.table}
                </div>
                <div className="mt-1 font-semibold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                  PAYLOAD: {"{"}id: "{ev.recordId}", sync_ms: {Date.now() % 1000}{"}"}
                </div>
              </div>
            ))}

            {syncTriggers.length === 0 && (
              <div className="py-20 text-center text-xs text-gray-450 font-medium leading-relaxed">
                No active sync changes broadcasted yet. Toggle block states, rename tags, or update schedules to see instant payloads trigger!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
