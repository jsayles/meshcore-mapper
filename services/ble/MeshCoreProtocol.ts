/**
 * MeshCore Binary Protocol Implementation
 * Handles encoding/decoding of MeshCore packets
 */

import { Buffer } from 'buffer';
import { PacketType } from '@/constants/meshcore';
import { TraceResponse, MeshCoreContact } from '@/types/meshcore';

/**
 * Build a trace request packet for a specific target
 */
export function buildTraceRequest(targetPubkey: string): Buffer {
  // Packet format:
  // Byte 0: PacketType.TRACE (0x10)
  // Bytes 1-N: Target public key as string
  const packet = Buffer.alloc(1 + targetPubkey.length);
  packet.writeUInt8(PacketType.TRACE, 0);
  packet.write(targetPubkey, 1, 'utf8');
  return packet;
}

/**
 * Build a get contacts request packet
 */
export function buildGetContactsRequest(): Buffer {
  const packet = Buffer.alloc(1);
  packet.writeUInt8(PacketType.GET_CONTACTS, 0);
  return packet;
}

/**
 * Parse trace response packet
 * Format (little-endian):
 *   Byte 0: PacketType.TRACE_ROUTE (0x85)
 *   Byte 1: Hop count (uint8)
 *   Bytes 2-3: RSSI (int16 LE)
 *   Bytes 4-5: Noise floor (int16 LE)
 *   Bytes 6-9: Timestamp (uint32 LE)
 */
export function parseTraceResponse(data: Buffer): TraceResponse | null {
  try {
    // Verify minimum packet size
    if (data.length < 10) {
      console.warn('Trace response too short:', data.length);
      return null;
    }

    // Verify packet type
    const packetType = data.readUInt8(0);
    if (packetType !== PacketType.TRACE_ROUTE) {
      console.warn('Invalid packet type for trace response:', packetType);
      return null;
    }

    // Parse fields (little-endian)
    const hopCount = data.readUInt8(1);
    const rssi = data.readInt16LE(2);
    const noiseFloor = data.readInt16LE(4);
    const timestamp = data.readUInt32LE(6);

    return {
      hopCount,
      rssi,
      noiseFloor,
      timestamp,
    };
  } catch (error) {
    console.error('Error parsing trace response:', error);
    return null;
  }
}

/**
 * Parse contact list response
 * Format:
 *   Starts with CONTACT_START (0x02)
 *   Multiple CONTACT (0x03) packets
 *   Ends with CONTACT_END (0x04)
 *
 * Each CONTACT packet contains:
 *   Byte 0: PacketType.CONTACT (0x03)
 *   Bytes 1-64: Public key (hex string)
 *   Bytes 65+: Name (null-terminated string)
 */
export function parseContactPacket(data: Buffer): MeshCoreContact | null {
  try {
    const packetType = data.readUInt8(0);

    if (packetType !== PacketType.CONTACT) {
      return null;
    }

    // Extract public key (next 64 bytes as hex string)
    const pubkeyStart = 1;
    const pubkeyEnd = pubkeyStart + 64;

    if (data.length < pubkeyEnd) {
      console.warn('Contact packet too short for pubkey');
      return null;
    }

    const pubkey = data.toString('utf8', pubkeyStart, pubkeyEnd);

    // Extract name (remaining bytes, null-terminated)
    let name = '';
    if (data.length > pubkeyEnd) {
      const nameData = data.slice(pubkeyEnd);
      const nullIndex = nameData.indexOf(0);
      name = nullIndex >= 0
        ? nameData.toString('utf8', 0, nullIndex)
        : nameData.toString('utf8');
    }

    // Get prefix (first 2 chars of pubkey)
    const prefix = pubkey.substring(0, 2);

    return {
      pubkey,
      name: name || `Unknown-${prefix}`,
      prefix,
    };
  } catch (error) {
    console.error('Error parsing contact packet:', error);
    return null;
  }
}

/**
 * Check if packet is CONTACT_START
 */
export function isContactStart(data: Buffer): boolean {
  return data.length > 0 && data.readUInt8(0) === PacketType.CONTACT_START;
}

/**
 * Check if packet is CONTACT_END
 */
export function isContactEnd(data: Buffer): boolean {
  return data.length > 0 && data.readUInt8(0) === PacketType.CONTACT_END;
}

/**
 * Check if packet is ACK
 */
export function isAck(data: Buffer): boolean {
  return data.length > 0 && data.readUInt8(0) === PacketType.ACK;
}

/**
 * Check if packet is ERROR
 */
export function isError(data: Buffer): boolean {
  return data.length > 0 && data.readUInt8(0) === PacketType.ERROR;
}

/**
 * Get packet type from buffer
 */
export function getPacketType(data: Buffer): PacketType | null {
  if (data.length === 0) return null;
  return data.readUInt8(0);
}
