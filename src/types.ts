/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeviceCategory = 'trusted' | 'guest' | 'blocked';
export type DeviceType = 'phone' | 'laptop' | 'tv' | 'smart_home' | 'tablet' | 'gaming' | 'camera' | 'unknown';
export type ConnectionStatus = 'online' | 'offline';
export type ConnectionType = 'wifi_2.4' | 'wifi_5' | 'ethernet' | 'hotspot';
export type UserRole = 'admin' | 'viewer';

export interface Network {
  id: string;
  name: string;
  type: 'wifi' | 'hotspot';
  ssid: string;
  isManaged: boolean;
  gatewayIp: string;
  signalQuality: number;
}

export interface NetworkDevice {
  id: string;
  name: string;
  brand: string;
  type: DeviceType;
  ip: string;
  mac: string;
  connectionStatus: ConnectionStatus;
  connectionType: ConnectionType;
  signalStrength: number; // 0 to 100
  uploadSpeed: number; // in Mbps or Kbps
  downloadSpeed: number; // in Mbps or Kbps
  category: DeviceCategory;
  lastActive: string;
  isBlockedByPolicy: boolean;
  registeredAt: string;
  riskRating: 'safe' | 'low' | 'suspicious' | 'critical';
  riskDetails: string;
}

export interface AccessSchedule {
  id: string;
  deviceId: string;
  deviceName: string;
  name: string;
  days: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
  isEnabled: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  deviceName: string;
  deviceMac: string;
  type: 'connection' | 'disconnection' | 'block' | 'unblock' | 'rule_trigger' | 'security_alert';
  details: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface SupabaseSyncStats {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  timestamp: string;
  status: 'synced' | 'pending';
}
