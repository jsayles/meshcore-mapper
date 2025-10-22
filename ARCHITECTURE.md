# MeshCore Mapper - Technical Architecture

## Overview
React Native application for mapping MeshCore mesh network signal coverage by performing trace requests from a handheld device to a fixed repeater while capturing GPS coordinates.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       React Native App                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   UI Layer   │  │   Services   │  │  Data Layer  │  │
│  │              │  │              │  │              │  │
│  │ - Scanner    │  │ - BLE Mgr    │  │ - Storage    │  │
│  │ - Collection │  │ - Protocol   │  │ - Export     │  │
│  │ - Status     │  │ - Location   │  │ - Sessions   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────┐       ┌─────────────┐      ┌──────────┐
    │  User   │       │  MeshCore   │      │   GPS    │
    │ Actions │       │   Device    │      │ Location │
    └─────────┘       │   (BLE)     │      │ Service  │
                      └─────────────┘      └──────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │  Rooftop    │
                      │  Repeater   │
                      │  (Mesh)     │
                      └─────────────┘
```

## Directory Structure

```
/
├── app/                          # Screens (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx            # Home/Connection screen
│   │   └── collection.tsx       # Data collection screen
│   ├── _layout.tsx
│   └── settings.tsx             # Repeater selection, export
│
├── components/                   # UI Components
│   ├── ble/
│   │   ├── DeviceScanner.tsx   # BLE device list
│   │   └── ConnectionStatus.tsx # Connection indicator
│   ├── collection/
│   │   ├── CaptureButton.tsx   # Large capture button
│   │   ├── SNRDisplay.tsx      # Current SNR value
│   │   └── ReadingCounter.tsx  # Session counter
│   └── export/
│       └── ExportControls.tsx  # CSV/JSON export buttons
│
├── services/                     # Business Logic
│   ├── ble/
│   │   ├── MeshCoreConnection.ts    # BLE connection management
│   │   ├── MeshCoreProtocol.ts      # Binary protocol parser
│   │   └── types.ts                 # BLE-specific types
│   ├── location/
│   │   └── LocationService.ts       # GPS integration
│   └── storage/
│       ├── DataLogger.ts            # Session management
│       ├── ExportService.ts         # CSV/JSON export
│       └── types.ts                 # Storage types
│
├── types/                        # TypeScript Types
│   ├── SignalReading.ts         # Core data model
│   ├── MeshCorePacket.ts        # Protocol types
│   └── Session.ts               # Session model
│
├── constants/
│   ├── theme.ts                 # Colors, fonts
│   └── meshcore.ts              # UUIDs, constants
│
└── hooks/                        # Custom React Hooks
    ├── useBLE.ts                # BLE state management
    ├── useLocation.ts           # Location tracking
    └── useDataCollection.ts     # Collection state
```

## Data Models

### SignalReading
```typescript
interface SignalReading {
  id: string;                    // UUID
  timestamp: number;             // Unix timestamp (ms)
  latitude: number;              // Decimal degrees
  longitude: number;             // Decimal degrees
  accuracy: number;              // GPS accuracy (meters)
  rssi: number;                  // Received signal strength (dBm)
  noiseFloor: number;           // Background noise (dBm)
  snr: number;                   // Signal-to-noise ratio (dB)
  hopCount: number;              // Always 0 (direct connection)
  repeaterPubkey: string;        // Full public key
  repeaterPrefix: string;        // First 2 chars (e.g., "74")
}
```

### Session
```typescript
interface Session {
  id: string;                    // UUID
  startTime: number;             // Unix timestamp (ms)
  endTime?: number;              // Unix timestamp (ms)
  readings: SignalReading[];     // Array of readings
  repeaterPubkey: string;        // Target repeater
  deviceName: string;            // MeshCore device name
  deviceAddress: string;         // BLE MAC address
}
```

### MeshCorePacket
```typescript
enum PacketType {
  TRACE_REQUEST = 0x10,
  TRACE_RESPONSE = 0x11,
  CONTACT_LIST = 0x03,
  TELEMETRY = 0x04,
  ACK = 0x80,
  ERROR = 0x01,
}

interface TraceRequest {
  type: PacketType.TRACE_REQUEST;
  targetPubkey: string;          // Target repeater public key
}

interface TraceResponse {
  type: PacketType.TRACE_RESPONSE;
  hopCount: number;              // Number of hops (must be 0)
  rssi: number;                  // int16 LE
  noiseFloor: number;           // int16 LE
  timestamp: number;             // uint32 LE
}
```

## BLE Protocol Implementation

### Nordic UART Service (NUS)
- **Service UUID:** `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- **TX Characteristic:** `6E400003-B5A3-F393-E0A9-E50E24DCCA9E` (notify)
- **RX Characteristic:** `6E400002-B5A3-F393-E0A9-E50E24DCCA9E` (write)

### Binary Packet Format
All multi-byte integers use **little-endian** byte order.

