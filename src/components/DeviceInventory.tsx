/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tv,
  HelpCircle,
  Home,
  Tablet,
  Gamepad2,
  Camera,
  Search,
  SlidersHorizontal,
  Edit2,
  Ban,
  Slash,
  BotOff,
  Bot,
  Percent,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Activity,
  Trash2,
  Plus
} from 'lucide-react';
import { NetworkDevice, DeviceCategory, DeviceType, UserRole } from '../types.js';

interface DeviceInventoryProps {
  devices: NetworkDevice[];
  userRole: UserRole;
  onModifyDevice: (id: string, payload: Partial<NetworkDevice>) => Promise<void>;
  onTriggerAIScan: (id: string) => Promise<any>;
  secReports: Record<string, any>;
  scanningIds: string[];
  onAddDevice?: (payload: {
    name: string;
    brand?: string;
    type?: DeviceType;
    ip?: string;
    mac: string;
    category?: DeviceCategory;
  }) => Promise<void>;
  onDeleteDevice?: (id: string) => Promise<void>;
}

export function DeviceInventory({
  devices,
  userRole,
  onModifyDevice,
  onTriggerAIScan,
  secReports,
  scanningIds,
  onAddDevice,
  onDeleteDevice,
}: DeviceInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<DeviceCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Custom add device form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newDevBrand, setNewDevBrand] = useState('');
  const [newDevMac, setNewDevMac] = useState('');
  const [newDevIp, setNewDevIp] = useState('');
  const [newDevType, setNewDevType] = useState<DeviceType>('phone');
  const [newDevCategory, setNewDevCategory] = useState<DeviceCategory>('trusted');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreateDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newDevName.trim()) {
      setFormError('A recognizable device nickname is required.');
      return;
    }
    if (!newDevMac.trim()) {
      setFormError('Physical Hardware MAC address is required.');
      return;
    }

    // Basic MAC address format validator: xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newDevMac.trim())) {
      setFormError('Invalid MAC format. Standard format: AA:BB:CC:DD:EE:FF');
      return;
    }

    if (onAddDevice) {
      try {
        await onAddDevice({
          name: newDevName.trim(),
          brand: newDevBrand.trim() || undefined,
          type: newDevType,
          ip: newDevIp.trim() || undefined,
          mac: newDevMac.trim(),
          category: newDevCategory
        });
        setFormSuccess('Device joined the network list successfully!');
        setNewDevName('');
        setNewDevBrand('');
        setNewDevMac('');
        setNewDevIp('');
        setTimeout(() => {
          setShowAddForm(false);
          setFormSuccess('');
        }, 1500);
      } catch (err: any) {
        setFormError(err.message || 'Failed to submit registration request.');
      }
    }
  };

  // Filter devices
  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip.includes(searchTerm) ||
      d.mac.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || d.connectionStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Render device group icons
  const getDeviceIcon = (type: DeviceType) => {
    const className = "h-5 w-5";
    switch (type) {
      case 'laptop':
        return <Laptop className={className} />;
      case 'phone':
        return <Smartphone className={className} />;
      case 'tv':
        return <Tv className={className} />;
      case 'smart_home':
        return <Home className={className} />;
      case 'tablet':
        return <Tablet className={className} />;
      case 'gaming':
        return <Gamepad2 className={className} />;
      case 'camera':
        return <Camera className={className} />;
      default:
        return <HelpCircle className={className} />;
    }
  };

  const getSignalColor = (strength: number) => {
    if (strength >= 80) return 'text-emerald-500 bg-emerald-50';
    if (strength >= 50) return 'text-amber-500 bg-amber-50';
    return 'text-rose-500 bg-rose-50';
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const saveRename = async (id: string) => {
    if (editName.trim()) {
      await onModifyDevice(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleBlockToggle = async (device: NetworkDevice) => {
    if (userRole === 'viewer') return;
    const isBlocking = !device.isBlockedByPolicy;
    await onModifyDevice(device.id, {
      isBlockedByPolicy: isBlocking,
      category: isBlocking ? 'blocked' : 'trusted',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Table search toolbar header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Device Inventory</h2>
          <p className="text-xs text-gray-500">
            View, block, or run AI scans on devices leasing subnets
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Searching */}
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Name, IP, MAC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-60 rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs focus:bg-white focus:outline-indigo-500"
            />
          </div>

          {/* Filtering dropdown category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as DeviceCategory | 'all')}
            className="h-9 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-600 focus:bg-white focus:outline-indigo-505"
          >
            <option value="all">All Profiles</option>
            <option value="trusted">Trusted Only</option>
            <option value="guest">Guest Only</option>
            <option value="blocked">Blocked Only</option>
          </select>

          {/* Filtering drop status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'online' | 'offline')}
            className="h-9 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-600 focus:bg-white focus:outline-indigo-505"
          >
            <option value="all">All States</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          {/* New custom manual registry option */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Device
          </button>
        </div>
      </div>

      {/* Manual enrollment form drawer block */}
      {showAddForm && (
        <form onSubmit={handleCreateDeviceSubmit} className="my-5 rounded-xl border border-indigo-150 bg-indigo-50/20 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Enrol Live Hardware Device
          </h3>
          <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Device Name/Nickname *</label>
              <input
                type="text"
                required
                placeholder="e.g. My-Real-Galaxy-S24"
                value={newDevName}
                onChange={(e) => setNewDevName(e.target.value)}
                className="mt-1 h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-indigo-505"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">MAC Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 70:89:D3:45:12:AA"
                value={newDevMac}
                onChange={(e) => setNewDevMac(e.target.value)}
                className="mt-1 h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-indigo-505"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Manufacturer / Brand</label>
              <input
                type="text"
                placeholder="e.g. Samsung Electronics"
                value={newDevBrand}
                onChange={(e) => setNewDevBrand(e.target.value)}
                className="mt-1 h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-indigo-505"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Device Type Category</label>
              <select
                value={newDevType}
                onChange={(e) => setNewDevType(e.target.value as DeviceType)}
                className="mt-1 h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-indigo-505"
              >
                <option value="phone">Smartphone</option>
                <option value="laptop">Laptop / PC</option>
                <option value="tablet">Tablet / iPad</option>
                <option value="tv">Smart TV / Box</option>
                <option value="smart_home">Iot Hub / Smart Home</option>
                <option value="gaming">Console / Gaming</option>
                <option value="camera">Security Camera</option>
                <option value="unknown">Other/Generic Device</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Managed IP Address (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank for auto DHCP lease"
                value={newDevIp}
                onChange={(e) => setNewDevIp(e.target.value)}
                className="mt-1 h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-indigo-505"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Default Access Profile</label>
              <select
                value={newDevCategory}
                onChange={(e) => setNewDevCategory(e.target.value as DeviceCategory)}
                className="mt-1 h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs focus:outline-indigo-505"
              >
                <option value="trusted">Trusted Client Access</option>
                <option value="guest">Guest Captive Portal</option>
                <option value="blocked">Blocked Blacklist Interceptor</option>
              </select>
            </div>
          </div>

          {formError && <p className="mt-3.5 text-xs font-semibold text-rose-600">{formError}</p>}
          {formSuccess && <p className="mt-3.5 text-xs font-semibold text-emerald-600">{formSuccess}</p>}

          <div className="mt-4 flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg bg-gray-100 px-3.5 py-1.5 font-semibold text-gray-650 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-650 px-4 py-1.5 font-bold text-white hover:bg-indigo-700 font-sans"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      )}

      {/* Grid of Devices */}
      <div className="mt-6 divide-y divide-gray-100">
        {filteredDevices.length === 0 ? (
          <div className="py-12 text-center">
            <SlidersHorizontal className="mx-auto h-10 w-10 text-gray-300" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900">No devices found</h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your lookup keywords or state filters.
            </p>
          </div>
        ) : (
          filteredDevices.map((d) => {
            const isScanning = scanningIds.includes(d.id);
            const aiReport = secReports[d.id];
            const isBlocked = d.category === 'blocked' || d.isBlockedByPolicy;

            return (
              <div key={d.id} className="py-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Device Summary */}
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xs ${
                        isBlocked
                          ? 'bg-rose-50 text-rose-600'
                          : d.connectionStatus === 'online'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {getDeviceIcon(d.type)}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {editingId === d.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-7 w-48 rounded border border-gray-300 px-2 text-xs font-medium focus:outline-indigo-500"
                              autoFocus
                            />
                            <button
                              onClick={() => saveRename(d.id)}
                              className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-semibold text-gray-900">{d.name}</h3>
                            <button
                              onClick={() => startRename(d.id, d.name)}
                              className="text-gray-400 hover:text-indigo-600"
                              title="Rename Device label"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </>
                        )}

                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                            d.category === 'trusted'
                              ? 'bg-emerald-50 text-emerald-700'
                              : d.category === 'guest'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {d.category.toUpperCase()}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                            d.connectionStatus === 'online'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-150 text-gray-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              d.connectionStatus === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          {d.connectionStatus.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-gray-500">
                        <span>IP: {d.ip}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>MAC: {d.mac}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>Brand: {d.brand}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Widgets */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
                    {/* Signal status */}
                    {d.connectionStatus === 'online' && (
                      <div
                        className={`hidden md:flex flex-col items-end rounded-lg p-2 ${getSignalColor(
                          d.signalStrength
                        )}`}
                      >
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase">
                          <Activity className="h-3 w-3" /> Signal Strength
                        </span>
                        <span className="text-xs font-bold font-mono">{d.signalStrength}%</span>
                      </div>
                    )}

                    {/* Bandwidth Usage indicators */}
                    {d.connectionStatus === 'online' && (
                      <div className="flex gap-2 rounded-lg bg-gray-50 border border-gray-100 p-1.5 text-[11px] font-mono font-medium">
                        <span className="text-emerald-600 flex items-center gap-0.5" title="Download">
                          ↓{d.downloadSpeed.toFixed(1)}M
                        </span>
                        <span className="text-blue-500 flex items-center gap-0.5" title="Upload">
                          ↑{d.uploadSpeed.toFixed(1)}M
                        </span>
                      </div>
                    )}

                    {/* Expand scan reports drawer */}
                    <button
                      onClick={() => toggleExpand(d.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100"
                      title="Inspect Risk Audit file"
                    >
                      {expandedId === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {/* Main trigger AI scan */}
                    <button
                      onClick={() => onTriggerAIScan(d.id)}
                      disabled={isScanning}
                      className={`flex h-9 items-center gap-1.5 px-3 rounded-xl border font-semibold text-xs transition-colors ${
                        isScanning
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300'
                      }`}
                    >
                      <Bot className={`h-4 w-4 ${isScanning ? 'animate-bounce' : ''}`} />
                      {isScanning ? 'AI Evaluating...' : 'AI Risk Audit'}
                    </button>

                    {/* Block / Unblock Policy Switch */}
                    <button
                      onClick={() => handleBlockToggle(d)}
                      disabled={userRole === 'viewer'}
                      className={`flex h-9 items-center gap-1.5 px-3.5 rounded-xl font-bold text-xs transition-all ${
                        userRole === 'viewer'
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                          : isBlocked
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                      title={userRole === 'viewer' ? 'Administrative authorization required' : ''}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      {isBlocked ? 'Restore Access' : 'Instantly Block'}
                    </button>

                    {/* Delete action button */}
                    {onDeleteDevice && (
                      confirmDeleteId === d.id ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteDevice(d.id);
                              setConfirmDeleteId(null);
                            }}
                            className="flex h-9 px-3 items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold transition sm:whitespace-nowrap"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex h-9 px-2 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 text-xs font-semibold transition sm:whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(d.id)}
                          disabled={userRole === 'viewer'}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/70 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition disabled:opacity-40"
                          title={userRole === 'viewer' ? 'Administrative authorization required' : 'Delete Device Lease'}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Expanding AI Audit Details Drawer */}
                {(expandedId === d.id || aiReport) && (
                  <div className="mt-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                      <div className="flex items-center gap-1.5 font-semibold text-indigo-900 text-xs">
                        <Bot className="h-4.5 w-4.5 text-indigo-600" />
                        AI Cybersecurity Threat Audit File
                      </div>
                      <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> System Analysed: 2026-05-31
                      </span>
                    </div>

                    {isScanning ? (
                      <div className="py-4 text-center text-xs text-indigo-600 font-medium">
                        Evaluating micro-firmware packet profiles using standard home gateway patterns... Just a moment.
                      </div>
                    ) : aiReport ? (
                      <div className="mt-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start">
                          {/* Risk meter */}
                          <div className="flex flex-col items-center rounded-lg bg-white border border-indigo-100 p-3 text-center md:w-36 shadow-xs">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">Risk Level</span>
                            <span
                              className={`mt-1 text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                                aiReport.riskRating === 'critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : aiReport.riskRating === 'suspicious'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {aiReport.riskRating || 'low'}
                            </span>
                            <div className="mt-3 relative flex items-center justify-center">
                              <span className="text-xl font-black text-gray-800 tracking-tight font-mono">
                                {aiReport.riskScore || 10}
                              </span>
                              <span className="text-[9px] text-gray-500 font-bold ml-0.5">/100</span>
                            </div>
                          </div>

                          {/* Assessment and findings */}
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-indigo-900">Executive Summary Assessment</h4>
                            <p className="mt-1 text-xs leading-relaxed text-indigo-950 font-medium bg-white p-2.5 rounded-lg border border-indigo-100">
                              {aiReport.executiveSummary || aiReport.riskDetails || 'No report available yet.'}
                            </p>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              {/* Detailed findings */}
                              <div>
                                <h5 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">
                                  Structural Findings
                                </h5>
                                <ul className="mt-1.5 space-y-1 text-[11px] text-indigo-950 list-disc list-inside">
                                  {aiReport.detailedFindings?.map((item: string, i: number) => (
                                    <li key={i} className="font-medium">{item}</li>
                                  )) || <li>Normal packet transmissions registered at port interfaces.</li>}
                                </ul>
                              </div>

                              {/* Actions */}
                              <div>
                                <h5 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide">
                                  Actions & Mitigation Guides
                                </h5>
                                <ul className="mt-1.5 space-y-1 text-[11px] text-indigo-950 list-disc list-inside">
                                  {aiReport.securityRecommendations?.map((item: string, i: number) => (
                                    <li key={i} className="font-medium text-indigo-800">{item}</li>
                                  )) || <li>No risk mitigation required. Active lease is verified.</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Synced database confirmation block */}
                        <div className="mt-4 flex items-center justify-between border-t border-indigo-100 pt-3 text-[10px] font-semibold text-indigo-500">
                          <span>Report synchronized via Supabase Edge Function Realtime stream.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-col items-center justify-center py-4 bg-white/70 rounded-lg text-center">
                        <AlertTriangle className="h-6 w-6 text-indigo-400" />
                        <span className="mt-1.5 text-xs text-indigo-950 font-semibold">
                          No active threat report compiled for this device MAC.
                        </span>
                        <p className="mt-0.5 text-[10px] text-indigo-600">
                          Click the 'AI Risk Audit' button above to call server-side Gemini threat evaluation.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
