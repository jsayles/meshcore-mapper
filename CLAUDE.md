## Development Notes

**Initial Setup Decisions:**
- Android-first development (iOS support possible later)
- Using Expo Go for device testing instead of emulator initially
- Git repo: https://github.com/jsayles/meshcore-mapper

**Key Context:**
- This is a signal mapping app for wireless coverage
- Connects to companion device via BLE for signal measurements
- Development environment fully configured on macOS
- Live reload working on Android tablet
- Project renamed from signal-mapper to meshcore-mapper during setup

**Next Steps:**
- Define app architecture and screen flow
- Implement BLE connection to companion device
- Implement signal strength measurement from BLE device
- Add mapping/GPS functionality
- Design data storage strategy

**Permissions Configured:**
- BLE (scan, connect) for companion device communication
- Location (fine) for GPS mapping
