## Development Notes

**Initial Setup Decisions:**
- Android-first development (iOS support possible later)
- Using custom development build (not Expo Go) for BLE support
- Git repo: https://github.com/jsayles/meshcore-mapper

**Key Context:**
- Signal mapping app for MeshCore mesh network coverage testing
- Connects to handheld MeshCore device via BLE
- Performs trace requests to fixed rooftop repeater
- Logs telemetry (SNR, RSSI, noise floor) with GPS coordinates
- Exports data to CSV/JSON for analysis and heat map visualization
- Development environment fully configured on macOS
- Project renamed from signal-mapper to meshcore-mapper during setup

**Use Case:**
- Fixed MeshCore repeater installed on roof
- Walk around neighborhood with Android tablet + handheld MeshCore device (connected via BLE)
- Press button to capture reading at current location
- Trace to repeater must be direct (0 hops) to log data
- Each walk creates separate session file with timestamp
- Export data for archival and multi-session comparison

**Permissions Configured:**
- BLE (scan, connect) for MeshCore device communication
- Location (fine) for GPS mapping

**MeshCore Protocol Details:**
- Nordic UART Service UUID: `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- TX Characteristic (notify): `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`
- RX Characteristic (write): `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
- Device name pattern: "MeshCore*"
- Binary protocol: little-endian integers
- Repeater selection: first 2 chars of public key (e.g., "74" from 7449758d...)

**Implementation Phases:**

**Phase 1: BLE Connection & Device Discovery** (Current)
- Scan for MeshCore devices
- Connect using Nordic UART Service
- Fetch contact list for repeater selection
- Connection status UI
- Handle disconnection/reconnection

**Phase 2: Protocol Implementation**
- Binary packet parser (little-endian)
- Trace request command (target repeater by pubkey prefix)
- Parse trace responses (filter hop count = 0)
- Extract telemetry: RSSI (int16), noise floor (int16), calculate SNR
- Error handling for failed traces

**Phase 3: GPS Integration**
- Install expo-location
- Request permissions
- Capture coordinates on button press
- Validate location accuracy

**Phase 4: Data Collection UI**
- Device scanner/connection screen
- Main collection screen:
  - Large "Capture Reading" button
  - Current SNR display
  - Reading counter
  - Connection status
  - Repeater selection

**Phase 5: Data Storage & Export**
- Session management (one file per walk, timestamp-based)
- Data format: timestamp, lat, lon, rssi, noise_floor, snr, repeater_pubkey
- CSV export
- JSON export
- File sharing functionality

**Technology Stack:**
- React Native 0.81.5 + Expo ~54.0.18
- BLE: `react-native-ble-plx`
- GPS: `expo-location`
- Storage: `AsyncStorage` + `expo-file-system`
- Export: `expo-sharing`

**Future Enhancements (Post v1):**
- Automatic data collection mode (interval-based or distance-based)
- In-app heat map visualization
- Multi-session overlay on map
- Support for multiple repeaters
- Real-time SNR graphing
