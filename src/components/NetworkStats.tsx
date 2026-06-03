/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDown, ArrowUp, Wifi, ShieldAlert, Laptop, CheckCircle, Database, Smartphone } from 'lucide-react';
import { NetworkDevice, Network } from '../types.js';

interface NetworkStatsProps {
  devices: NetworkDevice[];
  network: Network | null;
  logsCount: number;
}

export function NetworkStats({ devices, network, logsCount }: NetworkStatsProps) {
  const onlineCount = devices.filter((d) => d.connectionStatus === 'online').length;
  const blockedCount = devices.filter((d) => d.category === 'blocked' || d.isBlockedByPolicy).length;
  const suspiciousCount = devices.filter((d) => d.connectionStatus === 'online' && (d.riskRating === 'suspicious' || d.riskRating === 'critical')).length;

  // Compute live cumulative bandwidth speeds
  const totalDownload = devices
    .filter((d) => d.connectionStatus === 'online')
    .reduce((sum, d) => sum + d.downloadSpeed, 0);
  const totalUpload = devices
    .filter((d) => d.connectionStatus === 'online')
    .reduce((sum, d) => sum + d.uploadSpeed, 0);

  // Bandwidth history list (points to draw an SVG line chart)
  const chartPoints = [24, 45, 38, 55, 78, 62, 105, 95, totalDownload || 50];
  const maxVal = Math.max(...chartPoints, 120);
  const svgWidth = 500;
  const svgHeight = 110;
  const padding = 10;

  // Generate SVG coordinates for a smooth curved line
  const coordinates = chartPoints.map((val, i) => {
    const x = padding + (i * (svgWidth - padding * 2)) / (chartPoints.length - 1);
    const y = svgHeight - padding - (val / maxVal) * (svgHeight - padding * 2);
    return { x, y };
  });

  // Create SVG path string
  let linePath = '';
  coordinates.forEach((point, i) => {
    if (i === 0) {
      linePath += `M ${point.x} ${point.y}`;
    } else {
      // smooth interpolation curve
      const prev = coordinates[i - 1];
      const cx = (prev.x + point.x) / 2;
      linePath += `C ${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
    }
  });

  // Create SVG filled area path string
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${svgHeight - padding} L ${coordinates[0].x} ${svgHeight - padding} Z`;

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {/* Active Device Dashboard Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Active Interfaces
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Wifi className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{onlineCount}</span>
          <span className="text-xs text-brand-secondary font-medium text-gray-500">
            of {devices.length} registered
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            <CheckCircle className="h-3 w-3" /> Fully Synced
          </span>
          {suspiciousCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 animate-pulse">
              <ShieldAlert className="h-3 w-3" /> {suspiciousCount} Security Alert
            </span>
          )}
        </div>
      </div>

      {/* Real-time Bandwidth Metrics */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Download Throughput
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowDown className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-gray-900">
            {totalDownload.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-gray-500">Mbps</span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-150 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
            style={{ width: `${Math.min((totalDownload / 450) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Upload Speed Rates */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Upload Throughput
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ArrowUp className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-gray-900">
            {totalUpload.toFixed(1)}
          </span>
          <span className="text-sm font-semibold text-gray-500">Mbps</span>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-150 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
            style={{ width: `${Math.min((totalUpload / 50) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Connection Medium Mix */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Admin Blocking Rules
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <ShieldAlert className="h-4.5 w-4.5" />
          </span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{blockedCount}</span>
          <span className="text-xs font-medium text-gray-500">
            devices isolated
          </span>
        </div>
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1.5 font-medium leading-none">
          <Database className="h-3.5 w-3.5 text-indigo-500" />
          Realtime synched logs: {logsCount} rows
        </div>
      </div>

      {/* SVG Bandwidth Over-Time Chart Banner */}
      <div className="col-span-1 md:col-span-4 rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Traffic Distribution</h3>
            <p className="text-xs text-gray-500">Network load trend across active leases over last 15 seconds</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Download Bandwidth (Peak: {maxVal.toFixed(0)} Mbps)
            </div>
          </div>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl bg-white p-3 border border-gray-100">
          <svg className="w-full h-28" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Horizontal Gridlines */}
            <line x1="0" y1={padding} x2={svgWidth} y2={padding} stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1={svgHeight - padding} x2={svgWidth} y2={svgHeight - padding} stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Area Path */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Line Path */}
            <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

            {/* Dynamic Data Target Node Circles */}
            {coordinates.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === coordinates.length - 1 ? '4' : '2'}
                fill={i === coordinates.length - 1 ? '#10b981' : '#ffffff'}
                stroke="#10b981"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
