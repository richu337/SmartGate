/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { NetworkDevice, AccessSchedule, ActivityLog, Network } from './src/types.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Environment
import dotenv from 'dotenv';
dotenv.config();

// Create Supabase Client
let supabase: any = null;
let isDbActive = false;
let lastDbError: string | null = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    console.log('Supabase client initialized with URL:', process.env.SUPABASE_URL);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

// Map database structures back and forth
function mapDeviceToFront(d: any): NetworkDevice {
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    type: d.type,
    ip: d.ip,
    mac: d.mac,
    connectionStatus: d.connection_status,
    connectionType: d.connection_type,
    signalStrength: d.signal_strength ?? 0,
    uploadSpeed: d.upload_speed ?? 0,
    downloadSpeed: d.download_speed ?? 0,
    category: d.category,
    lastActive: d.last_active,
    isBlockedByPolicy: !!d.is_blocked_by_policy,
    registeredAt: d.registered_at,
    riskRating: d.risk_rating || 'safe',
    riskDetails: d.risk_details || '',
  };
}

function mapDeviceToDb(d: Partial<NetworkDevice>): any {
  const db: any = {};
  if (d.id !== undefined) db.id = d.id;
  if (d.name !== undefined) db.name = d.name;
  if (d.brand !== undefined) db.brand = d.brand;
  if (d.type !== undefined) db.type = d.type;
  if (d.ip !== undefined) db.ip = d.ip;
  if (d.mac !== undefined) db.mac = d.mac;
  if (d.connectionStatus !== undefined) db.connection_status = d.connectionStatus;
  if (d.connectionType !== undefined) db.connection_type = d.connectionType;
  if (d.signalStrength !== undefined) db.signal_strength = d.signalStrength;
  if (d.uploadSpeed !== undefined) db.upload_speed = d.uploadSpeed;
  if (d.downloadSpeed !== undefined) db.download_speed = d.downloadSpeed;
  if (d.category !== undefined) db.category = d.category;
  if (d.lastActive !== undefined) db.last_active = d.lastActive;
  if (d.isBlockedByPolicy !== undefined) db.is_blocked_by_policy = d.isBlockedByPolicy;
  if (d.registeredAt !== undefined) db.registered_at = d.registeredAt;
  if (d.riskRating !== undefined) db.risk_rating = d.riskRating;
  if (d.riskDetails !== undefined) db.risk_details = d.riskDetails;
  return db;
}

function mapScheduleToFront(s: any): AccessSchedule {
  return {
    id: s.id,
    deviceId: s.device_id,
    deviceName: s.device_name,
    name: s.name,
    days: s.days || [],
    startTime: s.start_time,
    endTime: s.end_time,
    isEnabled: !!s.is_enabled,
  };
}

function mapScheduleToDb(s: any): any {
  const db: any = {};
  if (s.id !== undefined) db.id = s.id;
  if (s.deviceId !== undefined) db.device_id = s.deviceId;
  if (s.deviceName !== undefined) db.device_name = s.deviceName;
  if (s.name !== undefined) db.name = s.name;
  if (s.days !== undefined) db.days = s.days;
  if (s.startTime !== undefined) db.start_time = s.startTime;
  if (s.endTime !== undefined) db.end_time = s.endTime;
  if (s.isEnabled !== undefined) db.is_enabled = s.isEnabled;
  return db;
}

function mapLogToFront(l: any): ActivityLog {
  return {
    id: l.id,
    timestamp: l.timestamp,
    deviceName: l.device_name,
    deviceMac: l.device_mac,
    type: l.type,
    details: l.details,
    severity: l.severity,
  };
}

function mapLogToDb(l: any): any {
  return {
    id: l.id,
    timestamp: l.timestamp,
    device_name: l.deviceName,
    device_mac: l.deviceMac,
    type: l.type,
    details: l.details,
    severity: l.severity,
  };
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom User-Agent for standard telemetry
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini AI billing SDK initialized successfully key.');
  } else {
    console.warn('GEMINI_API_KEY is not defined in the environment. AI scanning will be simulated.');
  }
} catch (e) {
  console.error('Failed to initialize Gemini Client:', e);
}

// In-Memory Simulated Database
let currentNetwork: Network = {
  id: 'net-main-001',
  name: 'Home Fiber Ultra',
  type: 'wifi',
  ssid: 'Rayhan_5G_Home',
  isManaged: true,
  gatewayIp: '192.168.1.1',
  signalQuality: 98,
};

