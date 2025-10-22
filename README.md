# MeshCore Signal Mapper - Android App

Mobile application for mapping signal strength of MeshCore repeaters.

## Tech Stack

**Framework:** React Native with Expo
- Chose Expo for simplified development workflow and easier deployment
- Cross-platform capability (currently focusing on Android)
- Hot reload for rapid development

**Development Environment:**
- Node.js v22.20.0
- VS Code for code editing
- Android tablet for live testing via Expo Go
- Android Studio for SDK and emulator support

**Language:** TypeScript

## Development Setup

1. Install dependencies:
```bash
   npm install
```

2. Start the development server:
```bash
   npx expo start
```

3. Test on device:
   - Install Expo Go on your Android device
   - Scan the QR code shown in terminal

## Project Structure

- `app/` - Main application screens and navigation
- `components/` - Reusable UI components
- `constants/` - App-wide constants and configuration
- `assets/` - Images, fonts, and other static resources
