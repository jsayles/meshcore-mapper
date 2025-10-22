/**
 * MeshCore Type Definitions
 */

import { PacketType } from '@/constants/meshcore';

// Contact from MeshCore device
export interface MeshCoreContact {
  pubkey: string;        // Full 64-char hex public key
  name: string;          // Contact name
  prefix: string;        // First 2 chars of pubkey (for quick identification)
}

// Signal reading data point
export interface SignalReading {
  id: string;            // UUID
  timestamp: number;     // Unix timestamp (ms)
  latitude: number;      // Decimal degrees
  longitude: number;     // Decimal degrees
  accuracy: number;      // GPS accuracy (meters)
  rssi: number;          // Received signal strength (dBm)
  noiseFloor: number;    // Background noise (dBm)
  snr: number;           // Signal-to-noise ratio (dB) = rssi - noiseFloor
  hopCount: number;      // Always 0 for valid readings
  repeaterPubkey: string;  // Full public key of target repeater
  repeaterPrefix: string;  // First 2 chars for display
}

// Data collection session
export interface DataSession {
  id: string;              // UUID
  startTime: number;       // Unix timestamp (ms)
  endTime?: number;        // Unix timestamp (ms), undefined if active
  readings: SignalReading[];
  repeaterPubkey: string;  // Target repeater for this session
  deviceName: string;      // MeshCore device name
  deviceAddress: string;   // BLE MAC address
}

// Trace response from device
export interface TraceResponse {
  hopCount: number;
  rssi: number;           // int16 little-endian
  noiseFloor: number;     // int16 little-endian
  timestamp: number;      // uint32 little-endian
}

// Generic packet structure
export interface MeshCorePacket {
  type: PacketType;
  payload: Buffer;
}

// BLE connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Device info for scanner
export interface ScannedDevice {
  id: string;             // BLE device ID
  name: string | null;    // Device name
  rssi?: number;          // Signal strength during scan
}