let devices: NetworkDevice[] = [
  {
    id: 'dev-001',
    name: 'Rayhan-MacBook-Pro',
    brand: 'Apple Inc.',
    type: 'laptop',
    ip: '192.168.1.102',
    mac: '1A:2B:3C:4D:5E:6F',
    connectionStatus: 'online',
    connectionType: 'wifi_5',
    signalStrength: 95,
    uploadSpeed: 4.8,
    downloadSpeed: 124.5,
    category: 'trusted',
    lastActive: new Date().toISOString(),
    isBlockedByPolicy: false,
    registeredAt: '2026-05-15T08:12:00Z',
    riskRating: 'safe',
    riskDetails: 'Verified administrator workstation. Clean security profile.',
  },
  {
    id: 'dev-002',
    name: 'Rayhan-iPhone-15',
    brand: 'Apple Inc.',
    type: 'phone',
    ip: '192.168.1.105',
    mac: '70:89:D3:45:12:AA',
    connectionStatus: 'online',
    connectionType: 'wifi_5',
    signalStrength: 82,
    uploadSpeed: 2.1,
    downloadSpeed: 45.3,
    category: 'trusted',
    lastActive: new Date().toISOString(),
    isBlockedByPolicy: false,
    registeredAt: '2026-05-15T08:15:00Z',
    riskRating: 'safe',
    riskDetails: 'Primary user mobile client. Encrypted communications active.',
  },
  {
    id: 'dev-003',
    name: 'Kids-iPad-Mini',
    brand: 'Apple Inc.',
    type: 'tablet',
    ip: '192.168.1.121',
    mac: 'BC:FE:D3:5F:A7:20',
    connectionStatus: 'online',
    connectionType: 'wifi_2.4',
    signalStrength: 64,
    uploadSpeed: 0.8,
    downloadSpeed: 12.1,
    category: 'trusted',
    lastActive: new Date().toISOString(),
    isBlockedByPolicy: false,
    registeredAt: '2026-05-16T14:30:00Z',
    riskRating: 'safe',
    riskDetails: 'Access restricted outside of homework/leisure parent policy hours.',
  },
  {
    id: 'dev-004',
    name: 'Smart-Hue-Bridge',
    brand: 'Signify NV (Philips Hue)',
    type: 'smart_home',
    ip: '192.168.1.15',
    mac: '00:17:88:AB:CD:12',
    connectionStatus: 'online',
    connectionType: 'ethernet',
    signalStrength: 100,
    uploadSpeed: 0.1,
    downloadSpeed: 0.4,
    category: 'trusted',
    lastActive: new Date().toISOString(),
    isBlockedByPolicy: false,
    registeredAt: '2026-05-15T08:10:00Z',
    riskRating: 'safe',
    riskDetails: 'Physical bridge hub. Only accepts authenticated local Zigbee calls.',
  },
  {
    id: 'dev-005',
    name: 'Unknown-Generic-SmartNode',
    brand: 'Espressif Inc.',
    type: 'unknown',
    ip: '192.168.1.199',
    mac: '24:0A:C4:01:23:45',
    connectionStatus: 'online',
    connectionType: 'wifi_2.4',
    signalStrength: 42,
    uploadSpeed: 1.2,
    downloadSpeed: 8.9,
    category: 'guest',
    lastActive: new Date().toISOString(),
    isBlockedByPolicy: false,
    registeredAt: '2026-05-30T10:45:00Z',
    riskRating: 'suspicious',
    riskDetails: 'Generic Espressif microcontroller emitting high packet rates. Unverified OUI prefix.',
  },
];

let schedules: AccessSchedule[] = [
  {
    id: 'sched-001',
    deviceId: 'dev-003',
    deviceName: 'Kids-iPad-Mini',
    name: 'Bedtime iPad Lockout',
    days: [0, 1, 2, 3, 4, 5, 6], // Every day
    startTime: '20:00',
    endTime: '07:00',
    isEnabled: true,
  },
];

let logs: ActivityLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    deviceName: 'Kids-iPad-Mini',
    deviceMac: 'BC:FE:D3:5F:A7:20',
    type: 'rule_trigger',
    details: 'Access allowed. Daily homework rules matching active.',
    severity: 'info',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    deviceName: 'Smart-Hue-Bridge',
    deviceMac: '00:17:88:AB:CD:12',
    type: 'connection',
    details: 'Wired Ethernet connection handshake successfully completed.',
    severity: 'info',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    deviceName: 'Unknown-Generic-SmartNode',
    deviceMac: '24:0A:C4:01:23:45',
    type: 'security_alert',
    details: 'New unrecognized Node detected on Guest network.',
    severity: 'warning',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    deviceName: 'Neighbour-S9-Hotspot',
    deviceMac: 'F4:F2:7D:66:33:B1',
    type: 'block',
    details: 'Attempted login rejected automatically per administrator blacklisting rules.',
    severity: 'alert',
  },
];

