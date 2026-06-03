/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NetworkDevice, UserRole } from '../types.js';
import { Shield, ShieldAlert, CheckCircle, Bot, AlertTriangle, ShieldCheck, HeartPulse, HelpCircle } from 'lucide-react';

interface SecurityRadarProps {
  devices: NetworkDevice[];
  onTriggerAIScan: (id: string) => Promise<any>;
  secReports: Record<string, any>;
  scanningIds: string[];
}

export function SecurityRadar({
  devices,
  onTriggerAIScan,
  secReports,
  scanningIds,
}: SecurityRadarProps) {
  const suspiciousDevices = devices.filter((d) => d.riskRating === 'suspicious' || d.riskRating === 'critical');
  const criticalCount = devices.filter((d) => d.riskRating === 'critical').length;
  const suspiciousCount = devices.filter((d) => d.riskRating === 'suspicious').length;

  // Calculate overall network threat rating
  let networkHealthScore = 100;
  devices.forEach((d) => {
    if (d.riskRating === 'critical') networkHealthScore -= 25;
    else if (d.riskRating === 'suspicious') networkHealthScore -= 15;
    else if (d.riskRating === 'low') networkHealthScore -= 5;
  });
  networkHealthScore = Math.max(networkHealthScore, 20);

  const getHealthLabel = (score: number) => {
    if (score >= 85) return { text: 'EXCELLENT', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 60) return { text: 'MODERATE', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: 'COMPROMISED RISK', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const health = getHealthLabel(networkHealthScore);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Network Health Shield */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 leading-none">
            <Shield className="h-4.5 w-4.5 text-indigo-600" /> Network Security Shield
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Computed aggregate health rating of local interfaces
          </p>
        </div>

        <div className="my-6 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-indigo-50/50 p-6">
            <HeartPulse className={`h-12 w-12 ${networkHealthScore >= 80 ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`} />
          </div>
          <div className="mt-4 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold text-gray-900 tracking-tight font-mono">
              {networkHealthScore}
            </span>
            <span className="text-xs text-gray-400 font-bold">/100</span>
          </div>
          <span className={`inline-block mt-2 rounded-full border px-3 py-1 text-[10px] font-bold ${health.color}`}>
            {health.text}
          </span>
        </div>

        <div className="text-[11px] text-gray-500 leading-normal border-t border-gray-50 pt-3">
          Our security firewall tracks MAC addresses against officially reported vendor prefixes to identify rogue client spoof devices.
        </div>
      </div>

      {/* Flagged Node Status */}
      <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Rogue Flags & Intercept Hub</h3>
        <p className="text-xs text-gray-500">Unverified OUI, port scan telemetry, or active blacklisted devices</p>

        <div className="mt-4 space-y-3">
          {suspiciousDevices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-emerald-600" />
              <h4 className="mt-2 text-xs font-bold text-emerald-900">Zero active threats detected</h4>
              <p className="mt-1 text-[10px] text-emerald-600 font-medium">All subnets are clean. Standard encryption parameters verified.</p>
            </div>
          ) : (
            suspiciousDevices.map((d) => (
              <div
                key={d.id}
                className={`rounded-xl border p-4 flex flex-col justify-between sm:flex-row sm:items-center ${
                  d.riskRating === 'critical'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      d.riskRating === 'critical' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      {d.name}
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          d.riskRating === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {d.riskRating.toUpperCase()}
                      </span>
                    </h4>
                    <p className="text-[10px] leading-relaxed text-gray-600 mt-1 font-medium italic">
                      "{d.riskDetails || 'Requires immediate evaluation.'}"
                    </p>
                    <div className="mt-2 flex gap-3 text-[10px] font-mono text-gray-500">
                      <span>IP: {d.ip}</span>
                      <span>MAC: {d.mac}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => onTriggerAIScan(d.id)}
                    disabled={scanningIds.includes(d.id)}
                    className="rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-slate-800 font-semibold px-3 py-1.5 text-xs shadow-xs flex items-center gap-1"
                  >
                    <Bot className="h-3.5 w-3.5" /> AI Scan
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Network Security Knowledge Base Box */}
      <div className="col-span-1 md:col-span-3 rounded-2xl border border-gray-100 bg-gray-50 p-5 mt-2">
        <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
          <HelpCircle className="h-4 w-4" /> Understanding Security Terms & Mitigations
        </h4>
        <div className="mt-3.5 grid gap-4 md:grid-cols-3 text-xs leading-relaxed text-gray-600">
          <div className="rounded-xl bg-white border border-gray-150 p-4">
            <span className="font-bold text-gray-900 block pb-1 border-b border-gray-55">What is MAC OUI Check?</span>
            <p className="mt-2 text-[11px]">
              OUI (Organizationally Unique Identifier) corresponds to the first 3 octets of a MAC address. Rogue actors can spoof common brand names, but AI deep scanning cross-checks registered hardware behaviors against real OUI logs to flag inconsistencies.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-gray-150 p-4">
            <span className="font-bold text-gray-900 block pb-1 border-b border-gray-55">VLAN & Isolation</span>
            <p className="mt-2 text-[11px]">
              If you host guest users or suspect smart IoT nodes (like generic ESP32 bulbs), isolating them in secondary WiFi Guest VLANs blocks their physical ability to discover and scan local server folders or PC workstations.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-gray-150 p-4">
            <span className="font-bold text-gray-900 block pb-1 border-b border-gray-55">Parental Scheduling Tips</span>
            <p className="mt-2 text-[11px]">
              Instead of manually locking children's laptops, pre-enforced timing blocks can shut down individual network access. This reduces active wireless load and is executed at the router hardware layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
