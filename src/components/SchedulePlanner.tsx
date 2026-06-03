/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NetworkDevice, AccessSchedule, UserRole } from '../types.js';
import { Clock, Plus, Trash2, Calendar, ShieldAlert, Lock, Power } from 'lucide-react';

interface SchedulePlannerProps {
  schedules: AccessSchedule[];
  devices: NetworkDevice[];
  userRole: UserRole;
  onAddSchedule: (payload: {
    deviceId: string;
    name: string;
    days: number[];
    startTime: string;
    endTime: string;
  }) => Promise<void>;
  onDeleteSchedule: (id: string) => Promise<void>;
  onToggleSchedule: (id: string) => Promise<void>;
}

export function SchedulePlanner({
  schedules,
  devices,
  userRole,
  onAddSchedule,
  onDeleteSchedule,
  onToggleSchedule,
}: SchedulePlannerProps) {
  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('07:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // weekdays default
  const [isFormOpen, setIsFormOpen] = useState(false);

  const daysLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    if (!name || !deviceId || !startTime || !endTime) return;

    await onAddSchedule({
      deviceId,
      name,
      days: selectedDays,
      startTime,
      endTime,
    });

    // Reset state
    setName('');
    setDeviceId('');
    setStartTime('20:00');
    setEndTime('07:00');
    setIsFormOpen(false);
  };

  const getDeviceName = (id: string) => {
    const dev = devices.find((d) => d.id === id);
    return dev ? dev.name : 'Unknown Device';
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Access Schedules & Parental Controls</h2>
          <p className="text-xs text-gray-500">
            Automatically enable or disable Wi-Fi access according to calendar slots
          </p>
        </div>

        {userRole === 'admin' && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            {isFormOpen ? 'Cancel Rule' : 'Add Time Restriction'}
          </button>
        )}
      </div>

      {userRole === 'viewer' && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-orange-50 border border-orange-100 p-3.5 text-xs text-orange-850 font-medium leading-relaxed">
          <Lock className="h-4 w-4 text-orange-500 shrink-0" />
          <span>
            Parental and scheduler overrides are locked under <strong>Family / Guest accounts</strong>. Switch roles in the top navbar to customize router rules.
          </span>
        </div>
      )}

      {/* Form Overlay */}
      {isFormOpen && userRole === 'admin' && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Configure Rule Access Policy</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600">Rule / Lockout Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bedtime Social Lockdown"
                className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-indigo-505"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600">Target Network Device</label>
              <select
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-indigo-505"
                required
              >
                <option value="">Choose Device...</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600">Blockout Start Slot (24h)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-indigo-505"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600">Blockout End Slot (24h)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:outline-indigo-505"
                required
              />
            </div>
          </div>

          {/* Day selection */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-600">Active Rule Days</label>
            <div className="mt-2 flex gap-1.5">
              {daysLabel.map((label, index) => {
                const isActive = selectedDays.includes(index);
                return (
                  <button
                    type="button"
                    key={index}
                    onClick={() => toggleDay(index)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold border transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="h-9 px-3 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Discard
            </button>
            <button
              type="submit"
              className="h-9 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
            >
              Apply Restriction
            </button>
          </div>
        </form>
      )}

      {/* Access Rule Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {schedules.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-gray-300" />
            <h3 className="mt-2.5 text-xs font-semibold text-gray-900">No scheduling filters configured</h3>
            <p className="text-[11px] text-gray-500">All registered devices possess unrestricted 24/7 routing access</p>
          </div>
        ) : (
          schedules.map((s) => {
            return (
              <div
                key={s.id}
                className={`rounded-xl border border-gray-150 p-4.5 bg-white shadow-xs transition-opacity ${
                  s.isEnabled ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        s.isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{s.name}</h4>
                      <span className="text-[10px] text-indigo-500 font-bold">{getDeviceName(s.deviceId)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => onToggleSchedule(s.id)}
                      disabled={userRole === 'viewer'}
                      className={`flex h-6 w-10 items-center rounded-full transition-colors ${
                        s.isEnabled ? 'bg-emerald-500' : 'bg-gray-200'
                      } ${userRole === 'viewer' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          s.isEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Delete button */}
                    {userRole === 'admin' && (
                      <button
                        onClick={() => onDeleteSchedule(s.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete scheduling policy rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Slot limits and days */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="text-[11px] text-gray-500 font-medium">
                    <span className="font-semibold text-gray-800">Closed Window: </span>
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-rose-600 font-bold">
                      {s.startTime} - {s.endTime}
                    </span>
                  </div>

                  <div className="flex gap-1.5 text-[9px] font-bold">
                    {daysLabel.map((label, idx) => {
                      const isActive = s.days.includes(idx);
                      return (
                        <span
                          key={idx}
                          className={`inline-block px-1 leading-none ${
                            isActive ? 'text-indigo-600' : 'text-gray-300'
                          }`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