// Helper to add activity logs
async function addLog(deviceName: string, deviceMac: string, type: ActivityLog['type'], details: string, severity: ActivityLog['severity']) {
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1050)}`,
    timestamp: new Date().toISOString(),
    deviceName,
    deviceMac,
    type,
    details,
    severity,
  };
  logs.unshift(newLog);
  // Cap logs at 100
  if (logs.length > 100) {
    logs.pop();
  }

  // Persist background audit log
  if (isDbActive && supabase) {
    try {
      const { error } = await supabase.from('activity_logs').insert(mapLogToDb(newLog));
      if (error) console.error('Error logging to activity_logs table:', error);
    } catch (err) {
      console.error('Failed to write log to Supabase:', err);
    }
  }
}

// REST API Endpoints

// Get active network setup
app.get('/api/network', (req, res) => {
  res.json(currentNetwork);
});

// Update active gateway setup
app.post('/api/network', (req, res) => {
  const { name, ssid } = req.body;
  if (name) currentNetwork.name = name;
  if (ssid) currentNetwork.ssid = ssid;
  res.json({ success: true, network: currentNetwork });
});

// Get device manifest
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// Modify a device (block, rename, recategorize)
app.post('/api/devices/modify', async (req, res) => {
  const { id, name, category, isBlockedByPolicy, connectionStatus } = req.body;
  const dev = devices.find((d) => d.id === id);
  if (!dev) {
    return res.status(404).json({ error: 'Device not found.' });
  }

  if (name !== undefined) {
    const oldName = dev.name;
    dev.name = name;
    await addLog(name, dev.mac, 'connection', `Device renamed from "${oldName}" to "${name}".`, 'info');
  }

  if (category !== undefined) {
    dev.category = category;
  }

  if (isBlockedByPolicy !== undefined) {
    const isBlocking = isBlockedByPolicy;
    dev.isBlockedByPolicy = isBlocking;
    if (isBlocking) {
      dev.category = 'blocked';
      await addLog(dev.name, dev.mac, 'block', `Interception block active. Physical packets dropped at gateway gateway.`, 'alert');
    } else {
      dev.category = 'trusted';
      await addLog(dev.name, dev.mac, 'unblock', `Interception block deactivated. Device access restored.`, 'info');
    }
  }

  if (connectionStatus !== undefined) {
    dev.connectionStatus = connectionStatus;
    if (connectionStatus === 'online') {
      await addLog(dev.name, dev.mac, 'connection', `Device joined managed band channel.`, 'info');
    } else {
      await addLog(dev.name, dev.mac, 'disconnection', `Device disconnected. Lease expired.`, 'info');
    }
  }

  // Update real Supabase DB
  if (isDbActive && supabase) {
    try {
      const dbDev = mapDeviceToDb(dev);
      const { error } = await supabase.from('devices').update(dbDev).eq('id', id);
      if (error) {
        console.error('Failed to save device updates to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync device edit onto Supabase:', err);
    }
  }

  res.json({ success: true, device: dev });
});

// Add a brand new device manually to the inventory
app.post('/api/devices', async (req, res) => {
  const { name, brand, type, ip, mac, connectionStatus, connectionType, category } = req.body;
  
  if (!name || !mac) {
    return res.status(400).json({ error: 'Device name and MAC address are required specifications.' });
  }

  // Create new active lease profile
  const newDev: NetworkDevice = {
    id: `dev-${Date.now()}`,
    name,
    brand: brand || 'Unknown Brand',
    type: type || 'unknown',
    ip: ip || `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
    mac: mac.toUpperCase(),
    connectionStatus: connectionStatus || 'online',
    connectionType: connectionType || 'wifi_5',
    signalStrength: Math.floor(Math.random() * 40) + 60, // 60-100%
    uploadSpeed: Math.random() * 3,
    downloadSpeed: Math.random() * 100 + 5,
    category: category || 'trusted',
    lastActive: new Date().toISOString(),
    isBlockedByPolicy: category === 'blocked',
    registeredAt: new Date().toISOString(),
    riskRating: 'safe',
    riskDetails: 'Manually enrolled by administrator.'
  };

  devices.push(newDev);
  await addLog(newDev.name, newDev.mac, 'connection', `Device manually registered: ${newDev.name} (${newDev.brand}) joined managing band.`, 'info');

  // Push to Supabase if DB connection active
  if (isDbActive && supabase) {
    try {
      const dbDev = mapDeviceToDb(newDev);
      const { error } = await supabase.from('devices').insert(dbDev);
      if (error) {
        console.error('Failed to save manually added device to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync new device details to Supabase:', err);
    }
  }

  res.json({ success: true, device: newDev });
});