#### Trace Request Packet
```
Byte 0:    Packet Type (0x10)
Byte 1-64: Target Public Key (32 bytes hex string)
```

#### Trace Response Packet
```
Byte 0:    Packet Type (0x11)
Byte 1:    Hop Count (uint8)
Byte 2-3:  RSSI (int16 LE)
Byte 4-5:  Noise Floor (int16 LE)
Byte 6-9:  Timestamp (uint32 LE)
```

### Connection Flow
```
1. Scan for devices with name "MeshCore*"
2. Connect to device
3. Discover Nordic UART Service
4. Subscribe to TX characteristic (notifications)
5. Fetch contact list
6. User selects repeater by prefix
7. Ready for trace requests
```

### Trace Request Flow
```
1. User presses "Capture Reading" button
2. Get current GPS coordinates
3. Build trace request packet for selected repeater
4. Write packet to RX characteristic
5. Wait for trace response on TX characteristic (timeout: 5s)
6. Parse response, verify hop count == 0
7. Extract telemetry (RSSI, noise floor)
8. Calculate SNR = RSSI - noiseFloor
9. Create SignalReading with GPS + telemetry
10. Add to current session
11. Display success or error
```

## Storage Strategy

### Phase 1 (v1): AsyncStorage + File System
- Current session stored in AsyncStorage
- Export creates CSV/JSON files in app documents directory
- Files named: `meshcore_session_YYYYMMDD_HHMMSS.{csv,json}`
- User can share files via system share sheet

### File Formats

#### CSV Format
```csv
timestamp,latitude,longitude,accuracy,rssi,noise_floor,snr,hop_count,repeater_prefix,repeater_pubkey
1698765432000,37.7749,-122.4194,5.2,-65,-95,30,0,74,7449758d8cedfb1d1b0a3e084a6f8fa6686e8baa12416254cb941d8984669664
```

#### JSON Format
```json
{
  "session": {
    "id": "uuid-here",
    "startTime": 1698765432000,
    "endTime": 1698769032000,
    "repeaterPubkey": "7449758d...",
    "deviceName": "MeshCore-T1000",
    "deviceAddress": "AA:BB:CC:DD:EE:FF"
  },
  "readings": [
    {
      "id": "reading-uuid",
      "timestamp": 1698765432000,
      "latitude": 37.7749,
      "longitude": -122.4194,
      "accuracy": 5.2,
      "rssi": -65,
      "noiseFloor": -95,
      "snr": 30,
      "hopCount": 0,
      "repeaterPubkey": "7449758d...",
      "repeaterPrefix": "74"
    }
  ]
}
```

## Error Handling

### BLE Errors
- **Device not found:** Show "No MeshCore devices found" message
- **Connection failed:** Show error, allow retry
- **Disconnected:** Show notification, attempt reconnection
- **Service not found:** Show "Incompatible device" error

### Trace Errors
- **Timeout (5s):** Show "No response from repeater" error, do not log data
- **Hop count > 0:** Show "Not a direct connection" error, do not log data
- **Invalid response:** Show "Invalid data received" error

### GPS Errors
- **Permission denied:** Show permission request dialog
- **Location unavailable:** Show "GPS signal weak" warning
- **Low accuracy (> 20m):** Show warning, allow user to retry or proceed

## Dependencies

### Required Packages
```json
{
  "react-native-ble-plx": "^3.x",      // BLE communication
  "expo-location": "~18.x",            // GPS
  "@react-native-async-storage/async-storage": "^2.x",  // Local storage
  "expo-file-system": "~18.x",         // File operations
  "expo-sharing": "~13.x",             // Share functionality
  "buffer": "^6.x"                     // Binary data handling
}
```

### Permissions Required
```xml
<!-- Android -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- iOS -->
NSBluetoothAlwaysUsageDescription
NSLocationWhenInUseUsageDescription
```

## State Management

### BLE State
```typescript
interface BLEState {
  isScanning: boolean;
  devices: Device[];
  connectedDevice: Device | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  contacts: Contact[];
  selectedRepeater: Contact | null;
}
```

### Collection State
```typescript
interface CollectionState {
  currentSession: Session | null;
  isCapturing: boolean;
  lastReading: SignalReading | null;
  readingCount: number;
  error: string | null;
}
```

### Location State
```typescript
interface LocationState {
  currentLocation: Location | null;
  accuracy: number;
  permissionGranted: boolean;
  isLoading: boolean;
}
```

## Future Considerations (Post v1)

### Heat Map Visualization
- Use `react-native-maps` for map display
- Overlay readings as colored markers/polygons
- Color gradient based on SNR values
- Support multiple session overlays

### Automatic Mode
- Background location tracking
- Interval-based or distance-based capture
- Battery optimization considerations
- Background BLE connection management

### Cloud Sync
- Upload sessions to backend
- Share sessions between users
- Aggregate coverage maps

### Analytics
- Coverage statistics
- SNR distribution graphs
- Distance from repeater analysis
- Time-series SNR trends
