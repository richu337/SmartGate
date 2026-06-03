/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NetworkDevice, Network } from '../types.js';
import { Monitor, Wifi, ShieldAlert, Cpu, ArrowDown, ArrowUp, XCircle, RefreshCw } from 'lucide-react';

interface TraySimulatorProps {
  devices: NetworkDevice[];
  network: Network | null;
  onModifyDevice: (id: string, payload: Partial<NetworkDevice>) => Promise<void>;
  onRefresh: () => void;
  isSyncing: boolean;
}

export function TraySimulator({
  devices,
  network,
  onModifyDevice,
  onRefresh,
  isSyncing,
}: TraySimulatorProps) {
  const onlineDevices = devices.filter((d) => d.connectionStatus === 'online');

  return (
    <div className="flex flex-col items-center justify-center py-10 bg-slate-900 rounded-3xl p-6 border border-slate-705 shadow-xl">
      {/* Mock Desktop background frame wrapper */}
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/90 text-slate-100 p-5 shadow-2xl backdrop-blur-md">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4.5 w-4.5 text-indigo-400" />
            <div>
              <h3 className="text-xs font-bold tracking-tight text-white">Smart Access Tray Utility</h3>
              <p className="text-[10px] text-slate-500">v1.4.0 • Local Host Agent</p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400"
            title="Poll Gateway Network"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Current Connection status */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 border border-slate-800/60 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-slate-300">Rayhan_5G_Home</span>
          </div>

          <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            SECURE
          </span>
        </div>

        {/* Dynamic Throughputs */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-900/60 border border-slate-850 p-2 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ArrowDown className="h-3 w-3 text-emerald-500" /> Download
            </span>
            <h4 className="mt-1 text-sm font-black font-mono text-white">186.2 Mbps</h4>
          </div>

          <div className="rounded-lg bg-slate-900/60 border border-slate-850 p-2 text-center">
            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ArrowUp className="h-3 w-3 text-blue-500" /> Upload
            </span>
            <h4 className="mt-1 text-sm font-black font-mono text-white">42.5 Mbps</h4>
          </div>
        </div>

        {/* Interactive Quick Block */}
        <div className="mt-5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block pb-1.5">
            Quick Client Intercept
          </span>

          <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1">
            {onlineDevices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl bg-slate-900/40 hover:bg-slate-900/80 p-2.5 border border-slate-900"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{d.name}</h4>
                  <p className="text-[9px] font-mono text-slate-500">{d.ip} ({d.brand})</p>
                </div>

                <button
                  onClick={() =>
                    onModifyDevice(d.id, {
                      isBlockedByPolicy: true,
                      category: 'blocked',
                    })
                  }
                  className="rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white px-2 py-1 text-[10px] font-bold text-rose-400 border border-rose-500/20"
                >
                  Intercept Lease
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Windows Taskbar alignment message */}
        <div className="mt-5 border-t border-slate-850 pt-3 text-center text-[10px] font-semibold text-slate-500">
          Sync status: Supabase Realtime connected.
        </div>
      </div>
    </div>
  );
}