// Delete/Remove a device lease entirely from the manifest
app.delete('/api/devices/:id', async (req, res) => {
  const { id } = req.params;
  const devIndex = devices.findIndex((d) => d.id === id);
  if (devIndex === -1) {
    return res.status(404).json({ error: 'Device target not found inside management manifest.' });
  }

  const dev = devices[devIndex];
  devices.splice(devIndex, 1);

  // Clean related schedules
  schedules = schedules.filter((s) => s.deviceId !== id);

  await addLog(dev.name, dev.mac, 'disconnection', `Device lease physically removed or cleared by administrator.`, 'info');

  // Delete from Supabase if DB active
  if (isDbActive && supabase) {
    try {
      // First delete any schedules belonging to this device
      await supabase.from('schedules').delete().eq('device_id', id);
      // Then delete the device
      const { error } = await supabase.from('devices').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete device row from Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync device lease purging on Supabase:', err);
    }
  }

  res.json({ success: true });
});

// Get Schedules List
app.get('/api/schedules', (req, res) => {
  res.json(schedules);
});

// Add parent schedule
app.post('/api/schedules', async (req, res) => {
  const { deviceId, name, days, startTime, endTime } = req.body;
  const dev = devices.find((d) => d.id === deviceId);
  if (!dev) {
    return res.status(404).json({ error: 'Target device not found for scheduling.' });
  }

  const newSched: AccessSchedule = {
    id: `sched-${Date.now()}`,
    deviceId,
    deviceName: dev.name,
    name,
    days: days || [1, 2, 3, 4, 5],
    startTime,
    endTime,
    isEnabled: true,
  };

  schedules.push(newSched);
  await addLog(dev.name, dev.mac, 'rule_trigger', `New parental access control rule "${name}" created.`, 'info');

  // Push to Supabase
  if (isDbActive && supabase) {
    try {
      const dbSched = mapScheduleToDb(newSched);
      const { error } = await supabase.from('schedules').insert(dbSched);
      if (error) {
        console.error('Failed to insert schedule row in Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to insert schedule onto Supabase:', err);
    }
  }

  res.json({ success: true, schedule: newSched });
});

// Delete schedule
app.delete('/api/schedules/:id', async (req, res) => {
  const { id } = req.params;
  const index = schedules.findIndex((s) => s.id === id);
  if (index !== -1) {
    const s = schedules[index];
    const dev = devices.find((d) => d.id === s.deviceId);
    schedules.splice(index, 1);
    if (dev) {
      await addLog(dev.name, dev.mac, 'rule_trigger', `Parental policy rule "${s.name}" deleted.`, 'info');
    }

    // Delete in Supabase
    if (isDbActive && supabase) {
      try {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (error) {
          console.error('Failed to delete schedule row from Supabase:', error);
        }
      } catch (err) {
        console.error('Failed to sync schedule deletion onto Supabase:', err);
      }
    }

    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Schedule trigger not found.' });
});

// Toggle schedule active
app.post('/api/schedules/toggle', async (req, res) => {
  const { id } = req.body;
  const s = schedules.find((item) => item.id === id);
  if (s) {
    s.isEnabled = !s.isEnabled;
    const dev = devices.find((d) => d.id === s.deviceId);
    const stateStr = s.isEnabled ? 'activated' : 'deactivated';
    if (dev) {
      await addLog(dev.name, dev.mac, 'rule_trigger', `Parental control rule "${s.name}" ${stateStr}.`, 'info');
    }

    // Update in Supabase
    if (isDbActive && supabase) {
      try {
        const { error } = await supabase.from('schedules').update(mapScheduleToDb(s)).eq('id', id);
        if (error) {
          console.error('Failed to update schedule is_enabled field in Supabase:', error);
        }
      } catch (err) {
        console.error('Failed to sync toggle change onto Supabase:', err);
      }
    }

    return res.json({ success: true, schedule: s });
  }
  res.status(404).json({ error: 'Schedule trigger not found.' });
});

// Get Audit Logs
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

// Trigger a mock network deep scan (simulates devices refreshing or random joining!)
app.post('/api/network/scan', async (req, res) => {
  // Let's randomize statuses slightly to sim active router discoveries
  for (const d of devices) {
    if (d.category !== 'blocked') {
      const activeRoll = Math.random();
      // Keep main admin Macbook online, randomize others slightly
      if (d.id !== 'dev-001') {
        const prevStatus = d.connectionStatus;
        d.connectionStatus = activeRoll > 0.15 ? 'online' : 'offline';
        if (d.connectionStatus === 'online') {
          d.downloadSpeed = parseFloat((Math.random() * 80 + 2).toFixed(1));
          d.uploadSpeed = parseFloat((Math.random() * 8 + 0.2).toFixed(1));
          d.signalStrength = Math.floor(Math.random() * 40) + 60;
        } else {
          d.downloadSpeed = 0;
          d.uploadSpeed = 0;
          d.signalStrength = 0;
        }

        if (prevStatus !== d.connectionStatus) {
          await addLog(
            d.name,
            d.mac,
            d.connectionStatus === 'online' ? 'connection' : 'disconnection',
            `Device active connection state updated to ${d.connectionStatus} under background band sweep.`,
            'info'
          );
        }
      } else {
        // Macbook always busy!
        d.downloadSpeed = parseFloat((Math.random() * 150 + 20).toFixed(1));
        d.uploadSpeed = parseFloat((Math.random() * 15 + 1).toFixed(1));
        d.signalStrength = Math.floor(Math.random() * 10) + 90;
      }
    }
  }

  // Decide if a new generic visitor joins the network
  const visitorRoll = Math.random();
  if (visitorRoll > 0.4 && !devices.some((item) => item.id === 'dev-guest-temp')) {
    const newDev: NetworkDevice = {
      id: 'dev-guest-temp',
      name: 'Simulated-SmartTV-Visitor',
      brand: 'LG Electronics',
      type: 'tv',
      ip: '192.168.1.187',
      mac: 'E0:F8:47:FF:21:BB',
      connectionStatus: 'online',
      connectionType: 'wifi_2.4',
      signalStrength: 75,
      uploadSpeed: 0.5,
      downloadSpeed: 18.4,
      category: 'guest',
      lastActive: new Date().toISOString(),
      isBlockedByPolicy: false,
      registeredAt: new Date().toISOString(),
      riskRating: 'safe',
      riskDetails: 'Guest screen streaming node. Normal behaviors detected.',
    };
    devices.push(newDev);
    await addLog(newDev.name, newDev.mac, 'connection', 'New guest client "Simulated-SmartTV-Visitor" established Wi-Fi lease.', 'info');
  }

  // Bulk upsert scan states to Supabase
  if (isDbActive && supabase) {
    try {
      const dbDevs = devices.map(mapDeviceToDb);
      const { error } = await supabase.from('devices').upsert(dbDevs);
      if (error) {
        console.error('Failed to upsert client scans to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync scans onto Supabase:', err);
    }
  }

  res.json({ success: true, devices });
});

// Call Gemini API for Network Threat Scan and Advice
app.post('/api/gemini/analyze-security', async (req, res) => {
  const { deviceId } = req.body;

  // Find target device metadata
  const dev = devices.find((d) => d.id === deviceId);
  if (!dev) {
    return res.status(404).json({ error: 'Device metadata not found.' });
  }

  if (!ai) {
    // Return simulated report when no API key found
    const simulatedReports: Record<string, any> = {
      'dev-001': {
        riskRating: 'safe',
        riskScore: 5,
        executiveSummary: 'This laptop is operating normally as an administrator workstation. There are no active threats.',
        detailedFindings: [
          'The MAC Address vendor corresponds to Apple Inc., consistent with the registered brand.',
          'Traffic analysis shows encrypted outbound TLS 1.3 packets, standard for secure administrative operations.',
          'No open listening ports or unauthorized discovery routines registered.',
        ],
        securityRecommendations: [
          'Keep your macOS firewall activated at all times.',
          'Consider configuring static DHCP mapping to keep this device at 192.168.1.102.',
        ],
      },
      'dev-005': {
        riskRating: 'suspicious',
        riskScore: 65,
        executiveSummary: 'This unidentified Espressif node is broadcasting high packet rates on local guest channels. Generic ESP32 microcontrollers are often used in IoT projects but could indicate rogue unauthorized hardware.',
        detailedFindings: [
          'Vendor prefix corresponds to Espressif, typical of low-cost Wi-Fi controllers (ESP8266/ESP32).',
          'Bandwidth logs show constant small UDP packets to external static IPs. This could represent unencrypted logging telemetry or a compromised firmware beacon.',
          'The device lacks host configuration details (no hostname mapped in DHCP).',
        ],
        securityRecommendations: [
          'Isolate this device into a separate, firewalled Guest Network VLAN.',
          'Enable internet-only routing restrictions for this station to block secondary internal sweeps.',
          'If you do not recognize this smart node, block it entirely using the Smart Access interface.',
        ],
      },
    };

    const report = simulatedReports[dev.id] || {
      riskRating: dev.riskRating || 'low',
      riskScore: dev.riskRating === 'critical' ? 88 : dev.riskRating === 'suspicious' ? 55 : 12,
      executiveSummary: `Scanning reveals normal background telemetry for the registered ${dev.brand} ${dev.type}. Risk posture remains low.`,
      detailedFindings: [
        `Device corresponds to expected MAC signature '${dev.mac}'.`,
        'Intermittent network polling aligns with typical vendor client sleep-wake cycles.',
        'Gateway inspection shows no active security flags or overflow packets.',
      ],
      securityRecommendations: [
        'No direct intervention needed. Enable automatic scheduling to limit downtime access.',
        'Ensure automatic firmware updates are enabled on this device.',
      ],
    };

    // Reflect simulated findings on the in-memory device record
    dev.riskRating = report.riskRating;
    dev.riskDetails = report.executiveSummary;

    return res.json({
      success: true,
      deviceId: dev.id,
      deviceName: dev.name,
      report,
      simulated: true,
    });
  }

  try {
    const systemPrompt = `You are an elite network cybersecurity analyzer and smart router AI assistant.
Your task is to analyze details of a local network node and return a structured JSON assessment.
Analyze whether the device looks valid, suspect, or poses immediate network vulnerability risks.
Consider attributes like MAC address vendor prefixes, device types (e.g. smart IoT switches are vulnerable), and bandwidth behaviors.

You must reply with a valid JSON document conforming to the provided responseSchema. Do not include markdown formatting or quotes outside of the valid JSON structure.`;

    const requestPrompt = `Please analyze the following network node detail:
Device Name: "${dev.name}"
Manufacturer: "${dev.brand}"
Device Type: "${dev.type}"
IP Address: "${dev.ip}"
MAC Identifier: "${dev.mac}"
Connection Class: "${dev.connectionType}" (current status: "${dev.connectionStatus}")
Bandwidth Utilization: Down: ${dev.downloadSpeed} Mbps, Up: ${dev.uploadSpeed} Mbps
Current Category status in controller: "${dev.category}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: requestPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskRating: {
              type: Type.STRING,
              description: 'Overall threat classification. Must be one of: "safe", "low", "suspicious", "critical".',
            },
            riskScore: {
              type: Type.INTEGER,
              description: 'A numeric rating from 0 to 100 representing direct threat risk level.',
            },
            executiveSummary: {
              type: Type.STRING,
              description: 'A professional executive synthesis overview suitable for human router administrators.',
            },
            detailedFindings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of detailed analytical bullet items looking at hardware flags, ports, spoofing risks.',
            },
            securityRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific actionable steps the owner can take in the router or security rules.',
            },
          },
          required: ['riskRating', 'riskScore', 'executiveSummary', 'detailedFindings', 'securityRecommendations'],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('Gemini API returned an empty text body.');
    }

    const report = JSON.parse(jsonText.trim());

    // Update in-memory state with this AI-derived assessment
    dev.riskRating = report.riskRating;
    dev.riskDetails = report.executiveSummary;

    // Log the event
    await addLog(
      dev.name,
      dev.mac,
      report.riskRating === 'critical' ? 'security_alert' : 'rule_trigger',
      `AI Threat Scan completed. Rating: ${report.riskRating.toUpperCase()} (Score: ${report.riskScore}).`,
      report.riskRating === 'critical' ? 'alert' : report.riskRating === 'suspicious' ? 'warning' : 'info'
    );

    res.json({
      success: true,
      deviceId: dev.id,
      deviceName: dev.name,
      report,
      simulated: false,
    });
  } catch (error: any) {
    console.error('Error contacting Gemini API:', error);
    res.status(500).json({
      error: 'AI Analysis call failed.',
      message: error.message,
    });
  }
});

// Function to test, initialize and synchronize databases with Supabase
async function syncAndLoadWithSupabase() {
  if (!supabase) {
    console.log('Supabase credentials not configured. Using mock in-memory stores.');
    isDbActive = false;
    return;
  }
  try {
    const { data: test, error: testErr } = await supabase.from('devices').select('id').limit(1);
    if (testErr) {
      if (
        testErr.code === 'PGRST116' || 
        testErr.code === '42P01' || 
        testErr.message?.includes('relation') || 
        testErr.message?.includes('does not exist')
      ) {
        console.warn('Supabase connected but "devices" table does not exist yet. Please run the SQL initialization script.');
        isDbActive = false;
        return;
      }
      throw testErr;
    }
    
    // Load devices
    const { data: devRows, error: devErr } = await supabase.from('devices').select('*');
    if (devErr) throw devErr;
    if (devRows && devRows.length > 0) {
      devices = devRows.map(mapDeviceToFront);
    } else {
      console.log('Seeding empty Supabase devices table with initial device manifest...');
      const seedDevs = devices.map(mapDeviceToDb);
      const { error: seedErr } = await supabase.from('devices').insert(seedDevs);
      if (seedErr) {
        console.error('Failed to seed Supabase devices:', JSON.stringify(seedErr, null, 2));
        throw new Error(`Failed to seed Supabase devices: ${seedErr.message || JSON.stringify(seedErr)}`);
      }
    }

    // Load schedules
    const { data: schedRows, error: schedErr } = await supabase.from('schedules').select('*');
    if (schedErr) throw schedErr;
    if (schedRows && schedRows.length > 0) {
      schedules = schedRows.map(mapScheduleToFront);
    } else {
      console.log('Seeding empty Supabase schedules table with bedtime lockouts...');
      const seedScheds = schedules.map(mapScheduleToDb);
      const { error: seedErr } = await supabase.from('schedules').insert(seedScheds);
      if (seedErr) {
        console.error('Failed to seed Supabase schedules:', JSON.stringify(seedErr, null, 2));
        throw new Error(`Failed to seed Supabase schedules: ${seedErr.message || JSON.stringify(seedErr)}`);
      }
    }

    // Load logs
    const { data: logRows, error: logErr } = await supabase.from('activity_logs').select('*');
    if (logErr) throw logErr;
    if (logRows && logRows.length > 0) {
      logs = logRows.map(mapLogToFront);
    } else {
      console.log('Seeding empty Supabase activity_logs table...');
      const seedLogs = logs.map(mapLogToDb);
      const { error: seedErr } = await supabase.from('activity_logs').insert(seedLogs);
      if (seedErr) {
        console.error('Failed to seed Supabase logs:', JSON.stringify(seedErr, null, 2));
        throw new Error(`Failed to seed Supabase logs: ${seedErr.message || JSON.stringify(seedErr)}`);
      }
    }

    isDbActive = true;
    lastDbError = null;
    console.log('⚡ Successfully fully synchronized state with REAL Supabase DB!');
  } catch (err: any) {
    console.error('Failed loading dataset from Supabase:', err.message || err);
    lastDbError = err.message || String(err);
    isDbActive = false;
  }
}

// Get Supabase check/initialize stats
app.get('/api/supabase/status', async (req, res) => {
  const isConfigured = !!supabase;
  let tablesExist = false;
  let errorMsg: string | null = null;

  if (supabase) {
    try {
      const { error } = await supabase.from('devices').select('id').limit(1);
      if (!error) {
        tablesExist = true;
        if (lastDbError) {
          errorMsg = lastDbError;
        }
      } else {
        errorMsg = error.message;
        if (
          error.code === 'PGRST116' || 
          error.code === '42P01' ||
          error.message?.includes('relation') || 
          error.message?.includes('does not exist')
        ) {
          errorMsg = 'Tables have not been created yet in Supabase SQL Editor.';
        }
      }
    } catch (err: any) {
      errorMsg = err.message || String(err);
    }
  }

  // Generate the copy/paste-ready PostgreSQL creation scripts
  const sqlScript = `-- SQL Script to create tables in Supabase SQL Editor

-- 1. Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    type TEXT NOT NULL,
    ip TEXT UNIQUE NOT NULL,
    mac TEXT UNIQUE NOT NULL,
    connection_status TEXT NOT NULL DEFAULT 'offline',
    connection_type TEXT NOT NULL,
    signal_strength INTEGER NOT NULL DEFAULT 0,
    upload_speed REAL NOT NULL DEFAULT 0,
    download_speed REAL NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'guest',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_blocked_by_policy BOOLEAN NOT NULL DEFAULT false,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    risk_rating TEXT NOT NULL DEFAULT 'safe',
    risk_details TEXT
);

-- 2. Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    name TEXT NOT NULL,
    days INTEGER[] NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true
);

-- 3. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    device_name TEXT NOT NULL,
    device_mac TEXT NOT NULL,
    type TEXT NOT NULL,
    details TEXT NOT NULL,
    severity TEXT NOT NULL
);

-- 4. Disable Row Level Security (RLS) on all tables to allow anonymous syncing
-- (Alternatively, you can create SELECT/INSERT/UPDATE policies if RLS remains enabled)
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Seed initial records list (if empty)
INSERT INTO devices (id, name, brand, type, ip, mac, connection_status, connection_type, signal_strength, upload_speed, download_speed, category, last_active, is_blocked_by_policy, registered_at, risk_rating, risk_details)
VALUES 
('dev-001', 'Rayhan-MacBook-Pro', 'Apple Inc.', 'laptop', '192.168.1.102', '1A:2B:3C:4D:5E:6F', 'online', 'wifi_5', 95, 4.8, 124.5, 'trusted', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, 'safe', 'Verified administrator workstation. Clean security profile.'),
('dev-002', 'Rayhan-iPhone-15', 'Apple Inc.', 'phone', '192.168.1.105', '70:89:D3:45:12:AA', 'online', 'wifi_5', 82, 2.1, 45.3, 'trusted', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, 'safe', 'Primary user mobile client. Encrypted communications active.'),
('dev-003', 'Kids-iPad-Mini', 'Apple Inc.', 'tablet', '192.168.1.121', 'BC:FE:D3:5F:A7:20', 'online', 'wifi_2.4', 64, 0.8, 12.1, 'trusted', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, 'safe', 'Access restricted outside of homework/leisure parent policy hours.'),
('dev-004', 'Smart-Hue-Bridge', 'Signify NV (Philips Hue)', 'smart_home', '192.168.1.15', '00:17:88:AB:CD:12', 'online', 'ethernet', 100, 0.1, 0.4, 'trusted', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, 'safe', 'Physical bridge hub. Only accepts authenticated local Zigbee calls.'),
('dev-005', 'Unknown-Generic-SmartNode', 'Espressif Inc.', 'unknown', '192.168.1.199', '24:0A:C4:01:23:45', 'online', 'wifi_2.4', 42, 1.2, 8.9, 'guest', CURRENT_TIMESTAMP, false, CURRENT_TIMESTAMP, 'suspicious', 'Generic Espressif microcontroller emitting high packet rates. Unverified OUI prefix.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO schedules (id, device_id, device_name, name, days, start_time, end_time, is_enabled)
VALUES 
('sched-001', 'dev-003', 'Kids-iPad-Mini', 'Bedtime iPad Lockout', ARRAY[0,1,2,3,4,5,6], '20:00', '07:00', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_logs (id, timestamp, device_name, device_mac, type, details, severity)
VALUES
('log-001', CURRENT_TIMESTAMP, 'Kids-iPad-Mini', 'BC:FE:D3:5F:A7:20', 'rule_trigger', 'Access allowed. Daily homework rules matching active.', 'info'),
('log-002', CURRENT_TIMESTAMP, 'Smart-Hue-Bridge', '00:17:88:AB:CD:12', 'connection', 'Wired Ethernet connection handshake successfully completed.', 'info')
ON CONFLICT (id) DO NOTHING;
`;

  res.json({
    isConfigured,
    tablesExist,
    error: errorMsg,
    url: process.env.SUPABASE_URL || '',
    sqlScript
  });
});

// Endpoint to trigger connection validation & reload
app.post('/api/supabase/recheck', async (req, res) => {
  await syncAndLoadWithSupabase();
  res.json({ success: true, isDbActive });
});

// Setup Express Static Assets & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite development server middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Load backend rows from real Supabase DB if enabled on bootup!
  await syncAndLoadWithSupabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Network Access Manager backend serving on http://localhost:${PORT}`);
  });
}

startServer();
