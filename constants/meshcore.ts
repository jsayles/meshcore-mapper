/**
 * MeshCore BLE Protocol Constants
 * Based on Nordic UART Service (NUS)
 */

// Nordic UART Service UUIDs
export const MESHCORE_BLE = {
  // Service UUID
  SERVICE_UUID: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',

  // TX Characteristic (Device -> App, notifications)
  TX_CHARACTERISTIC_UUID: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',

  // RX Characteristic (App -> Device, write)
  RX_CHARACTERISTIC_UUID: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',

  // Device name pattern for scanning
  DEVICE_NAME_PREFIX: 'MeshCore',
} as const;

// Packet Types (from meshcore_py/packets.py)
export enum PacketType {
  OK = 0x00,
  ERROR = 0x01,
  CONTACT_START = 0x02,
  CONTACT = 0x03,
  CONTACT_END = 0x04,
  CONTACT_MSG_RECV = 0x05,
  CHANNEL_MSG_RECV = 0x06,
  SELF_INFO = 0x07,
  GET_MSG = 0x08,
  SEND_MSG = 0x09,
  SEND_CHAN_MSG = 0x0A,
  GET_CONTACTS = 0x0B,
  ADD_CONTACT = 0x0C,
  REMOVE_CONTACT = 0x0D,
  SET_NAME = 0x0E,
  SET_COORDS = 0x0F,
  TRACE = 0x10,
  SET_TX_POWER = 0x11,
  SET_CHAN_LABELS = 0x12,
  GET_CHAN_LABELS = 0x13,
  CHAN_LABELS = 0x14,
  BINARY_REQ = 0x32,
  FACTORY_RESET = 0x33,
  ADVERTISEMENT = 0x80,
  PATH_UPDATE = 0x81,
  ACK = 0x82,
  MESSAGES_WAITING = 0x83,
  NODE_REPORT = 0x84,
  TRACE_ROUTE = 0x85,
  TELEMETRY_REPORT = 0x86,
  NEIGHBOR_INFO = 0x87,
  POSITION_UPDATE = 0x88,
  CHANNEL_RECEPTION_RATIO = 0x89,
  SHORT_CONTACT_LIST = 0x8A,
  NETWORK_STATS = 0x8B,
  CUSTOM_VARS = 0x8C,
  GET_DEVICE_INFO = 0x8D,
}

// Binary Request Types
export enum BinaryReqType {
  STATUS = 0x01,
  KEEP_ALIVE = 0x02,
  TELEMETRY = 0x03,
  MMA = 0x04,
  ACL = 0x05,
}

// Timeouts
export const TIMEOUTS = {
  SCAN: 10000,           // 10 seconds for device scanning
  CONNECT: 15000,        // 15 seconds for connection
  TRACE: 5000,           // 5 seconds for trace response
  COMMAND: 3000,         // 3 seconds for general commands
} as const;

// Protocol Constants
export const PROTOCOL = {
  MAX_HOPS: 0,           // We only accept direct connections (0 hops)
  PUBKEY_LENGTH: 64,     // Public key hex string length
  PREFIX_LENGTH: 2,      // First 2 chars used for repeater selection
} as const;
